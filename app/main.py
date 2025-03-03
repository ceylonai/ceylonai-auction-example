import asyncio
import dataclasses
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from ceylon import Worker, AgentDetail, on
from app.agents.agents import admin, worker
from app.services.bid_service import Bid, get_highest_bidder, process_bid_message, bids
from app.api.routes import router as bid_router

@dataclasses.dataclass
class HumanInput:
    content: str

class HumanAgent(Worker):
    def __init__(self, name, role):
        super().__init__(name, role)

    @on(HumanInput)
    async def on_human_input(self, data: HumanInput, agent: AgentDetail, time):
        print(f"Message {agent.name} - {data}")
        await self.broadcast_message({
            "username": self.details().name,
            "message": data.content
        })

human_interface = HumanAgent("human_interface", "human")

# Initialize FastAPI
app = FastAPI()

app.include_router(bid_router, prefix="/api")

# Add CORS Middleware for FastAPI routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Socket.IO with allowed origins
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=[
    "http://localhost:3000"
])
socket_app = socketio.ASGIApp(sio, app)

# Store usernames, typing status, chat history, and bids
users = []
usernames = {}
users_list = [] 
typing_users = set()
chat_history = []
MAX_HISTORY_MESSAGES = 50

# REST API endpoints


# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    users.append(sid)
    await sio.emit("users_count", {"count": len(users)})

@sio.event
async def get_users_list(sid):
    # Send the current users list to the requesting client
    await sio.emit("users_list", {"users": users_list}, room=sid)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    if sid in users:
        users.remove(sid)  # Remove disconnected user
    
    if sid in usernames:
        username = usernames[sid]
        del usernames[sid]
        
        # Update the users list
        if username in users_list:
            users_list.remove(username)
        
        # Send both the username of the disconnected user AND the updated users list
        await sio.emit("user_left", {
            "username": username,
            "users": users_list
        })
    
    await sio.emit("users_count", {"count": len(users)})

@sio.event
async def set_username(sid, username):
    usernames[sid] = username
    
    # Add username to the users list
    if username not in users_list:
        users_list.append(username)
    
    # Send both the new username AND the full users list
    await sio.emit("user_joined", {
        "username": username,
        "users": users_list
    })
    
    print(f"{username} joined the chat")
    
    # Send chat history to the newly connected user
    if chat_history:
        await sio.emit("chat_history", {"messages": chat_history}, room=sid)

@sio.event
async def message(sid, data):
    username = usernames.get(sid, "Unknown")
    print(f"Message from {username}: {data}")

    # Create message object
    message_data = {"username": username, "message": data}
    
    # Broadcast to all clients
    await sio.emit("response", message_data)

    # Process bid if message contains a bid command
    await process_bid_message(sio, username, data)

@sio.event
async def typing(sid):
    if sid in usernames:
        typing_users.add(usernames[sid])
        await sio.emit("user_typing", {"username": usernames[sid]})

@sio.event
async def stopped_typing(sid):
    if sid in usernames:
        typing_users.discard(usernames[sid])
        await sio.emit("user_stopped_typing")

@sio.event
async def request_history(sid):
    """Allow clients to explicitly request chat history"""
    if chat_history:
        await sio.emit("chat_history", {"messages": chat_history}, room=sid)

@sio.event
async def request_highest_bidder(sid):
    highest = get_highest_bidder()
    if highest:
        await sio.emit("highest_bid", {"highest_bid": dataclasses.asdict(highest)}, room=sid)
    else:
        await sio.emit("highest_bid", {"message": "No bids placed yet"}, room=sid)

@sio.event
async def get_bids(sid):
    """Allow clients to request all bids."""
    if bids:
        await sio.emit("all_bids", {"bids": [dataclasses.asdict(bid) for bid in bids]}, room=sid)

@app.on_event("startup")
async def startup_event():
    print("Starting Admin Agent and Workers...")
    await asyncio.sleep(2)  # Small delay to ensure workers are ready
    asyncio.create_task(admin.start_agent(b"", [worker, human_interface]))  # Use a list here

@admin.on_connect("*")
async def on_connect(topic, agent: AgentDetail):
    await asyncio.sleep(2)
    print(f"Agent connected: {agent.name}")
    print(f"Agent connected: {agent.id}")
    usernames[agent.id] = agent.name
    
    # Create system message for agent connection
    agent_connect_msg = {
        "username": agent.name, 
        "message": f"Agent {agent.name} connected",
        "timestamp": asyncio.get_event_loop().time(),
        "type": "system"
    }
    
    # Add agent connection message to history
    chat_history.append(agent_connect_msg)
    
    # Keep chat history within size limit
    if len(chat_history) > MAX_HISTORY_MESSAGES:
        chat_history.pop(0)
        
    await sio.emit("user_joined", {"username": agent.name})
    # Broadcast the message to all connected clients
    await sio.emit("response", agent_connect_msg)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)