from fastapi import APIRouter, HTTPException,Query
from pydantic import BaseModel
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, ForeignKey,text,select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Dict
import logging
import os

# FILTER BASED on FILTER TYPE AND VALUE.. INNER JOIN...
# SELECT
#     r.name AS region_name,
#     z.name AS zone_name,
#     c.name AS cluster_name,
#     b.name AS branch_name
# FROM
#     Regions r
#     INNER JOIN Zones z ON r.region_id = z.region_id
#     INNER JOIN Clusters c ON z.zone_id = c.zone_id
#     INNER JOIN Branches b ON c.cluster_id = b.cluster_id
# WHERE
#     r.name = 'North America';


logging.basicConfig(level=logging.DEBUG)

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/mydatabase")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# FastAPI router
router = APIRouter()

# Pydantic model for the combined input
class HierarchicalInput(BaseModel):
    hierarchy: List[str]  # List of table names in order of hierarchy
    data: List[Dict[str, str]]  # List of dictionaries with hierarchical data

# Function to create tables dynamically with "lvl_" prefix
def create_dynamic_tables(hierarchy: List[str]):
    metadata = MetaData()
    tables = {}
    parent = None

    for level in hierarchy:
        table_name = f"lvl_{level.lower()}"  # Add "lvl_" prefix to the table name

        if table_name in metadata.tables:
            continue  # If it exists, skip creating it

        fk = ForeignKey(f"{parent}.id") if parent else None

        table = Table(
            table_name,
            metadata,
            Column("id", Integer, primary_key=True),
            Column("name", String(50)),
            Column(f"{parent}_id", Integer, fk) if parent else None,
        )

        tables[table_name] = table  # Store reference to created tables
        parent = table_name  # Update the parent for the next level

    metadata.create_all(engine)  # Create all tables in the database
    return tables  # Return the table references

# Helper function to insert or fetch ID for a given data
def insert_or_get(session, table, item_data: Dict[str, str], parent_column=None):
    # Query to check if the record exists
    query = select(table).where(table.c.name == item_data["name"])

    # If there's a parent column, add it to the query
    if parent_column and parent_column in item_data:
        query = query.where(table.c[parent_column] == item_data[parent_column])

    # Fetch the first record
    existing_record = session.execute(query).fetchone()

    if existing_record:
        return existing_record.id

    # If not found, insert and get the new ID
    result = session.execute(table.insert().values(item_data))
    session.commit()  # Commit to get the ID
    return result.inserted_primary_key[0]

@router.post("/upload-branch-data")
async def create_tables_and_add_data(request: HierarchicalInput):
    # Start a new database session
    session = Session()

    try:
        # Create tables based on hierarchy
        created_tables = create_dynamic_tables(request.hierarchy)

        # Reflect existing table structure
        metadata = MetaData()
        metadata.reflect(bind=engine)

        # To track parent-child relationships
        parent_id_map = {}

        # Loop through each dictionary in the input data
        for item in request.data:
            previous_table_name = None
            previous_id = None

            # Insert based on hierarchy order
            for key, value in item.items():
                # Convert key to "lvl_" prefixed table name
                table_name = f"lvl_{key.lower()}"
                table = metadata.tables.get(table_name)

                if table is None:
                    raise HTTPException(status_code=500, detail=f"Table '{table_name}' does not exist")

                # Determine if this entry has a parent
                parent_column = None
                if previous_table_name:
                    parent_column = f"{previous_table_name}_id"

                # Prepare the data for insertion
                insert_data = {"name": value}
                if parent_column and previous_id is not None:
                    insert_data[parent_column] = previous_id

                # Insert or fetch the existing record's ID
                new_id = insert_or_get(session, table, insert_data, parent_column)

                # Update the previous table name and ID for parent references
                previous_table_name = table_name
                previous_id = new_id

        return {
            "message": "Tables and data created successfully",
            "created_tables": list(created_tables.keys()),
        }

    except SQLAlchemyError as e:
        session.rollback()  # Rollback on error
        raise HTTPException(status_code=500, detail=f"Error inserting data: {str(e)}")

    finally:
        session.close()  # Ensure session closure











# 
# API to fetch hierarchy
# Also the top most and bottom most tables
# 

from utils.table_hierarchy import find_relationships,find_top_most_level,find_bottom_most_level


# Function to traverse the hierarchy and return an ordered list of tables
def get_ordered_table_hierarchy(relationships, top_most_level):
    # Create an ordered list with the topmost level at the start
    ordered_hierarchy = [top_most_level]
    current_level = top_most_level

    # Traverse the relationships to build the hierarchy
    while True:
        # Get the child tables that have the current level as their parent
        child_tables = []
        for table, parent_columns in relationships.items():
            # Check if the current level is a parent to any other table
            if current_level in [parent[0] for parent in parent_columns]:
                child_tables.append(table)

        if not child_tables:
            # If no child tables found, we've reached the bottommost level
            break

        # Add the first child table to the hierarchy (assuming a single hierarchy path)
        ordered_hierarchy.append(child_tables[0])
        current_level = child_tables[0]

    return ordered_hierarchy



