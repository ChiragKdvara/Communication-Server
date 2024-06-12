import logging
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine, func,MetaData, Table
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
logging.basicConfig(level=logging.DEBUG)

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/mydatabase")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
metadata = MetaData()

# Reflect existing tables to ensure SQLAlchemy is aware of them
metadata.reflect(bind=engine)

# FastAPI router
router = APIRouter()


@router.get("/")
async def get_stats():
    session = Session()
    try:
        # Total number of users
        users_table = Table("users", metadata, autoload_with=engine)
        total_users = session.query(func.count(users_table.c.id)).scalar()

        # Total number of messages sent today
        now = datetime.now()
        start_of_day = now - timedelta(days=1)
        exp_message_table = Table("exp_message", metadata, autoload_with=engine)
        total_messages_today = session.query(func.count(exp_message_table.c.id)).filter(exp_message_table.c.sent_time >= start_of_day).scalar()

        return {
            "total_users": total_users,
            "total_messages_today": total_messages_today
        }
    except SQLAlchemyError as e:
        logging.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    finally:
        session.close()