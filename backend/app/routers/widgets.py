from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Widget, Map
from ..schemas import WidgetCreate, WidgetUpdate, WidgetResponse

router = APIRouter(tags=["widgets"])

@router.get("/api/maps/{map_id}/widgets", response_model=List[WidgetResponse])
def list_widgets(map_id: int, db: Session = Depends(get_db)):
    m = db.query(Map).filter(Map.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Map not found")
    return db.query(Widget).filter(Widget.map_id == map_id).all()

@router.post("/api/maps/{map_id}/widgets", response_model=WidgetResponse)
def create_widget(map_id: int, widget: WidgetCreate, db: Session = Depends(get_db)):
    m = db.query(Map).filter(Map.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Map not found")
    db_widget = Widget(map_id=map_id, **widget.model_dump())
    db.add(db_widget)
    db.commit()
    db.refresh(db_widget)
    return db_widget

@router.get("/api/widgets/{widget_id}", response_model=WidgetResponse)
def get_widget(widget_id: int, db: Session = Depends(get_db)):
    w = db.query(Widget).filter(Widget.id == widget_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Widget not found")
    return w

@router.put("/api/widgets/{widget_id}", response_model=WidgetResponse)
def update_widget(widget_id: int, update: WidgetUpdate, db: Session = Depends(get_db)):
    w = db.query(Widget).filter(Widget.id == widget_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Widget not found")
    for k, v in update.model_dump(exclude_unset=True).items():
        setattr(w, k, v)
    db.commit()
    db.refresh(w)
    return w

@router.delete("/api/widgets/{widget_id}")
def delete_widget(widget_id: int, db: Session = Depends(get_db)):
    w = db.query(Widget).filter(Widget.id == widget_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Widget not found")
    db.delete(w)
    db.commit()
    return {"ok": True}
