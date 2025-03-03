import asyncio
import dataclasses
import time
import re
from app.models.models import Bid

# Initialize global variables
bids = []
bid_timer_started = False
bid_timer_task = None
BID_TIMEOUT = 30

def get_highest_bidder():
    """
    Returns the highest bid from the bids list.
    If no bids exist, returns None.
    """
    if not bids:
        return None
        
    # Find the highest bid based on amount
    highest_bid = max(bids, key=lambda bid: bid.amount)
    return highest_bid

async def start_bid_timer(sio):
    """
    Starts a 30-second countdown timer. If no new bids are placed during this time,
    broadcasts the highest bidder to all users.
    """
    global bid_timer_started
    
    # Set the timer started flag
    bid_timer_started = True
    
    # Start countdown from 30 seconds
    remaining = BID_TIMEOUT
    
    while remaining > 0:
        # Broadcast the timer to all clients
        await sio.emit("bid_timer", {"remaining": remaining})
        
        # Wait 1 second
        await asyncio.sleep(1)
        remaining -= 1
    
    # Time's up - find the highest bidder
    highest_bid = get_highest_bidder()
    
    if highest_bid:
        # Broadcast the auction result to all clients
        await sio.emit("auction_end", {
            "winner": highest_bid.username,
            "amount": highest_bid.amount
        })
        
        # Also emit the highest_bid event for compatibility
        await sio.emit("highest_bid", {"highest_bid": dataclasses.asdict(highest_bid)})
        
        print(f"Auction ended. Winner: {highest_bid.username}, Amount: ${highest_bid.amount}")
    else:
        # No bids were placed
        await sio.emit("auction_end", {"message": "Auction ended with no bids"})
    
    # Reset the timer flag
    bid_timer_started = False

async def process_bid_message(sio, username, data):
    """Process a message to check if it's a bid and handle it accordingly"""
    global bid_timer_task
    
    if isinstance(data, str) and data.lower().startswith("bid"):
        match = re.search(r"bid\s+(\d+(\.\d+)?)", data.lower())
        if match:
            amount = float(match.group(1))
            timestamp = time.time()
            bid = Bid(username=username, amount=amount, timestamp=timestamp)
            bids.append(bid)
            print(f"Bid placed: {bid}")

            # Cancel existing timer if running
            if bid_timer_task and not bid_timer_task.done():
                bid_timer_task.cancel()
            
            # Start a new timer for this bid
            bid_timer_task = asyncio.create_task(start_bid_timer(sio))

            # Broadcast bid to all users
            await sio.emit("new_bid", dataclasses.asdict(bid))
            return True
    return False