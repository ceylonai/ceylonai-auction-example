from fastapi import APIRouter
from app.services.bid_service import get_highest_bidder, bids
import dataclasses 

router = APIRouter()

@router.get("/bids")
async def get_bids_api():
    return bids

@router.get("/highest-bidder")
async def get_highest_bidder_api():
    highest = get_highest_bidder()
    if highest:
        return dataclasses.asdict(highest)
    return {"message": "No bids placed yet"}