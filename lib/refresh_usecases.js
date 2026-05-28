const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'db.json');

/**
 * Reads the current database state. Never overwrites existing data.
 */
function readDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      if (!raw.chatMessages) raw.chatMessages = [];
      return raw;
    }
  } catch (e) {
    console.error("[Seed Refresher] Failed to read db.json:", e.message);
  }
  return { builds: [], patches: [], chatMessages: [] };
}

/**
 * Writes data back to db.json atomically.
 */
function writeDb(data) {
  const tempPath = DB_PATH + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_PATH);
}

/**
 * The 5 scenario templates — ONLY failure injection data + log output.
 * No hardcoded patches! The AI model generates diagnosis and patches dynamically
 * when the user triggers the pipeline or requests diagnosis.
 */
const scenarioTemplates = [
  {
    target_scenario: "Scenario A: Cascading Shared Bug",
    log_output: "============================= test session starts =============================\nplatform win32 -- Python 3.10.2, pytest-7.4.0\nrootdir: C:\\Users\\mashw\\Desktop\\Open AI\\mock_project\ncollected 5 items\n\ntests/test_security.py F                                                 [ 20%]\ntests/test_billing.py F                                                  [ 40%]\ntests/test_reports.py F                                                  [ 60%]\ntests/test_database.py .                                                 [ 80%]\ntests/test_payment.py .                                                  [100%]\n\n================================== FAILURES ===================================\n______________________________ test_security_zero_scale _______________________\n\n    def test_security_zero_scale():\n        # Dynamic zero division vector: triggers crash in core/security.py.\n>       assert validate_token(\"header.user:admin;scale:0.signature\") is True\n\ntests/test_security.py:13: \n_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _\n\ntoken = 'header.user:admin;scale:0.signature'\n\n    def validate_token(token: str) -> bool:\n        ...\n        try:\n            scale = int(scale_str)\n        except ValueError:\n            scale = 1\n            \n        # BUG: Division by zero when scale is 0.\n>       factor = 100 / scale\nE       ZeroDivisionError: division by zero\n\ncore/security.py:27: ZeroDivisionError\n============================== 3 failed, 2 passed in 0.15s =============================="
  },
  {
    target_scenario: "Scenario B: Syntax Error",
    log_output: "============================= test session starts =============================\nplatform win32 -- Python 3.10.2, pytest-7.4.0\nrootdir: C:\\Users\\mashw\\Desktop\\Open AI\\mock_project\ncollected 0 items / 1 error\n\n=================================== ERRORS ====================================\n___________________ ERROR collecting tests/test_billing.py ____________________\nImportError while importing test module 'C:\\Users\\mashw\\Desktop\\Open AI\\mock_project\\tests\\test_billing.py'.\nDirectory import failed because BillingService has a compilation error.\n  File \"C:\\Users\\mashw\\Desktop\\Open AI\\mock_project\\services\\billing.py\", line 6\n    def process_payment(self, amount: float, token: str)\n                                                       ^\nSyntaxError: expected ':' to terminate method signature\n\n=========================== 1 error in 0.08s ==========================="
  },
  {
    target_scenario: "Scenario C: Logical Assertion Error",
    log_output: "============================= test session starts =============================\nplatform win32 -- Python 3.10.2, pytest-7.4.0\nrootdir: C:\\Users\\mashw\\Desktop\\Open AI\\mock_project\ncollected 5 items\n\ntests/test_security.py .                                                 [ 20%]\ntests/test_billing.py .                                                  [ 40%]\ntests/test_reports.py F                                                  [ 60%]\ntests/test_database.py .                                                 [ 80%]\ntests/test_payment.py .                                                  [100%]\n\n================================== FAILURES ===================================\n________________________ test_compile_financials_report _______________________\n\n    def test_compile_financials_report():\n        ...\n        result = engine.compile_financials(transactions, \"header.user:admin;scale:2.signature\")\n        \n        assert result[\"total_cleared\"] == 600.0\n        \n        # BUG: Logical assertion regression.\n>       assert result[\"growth\"] == 40.0\nE       AssertionError: assert 20.0 == 40.0\nE         -20.0\nE         +40.0\n\ntests/test_reports.py:16: AssertionError\n======================== 1 failed, 4 passed in 0.18s ========================="
  },
  {
    target_scenario: "Scenario D: Database Connection Timeout",
    log_output: "============================= test session starts =============================\nplatform win32 -- Python 3.10.2, pytest-7.4.0\nrootdir: C:\\Users\\mashw\\Desktop\\Open AI\\mock_project\ncollected 5 items\n\ntests/test_security.py .                                                 [ 20%]\ntests/test_billing.py .                                                  [ 40%]\ntests/test_reports.py .                                                  [ 60%]\ntests/test_payment.py .                                                  [ 80%]\ntests/test_database.py F                                                 [100%]\n\n================================== FAILURES ===================================\n____________________________ test_database_queries ____________________________\n\n    def test_database_queries():\n        db = DatabaseService()\n        # Execute consecutive queries. If connection leaks occur, pool size of 5 will blow up!\n        for i in range(10):\n>           res = db.execute_query(f\"SELECT * FROM users LIMIT {i}\")\n\ntests/test_database.py:7: \n_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ \nservices/database.py:25: in execute_query\n    conn = self.pool.get_connection()\n_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ \n\nself = <services.database.DatabaseConnectionPool object at 0x0000021A15A3A0B0>\n\n    def get_connection(self):\n        if self.active_connections >= self.size:\n>           raise RuntimeError(\"TimeoutError: Connection pool exhausted. Too many active cursors.\")\nE           RuntimeError: TimeoutError: Connection pool exhausted. Too many active cursors.\n\nservices/database.py:9: RuntimeError\n======================== 1 failed, 4 passed in 0.22s ========================="
  },
  {
    target_scenario: "Scenario E: Payment Webhook KeyError",
    log_output: "============================= test session starts =============================\nplatform win32 -- Python 3.10.2, pytest-7.4.0\nrootdir: C:\\Users\\mashw\\Desktop\\Open AI\\mock_project\ncollected 5 items\n\ntests/test_security.py .                                                 [ 20%]\ntests/test_billing.py .                                                  [ 40%]\ntests/test_reports.py .                                                  [ 60%]\ntests/test_database.py .                                                 [ 80%]\ntests/test_payment.py F                                                  [100%]\n\n================================== FAILURES ===================================\n_________________________ test_payment_webhook_malformed ________________________\n\n    def test_payment_webhook_malformed():\n        service = PaymentGatewayService()\n        # Webhook triggers with incomplete metadata properties\n        payload = {\n            \"event\": \"charge.failed\"\n        }\n>       assert service.parse_webhook_payload(payload) == \"default_merchant\"\n\ntests/test_payment.py:18: \n_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ \n\nself = <services.payment_gateway.PaymentGatewayService object at 0x0000021A15B4C120>\npayload = {'event': 'charge.failed'}\n\n    def parse_webhook_payload(self, payload):\n        \"\"\"\n        Parses metadata merchant information safely from third-party gateway hooks.\n        Defensively checks sub-dictionary properties.\n        \"\"\"\n        # BUG: KeyError if \"meta\" or \"merchant_id\" is absent in webhook callbacks\n>       return payload[\"meta\"][\"merchant_id\"]\nE       KeyError: 'meta'\n\nservices/payment_gateway.py:12: KeyError\n======================== 1 failed, 4 passed in 0.19s ========================="
  }
];

