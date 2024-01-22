from pydantic import BaseModel, EmailStr
from typing import List, Optional

# Pydantic models

class Question(BaseModel):
    """
    Represents a question with an identifier and text content.

    Attributes:
        question_id (int): Unique identifier for the question.
        question_text (str): Text content of the question.
    """
    question_id: int
    question_text: str

class QuestionGroup(BaseModel):
    """
    Represents a group of questions, categorized under a specific class and display text.

    Attributes:
        group_class (str): Class/category of the question group.
        display_text (str): Display text for the question group, possibly used as a label or title.
        questions (List[Question]): A list of questions belonging to this group.
    """
    group_class: str
    display_text: str
    questions: List[Question]

class Questionnaire(BaseModel):
    """
    Represents a complete questionnaire, consisting of multiple groups of questions.

    Attributes:
        question_groups (List[QuestionGroup]): A list of question groups that make up the questionnaire.
    """
    question_groups: List[QuestionGroup]

class NewQuestion(BaseModel):
    """
    Represents the details required to create a new question. This model is typically used when a new question is being submitted.

    Attributes:
        group_id (int): The identifier of the group to which the new question belongs.
        question_text (str): Text content of the new question.
    """
    group_id: int
    question_text: str

class User(BaseModel):
    username: str
    email: Optional[str] = None
    hashed_password: Optional[str] = None
    disabled: Optional[bool] = None
    is_admin: bool = False

class UserInDB(User):
    hashed_password: Optional[str] = None

class UserCreateRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_admin: bool = False