from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import os
from .database import engine, Base
from .routers import projects, maps, widgets, data

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Map Data Panel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, map_id: int, websocket: WebSocket):
        await websocket.accept()
        if map_id not in self.active_connections:
            self.active_connections[map_id] = []
        self.active_connections[map_id].append(websocket)

    def disconnect(self, map_id: int, websocket: WebSocket):
        if map_id in self.active_connections:
            self.active_connections[map_id].remove(websocket)

    async def broadcast(self, map_id: int, message: str):
        if map_id in self.active_connections:
            dead = []
            for ws in self.active_connections[map_id]:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active_connections[map_id].remove(ws)

manager = ConnectionManager()

app.include_router(projects.router)
app.include_router(maps.router)
app.include_router(widgets.router)
app.include_router(data.router)

@app.websocket("/ws/{map_id}")
async def websocket_endpoint(websocket: WebSocket, map_id: int):
    await manager.connect(map_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(map_id, websocket)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/health")
def health():
    return {"status": "ok"}