/**
 * APPEND-ONLY REFRESH: Picks a random scenario and appends it as a NEW build.
 * The build is created with status FAILED — no hardcoded patches.
 * The AI will generate the diagnosis dynamically when the user views the build.
 */
function refreshUsecases() {
  console.log("[Seed Refresher] Appending a fresh enterprise scenario to the existing database...");
  
  const data = readDb();
  
  // Calculate next build ID from existing data
  const maxId = Math.max(...data.builds.map(b => parseInt(b.id) || 100), 100);
  const newBuildId = String(maxId + 1);
  
  // Pick a random scenario
  const scenario = scenarioTemplates[Math.floor(Math.random() * scenarioTemplates.length)];
  
  // Create the new build record — status is FAILED, no pre-generated patch
  const newBuild = {
    id: newBuildId,
    timestamp: new Date().toISOString(),
    status: "FAILED",
    log_output: scenario.log_output,
    target_scenario: scenario.target_scenario
  };
  
  // APPEND to existing data — never overwrite
  data.builds.push(newBuild);
  
  writeDb(data);
  console.log(`[Seed Refresher] Appended Build #${newBuildId} (${scenario.target_scenario}) as FAILED — awaiting AI diagnosis.`);
  console.log(`[Seed Refresher] Total builds in database: ${data.builds.length}`);
}

