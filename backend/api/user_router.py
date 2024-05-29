# Import necessary modules
from typing import List
from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, ValidationError
from sqlalchemy import and_, create_engine, MetaData, Table, Column, Integer, String, ForeignKey, select, text
from sqlalchemy.orm import sessionmaker
import os
import logging
from datetime import datetime
from utils.table_hierarchy import find_relationships, find_bottom_most_level


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



# Endpoint for batch user creation
@router.post("/add-users")
async def create_users_batch(request: Request):
    session = Session()
    errors = []
    successful_entries = 0

    try:
        # Read the raw JSON body
        body = await request.json()
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
            Column('username', String(50), nullable=False),
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

        for user_data in user_batch:
            try:
                user = UserCreate(**user_data)
                
                # Validate the email field manually
                user_email = user.email
                
                if user_email in seen_emails:
                    errors.append({
                        "entry": user_data,
                        "error": "Duplicate email within the batch"
                    })
                    continue

                seen_emails.add(user_email)

                existing_user = session.query(user_table).filter(
                    (user_table.c.email == user.email)
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
    email: str

# Login api end-point for user
@router.post("/login")
async def check_user(data: LoginInput):
    session = Session()

    try:
        # Fetch user based on email
        users_table = Table("users", metadata, autoload_with=engine)
        user = session.execute(
            users_table.select().where(users_table.c.email == data.email)
        ).fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

       # Fetch all reference IDs from `exp_message` for the given user ID
        exp_message_table = Table("exp_message", metadata, autoload_with=engine)
        exp_messages = session.execute(
            exp_message_table.select().where(exp_message_table.c.user_id == user.id)
        ).fetchall()  # Fetch all entries


        return {
            "user_id": user.id,
            "username":user.username,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking user: {str(e)}")

    finally:
        session.close()









from utils.user_filter import user_filtering

# FILTER USERS BASED ON BRANCH...
@router.get("/user_filter")
async def user_filter(btm_lvl_name: str):
    
    return user_filtering(btm_lvl_name)




# Get a particular message for a particular user
# Endpoint to fetch reference data and update `exp_message`
@router.get("/messages/{message_id}")
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
        session.close()  # Ensure session is closed





# USER SEARCH API

@router.get("/user-search")
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




# VIEW ALL SENT MESSAGES TO PARTICULAR USER:
@router.get("/{user_id}")
async def get_references(user_id: int):
    session = Session()

    try:
        # Fetch all rows from `exp_message` for the given `user_id`
        exp_message_table = Table("exp_message", metadata, autoload_with=engine)
        exp_messages = session.execute(
            exp_message_table.select().where(exp_message_table.c.user_id == user_id)
        ).fetchall()

        if not exp_messages:
            raise HTTPException(status_code=404, detail="No messages found for this user")

        # Extract the reference IDs and their `sent_time`
        reference_ids_with_details = [(msg.id, msg.reference_id, msg.sent_time) for msg in exp_messages]

        # Fetch corresponding data from `reference_table` using `reference_ids`
        reference_table = Table("reference_table", metadata, autoload_with=engine)
        reference_ids = [ref_id for _, ref_id, _ in reference_ids_with_details]
        reference_data = session.execute(
            reference_table.select().where(reference_table.c.id.in_(reference_ids))
        ).fetchall()

        # Create a dictionary to map `reference_id` to its data and `exp_message.id`
        ref_id_to_exp_message = {ref_id: exp_msg_id for exp_msg_id, ref_id, _ in reference_ids_with_details}
        ref_id_to_sent_time = {ref_id: sent_time for _, ref_id, sent_time in reference_ids_with_details}

        # Match `reference_data` with the correct `exp_message.id` and `sent_time`
        combined_data = []
        for ref in reference_data:
            ref_id = ref.id
            if ref_id in ref_id_to_exp_message:
                exp_msg_id = ref_id_to_exp_message[ref_id]
                sent_time = ref_id_to_sent_time[ref_id].strftime("%d/%m/%Y %H:%M:%S")
                combined_data.append({
                    "exp_message_id": exp_msg_id,  # Include `exp_message.id`
                    "message_title": ref.message_title,
                    "sent_time": sent_time,  # Formatted `sent_time`
                })

        # Sort combined data by `sent_time` in descending order
        combined_data.sort(key=lambda x: x['sent_time'], reverse=True)

        return {
            "user_id": user_id,
            "reference_data": combined_data,  # Return the correct sorted data
        }

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error fetching references: {str(e)}")

    finally:
        session.close()