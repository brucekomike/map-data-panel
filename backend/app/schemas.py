from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class MapBase(BaseModel):
    name: str
    description: Optional[str] = ""

class MapCreate(MapBase):
    pass

class MapUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    calibration_pos_x: Optional[float] = None
    calibration_pos_y: Optional[float] = None
    calibration_pos_z: Optional[float] = None
    calibration_rot_x: Optional[float] = None
    calibration_rot_y: Optional[float] = None
    calibration_rot_z: Optional[float] = None
    calibration_scale: Optional[float] = None

class MapResponse(MapBase):
    id: int
    project_id: int
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    calibration_pos_x: float
    calibration_pos_y: float
    calibration_pos_z: float
    calibration_rot_x: float
    calibration_rot_y: float
    calibration_rot_z: float
    calibration_scale: float
    created_at: datetime
    class Config:
        from_attributes = True

class WidgetBase(BaseModel):
    name: str
    pos_x: float = 0.0
    pos_y: float = 0.0
    pos_z: float = 0.0
    data_key: str = "default"

class WidgetCreate(WidgetBase):
    pass

class WidgetUpdate(BaseModel):
    name: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    pos_z: Optional[float] = None
    data_key: Optional[str] = None

class WidgetResponse(WidgetBase):
    id: int
    map_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class DataEntryCreate(BaseModel):
    widget_id: int
    value: Any

class DataEntryResponse(BaseModel):
    id: int
    widget_id: int
    value: str
    timestamp: datetime
    class Config:
        from_attributes = True
