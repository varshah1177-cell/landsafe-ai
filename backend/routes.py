from datetime import datetime

import networkx as nx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import RISK_LEVELS, SOIL_TYPES, VEGETATION_LEVELS, PROTOTYPE_NOTICE
from app.db.database import get_db
from app.db.models import LandslideZone, Road, Village, CitizenReport, Alert
from app.ml.predictor import predict_risk

router = APIRouter()

RISK_MULTIPLIER = {"PASSABLE": 1.0, "AT RISK": 2.5, "BLOCKED": None}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PredictionInput(BaseModel):
    rainfall_24h: float = Field(..., ge=0, le=600)
    rainfall_72h: float = Field(..., ge=0, le=1200)
    slope_deg: float = Field(..., ge=0, le=90)
    elevation_m: float = Field(..., ge=0, le=9000)
    soil_moisture: float = Field(..., ge=0, le=100)
    soil_type: str
    vegetation_level: str
    history_landslide: bool


class ReportInput(BaseModel):
    location: str
    latitude: float
    longitude: float
    report_type: str
    description: str
    severity: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _zone_to_dict(z: LandslideZone) -> dict:
    return {
        "id": z.id, "name": z.name, "latitude": z.latitude, "longitude": z.longitude,
        "risk_level": z.risk_level, "slope_deg": z.slope_deg, "rainfall_24h": z.rainfall_24h,
        "rainfall_72h": z.rainfall_72h, "soil_moisture": z.soil_moisture, "elevation_m": z.elevation_m,
        "soil_type": z.soil_type, "vegetation_level": z.vegetation_level,
        "history_landslide": z.history_landslide, "confidence": z.confidence,
    }


def _road_to_dict(r: Road) -> dict:
    return {
        "id": r.id, "name": r.name, "start_node": r.start_node, "end_node": r.end_node,
        "distance_km": r.distance_km, "status": r.status, "blockage_risk": r.blockage_risk,
        "population_impact": r.population_impact,
    }


def _village_to_dict(v: Village) -> dict:
    return {
        "id": v.id, "name": v.name, "population": v.population, "households": v.households,
        "latitude": v.latitude, "longitude": v.longitude,
        "isolation_status": v.isolation_status, "risk_level": v.risk_level,
    }


def _report_to_dict(r: CitizenReport) -> dict:
    return {
        "id": r.id, "location": r.location, "latitude": r.latitude, "longitude": r.longitude,
        "report_type": r.report_type, "description": r.description, "severity": r.severity,
        "timestamp": r.timestamp.isoformat(), "status": r.status,
    }


def _alert_to_dict(a: Alert) -> dict:
    return {
        "id": a.id, "alert_id": a.alert_id, "title": a.title, "severity": a.severity,
        "location": a.location, "message": a.message, "issued_at": a.issued_at.isoformat(),
        "valid_until": a.valid_until.isoformat(), "recommended_action": a.recommended_action,
        "status": a.status,
    }


def _build_graph(db: Session) -> nx.Graph:
    graph = nx.Graph()
    roads = db.query(Road).all()
    for r in roads:
        multiplier = RISK_MULTIPLIER.get(r.status, 1.0)
        if multiplier is None:
            continue  # BLOCKED roads are excluded entirely
        weight = r.distance_km * multiplier
        graph.add_edge(r.start_node, r.end_node, weight=weight, distance=r.distance_km,
                        status=r.status, name=r.name)
    return graph


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get("/health")
def health():
    return {"status": "ok", "service": "LANDSAFE AI Backend", "prototype_notice": PROTOTYPE_NOTICE,
            "time": datetime.utcnow().isoformat()}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@router.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    zones = db.query(LandslideZone).all()
    roads = db.query(Road).all()
    villages = db.query(Village).all()
    alerts = db.query(Alert).filter(Alert.status == "ACTIVE").all()

    high_critical_zones = [z for z in zones if z.risk_level in ("HIGH", "CRITICAL")]
    roads_at_risk = [r for r in roads if r.status in ("AT RISK", "BLOCKED")]
    population_at_risk = sum(v.population for v in villages if v.risk_level in ("HIGH", "CRITICAL"))

    rainfall_trend = [
        {"zone": z.name, "rainfall_24h": z.rainfall_24h, "rainfall_72h": z.rainfall_72h}
        for z in zones
    ]

    return {
        "active_alerts": len(alerts),
        "high_critical_zones": len(high_critical_zones),
        "roads_at_risk": len(roads_at_risk),
        "population_at_risk": population_at_risk,
        "recent_alerts": [_alert_to_dict(a) for a in sorted(alerts, key=lambda a: a.issued_at, reverse=True)[:5]],
        "high_risk_zones": [_zone_to_dict(z) for z in high_critical_zones],
        "rainfall_monitoring": rainfall_trend,
        "system_status": {
            "backend": "ONLINE", "ml_model": "LOADED", "database": "CONNECTED",
            "mode": "PROTOTYPE", "notice": PROTOTYPE_NOTICE,
        },
    }


