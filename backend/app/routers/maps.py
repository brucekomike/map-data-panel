from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os, shutil, uuid
from ..database import get_db
from ..models import Map, Project
from ..schemas import MapResponse, MapUpdate

router = APIRouter(tags=["maps"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "uploads")

@router.get("/api/projects/{project_id}/maps", response_model=List[MapResponse])
def list_maps(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(Map).filter(Map.project_id == project_id).all()

@router.post("/api/projects/{project_id}/maps", response_model=MapResponse)
async def create_map(
    project_id: int,
    name: str = Form(...),
    description: str = Form(""),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    file_path = None
    file_type = None
    if file and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".ply", ".splat", ".ksplat"]:
            raise HTTPException(status_code=400, detail="Invalid file type")
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        unique_name = f"{uuid.uuid4()}{ext}"
        dest = os.path.join(UPLOAD_DIR, unique_name)
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
        file_path = unique_name
        file_type = ext
    db_map = Map(project_id=project_id, name=name, description=description, file_path=file_path, file_type=file_type)
    db.add(db_map)
    db.commit()
    db.refresh(db_map)
    return db_map

@router.get("/api/maps/{map_id}", response_model=MapResponse)
def get_map(map_id: int, db: Session = Depends(get_db)):
    m = db.query(Map).filter(Map.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Map not found")
    return m

@router.put("/api/maps/{map_id}", response_model=MapResponse)
def update_map(map_id: int, update: MapUpdate, db: Session = Depends(get_db)):
    m = db.query(Map).filter(Map.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Map not found")
    for k, v in update.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return m

@router.delete("/api/maps/{map_id}")
def delete_map(map_id: int, db: Session = Depends(get_db)):
    m = db.query(Map).filter(Map.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Map not found")
    if m.file_path:
        fp = os.path.join(UPLOAD_DIR, m.file_path)
        if os.path.exists(fp):
            os.remove(fp)
    db.delete(m)
    db.commit()
    return {"ok": True}

@router.get("/api/maps/{map_id}/file")
def get_map_file(map_id: int, db: Session = Depends(get_db)):
    m = db.query(Map).filter(Map.id == map_id).first()
    if not m or not m.file_path:
        raise HTTPException(status_code=404, detail="File not found")
    fp = os.path.join(UPLOAD_DIR, m.file_path)
    if not os.path.exists(fp):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(fp)
