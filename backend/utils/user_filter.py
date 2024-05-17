# Import necessary modules
from fastapi import  HTTPException
from sqlalchemy import create_engine,MetaData, Table,text
from sqlalchemy.orm import sessionmaker

import os
import logging
from utils.table_hierarchy import find_relationships,find_bottom_most_level


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/mydatabase")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
Session = sessionmaker(bind=engine)


def user_filtering(btm_lvl_name: str): 
    session = Session()
    try:
        metadata = MetaData()

        # Reflect existing tables to ensure SQLAlchemy is aware of them
        metadata.reflect(bind=engine)

        # Find the bottom-most level
        relationships = find_relationships(engine)
        bottom_most = find_bottom_most_level(relationships)
        logging.debug(f'bottom_most: {bottom_most}, btm_lvl_name: {btm_lvl_name}')

        # Extract the column name for btm_lvl_id dynamically
        btm_lvl_column = bottom_most.replace("lvl_", "") + "_id"
        logging.debug(f'btm_lvl_column: {btm_lvl_column}')

        # Ensure the users table exists
        users_table = Table("users", metadata, autoload_with=engine)
        logging.debug(f'users_table: {users_table}')

        # Get the bottom-most table to fetch the btm_id
        bottom_most_table = metadata.tables[bottom_most]
        logging.debug(f'bottom_most_table: {bottom_most_table}')

        query = text(f"SELECT {bottom_most}.id FROM {bottom_most} WHERE {bottom_most}.name = :btm_lvl_name")
        logging.debug(f'query: {query}')
        result = session.execute(query, {"btm_lvl_name": btm_lvl_name})

        # Fetch the bottom_most_id from the result
        btm_id = result.scalar()
        logging.debug(f'btm_id: {btm_id}')

        if btm_id is None:
            raise HTTPException(status_code=404, detail=f"No users found for the provided bottom level name")

        # Execute the query to fetch users with the given btm_id
        query = users_table.select().where(getattr(users_table.c, btm_lvl_column) == btm_id)
        result = session.execute(query)
        logging.debug(f'result: {result}')

        # Extract user IDs from the result
        users = []
        for row in result.fetchall():
            logging.debug(f'row: {row}')
            users.append(row[0])

        return {"users":users}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error filtering users: {str(e)}")

    finally:
        session.close()  # Close the session to prevent resource leaks