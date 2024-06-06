from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import os
import logging


router = APIRouter()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/mydatabase")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


# Validate if users and levels exists
@router.get("/")
async def validate():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        users_table_exists = "users" in tables
        levels_tables_exist = any(table.startswith("lvl_") for table in tables)

        if users_table_exists and levels_tables_exist:
            return True
        else:
            return False
    except SQLAlchemyError as e:
        logging.error(e)
        raise HTTPException(status_code=500, detail="Error checking tables existence")