/**
 * INITIAL SEED: Only called when db.json does not exist at all (fresh install).
 * Seeds the database with 2 green builds and 5 FAILED builds (one per scenario).
 * No hardcoded patches — the AI will diagnose each one dynamically.
 */
function seedInitialData() {
  if (fs.existsSync(DB_PATH)) {
    console.log("[Seed Refresher] Database already exists. Skipping initial seed.");
    return;
  }
  
  console.log("[Seed Refresher] First-time setup: Creating initial database with starter scenarios...");
  
  const now = Date.now();
  const data = { builds: [], patches: [], chatMessages: [] };
  
  // 2 historical green builds
  data.builds.push({
    id: "101",
    timestamp: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
    status: "SUCCESS",
    log_output: "============================= test session starts =============================\nplatform win32 -- Python 3.10.2, pytest-7.4.0\nrootdir: C:\\Users\\enterprise\\vibecheck-ai\\mock_project\ncollected 5 items\n\ntests/test_security.py .                                                 [ 20%]\ntests/test_billing.py .                                                  [ 40%]\ntests/test_reports.py .                                                  [ 60%]\ntests/test_database.py .                                                 [ 80%]\ntests/test_payment.py .                                                  [100%]\n\n============================== 5 passed in 0.12s ==============================",
    target_scenario: "historical_green"
  });
  data.builds.push({
    id: "102",
    timestamp: new Date(now - 24 * 3600 * 1000).toISOString(),
    status: "SUCCESS",
    log_output: "============================= test session starts =============================\nplatform win32 -- Python 3.10.2, pytest-7.4.0\nrootdir: C:\\Users\\enterprise\\vibecheck-ai\\mock_project\ncollected 5 items\n\ntests/test_security.py .                                                 [ 20%]\ntests/test_billing.py .                                                  [ 40%]\ntests/test_reports.py .                                                  [ 60%]\ntests/test_database.py .                                                 [ 80%]\ntests/test_payment.py .                                                  [100%]\n\n============================== 5 passed in 0.14s ==============================",
    target_scenario: "historical_green"
  });
  
  // 5 failure scenarios — FAILED status, no patches (AI will diagnose dynamically)
  const offsets = [12, 6, 4, 2, 0]; // hours ago
  for (let i = 0; i < scenarioTemplates.length; i++) {
    const sc = scenarioTemplates[i];
    const buildId = String(103 + i);
    const ts = new Date(now - offsets[i] * 3600 * 1000);
    
    data.builds.push({
      id: buildId,
      timestamp: ts.toISOString(),
      status: "FAILED",
      log_output: sc.log_output,
      target_scenario: sc.target_scenario
    });
    // No patches — they will be generated by AI when viewed
  }
  
  writeDb(data);
  console.log(`[Seed Refresher] Initial database seeded with ${data.builds.length} builds (no hardcoded patches).`);
}

if (require.main === module) {
  refreshUsecases();
}

module.exports = { refreshUsecases, seedInitialData, scenarioTemplates };
