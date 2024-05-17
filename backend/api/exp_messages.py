from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
from datetime import datetime
import re  # For regular expressions
import os
import logging
from utils.table_hierarchy import find_relationships,find_bottom_most_level

# Initialize FastAPI Router
router = APIRouter()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/mydatabase")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)  # Correct sessionmaker setup
metadata = MetaData()


metadata.reflect(bind=engine)


# Define Pydantic model for input data
class ReferenceDataInput(BaseModel):
    template_name: str
    message_title: str
    message_content: str
    btm_lvl: str
    user_count: int

# Endpoint to save reference data and create `exp_message`
@router.post("/")
async def expMessage(data: ReferenceDataInput):
    session = Session()  # Correct session creation
    relationships = find_relationships(engine)
    bottom_most = find_bottom_most_level(relationships)
    bottom_most_name = bottom_most[4:]  # Removing 'lvl_' prefix
    bottom_most_name_with_suffix = f"{bottom_most_name}_name"
    try:


        # Create tables if they don't exist
        logging.debug(f'bmn: {bottom_most_name_with_suffix}')
        reference_table = Table(
            "reference_table",
            metadata,
            Column("id", Integer, primary_key=True, autoincrement=True),
            Column("template_name", String, nullable=False),
            Column("message_title", String, nullable=False),
            Column("message_content", String, nullable=False),
            Column(bottom_most_name_with_suffix, String, nullable=False),  # Correct column name
            Column("user_count", Integer, nullable=False),
            extend_existing=True
        )

        exp_message = Table(
            "exp_message",
            metadata,
            Column("id", Integer, primary_key=True, autoincrement=True),
            Column("user_id", Integer, nullable=False),  # This should be set to the relevant user ID
            Column("channel", String, nullable=False),
            Column("msg_title", String, nullable=False),
            Column("msg_content", String, nullable=False),
            Column("reference_id", Integer, ForeignKey("reference_table.id"), nullable=False),  # Reference to ReferenceTable
            Column("sent_time", DateTime, server_default=func.now()),  # Time when sent
            Column("msg_read_time", DateTime, nullable=True),  # Time when read
            Column("read_status", String, default="unread"),  # Default to "unread"
            extend_existing=True
        )

        # Create all tables in the database
        metadata.create_all(engine)

        
        metadata.reflect(bind=engine)
        # Insert into `reference_table`
        reference_table = Table("reference_table", metadata, autoload_with=engine)  # Ensure correct table reference
        ins = reference_table.insert().values(
        template_name=data.template_name,
        message_title=data.message_title,
        message_content=data.message_content,
        **{bottom_most_name_with_suffix: data.btm_lvl},  # Correct key
        user_count=data.user_count
    )

        result = session.execute(ins)  # Execute with the session
        session.commit()  # Commit the `reference_table` insertion
        
        reference_id = result.inserted_primary_key[0]  # Get the auto-generated ID

        # Find branch_id from branch name
        btm_lvl_table = Table(bottom_most, metadata, autoload_with=engine)
        btm = session.execute(
            btm_lvl_table.select().where(btm_lvl_table.c.name == data.btm_lvl)
        ).fetchone()

        logging.debug(f'btm fetch one: {btm}')

        if not btm:
            raise HTTPException(status_code=404, detail=f"No branch found with name '{data.btm_lvl}'")

        btm_id = btm.id  # Get the branch ID
        logging.debug(f'btm id fetch one: {btm_id}')
        user_btm_lvl=f'{bottom_most_name}_id'
        logging.debug(f'user_btm_lvl: {user_btm_lvl}')

        # Fetch users based on branch_id
        users_table = Table("users", metadata, autoload_with=engine)
        logging.debug(f'users_table: {users_table}')
        users = session.execute(
            users_table.select().where(getattr(users_table.c, user_btm_lvl) == btm_id) # Fetch users with correct branch_id
        ).fetchall()
        logging.debug(f'users: {users}')
        if not users:
            raise HTTPException(status_code=404, detail=f"No users found for branch '{data.btm_lvl}'")

        # Get variable names from message content
        variable_pattern = re.compile(r"\{\{([a-zA-Z_]+)\}\}")  # Regex to find variables
        variables = variable_pattern.findall(data.message_content)
        logging.debug(f'variables: {variables}')

        # Create `exp_message` list with personalized content
        exp_messages = []
        for user in users:
            personalized_content = data.message_content

            # Replace variables with user attributes
            for var in variables:
                logging.debug(f'var: {var}')
                user_attr = getattr(user, var, None)  # Get user attribute
                logging.debug(f'user_attr: {user_attr}')

                if user_attr:
                    personalized_content = re.sub(
                        f"\{{{{{var}}}}}", str(user_attr), personalized_content
                    )
                    logging.debug(f'personalized_content: {personalized_content}')

            exp_messages.append(
                {
                    "user_id": user.id,
                    "channel": "webhooks",  # Or appropriate communication channel
                    "reference_id": reference_id,
                    "sent_time": datetime.now(),
                    "read_status": "unread",
                    "msg_title":data.message_title,
                    "msg_content": personalized_content,
                }
            )

        # Insert all `exp_message` into the database
        exp_message_table = Table("exp_message", metadata, autoload_with=engine)  # Ensure correct table reference
        session.execute(exp_message_table.insert(), exp_messages)  # Use a list of dictionaries
        session.commit()  # Commit all exp_messages

        return {
            "message": "Reference data and exp_messages created successfully",
            "exp_message_count": len(exp_messages),
        }

    except Exception as e:
        session.rollback()  # Rollback on error
        raise HTTPException(status_code=500, detail=f"Error creating reference data and exp_messages: {str(e)}")

    finally:
        session.close()  # Ensure session is closed












