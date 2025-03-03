import dataclasses
@dataclasses.dataclass
class Bid:
    username: str
    amount: float
    timestamp: float