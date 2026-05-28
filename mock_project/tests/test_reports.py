from services.report_engine import EnterpriseReportEngine

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
