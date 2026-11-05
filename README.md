To run the project, create an env file in place of the .env.example file and add your own database keys.
Download the database if needed.
To start backend, run uvicorn backend.main:app --reload
To start frontend, run python -m http.server 5500 --directory frontend