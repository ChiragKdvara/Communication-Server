from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, select, DateTime
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import logging
from datetime import datetime

logging.basicConfig(level=logging.DEBUG)
# Database configuration
import os
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/mydatabase")

router = APIRouter()

engine = create_engine(DATABASE_URL)
metadata = MetaData()

# Define the templates table
templates = Table(
    "templates",
    metadata,
    Column("template_id", Integer, primary_key=True),
    Column("template_name", String),
    Column("message_title", String),
    Column("message_content", String),
    Column("template_useCount", Integer, default=0),
    Column("createdAt", DateTime, default=datetime.now()),
    Column("modifiedAt", DateTime, default=datetime.now()),

)

# Create the table if it doesn't exist
metadata.create_all(engine)

# Define Pydantic models
class TemplateCreate(BaseModel):
    template_name: str
    message_title: str
    message_content: str

class Template(BaseModel):
    template_id: int
    template_name: str
    message_title: str
    message_content: str
    template_useCount: int
    createdAt: datetime
    modifiedAt: datetime

# FastAPI router
router = APIRouter()

# Create a Template (POST)
@router.post("/", response_model=Template)
async def create_template(template: TemplateCreate):
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        new_template = {
            "template_name": template.template_name,
            "message_title": template.message_title,
            "message_content": template.message_content
        }
        result = session.execute(templates.insert(), new_template)
        session.commit()
        created_template = session.execute(select(templates).where(templates.c.template_id == result.inserted_primary_key[0])).fetchone()
        session.close()
        return created_template
    except SQLAlchemyError as e:
        logging.error(e)
        raise HTTPException(status_code=500, detail="Error creating template")