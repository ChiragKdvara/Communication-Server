# Import necessary modules
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, ValidationError
from sqlalchemy import and_, create_engine, MetaData, Table, Column, Integer, String, ForeignKey, select, text
from sqlalchemy.orm import sessionmaker
import os
import logging
from datetime import datetime
from utils.table_hierarchy import find_relationships, find_bottom_most_level
import json

# Set up database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/mydatabase")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
metadata = MetaData()

# Reflect existing tables to ensure SQLAlchemy is aware of them
metadata.reflect(bind=engine)


# FastAPI router
router = APIRouter()


# Pydantic models for FastAPI
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    role: str
    btm_lvl_id: int


class UserBatchCreate(BaseModel):
    users: List[UserCreate]


class UserResponse(BaseModel):
    id: int
    # username: str
    # email: str
    # role: str
    # btm_lvl_id: int


class ErrorResponse(BaseModel):
    entry: Optional[dict]
    error: str


class MessageResponse(BaseModel):
    message_title: str
    message_content: str
    sent_time: str


class LoginResponse(BaseModel):
    user_id: int
    username: str


class UserSearchResponse(BaseModel):
    id: int
    username: str
    email: str
    read_status: str
    msg_content: str
    msg_title: str
    exp_message_id: int


# Endpoint for batch user creation
@router.post("/add-users", tags=["Users"], response_model=dict)
async def create_users_batch(request: UserBatchCreate):
    session = Session()
    errors = []
    successful_entries = 0

    try:
        # Read the raw JSON body
        body_str = request.model_dump_json()
        body = json.loads(body_str)
        user_batch = body.get("users", [])

        relationships = find_relationships(engine)
        bottom_most = find_bottom_most_level(relationships)

        # Remove the 'lvl_' prefix if required
        bottom_most_name = bottom_most[4:]
        bottom_most_id = f"{bottom_most_name}_id"
        logging.debug(f'bmi: {bottom_most_id}')
        foreign_key_id = f'lvl_{bottom_most_name}.id'
        logging.debug(f'bmi: {bottom_most_id}, fki: {foreign_key_id}')

        metadata = MetaData()

        # Reflect existing tables to ensure SQLAlchemy is aware of them
        metadata.reflect(bind=engine)
        # Ensure 'users' table is created
        user_table = Table(
            'users', metadata,
            Column('id', Integer, primary_key=True),
            Column('username', String(50), unique=True, nullable=False),
            Column('email', String(100), unique=True, nullable=False),
            Column('role', String(50), nullable=False),
            Column(bottom_most_id, Integer, ForeignKey(foreign_key_id)),  # Ensure correct foreign key
            extend_existing=True
        )

        logging.debug(f'user_table: {user_table}')

        # Create the 'users' table without affecting existing tables
        metadata.create_all(engine)

        # Truncate the 'users' table before inserting new data
        session.execute(user_table.delete())
        session.commit()

        # Check for duplicates within the provided batch data
        seen_emails = set()
        seen_usernames = set()

        for user_data in user_batch:
            try:
                user = UserCreate(**user_data)

                # Validate the email and username fields manually
                user_email = user.email
                user_username = user.username

                if user_email in seen_emails:
                    errors.append({
                        "entry": user_data,
                        "error": "Duplicate email within the batch"
                    })
                    continue

                if user_username in seen_usernames:
                    errors.append({
                        "entry": user_data,
                        "error": "Duplicate username within the batch"
                    })
                    continue

                seen_emails.add(user_email)
                seen_usernames.add(user_username)

                existing_user = session.query(user_table).filter(
                    (user_table.c.email == user.email) |
                    (user_table.c.username == user.username)
                ).first()

                if existing_user:
                    # Check if the new data is the same as the existing data
                    is_same = (
                        existing_user.username == user.username and
                        existing_user.role == user.role and
                        existing_user[bottom_most_id] == user.btm_lvl_id
                    )
                    if is_same:
                        continue

                    # Update the existing user with new data
                    session.execute(user_table.update().where(
                        user_table.c.email == user.email
                    ).values(
                        username=user.username,
                        role=user.role,
                        **{bottom_most_id: user.btm_lvl_id},
                    ))
                else:
                    # Insert new user
                    logging.debug(f'user_data: {user.username}')
                    session.execute(user_table.insert().values(
                        username=user.username,
                        email=user.email,
                        role=user.role,
                        **{bottom_most_id: user.btm_lvl_id},
                    ))

                successful_entries += 1

            except ValidationError as ve:
                errors.append({
                    "entry": user_data,
                    "error": ve.errors()
                })
            except Exception as e:
                errors.append({
                    "entry": user_data,
                    "error": str(e)
                })

    except Exception as e:
        errors.append({
            "entry": None,
            "error": str(e)
        })

    session.commit()  # Commit all users in a single transaction

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "message": "Users data added successfully",
            "successful_entries": successful_entries,
            "errors": errors,
            "error_count": len(errors),
        }
    )

# USER LOGIN

class LoginInput(BaseModel):
    username: str

# Login api end-point for user
@router.post("/login", tags=["Users"], response_model=LoginResponse)
async def check_user(data: LoginInput):
    session = Session()

    try:
        # Fetch user based on username
        users_table = Table("users", metadata, autoload_with=engine)
        user = session.execute(
            users_table.select().where(users_table.c.username == data.username)
        ).fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "user_id": user.id,
            "username": user.username,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking user: {str(e)}")

    finally:
        session.close()


