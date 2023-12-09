from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi import Security
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import DictCursor
from psycopg2.extensions import connection as Psycopg2Connection
from fastapi.middleware.cors import CORSMiddleware
from contextlib import contextmanager
from typing import List, Optional, Dict, Generator
from models import Question, QuestionGroup, Questionnaire, NewQuestion, User, UserCreateRequest
from db import get_questionnaire_data, update_question_in_db, create_new_question, delete_question_from_db, get_user, create_user
from auth import verify_password, create_access_token
from datetime import datetime, timedelta


app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

ACCESS_TOKEN_EXPIRE_MINUTES = 30

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API endpoint handlers
@app.get("/get_data", response_model=Questionnaire)
async def get_data() -> Questionnaire:
    """
    Endpoint to fetch questionnaire data.

    Returns:
        Questionnaire: A Questionnaire object representing the fetched data.
    """
    return get_questionnaire_data()

@app.put("/update_question", response_model=Question)
async def update_question(question: Question) -> Question:
    """
    Endpoint to update the text of a question and return the updated question.

    Args:
        question (Question): The question object containing the ID and the new text.

    Returns:
        Question: The updated question object.
    """
    return update_question_in_db(question)

# Global exception handler
@app.exception_handler(Exception)
async def exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for the FastAPI app.

    Args:
        request: The incoming request that caused the exception.
        exc: The exception that was raised.

    Returns:
        JSONResponse: A JSON response indicating an error.
    """
    return JSONResponse(
        status_code=500,
        content={"message": "An error occurred during processing."},
    )

@app.post("/create_question", response_model=Question)
async def create_question(new_question: NewQuestion) -> Question:
    """
    Endpoint to create a new question.

    Args:
        new_question (NewQuestion): The details of the new question.

    Returns:
        Question: The created question object with its generated ID.
    """
    return create_new_question(new_question)

@app.delete("/delete_question/{question_id}", response_model=Dict[str, str])
async def delete_question(question_id: int) -> Dict[str, str]:
    """
    Endpoint to delete a question by its ID.

    Args:
        question_id (int): The ID of the question to delete.

    Returns:
        Dict[str, str]: A response indicating success or failure.
    """
    return delete_question_from_db(question_id)

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    from pprint import pprint
    pprint(user)
    access_token = create_access_token(
            data={"sub": user.username},
            is_admin=user.is_admin,  # Pass the is_admin attribute from the user record
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
    return {"access_token": access_token, "token_type": "bearer"}



async def get_current_user(token: str = Security(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)

@app.post("/create_user", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(user: UserCreateRequest):
    """
    Create a new user.
    """
    try:
        # Create and store the new user
        new_user = create_user(user)
        return new_user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating user: {e}")