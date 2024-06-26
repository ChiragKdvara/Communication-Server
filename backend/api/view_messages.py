from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import create_engine, MetaData, Table, select, text
from sqlalchemy.orm import sessionmaker
import os
import logging

from datetime import datetime, timedelta
import pytz

# Define the time zone for IST
ist = pytz.timezone('Asia/Kolkata')

# Initialize FastAPI Router
router = APIRouter()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/mydatabase")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)  # Correct sessionmaker setup



# FETCH ALL MESSAGES SENT...
@router.get("/")
async def view_messages(limit: int = Query(default=10, description="Limit the number of messages to fetch")):
    session = Session()
    try:
        metadata = MetaData()
        metadata.reflect(bind=engine)
        
        # Reflect both exp_message and reference_table
        exp_message_table = Table("exp_message", metadata, autoload_with=engine)
        reference_table = Table("reference_table", metadata, autoload_with=engine)

        # Join exp_message and reference_table on the reference_id column
        join_condition = exp_message_table.c.reference_id == reference_table.c.id
        joined_tables = exp_message_table.join(reference_table, join_condition)
        logging.debug(f'joined_tables: {joined_tables}')


        # Construct the SQL query to fetch messages with limited results
        query = text(
            f"""
            SELECT 
                {exp_message_table.name}.sent_time,
                {reference_table.name}.template_name,
                {reference_table.name}.id
            FROM 
                {exp_message_table.name}
            JOIN 
                {reference_table.name} 
            ON 
                {exp_message_table.name}.reference_id = {reference_table.name}.id
            ORDER BY 
                {exp_message_table.name}.sent_time DESC
            LIMIT 
                :limit
            """
        ).bindparams(limit=limit)
        logging.debug(f'query: {query}')


        # Execute the query and fetch all results
        result = session.execute(query).fetchall()
        logging.debug(f'result: {result}')

        # Transform the result into a list of dictionaries
        unique_reference_ids = set()
        messages = []

        for row in result:
            sent_time_utc = row[0].astimezone(pytz.utc)  # Convert to UTC
            sent_time_ist = sent_time_utc.astimezone(ist)  # Convert to IST

            # Remove seconds from the time format
            sent_time_ist = sent_time_ist.replace(second=0, microsecond=0)

            reference_id = row[2]
            if reference_id not in unique_reference_ids:
                message_dict = {
                    "sent_time": sent_time_ist.strftime('%d-%m-%Y %H:%M'),
                    "template_name": row[1],
                    "reference_id": reference_id
                }
                messages.append(message_dict)
                unique_reference_ids.add(reference_id)

        return {"messages": messages}
    
    except Exception as e:
        # If an error occurs, raise an HTTPException with a 500 status code and the error detail
        raise HTTPException(status_code=500, detail=f"Error fetching messages: {str(e)}")

    finally:
        session.close()  # Close the session to prevent resource leaks








from utils.table_hierarchy import find_relationships,find_bottom_most_level
from utils.user_filter import user_filtering


# FETCH A PARTICULAR MESSAGE FOR USER...
@router.get("/{id}")
async def get_reference_details(id: int):
    try:
        # Create metadata
        metadata = MetaData()
        metadata.reflect(bind=engine)

        # Get exp_message_table and reference_table
        exp_message_table = Table("exp_message", metadata, autoload_with=engine)
        reference_table = Table("reference_table", metadata, autoload_with=engine)

        # Start a new session
        with Session() as session:
            # Fetch details from the reference table
            query = text(
                f"""
                SELECT * FROM {reference_table.name}
                WHERE {reference_table.c.id} = :id
                """
            )

            # Execute the query
            reference_details = session.execute(query, {"id": id}).fetchone()

            if not reference_details:
                raise HTTPException(status_code=404, detail="Reference table entry not found")

            logging.debug(f'reference_details: {reference_details}')

            # Fetch column names dynamically
            column_names = reference_table.columns.keys()
            logging.debug(f'column_names: {column_names}')

            # Create a dictionary to store reference details
            reference_dict = {}

            for idx, column_name in enumerate(column_names):
                reference_dict[column_name] = reference_details[idx]

            # Find bottom most level
            relationships = find_relationships(engine)
            btm_lvl = find_bottom_most_level(relationships)

            # Remove "lvl_" prefix and add "_name" suffix
            btm_lvl_name = btm_lvl.replace("lvl_", "") + "_name"

            # Replace "branch_name" with btm_lvl_name
            reference_dict["btm_lvl"] = reference_dict.pop(btm_lvl_name, None)
            users=user_filtering(reference_dict["btm_lvl"])

            # Return the reference details
            return {"reference_data":reference_dict},users

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reference details: {str(e)}")
