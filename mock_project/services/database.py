class DatabaseConnectionPool:
    def __init__(self, size=5):
        self.size = size
        self.active_connections = 0
        
    def get_connection(self):
        if self.active_connections >= self.size:
            raise RuntimeError("TimeoutError: Connection pool exhausted. Too many active cursors.")
        self.active_connections += 1
        return self
        
    def cursor(self):
        return self
        
    def execute(self, query):
        return f"Results for: {query}"
        
    def close(self):
        pass
        
    def release_connection(self, conn):
        if self.active_connections > 0:
            self.active_connections -= 1

class DatabaseService:
    def __init__(self):
        self.pool = DatabaseConnectionPool()
        
    def execute_query(self, query):
        conn = self.pool.get_connection()
        try:
            cursor = conn.cursor()
            return cursor.execute(query)
        finally:
            cursor.close()
            self.pool.release_connection(conn)
