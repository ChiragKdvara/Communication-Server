# Use a Python base image
FROM python:3.10-slim

# Install FastAPI and necessary dependencies
RUN pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic[email] pytz

# Copy the application files into the container
COPY . /app/

# Set the working directory
WORKDIR /app

EXPOSE 8000

# Start FastAPI with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