# ---------------------------------------------------------------------------
# Zones / Roads / Villages
# ---------------------------------------------------------------------------

@router.get("/zones")
def get_zones(db: Session = Depends(get_db)):
    return [_zone_to_dict(z) for z in db.query(LandslideZone).all()]


@router.get("/roads")
def get_roads(db: Session = Depends(get_db)):
    return [_road_to_dict(r) for r in db.query(Road).all()]


@router.get("/villages")
def get_villages(db: Session = Depends(get_db)):
    return [_village_to_dict(v) for v in db.query(Village).all()]


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    return [_alert_to_dict(a) for a in db.query(Alert).order_by(Alert.issued_at.desc()).all()]


# ---------------------------------------------------------------------------
# Citizen Reports
# ---------------------------------------------------------------------------

@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    return [_report_to_dict(r) for r in db.query(CitizenReport).order_by(CitizenReport.timestamp.desc()).all()]


VALID_REPORT_TYPES = {"Crack", "Rockfall", "Road Blockage", "Water Seepage", "Slope Failure", "Other"}
VALID_SEVERITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}


@router.post("/reports")
def create_report(payload: ReportInput, db: Session = Depends(get_db)):
    if payload.report_type not in VALID_REPORT_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid report_type. Must be one of {sorted(VALID_REPORT_TYPES)}")
    if payload.severity.upper() not in VALID_SEVERITIES:
        raise HTTPException(status_code=400, detail=f"Invalid severity. Must be one of {sorted(VALID_SEVERITIES)}")
    if not payload.location.strip() or not payload.description.strip():
        raise HTTPException(status_code=400, detail="Location and description cannot be empty.")

    report = CitizenReport(
        location=payload.location.strip(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        report_type=payload.report_type,
        description=payload.description.strip(),
        severity=payload.severity.upper(),
        timestamp=datetime.utcnow(),
        status="PENDING",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return _report_to_dict(report)


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

@router.post("/predict")
def predict(payload: PredictionInput):
    if payload.soil_type.upper() not in SOIL_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid soil_type. Must be one of {SOIL_TYPES}")
    if payload.vegetation_level.upper() not in VEGETATION_LEVELS:
        raise HTTPException(status_code=400, detail=f"Invalid vegetation_level. Must be one of {VEGETATION_LEVELS}")

    data = payload.model_dump()
    data["soil_type"] = payload.soil_type.upper()
    data["vegetation_level"] = payload.vegetation_level.upper()
    data["history_landslide"] = int(payload.history_landslide)

    try:
        result = predict_risk(data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    return result


# ---------------------------------------------------------------------------
# Spatial analysis
# ---------------------------------------------------------------------------

@router.get("/spatial/graph")
def spatial_graph(db: Session = Depends(get_db)):
    roads = db.query(Road).all()
    nodes = set()
    for r in roads:
        nodes.add(r.start_node)
        nodes.add(r.end_node)

    return {
        "nodes": [{"id": n} for n in sorted(nodes)],
        "edges": [
            {"source": r.start_node, "target": r.end_node, "distance_km": r.distance_km,
             "status": r.status, "blockage_risk": r.blockage_risk, "name": r.name}
            for r in roads
        ],
    }


@router.get("/spatial/analysis")
def spatial_analysis(db: Session = Depends(get_db)):
    """Cascading impact: landslide zone -> road blockage -> village isolation -> population -> priority."""
    zones = db.query(LandslideZone).all()
    roads = db.query(Road).all()
    villages = db.query(Village).all()
    graph = _build_graph(db)

    village_names = {v.name for v in villages}

    # Determine the largest connected "mainland" component among village nodes.
    # Villages outside the mainland component are considered isolated by the
    # current road-network state (after removing BLOCKED roads).
    components = [c for c in nx.connected_components(graph)]
    village_components = [c & village_names for c in components if c & village_names]
    mainland = max(village_components, key=len) if village_components else set()
    network_isolated = village_names - mainland
    for v in villages:
        if v.name not in graph:
            network_isolated.add(v.name)

    results = []

    for zone in zones:
        nearby_roads = [
            r for r in roads
            if r.start_node == zone.name or r.end_node == zone.name
        ]
        blocked = [r for r in nearby_roads if r.status == "BLOCKED"]
        at_risk = [r for r in nearby_roads if r.status == "AT RISK"]

        # A village is attributed to this zone's cascade if it IS the zone location
        # (direct hit) or if it has been cut off from the mainland by this zone's
        # blocked roads.
        isolated_villages = [v.name for v in villages if v.name == zone.name or v.name in network_isolated]

        affected_population = sum(v.population for v in villages if v.name in isolated_villages)

        if zone.risk_level == "CRITICAL":
            priority = "IMMEDIATE"
        elif zone.risk_level == "HIGH":
            priority = "HIGH"
        elif zone.risk_level == "MEDIUM":
            priority = "MODERATE"
        else:
            priority = "ROUTINE"

        results.append({
            "zone": zone.name,
            "risk_level": zone.risk_level,
            "roads_blocked": [r.name for r in blocked],
            "roads_at_risk": [r.name for r in at_risk],
            "isolated_villages": list(set(isolated_villages)),
            "affected_population_estimate": affected_population,
            "emergency_priority": priority,
        })

    return {"cascade_analysis": results, "notice": PROTOTYPE_NOTICE}


@router.get("/routes/safe")
def safe_route(start: str, end: str, db: Session = Depends(get_db)):
    graph = _build_graph(db)

    if start not in graph or end not in graph:
        raise HTTPException(status_code=400, detail="Unknown start or end location.")

    try:
        path = nx.dijkstra_path(graph, start, end, weight="weight")
        path_weight = nx.dijkstra_path_length(graph, start, end, weight="weight")
    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="No safe route available between these locations. All connecting roads may be blocked.")

    edges_used = []
    total_distance = 0.0
    for i in range(len(path) - 1):
        edge = graph[path[i]][path[i + 1]]
        edges_used.append({
            "from": path[i], "to": path[i + 1], "name": edge["name"],
            "distance_km": edge["distance"], "status": edge["status"],
        })
        total_distance += edge["distance"]

    # roads avoided = BLOCKED roads adjacent to any node on route, plus all blocked roads globally
    all_roads = db.query(Road).all()
    avoided = [r.name for r in all_roads if r.status == "BLOCKED"]

    route_risk = "LOW"
    if any(e["status"] == "AT RISK" for e in edges_used):
        route_risk = "MODERATE"

    est_time_minutes = round((total_distance / 30.0) * 60, 1)  # assume 30 km/h avg mountain speed

    return {
        "start": start,
        "end": end,
        "route": path,
        "segments": edges_used,
        "total_distance_km": round(total_distance, 2),
        "estimated_time_minutes": est_time_minutes,
        "route_risk": route_risk,
        "avoided_roads": avoided,
        "weighted_cost": round(path_weight, 2),
        "notice": PROTOTYPE_NOTICE,
    }
