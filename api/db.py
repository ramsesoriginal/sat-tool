from pydantic import BaseModel
import psycopg2
from psycopg2.extras import DictCursor
from psycopg2.extensions import connection as Psycopg2Connection
from contextlib import contextmanager
from typing import List, Optional, Dict, Generator
from models import Question, QuestionGroup, Questionnaire, NewQuestion, UserInDB, UserCreateRequest
from auth import get_password_hash

# Database configuration
db_config: Dict[str, str] = {
    'host': 'localhost',
    'database': 'sat',
    'user': 'sat',
    'password': 'sat',
    'port': '5432',
}

# Database Utility Class
class Database:
    """
    Database utility class for handling database operations.
    """
    def __init__(self, config: Dict[str, str]):
        self.config = config

    def connect(self) -> Psycopg2Connection:
        """
        Establishes a database connection using the provided configuration.

        Returns:
            Psycopg2Connection: A new database connection.
        """
        return psycopg2.connect(**self.config)

    @contextmanager
    def get_cursor(self) -> Generator:
        """
        Context manager for getting a database cursor.

        Yields:
            Generator: A cursor to interact with the database.
        """
        connection = self.connect()
        try:
            yield connection.cursor(cursor_factory=DictCursor)
            connection.commit()
        except Exception as e:
            connection.rollback()
            raise e
        finally:
            connection.close()

db = Database(db_config)

# Business logic functions
def get_questionnaire_data() -> Questionnaire:
    """
    Fetches questionnaire data from the database.

    Returns:
        Questionnaire: A Questionnaire object containing the fetched data.
    """
    questionnaire = Questionnaire(question_groups=[])
    with db.get_cursor() as cursor:
        cursor.execute("""
            SELECT 
                questions.question_id,
                groups.class AS group_class,
                groups.displayText AS group_display_text,
                questions.question_text
            FROM questions
            JOIN groups ON questions.group_id = groups.group_id
        """)

        data = cursor.fetchall()

        current_group: Optional[QuestionGroup] = None
        for row in data:
            if current_group is None or current_group.group_class != row["group_class"]:
                current_group = QuestionGroup(group_class=row["group_class"], display_text=row["group_display_text"], questions=[])
                questionnaire.question_groups.append(current_group)

            question = Question(question_id=row["question_id"], question_text=row["question_text"])
            current_group.questions.append(question)

    return questionnaire

def update_question_in_db(question: Question) -> Question:
    """
    Updates a question in the database.

    Args:
        question (Question): The question object containing the ID and the new text.

    Returns:
        Question: The updated question object.
    """
    with db.get_cursor() as cursor:
        cursor.execute("""
            UPDATE public.questions
            SET question_text = %s
            WHERE question_id = %s RETURNING question_id, question_text;
        """, (question.question_text, question.question_id))
        updated_question_data = cursor.fetchone()

    if updated_question_data:
        return Question(question_id=updated_question_data[0], question_text=updated_question_data[1])
    else:
        raise HTTPException(status_code=404, detail="Question not found")

def create_new_question(new_question: NewQuestion) -> Question:
    """
    Creates a new question in the database.

    Args:
        new_question (NewQuestion): The details of the new question.

    Returns:
        Question: The created question object with its generated ID.
    """
    with db.get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO public.questions (group_id, question_text)
            VALUES (%s, %s) RETURNING question_id;
        """, (new_question.group_id, new_question.question_text))
        question_id = cursor.fetchone()[0]

    return Question(question_id=question_id, question_text=new_question.question_text)

def delete_question_from_db(question_id: int) -> Dict[str, str]:
    """
    Deletes a question by its ID from the database.

    Args:
        question_id (int): The ID of the question to delete.

    Returns:
        Dict[str, str]: A response indicating success or failure.
    """
    with db.get_cursor() as cursor:
        cursor.execute("""
            DELETE FROM public.questions
            WHERE question_id = %s;
        """, (question_id,))
    return {"message": f"Question with ID {question_id} deleted successfully"}


def get_user(username: str) -> Optional[UserInDB]:
    with db.get_cursor() as cursor:
        cursor.execute("""
            SELECT id, username, email, hashed_password, is_admin, disabled
            FROM users WHERE username = %s;
        """, (username,))
        
        user_data = cursor.fetchone()
        if user_data:
            return UserInDB(**user_data)
        else:
            return None

def create_user(user_data: UserCreateRequest) -> UserInDB:
    hashed_password = get_password_hash(user_data.password)
    
    with db.get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, is_admin, disabled)
            VALUES (%s, %s, %s, %s, %s) RETURNING id, username, email, is_admin, disabled;
        """, (user_data.username, user_data.email, hashed_password, user_data.is_admin, False))
        
        new_user_data = cursor.fetchone()
    
    return UserInDB(**new_user_data)
