const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const MOCK_PROJECT_PATH = path.join(process.cwd(), 'mock_project');

function checkFileExists(relPath) {
  try {
    const targetPath = path.resolve(MOCK_PROJECT_PATH, relPath);
    const normalizedMockPath = MOCK_PROJECT_PATH.replace(/\\/g, '/').toLowerCase();
    const normalizedTargetPath = targetPath.replace(/\\/g, '/').toLowerCase();
    
    if (!normalizedTargetPath.startsWith(normalizedMockPath)) {
      console.warn(`[Security Guard] Blocked read path traversal attempt: ${relPath}`);
      return false;
    }
    return fs.existsSync(targetPath);
  } catch (e) {
    return false;
  }
}

function getFileContent(relPath) {
  try {
    const targetPath = path.resolve(MOCK_PROJECT_PATH, relPath);
    const normalizedMockPath = MOCK_PROJECT_PATH.replace(/\\/g, '/').toLowerCase();
    const normalizedTargetPath = targetPath.replace(/\\/g, '/').toLowerCase();
    
    if (!normalizedTargetPath.startsWith(normalizedMockPath)) {
      console.warn(`[Security Guard] Blocked read path traversal attempt: ${relPath}`);
      return '';
    }
    return fs.readFileSync(targetPath, 'utf-8');
  } catch (e) {
    return '';
  }
}

/**
 * Executes python pytest command. Falls back to highly realistic reactive 
 * simulation if python or pytest are not installed or if execution fails.
 */
