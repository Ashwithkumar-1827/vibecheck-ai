import pytest
from services.database import DatabaseService

def test_database_queries():
    db = DatabaseService()
    # Execute consecutive queries. If connection leaks occur, pool size of 5 will blow up!
    for i in range(10):
        res = db.execute_query(f"SELECT * FROM users LIMIT {i}")
        assert "SELECT" in res

def test_database_single_query():
    db = DatabaseService()
    res = db.execute_query("SELECT NOW()")
    assert "NOW" in res
