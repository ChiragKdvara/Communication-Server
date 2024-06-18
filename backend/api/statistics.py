import logging
from datetime import datetime, timedelta
from typing import Dict
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine, func, MetaData, Table, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import os

logging.basicConfig(level=logging.DEBUG)

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/mydatabase")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
metadata = MetaData()

# FastAPI router
router = APIRouter()

# Pydantic models
class StatsResponse(BaseModel):
    total_users: int
    total_messages_today: int

# Helper function to check if a table exists
def table_exists(engine, table_name):
    inspector = inspect(engine)
    return inspector.has_table(table_name)

# Endpoint to get statistics
@router.get("/", response_model=StatsResponse, tags=["Statistics"])
async def get_stats() -> Dict[str, int]:
    session = Session()
    try:
        # Initialize counts
        total_users = 0
        total_messages_today = 0
        
        # Check if users table exists and get total number of users
        if table_exists(engine, "users"):
            users_table = Table("users", metadata, autoload_with=engine)
            total_users = session.query(func.count(users_table.c.id)).scalar()
        else:
            logging.warning("Users table does not exist.")
        
        # Check if exp_message table exists and get total number of messages sent today
        if table_exists(engine, "exp_message"):
            now = datetime.now()
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            exp_message_table = Table("exp_message", metadata, autoload_with=engine)
            total_messages_today = session.query(func.count(exp_message_table.c.id)).filter(
                exp_message_table.c.sent_time >= start_of_day
            ).scalar()
        else:
            logging.warning("exp_message table does not exist.")

        return {
            "total_users": total_users,
            "total_messages_today": total_messages_today
        }
    except SQLAlchemyError as e:
        logging.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    finally:
        session.close()
