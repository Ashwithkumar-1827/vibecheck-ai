import pytest
from services.billing import BillingService

def test_billing_success():
    service = BillingService()
    res = service.process_payment(150.0, "header.user:admin;scale:2.signature")
    assert res["status"] == "cleared"
    assert res["amount"] == 150.0

def test_billing_unauthorized():
    service = BillingService()
    with pytest.raises(PermissionError):
        service.process_payment(200.0, "header.user:guest;scale:5.signature")
