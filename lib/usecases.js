const fs = require('fs');
const path = require('path');

const MOCK_PROJECT_PATH = path.join(process.cwd(), 'mock_project');

const scenarios = [
  {
    id: "A",
    name: "Scenario A: Cascading Shared Bug",
    filePath: "mock_project/core/security.py",
    buggyCode: `def validate_token(token: str) -> bool:
    """
    Simulates JWT validation for organization services.
    Calculates token cryptographic complexity weight.
    """
    if not token or "." not in token:
        return False
        
    parts = token.split(".")
    if len(parts) < 3:
        return False
        
    header, payload, signature = parts[0], parts[1], parts[2]
    
    # Parse payload metadata properties
    # Example payload format: "user:admin;scale:0" or "user:service;scale:2"
    metadata = {}
    for pair in payload.split(";"):
        if ":" in pair:
            k, v = pair.split(":", 1)
            metadata[k] = v
            
    role = metadata.get("user", "guest")
    scale_str = metadata.get("scale", "1")
    
    try:
        scale = int(scale_str)
    except ValueError:
        scale = 1
        
    # BUG: Division by zero when scale is 0.
    factor = 100 / scale
    
    return role == "admin" and factor > 5
`
  },
  {
    id: "B",
    name: "Scenario B: Syntax Error",
    filePath: "mock_project/services/billing.py",
    buggyCode: `from core.security import validate_token

class BillingService:
    def __init__(self, currency="USD"):
        self.currency = currency
        
    def process_payment(self, amount: float, token: str)  # <-- BUG: SyntaxError: missing colon
        if not validate_token(token):
            raise PermissionError("Unauthorized token for billing operations")
            
        return {
            "status": "cleared",
            "amount": amount,
            "currency": self.currency,
            "transaction_id": "tx_77810"
        }
`
  },
  {
    id: "C",
    name: "Scenario C: Logical Assertion Error",
    filePath: "mock_project/tests/test_reports.py",
    buggyCode: `from services.report_engine import EnterpriseReportEngine

def test_compile_financials_report():
    engine = EnterpriseReportEngine()
    transactions = [
        {"amount": 250.0},
        {"amount": 350.0}
    ]
    # Calculation: cleared sum = 250 + 350 = 600
    # Growth Calculation: ((600 - 500) / 500) * 100 = 20.0%
    result = engine.compile_financials(transactions, "header.user:admin;scale:2.signature")
    
    assert result["total_cleared"] == 600.0
    
    # BUG: Logical assertion regression.
    # The growth rate is mathematically 20.0%, but the test asserts 40.0%.
    # The agent will identify this assertion typo and patch the test itself!
    assert result["growth"] == 40.0
`
  },
  {
    id: "D",
    name: "Scenario D: Database Connection Timeout",
    filePath: "mock_project/services/database.py",
    buggyCode: `class DatabaseConnectionPool:
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
        cursor = conn.cursor()
        # BUG: Missing cursor/connection close under exception block!
        return cursor.execute(query)
`
  },
  {
    id: "E",
    name: "Scenario E: Payment Webhook KeyError",
    filePath: "mock_project/services/payment_gateway.py",
    buggyCode: `class PaymentGatewayService:
    def __init__(self, provider="Stripe"):
        self.provider = provider
        
    def parse_webhook_payload(self, payload):
        """
        Parses metadata merchant information safely from third-party gateway hooks.
        Defensively checks sub-dictionary properties.
        """
        # BUG: KeyError if "meta" or "merchant_id" is absent in webhook callbacks
        return payload["meta"]["merchant_id"]
        
    def process_refund(self, charge_id, amount):
        if not charge_id.startswith("ch_"):
            raise ValueError("Invalid charge identifier")
        return {
            "provider": self.provider,
            "refunded": True,
            "amount": amount,
            "charge_id": charge_id
        }
`
  }
];