# Get Values for each hierarchy level (Use in dropdown in the frontend):
@router.get("/lvl-values")
async def get_lvl_tables_data():
    session = Session()  # Create a session for database operations
    data = {}

    metadata = MetaData()
    metadata.reflect(bind=engine)

    try:
        # Get all tables starting with 'lvl_'
        relationships = find_relationships(engine)
            # Find the top-most and bottom-most levels
        top_most = find_top_most_level(relationships)
        lvl_tables = get_ordered_table_hierarchy(relationships, top_most)
        logging.debug(f'lvl_tables: {lvl_tables}')
        if not lvl_tables:
            return {"error": "No tables found starting with 'lvl_'"}

        # Retrieve data from each table
        for table_name in lvl_tables:  # Iterate over table names
            # Execute the select statement and fetch the data
            table = metadata.tables[table_name]  # Get the table object
            select_stmt = table.select()  # Create a select statement
            result = session.execute(select_stmt)  # Execute the query

            table_data = []
            for row in result.fetchall():  # Fetch all rows
                # Construct dictionary using column values
                row_dict = {table.columns[i].name: row[i] for i in range(len(row))}
                table_data.append(row_dict)  # Add the dictionary to the list

            data[table_name] = table_data  # Store in dictionary with the modified table name as key

        return data  # Return the dictionary with all the data

    except Exception as e:
        session.rollback()  # Rollback if there's an error
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

    finally:
        session.close() # Ensure the session is closed to prevent resource leaks

# @router.get("/lvl_info")
# async def get_lvl_info():
#     # Get the relationships using the function
#     relationships = find_relationships(engine)

    # # Find the top-most and bottom-most levels
    # top_most = find_top_most_level(relationships)
#     bottom_most = find_bottom_most_level(relationships)

#     # Get the ordered hierarchy based on the relationships
#     ordered_hierarchy = get_ordered_table_hierarchy(relationships, top_most)

#     # Return the ordered hierarchy without the "lvl_" prefix
#     ordered_hierarchy_without_prefix = [table[4:] for table in ordered_hierarchy]

#     return {
#         "tables": ordered_hierarchy_without_prefix,
#         "top_most": top_most[4:],  # remove "lvl_"
#         "bottom_most": bottom_most[4:]  # remove "lvl_"
#     }

















#----------------------------- FILTER BRANCH VALUES API  -------------------------------------------


# Adjust the function to initialize the stack from the correct table
def generate_query_string(relationships, filter_type, filter_value):
    table_name = f"lvl_{filter_type.lower()}"

    # Check if the given filter type is valid
    if table_name not in relationships:
        raise HTTPException(status_code=400, detail="Invalid filter type")

    # Build the INNER JOINs based on the hierarchy
    top_most_table = find_top_most_level(relationships)
    join_clauses = []
    visited = set()
    stack = [(table_name, None)]  # Initialize from the current table, not top-most

    while stack:
        current_table, parent_table = stack.pop()
        visited.add(current_table)

        if parent_table:
            join_clause = f"INNER JOIN {current_table} ON {parent_table}.id = {current_table}.{parent_table}_id"
            join_clauses.append(join_clause)

        # Add child tables to ensure all relationships are connected
        for child in relationships.get(current_table, []):
            if child[0] not in visited:
                stack.append((child[0], current_table))

    # Determine the SELECT clause based on the given level
    bottom_most_table = find_bottom_most_level(relationships)

    if table_name == top_most_table:
        # For top-most level, return bottom-most level values
        select_clause = f"{bottom_most_table}.name"
    elif table_name == bottom_most_table:
        # For bottom-most level, return all data in the hierarchy
        select_clause = ", ".join([f"{table}.name" for table in visited])
    else:
        # For intermediate level, return parent data and bottom-most level data
        select_clause = ", ".join([f"{bottom_most_table}.name"] + [f"{table}.name" for table in relationships[table_name]])

    # WHERE clause with the filter condition
    where_clause = f"WHERE {table_name}.name = '{filter_value}'"

    # Construct the query string with FROM, INNER JOINs, SELECT, and WHERE clauses
    query_str = f"SELECT {select_clause} FROM {top_most_table} {' '.join(join_clauses)} {where_clause};"
    logging.debug(f'query_str: {query_str}')
    return query_str


# Function to execute the query and retrieve results
def get_query_results(engine, query_str):
    with engine.connect() as connection:
        query = text(query_str)
        result = connection.execute(query)
        rows = result.fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="No results found")

    # Return the results as a list of dictionaries for proper retrieval
    result_data = []
    for row in rows:
        row_dict = {f"column_{i}": col for i, col in enumerate(row)}
        result_data.append(row_dict)


    return result_data


# FastAPI endpoint to get filtered results
@router.get("/get-data/")
async def get_filtered_results(
    filter_type: str = Query(..., description="Type of filter"),
    filter_value: str = Query(..., description="Value to filter by"),
):
    try:
        # Get relationships between tables
        relationships = find_relationships(engine)

        # Generate the query string with INNER JOINs
        query_str = generate_query_string(relationships, filter_type, filter_value)

        # Get query results and return them
        results = get_query_results(engine, query_str)

        return {
            "message": "Filtered results",
            "data": results,
        }

    except HTTPException as e:
        raise e
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching filtered results: {str(e)}")