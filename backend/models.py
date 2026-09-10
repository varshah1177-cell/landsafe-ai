from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.db.database import Base


class LandslideZone(Base):
    __tablename__ = "landslide_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    slope_deg = Column(Float, nullable=False)
    rainfall_24h = Column(Float, nullable=False)
    rainfall_72h = Column(Float, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False)
    soil_type = Column(String, nullable=False)
    vegetation_level = Column(String, nullable=False)
    history_landslide = Column(Boolean, default=False)
    confidence = Column(Float, default=0.0)


class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_node = Column(String, nullable=False)
    end_node = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # PASSABLE / AT RISK / BLOCKED
    blockage_risk = Column(Float, default=0.0)
    population_impact = Column(Integer, default=0)


class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    population = Column(Integer, nullable=False)
    households = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    isolation_status = Column(String, default="CONNECTED")
    risk_level = Column(String, default="LOW")


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    report_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    status = Column(String, default="PENDING")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, nullable=False, unique=True)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    location = Column(String, nullable=False)
    message = Column(String, nullable=False)
    issued_at = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    recommended_action = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")
