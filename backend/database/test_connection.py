from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

from backend.database.connection import engine

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT DATABASE()"))
        database_name = result.scalar()

        print("CONNECTION SUCCESSFUL!")
        print("Connected database:", database_name)

except SQLAlchemyError as e:
    print("CONNECTION FAILED!")
    print("Error type:", type(e).__name__)
    raise
