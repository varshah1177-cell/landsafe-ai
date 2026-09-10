from datetime import datetime, timedelta

from app.db.database import Base, engine, SessionLocal
from app.db.models import LandslideZone, Road, Village, CitizenReport, Alert


def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ---------------- Landslide Zones ----------------
        zones = [
            LandslideZone(
                name="Chooralmala", latitude=11.4922, longitude=76.1231,
                risk_level="CRITICAL", slope_deg=42.0, rainfall_24h=185.0, rainfall_72h=410.0,
                soil_moisture=88.0, elevation_m=980.0, soil_type="CLAY", vegetation_level="SPARSE",
                history_landslide=True, confidence=91.5,
            ),
            LandslideZone(
                name="Mundakkai", latitude=11.4985, longitude=76.1298,
                risk_level="CRITICAL", slope_deg=45.0, rainfall_24h=192.0, rainfall_72h=430.0,
                soil_moisture=90.0, elevation_m=1020.0, soil_type="CLAY", vegetation_level="NONE",
                history_landslide=True, confidence=94.2,
            ),
            LandslideZone(
                name="Meppadi", latitude=11.5678, longitude=76.1421,
                risk_level="HIGH", slope_deg=34.0, rainfall_24h=140.0, rainfall_72h=310.0,
                soil_moisture=74.0, elevation_m=820.0, soil_type="LOAMY", vegetation_level="MODERATE",
                history_landslide=True, confidence=78.9,
            ),
            LandslideZone(
                name="Attamala", latitude=11.4870, longitude=76.1185,
                risk_level="HIGH", slope_deg=36.0, rainfall_24h=150.0, rainfall_72h=330.0,
                soil_moisture=79.0, elevation_m=890.0, soil_type="CLAY", vegetation_level="SPARSE",
                history_landslide=True, confidence=82.3,
            ),
            LandslideZone(
                name="Vythiri", latitude=11.6083, longitude=76.0894,
                risk_level="MEDIUM", slope_deg=25.0, rainfall_24h=95.0, rainfall_72h=210.0,
                soil_moisture=58.0, elevation_m=760.0, soil_type="LOAMY", vegetation_level="MODERATE",
                history_landslide=False, confidence=61.0,
            ),
            LandslideZone(
                name="Northeast Zone - Sohra", latitude=25.2840, longitude=91.7273,
                risk_level="MEDIUM", slope_deg=28.0, rainfall_24h=110.0, rainfall_72h=260.0,
                soil_moisture=64.0, elevation_m=1430.0, soil_type="SILTY", vegetation_level="DENSE",
                history_landslide=False, confidence=57.4,
            ),
            LandslideZone(
                name="Kalpetta", latitude=11.6084, longitude=76.0836,
                risk_level="LOW", slope_deg=14.0, rainfall_24h=45.0, rainfall_72h=95.0,
                soil_moisture=32.0, elevation_m=700.0, soil_type="ROCKY", vegetation_level="DENSE",
                history_landslide=False, confidence=22.7,
            ),
        ]
        db.add_all(zones)

        # ---------------- Roads ----------------
        roads = [
            Road(name="Chooralmala-Mundakkai Link", start_node="Chooralmala", end_node="Mundakkai",
                 distance_km=3.2, status="BLOCKED", blockage_risk=95.0, population_impact=4200),
            Road(name="Mundakkai-Meppadi Road", start_node="Mundakkai", end_node="Meppadi",
                 distance_km=6.8, status="AT RISK", blockage_risk=68.0, population_impact=3100),
            Road(name="Meppadi-Vythiri Highway", start_node="Meppadi", end_node="Vythiri",
                 distance_km=9.5, status="AT RISK", blockage_risk=54.0, population_impact=2600),
            Road(name="Attamala Connector", start_node="Attamala", end_node="Chooralmala",
                 distance_km=4.1, status="AT RISK", blockage_risk=61.0, population_impact=1800),
            Road(name="Vythiri-Kalpetta Road", start_node="Vythiri", end_node="Kalpetta",
                 distance_km=11.2, status="PASSABLE", blockage_risk=12.0, population_impact=900),
            Road(name="Kalpetta Bypass", start_node="Kalpetta", end_node="Meppadi",
                 distance_km=14.0, status="PASSABLE", blockage_risk=8.0, population_impact=700),
        ]
        db.add_all(roads)

        # ---------------- Villages ----------------
        villages = [
            Village(name="Chooralmala", population=4200, households=980, latitude=11.4922, longitude=76.1231,
                    isolation_status="ISOLATED", risk_level="CRITICAL"),
            Village(name="Mundakkai", population=3800, households=860, latitude=11.4985, longitude=76.1298,
                    isolation_status="ISOLATED", risk_level="CRITICAL"),
            Village(name="Meppadi", population=6100, households=1450, latitude=11.5678, longitude=76.1421,
                    isolation_status="AT RISK", risk_level="HIGH"),
            Village(name="Attamala", population=1800, households=410, latitude=11.4870, longitude=76.1185,
                    isolation_status="AT RISK", risk_level="HIGH"),
            Village(name="Vythiri", population=5200, households=1180, latitude=11.6083, longitude=76.0894,
                    isolation_status="CONNECTED", risk_level="MEDIUM"),
            Village(name="Kalpetta", population=9800, households=2200, latitude=11.6084, longitude=76.0836,
                    isolation_status="CONNECTED", risk_level="LOW"),
        ]
        db.add_all(villages)

        # ---------------- Citizen Reports ----------------
        now = datetime.utcnow()
        reports = [
            CitizenReport(location="Chooralmala", latitude=11.4925, longitude=76.1235, report_type="Rockfall",
                          description="Large rocks fell near the main access road after midnight rainfall.",
                          severity="CRITICAL", timestamp=now - timedelta(hours=2), status="VERIFIED"),
            CitizenReport(location="Mundakkai", latitude=11.4990, longitude=76.1301, report_type="Crack",
                          description="New ground crack observed behind the community hall, roughly 2 meters long.",
                          severity="HIGH", timestamp=now - timedelta(hours=5), status="VERIFIED"),
            CitizenReport(location="Meppadi", latitude=11.5680, longitude=76.1425, report_type="Water Seepage",
                          description="Continuous water seepage from the hillside near the school compound.",
                          severity="MEDIUM", timestamp=now - timedelta(hours=9), status="PENDING"),
            CitizenReport(location="Attamala", latitude=11.4873, longitude=76.1189, report_type="Road Blockage",
                          description="Minor debris blocking one lane of the connector road.",
                          severity="MEDIUM", timestamp=now - timedelta(hours=14), status="PENDING"),
            CitizenReport(location="Vythiri", latitude=11.6085, longitude=76.0897, report_type="Slope Failure",
                          description="Small slope slip observed on the highway embankment.",
                          severity="LOW", timestamp=now - timedelta(hours=20), status="RESOLVED"),
            CitizenReport(location="Kalpetta", latitude=11.6087, longitude=76.0839, report_type="Other",
                          description="Unusual muddy water color reported in the local stream.",
                          severity="LOW", timestamp=now - timedelta(days=1, hours=2), status="RESOLVED"),
        ]
        db.add_all(reports)

        # ---------------- Alerts ----------------
        alerts = [
            Alert(alert_id="LS-2026-0091", title="Critical Landslide Risk - Mundakkai",
                  severity="CRITICAL", location="Mundakkai",
                  message="Heavy rainfall and unstable slope conditions detected near Mundakkai. Immediate evacuation of vulnerable households is recommended.",
                  issued_at=now - timedelta(hours=1), valid_until=now + timedelta(hours=23),
                  recommended_action="Evacuate low-lying and slope-adjacent households immediately.",
                  status="ACTIVE"),
            Alert(alert_id="LS-2026-0090", title="Critical Landslide Risk - Chooralmala",
                  severity="CRITICAL", location="Chooralmala",
                  message="Saturated soil and continuous rainfall have raised landslide probability to critical levels.",
                  issued_at=now - timedelta(hours=3), valid_until=now + timedelta(hours=21),
                  recommended_action="Deploy rescue teams and restrict access to the main slope zone.",
                  status="ACTIVE"),
            Alert(alert_id="LS-2026-0088", title="Road Blockage Risk - Chooralmala Link",
                  severity="HIGH", location="Chooralmala-Mundakkai Link",
                  message="Road blockage risk increasing near Chooralmala due to slope instability.",
                  issued_at=now - timedelta(hours=6), valid_until=now + timedelta(hours=18),
                  recommended_action="Reroute traffic and prepare alternate supply routes.",
                  status="ACTIVE"),
            Alert(alert_id="LS-2026-0085", title="Rising Soil Moisture - Meppadi",
                  severity="MEDIUM", location="Meppadi",
                  message="Soil moisture rising in Meppadi following sustained 72-hour rainfall.",
                  issued_at=now - timedelta(hours=10), valid_until=now + timedelta(hours=14),
                  recommended_action="Monitor slope sensors and advise residents to stay alert.",
                  status="ACTIVE"),
            Alert(alert_id="LS-2026-0080", title="Slope Monitoring Advisory - Vythiri",
                  severity="LOW", location="Vythiri",
                  message="Minor slope movement detected; conditions currently stable.",
                  issued_at=now - timedelta(hours=18), valid_until=now + timedelta(hours=6),
                  recommended_action="Continue routine monitoring, no action required yet.",
                  status="ACTIVE"),
        ]
        db.add_all(alerts)

        db.commit()
        print("Database seeded successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
