class PaymentGatewayService:
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
