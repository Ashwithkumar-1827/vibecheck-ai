from core.security import validate_token

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
