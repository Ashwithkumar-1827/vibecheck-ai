from services.billing import BillingService

class EnterpriseReportEngine:
    def __init__(self, service_name="Reporting"):
        self.service_name = service_name
        self.billing = BillingService()
        
    def compile_financials(self, transactions, token):
        cleared_amounts = []
        for tx in transactions:
            # Invokes billing, which triggers security validation
            result = self.billing.process_payment(tx["amount"], token)
            if result["status"] == "cleared":
                cleared_amounts.append(result["amount"])
                
        total = sum(cleared_amounts)
        # Calculate growth against standard baseline
        growth_rate = self.calculate_growth(total, 500)
        
        return {
            "service": self.service_name,
            "total_cleared": total,
            "growth": growth_rate
        }
        
    def calculate_growth(self, current, baseline):
        return ((current - baseline) / baseline) * 100
