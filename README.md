ActiveKids_Project - Example Full Project Package

This package contains a frontend (split HTML/CSS/JS) and a simple illustrative Flask backend.


1) Create venv:
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

2) (Optional) Start DBs via Homebrew:
   brew services start mongodb-community@7.0
   brew services start redis
   brew services start cassandra
   brew services start neo4j

3) Run backend:
   cd backend
   python app.py

4) Open http://localhost:5000

Folder structure:
- frontend/ (login.html, login.css, login.js, user.html, user.css, user.js, admin.html, admin.css, admin.js, images...)
- backend/ (app.py, config.py, .env)
- database_setup/ (mongo_setup.js, cassandra_setup.cql, neo4j_setup.cypher, redis_setup.txt)
