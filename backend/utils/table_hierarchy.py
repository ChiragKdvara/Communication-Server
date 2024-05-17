# Function to find relationships, considering only tables with "lvl_" prefix
from sqlalchemy import MetaData

def find_relationships(engine):
    metadata = MetaData()
    metadata.reflect(engine)

    relationships = {}
    for table in metadata.tables.values():
        if not table.name.lower().startswith("lvl_"):
            continue

        parent_columns = []
        
        for column in table.columns:
            if hasattr(column, "foreign_keys"):
                for fk in column.foreign_keys:
                    parent_table = fk.column.table.name.lower()
                    if parent_table.startswith("lvl_"):
                        parent_columns.append((parent_table, fk.column.name))

        relationships[table.name.lower()] = parent_columns if parent_columns else []

    return relationships


# Functions to identify top-most, intermediate, and bottom-most levels
def find_top_most_level(relationships):
    top_most_levels = [table for table, parent_columns in relationships.items() if not parent_columns]
    return top_most_levels[0]


def find_bottom_most_level(relationships):
    all_tables = set(relationships.keys())
    parent_tables = set()

    for parent_columns in relationships.values():
        for parent_table in [parent[0] for parent in parent_columns]:
            parent_tables.add(parent_table)

    bottom_most_levels = list(all_tables - parent_tables)
    return bottom_most_levels[0]