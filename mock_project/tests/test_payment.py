import pytest
from services.payment_gateway import PaymentGatewayService

def test_payment_webhook_valid():
    service = PaymentGatewayService()
    payload = {
        "event": "charge.succeeded",
        "meta": {
            "merchant_id": "merch_9981a",
            "tier": "enterprise"
        }
    }
    assert service.parse_webhook_payload(payload) == "merch_9981a"

def test_payment_webhook_malformed():
    service = PaymentGatewayService()
    # Webhook triggers with incomplete metadata properties
    payload = {
        "event": "charge.failed"
    }
    assert service.parse_webhook_payload(payload) == "default_merchant"

def test_refund_success():
    service = PaymentGatewayService()
    res = service.process_refund("ch_stripe_88", 50.0)
    assert res["refunded"] is True