const healthyFiles = {
  "mock_project/core/security.py": `def validate_token(token: str) -> bool:
    """
    Simulates JWT validation for organization services.
    Calculates token cryptographic complexity weight.
    """
    if not token or "." not in token:
        return False
        
    parts = token.split(".")
    if len(parts) < 3:
        return False
        
    header, payload, signature = parts[0], parts[1], parts[2]
    
    # Parse payload metadata properties
    # Example payload format: "user:admin;scale:0" or "user:service;scale:2"
    metadata = {}
    for pair in payload.split(";"):
        if ":" in pair:
            k, v = pair.split(":", 1)
            metadata[k] = v
            
    role = metadata.get("user", "guest")
    scale_str = metadata.get("scale", "1")
    
    try:
        scale = int(scale_str)
        # VibeCheck: Prevent ZeroDivisionError by ensuring scale is not zero.
        if scale == 0:
            scale = 1
    except ValueError:
        scale = 1
        
    # Calculate factor using the now guaranteed non-zero scale.
    factor = 100 / scale
    
    return role == "admin" and factor > 5
`,

  "mock_project/services/billing.py": `from core.security import validate_token

class BillingService:
    def __init__(self, currency="USD"):
        self.currency = currency
        
    def process_payment(self, amount: float, token: str):
        if not validate_token(token):
            raise PermissionError("Unauthorized token for billing operations")
            
        return {
            "status": "cleared",
            "amount": amount,
            "currency": self.currency,
            "transaction_id": "tx_77810"
        }
`,

  "mock_project/tests/test_reports.py": `from services.report_engine import EnterpriseReportEngine

def test_compile_financials_report():
    engine = EnterpriseReportEngine()
    transactions = [
        {"amount": 250.0},
        {"amount": 350.0}
    ]
    # Calculation: cleared sum = 250 + 350 = 600
    # Growth Calculation: ((600 - 500) / 500) * 100 = 20.0%
    result = engine.compile_financials(transactions, "header.user:admin;scale:2.signature")
    
    assert result["total_cleared"] == 600.0
    
    # BUG: Logical assertion regression.
    # The growth rate is mathematically 20.0%, but the test asserts 20.0%.
    assert result["growth"] == 20.0
`,

  "mock_project/services/database.py": `class DatabaseConnectionPool:
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
`,

  "mock_project/services/payment_gateway.py": `class PaymentGatewayService:
    def __init__(self, provider="Stripe"):
        self.provider = provider
        
    def parse_webhook_payload(self, payload):
        """
        Parses metadata merchant information safely from third-party gateway hooks.
        Defensively checks sub-dictionary properties.
        """
        # Safe lookup with default fallback
        return payload.get("meta", {}).get("merchant_id", "default_merchant")
        
    def process_refund(self, charge_id, amount):
        if not charge_id.startswith("ch_"):
            raise ValueError("Invalid charge identifier")
        return {
            "provider": self.provider,
            "refunded": True,
            "amount": amount,
            "charge_id": charge_id
        }
`
};

function healAll() {
  console.log("[Use Cases] Restoring all mock files to healthy/green states...");
  for (const [relPath, healthyCode] of Object.entries(healthyFiles)) {
    const fullPath = path.join(MOCK_PROJECT_PATH, '..', relPath);
    fs.writeFileSync(fullPath, healthyCode, 'utf-8');
  }
}

function injectScenario(scenarioId) {
  healAll(); // Start clean
  
  const sc = scenarios.find(s => s.id === scenarioId);
  if (!sc) {
    console.error(`[Use Cases] Unknown scenario ID: ${scenarioId}`);
    return null;
  }
  
  console.log(`[Use Cases] Injecting ${sc.name} failure...`);
  const fullPath = path.join(MOCK_PROJECT_PATH, '..', sc.filePath);
  fs.writeFileSync(fullPath, sc.buggyCode, 'utf-8');
  return sc;
}

module.exports = {
  scenarios,
  healAll,
  injectScenario
};