from utils.user_filter import user_filtering

# FILTER USERS BASED ON BRANCH...
@router.get("/user_filter", tags=["Users"], response_model=List[UserResponse])
async def user_filter(btm_lvl_name: str):
    return user_filtering(btm_lvl_name)


# Get a particular message for a particular user
# Endpoint to fetch reference data and update `exp_message`
@router.get("/messages/{message_id}", tags=["Messages"], response_model=MessageResponse)
async def get_reference(message_id: int):
    session = Session()

    try:
        # Fetch the data from `reference_table`
        exp_message_table = Table("exp_message", metadata, autoload_with=engine)
        exp_message_record = session.execute(
            exp_message_table.select().where(exp_message_table.c.id == message_id)
        ).fetchone()

        if not exp_message_record:
            raise HTTPException(status_code=404, detail="Message not found")

        logging.debug(f'exp_message_record {exp_message_record}')

        update_exp_message = (
            exp_message_table.update()
            .where(exp_message_table.c.id == message_id)
            .values(
                msg_read_time=datetime.now(),  # Set `msg_read_time` to the current time
                read_status="read",  # Change `read_status` to "read"
            )
        )

        session.execute(update_exp_message)  # Execute the update
        session.commit()  # Commit the changes

        # Return the data from `reference_table` and `sent_time`
        return {
            "message_title": exp_message_record.msg_title,
            "message_content": exp_message_record.msg_content,
            "sent_time": exp_message_record.sent_time.strftime("%d/%m/%Y %H:%M:%S"),  # Formatted `sent_time`
        }

    except Exception as e:
        session.rollback()  # Rollback in case of errors
        raise HTTPException(status_code=500, detail=f"Error fetching reference data: {str(e)}")

    finally:
        session.close()


# USER SEARCH API

@router.get("/user-search", tags=["Users"], response_model=List[UserSearchResponse])
async def get_users(
    user_ids: str = Query(..., description="List of user IDs separated by comma"),
    reference_id: int = Query(..., description="Reference ID")
):
    # Convert string of comma-separated integers to a list of integers
    users_table = Table("users", metadata, autoload_with=engine)
    exp_message_table = Table("exp_message", metadata, autoload_with=engine)
    user_id_list = [int(user_id) for user_id in user_ids.split(",")]

    with Session() as session:
        # Create a text query using SQLAlchemy's text() function
        query = (
            session.query(
                users_table.c.id,
                users_table.c.username,
                users_table.c.email,
                exp_message_table.c.read_status,
                exp_message_table.c.msg_content,
                exp_message_table.c.msg_title,
                exp_message_table.c.id
            )
            .join(exp_message_table, and_(
                users_table.c.id == exp_message_table.c.user_id,
                exp_message_table.c.reference_id == reference_id
            ))
            .filter(users_table.c.id.in_(user_id_list))
        )

        # Execute the query
        result = query.all()
        logging.debug(f'user search result: {result}')

        if not result:
            raise HTTPException(status_code=404, detail="Users not found")

        users = []
        for row in result:
            user = {
                "id": row[0],
                "username": row[1],
                "email": row[2],
                "read_status": row[3],
                "msg_content": row[4],
                "msg_title": row[5],
                "exp_message_id": row[6],
            }
            users.append(user)

        return users


# Helper function to convert DD-MM-YYYY to datetime
def convert_to_datetime(date_str: str, end_of_day: bool = False) -> datetime:
    dt = datetime.strptime(date_str, "%d-%m-%Y")
    if end_of_day:
        dt = dt.replace(hour=23, minute=59, second=59)
    return dt

# VIEW ALL SENT MESSAGES TO PARTICULAR USER:
@router.get("/", tags=["Messages"], response_model=dict)
async def get_references(username: str, start_date: str = None, end_date: str = None):
    session = Session()

    try:
        users_table = Table("users", metadata, autoload_with=engine)
        user = session.execute(
            users_table.select().where(users_table.c.username == username)
        ).fetchone()

        if not user:
            raise HTTPException(status_code=404, detail=f"No user found with username: {username}")

        logging.debug(f'user: {user.id}')

        # Set default date range if not provided
        if start_date:
            start_datetime = convert_to_datetime(start_date)
        else:
            start_datetime = datetime.min  # Earliest representable datetime

        if end_date:
            end_datetime = convert_to_datetime(end_date, end_of_day=True)
        else:
            end_datetime = datetime.max  # Latest representable datetime

        # Fetch all rows from `exp_message` for the given `user_id` and within the date range
        exp_message_table = Table("exp_message", metadata, autoload_with=engine)
        exp_messages = session.execute(
            exp_message_table.select().where(
                and_(
                    exp_message_table.c.user_id == user.id,
                    exp_message_table.c.sent_time >= start_datetime,
                    exp_message_table.c.sent_time <= end_datetime
                )
            )
        ).mappings().all()

        logging.debug(f'exp_message: {exp_messages}')

        if not exp_messages:
            raise HTTPException(status_code=404, detail="No messages found for this user within the date range")

        # Convert RowMapping objects to dictionaries
        exp_messages_dict = [dict(msg) for msg in exp_messages]

        return {
            "exp_messages": exp_messages_dict
        }

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

    finally:
        session.close()
