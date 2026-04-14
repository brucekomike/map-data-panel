from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from ..database import get_db
from ..models import DataEntry, Widget
from ..schemas import DataEntryCreate, DataEntryResponse

router = APIRouter(tags=["data"])

@router.get("/api/widgets/{widget_id}/data", response_model=List[DataEntryResponse])
def get_widget_data(widget_id: int, db: Session = Depends(get_db)):
    w = db.query(Widget).filter(Widget.id == widget_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Widget not found")
    return db.query(DataEntry).filter(DataEntry.widget_id == widget_id).order_by(DataEntry.timestamp.desc()).limit(100).all()

@router.post("/api/data", response_model=DataEntryResponse)
async def post_data(entry: DataEntryCreate, db: Session = Depends(get_db)):
    w = db.query(Widget).filter(Widget.id == entry.widget_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Widget not found")
    value_str = json.dumps(entry.value) if not isinstance(entry.value, str) else entry.value
    db_entry = DataEntry(widget_id=entry.widget_id, value=value_str)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    # broadcast via websocket manager (imported from main)
    from ..main import manager
    message = json.dumps({
        "type": "data_update",
        "widget_id": entry.widget_id,
        "data": {
            "id": db_entry.id,
            "value": db_entry.value,
            "timestamp": db_entry.timestamp.isoformat()
        }
    })
    await manager.broadcast(w.map_id, message)
    return db_entry