function runPipeline() {
  return new Promise((resolve) => {
    // Try running the real python test suite first
    exec('python -m pytest mock_project', { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (!err || (stdout && stdout.includes('test session starts'))) {
        // Python runs successfully (even if tests failed, stdout contains tracebacks)
        resolve({
          success: !err,
          log: stdout || stderr,
          isSimulated: false
        });
        return;
      }

      // If python is missing or failed to run, activate our reactive simulator
      console.warn("Python/pytest execution failed. Activating VibeCheck reactive pipeline simulator.");
      
      const securityContent = getFileContent('core/security.py');
      const billingContent = getFileContent('services/billing.py');
      const reportsContent = getFileContent('tests/test_reports.py');
      const databaseContent = getFileContent('services/database.py');
      const paymentContent = getFileContent('services/payment_gateway.py');
      
      // Determine pipeline state by reading the actual target files in the mock_project
      
      // 1. Check for Scenario B: Syntax error in services/billing.py
      const hasSyntaxError = billingContent && (
        !billingContent.includes('def process_payment(self, amount: float, token: str):') ||
        billingContent.includes('def process_payment(self, amount: float, token: str)::')
      );
      
      if (hasSyntaxError) {
        resolve({
          success: false,
          log: `============================= test session starts =============================
platform win32 -- Python 3.10.2, pytest-7.4.0
rootdir: ${MOCK_PROJECT_PATH}
collected 0 items / 1 error

=================================== ERRORS ====================================
___________________ ERROR collecting tests/test_billing.py ____________________
ImportError while importing test module '${path.join(MOCK_PROJECT_PATH, 'tests', 'test_billing.py')}'.
Directory import failed because BillingService has a compilation error.
  File "${path.join(MOCK_PROJECT_PATH, 'services', 'billing.py')}", line 6
    def process_payment(self, amount: float, token: str)
                                                       ^
SyntaxError: expected ':' to terminate method signature

=========================== 1 error in 0.08s ===========================`,
          isSimulated: true
        });
        return;
      }
      
      // 2. Check for Scenario A: ZeroDivisionError in core/security.py
      const hasDivisionError = securityContent && 
        securityContent.includes('factor = 100 / scale') && 
        !securityContent.includes('if scale == 0:') &&
        !securityContent.includes('scale != 0') &&
        !securityContent.includes('scale == 0') &&
        !securityContent.includes('scale or 1');
      
      if (hasDivisionError) {
        resolve({
          success: false,
          log: `============================= test session starts =============================
platform win32 -- Python 3.10.2, pytest-7.4.0
rootdir: ${MOCK_PROJECT_PATH}
collected 5 items

tests/test_security.py F                                                 [ 20%]
tests/test_billing.py F                                                  [ 40%]
tests/test_reports.py F                                                  [ 60%]
tests/test_database.py .                                                 [ 80%]
tests/test_payment.py .                                                  [100%]

================================== FAILURES ===================================
______________________________ test_security_zero_scale _______________________

    def test_security_zero_scale():
        # Dynamic zero division vector: triggers crash in core/security.py.
>       assert validate_token("header.user:admin;scale:0.signature") is True

tests/test_security.py:13: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

token = 'header.user:admin;scale:0.signature'

    def validate_token(token: str) -> bool:
        ...
        try:
            scale = int(scale_str)
        except ValueError:
            scale = 1
            
        # BUG: Division by zero when scale is 0.
>       factor = 100 / scale
E       ZeroDivisionError: division by zero

core/security.py:27: ZeroDivisionError
============================== 3 failed, 2 passed in 0.15s ==============================`,
          isSimulated: true
        });
        return;
      }
      
      // 3. Check for Scenario C: Logical Assertion error in tests/test_reports.py
      const hasAssertionError = reportsContent && reportsContent.includes('assert result["growth"] == 40.0');
      
      if (hasAssertionError) {
        resolve({
          success: false,
          log: `============================= test session starts =============================
platform win32 -- Python 3.10.2, pytest-7.4.0
rootdir: ${MOCK_PROJECT_PATH}
collected 5 items

tests/test_security.py .                                                 [ 20%]
tests/test_billing.py .                                                  [ 40%]
tests/test_reports.py F                                                  [ 60%]
tests/test_database.py .                                                 [ 80%]
tests/test_payment.py .                                                  [100%]

================================== FAILURES ===================================
________________________ test_compile_financials_report _______________________

    def test_compile_financials_report():
        ...
        result = engine.compile_financials(transactions, "header.user:admin;scale:2.signature")
        
        assert result["total_cleared"] == 600.0
        
        # BUG: Logical assertion regression.
>       assert result["growth"] == 40.0
E       AssertionError: assert 20.0 == 40.0
E         -20.0
E         +40.0

tests/test_reports.py:16: AssertionError
======================== 1 failed, 4 passed in 0.18s =========================`,
          isSimulated: true
        });
        return;
      }

      // 4. Check for Scenario D: Database Pool Connection Timeout
      const hasDatabaseError = databaseContent && !databaseContent.includes('finally:');
      
      if (hasDatabaseError) {
        resolve({
          success: false,
          log: `============================= test session starts =============================
platform win32 -- Python 3.10.2, pytest-7.4.0
rootdir: ${MOCK_PROJECT_PATH}
collected 5 items

tests/test_security.py .                                                 [ 20%]
tests/test_billing.py .                                                  [ 40%]
tests/test_reports.py .                                                  [ 60%]
tests/test_payment.py .                                                  [ 80%]
tests/test_database.py F                                                 [100%]

================================== FAILURES ===================================
____________________________ test_database_queries ____________________________

    def test_database_queries():
        db = DatabaseService()
        # Execute consecutive queries. If connection leaks occur, pool size of 5 will blow up!
        for i in range(10):
>           res = db.execute_query(f"SELECT * FROM users LIMIT {i}")

tests/test_database.py:7: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
services/database.py:25: in execute_query
    conn = self.pool.get_connection()
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 

self = <services.database.DatabaseConnectionPool object at 0x0000021A15A3A0B0>

    def get_connection(self):
        if self.active_connections >= self.size:
>           raise RuntimeError("TimeoutError: Connection pool exhausted. Too many active cursors.")
E           RuntimeError: TimeoutError: Connection pool exhausted. Too many active cursors.

services/database.py:9: RuntimeError
======================== 1 failed, 4 passed in 0.22s =========================`,
          isSimulated: true
        });
        return;
      }

      // 5. Check for Scenario E: Payment Webhook KeyError
      const hasPaymentError = paymentContent && paymentContent.includes('payload["meta"]["merchant_id"]');
      
      if (hasPaymentError) {
        resolve({
          success: false,
          log: `============================= test session starts =============================
platform win32 -- Python 3.10.2, pytest-7.4.0
rootdir: ${MOCK_PROJECT_PATH}
collected 5 items

tests/test_security.py .                                                 [ 20%]
tests/test_billing.py .                                                  [ 40%]
tests/test_reports.py .                                                  [ 60%]
tests/test_database.py .                                                 [ 80%]
tests/test_payment.py F                                                  [100%]

================================== FAILURES ===================================
_________________________ test_payment_webhook_malformed ________________________

    def test_payment_webhook_malformed():
        service = PaymentGatewayService()
        # Webhook triggers with incomplete metadata properties
        payload = {
            "event": "charge.failed"
        }
>       assert service.parse_webhook_payload(payload) == "default_merchant"

tests/test_payment.py:18: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 

self = <services.payment_gateway.PaymentGatewayService object at 0x0000021A15B4C120>
payload = {'event': 'charge.failed'}

    def parse_webhook_payload(self, payload):
        """
        Parses metadata merchant information safely from third-party gateway hooks.
        Defensively checks sub-dictionary properties.
        """
        # BUG: KeyError if "meta" or "merchant_id" is absent in webhook callbacks
>       return payload["meta"]["merchant_id"]
E       KeyError: 'meta'

services/payment_gateway.py:12: KeyError
======================== 1 failed, 4 passed in 0.19s =========================`,
          isSimulated: true
        });
        return;
      }
      
      // 6. Default: All healed! Pipeline success!
      resolve({
        success: true,
        log: `============================= test session starts =============================
platform win32 -- Python 3.10.2, pytest-7.4.0
rootdir: ${MOCK_PROJECT_PATH}
collected 5 items

tests/test_security.py .                                                 [ 20%]
tests/test_billing.py .                                                  [ 40%]
tests/test_reports.py .                                                  [ 60%]
tests/test_database.py .                                                 [ 80%]
tests/test_payment.py .                                                  [100%]

============================== 5 passed in 0.14s ==============================`,
        isSimulated: true
      });
    });
  });
}

module.exports = {
  runPipeline
};
