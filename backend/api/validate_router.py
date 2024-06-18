from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine, inspect,  MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import os
import logging
from pydantic import BaseModel




router = APIRouter()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/mydatabase")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
metadata = MetaData()


class ValidationResponse(BaseModel):
    users_table_exists: bool
    levels_tables_exist: bool


# Validate if users and levels exists
@router.get("/", tags=["Validation"], response_model=ValidationResponse)
async def validate():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        users_table_exists = "users" in tables
        levels_tables_exist = any(table.startswith("lvl_") for table in tables)

        return {
            "users_table_exists": users_table_exists,
            "levels_tables_exist": levels_tables_exist
        }
    except SQLAlchemyError as e:
        logging.error(e)
        raise HTTPException(status_code=500, detail="Error checking tables existence")

