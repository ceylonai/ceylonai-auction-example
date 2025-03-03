from ceylon import Admin, Worker

# Initialize agents
admin = Admin("admin", 7446)
worker = Worker("worker", "worker")

# Export all agents
__all__ = ['admin', 'worker']