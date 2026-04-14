from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    maps = relationship("Map", back_populates="project", cascade="all, delete-orphan")

class Map(Base):
    __tablename__ = "maps"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    file_path = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    calibration_pos_x = Column(Float, default=0.0)
    calibration_pos_y = Column(Float, default=0.0)
    calibration_pos_z = Column(Float, default=0.0)
    calibration_rot_x = Column(Float, default=0.0)
    calibration_rot_y = Column(Float, default=0.0)
    calibration_rot_z = Column(Float, default=0.0)
    calibration_scale = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    project = relationship("Project", back_populates="maps")
    widgets = relationship("Widget", back_populates="map", cascade="all, delete-orphan")

class Widget(Base):
    __tablename__ = "widgets"
    id = Column(Integer, primary_key=True, index=True)
    map_id = Column(Integer, ForeignKey("maps.id"), nullable=False)
    name = Column(String, nullable=False)
    pos_x = Column(Float, default=0.0)
    pos_y = Column(Float, default=0.0)
    pos_z = Column(Float, default=0.0)
    data_key = Column(String, nullable=False, default="default")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    map = relationship("Map", back_populates="widgets")
    data_entries = relationship("DataEntry", back_populates="widget", cascade="all, delete-orphan")

class DataEntry(Base):
    __tablename__ = "data_entries"
    id = Column(Integer, primary_key=True, index=True)
    widget_id = Column(Integer, ForeignKey("widgets.id"), nullable=False)
    value = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    widget = relationship("Widget", back_populates="data_entries")
