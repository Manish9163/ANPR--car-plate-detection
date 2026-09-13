"""
PlateVision — Database Seeder

Initializes database schema and populates default accounts:
  - Administrator: admin@platevision.ai / AdminPassword@123
  - Operator: operator@platevision.ai / OperatorPassword@123
"""

import logging
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.core.security import get_password_hash, UserRole
from backend.app.models.user import User
from backend.app.models.refresh_token import RefreshToken
from backend.app.models.recognition import Recognition
from backend.app.models.audit_log import AuditLog

logger = logging.getLogger("platevision.seed")


def init_db(db: Session) -> None:
    """Create all database tables and seed initial users."""
    Base.metadata.create_all(bind=engine)

    # 1. Seed Default Admin User
    admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not admin:
        logger.info(f"Creating default admin account ({settings.ADMIN_EMAIL})...")
        admin = User(
            email=settings.ADMIN_EMAIL,
            username=settings.ADMIN_USERNAME,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            role=UserRole.ADMIN.value,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        logger.info("Default admin account created successfully.")

    # 2. Seed Default Operator User
    operator_email = "operator@platevision.ai"
    operator = db.query(User).filter(User.email == operator_email).first()
    if not operator:
        logger.info(f"Creating default operator account ({operator_email})...")
        operator = User(
            email=operator_email,
            username="operator",
            password_hash=get_password_hash("OperatorPassword@123"),
            role=UserRole.OPERATOR.value,
            is_active=True,
        )
        db.add(operator)
        db.commit()
        db.refresh(operator)
        logger.info("Default operator account created successfully.")

    # 3. Seed Realistic Demonstration Recognitions (if none or few exist)
    if db.query(Recognition).count() < 8:
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)

        sample_records = [
            {
                "plate_raw": "DL01AB1234",
                "plate_norm": "DL 01 AB 1234",
                "overall_conf": 0.985,
                "det_conf": 0.991,
                "ocr_conf": 0.980,
                "status": "SUCCESS",
                "duration_ms": 138.4,
                "source": "IMAGE",
                "meta": {"vehicle_type": "Sedan", "state": "DL", "rto": "Delhi North", "syntax_valid": True, "bounding_box": {"x1": 140, "y1": 90, "x2": 820, "y2": 510}},
                "offset_mins": 12,
            },
            {
                "plate_raw": "MH12CD5678",
                "plate_norm": "MH 12 CD 5678",
                "overall_conf": 0.962,
                "det_conf": 0.978,
                "ocr_conf": 0.948,
                "status": "SUCCESS",
                "duration_ms": 144.2,
                "source": "WEBCAM",
                "meta": {"vehicle_type": "SUV", "state": "MH", "rto": "Pune Central", "syntax_valid": True, "bounding_box": {"x1": 160, "y1": 110, "x2": 800, "y2": 530}},
                "offset_mins": 45,
            },
            {
                "plate_raw": "KA03EV2024",
                "plate_norm": "KA 03 EV 2024",
                "overall_conf": 0.991,
                "det_conf": 0.995,
                "ocr_conf": 0.988,
                "status": "SUCCESS",
                "duration_ms": 131.8,
                "source": "IMAGE",
                "meta": {"vehicle_type": "EV Hatchback", "state": "KA", "rto": "Bangalore East", "syntax_valid": True, "bounding_box": {"x1": 130, "y1": 95, "x2": 840, "y2": 505}},
                "offset_mins": 90,
            },
            {
                "plate_raw": "HR26DQ5521",
                "plate_norm": "HR 26 DQ 5521",
                "overall_conf": 0.942,
                "det_conf": 0.965,
                "ocr_conf": 0.920,
                "status": "SUCCESS",
                "duration_ms": 152.6,
                "source": "VIDEO",
                "meta": {"vehicle_type": "Truck", "state": "HR", "rto": "Gurgaon South", "syntax_valid": True, "bounding_box": {"x1": 120, "y1": 80, "x2": 860, "y2": 540}},
                "offset_mins": 180,
            },
            {
                "plate_raw": "UP16BE8832",
                "plate_norm": "UP 16 BE 8832",
                "overall_conf": 0.957,
                "det_conf": 0.981,
                "ocr_conf": 0.935,
                "status": "SUCCESS",
                "duration_ms": 139.1,
                "source": "IMAGE",
                "meta": {"vehicle_type": "Sedan", "state": "UP", "rto": "Noida Gautam Budh Nagar", "syntax_valid": True, "bounding_box": {"x1": 150, "y1": 100, "x2": 810, "y2": 520}},
                "offset_mins": 360,
            },
            {
                "plate_raw": "TN09BK4102",
                "plate_norm": "TN 09 BK 4102",
                "overall_conf": 0.973,
                "det_conf": 0.989,
                "ocr_conf": 0.958,
                "status": "SUCCESS",
                "duration_ms": 135.5,
                "source": "IMAGE",
                "meta": {"vehicle_type": "Coupe", "state": "TN", "rto": "Chennai West", "syntax_valid": True, "bounding_box": {"x1": 145, "y1": 95, "x2": 825, "y2": 515}},
                "offset_mins": 720,
            },
            {
                "plate_raw": "WB24AB1234",
                "plate_norm": "WB 24 AB 1234",
                "overall_conf": 0.947,
                "det_conf": 0.972,
                "ocr_conf": 0.923,
                "status": "SUCCESS",
                "duration_ms": 141.0,
                "source": "WEBCAM",
                "meta": {"vehicle_type": "Sedan", "state": "WB", "rto": "Barrackpore", "syntax_valid": True, "bounding_box": {"x1": 135, "y1": 90, "x2": 830, "y2": 510}},
                "offset_mins": 1440,
            },
            {
                "plate_raw": "GJ01AX9911",
                "plate_norm": "GJ 01 AX 9911",
                "overall_conf": 0.988,
                "det_conf": 0.993,
                "ocr_conf": 0.984,
                "status": "SUCCESS",
                "duration_ms": 133.2,
                "source": "IMAGE",
                "meta": {"vehicle_type": "SUV", "state": "GJ", "rto": "Ahmedabad", "syntax_valid": True, "bounding_box": {"x1": 155, "y1": 105, "x2": 815, "y2": 525}},
                "offset_mins": 2880,
            },
        ]

        logger.info("Populating initial realistic ANPR recognition records...")
        for rec_data in sample_records:
            rec = Recognition(
                user_id=admin.id if admin else None,
                plate_text_raw=rec_data["plate_raw"],
                plate_text_normalized=rec_data["plate_norm"],
                overall_confidence=rec_data["overall_conf"],
                detector_confidence=rec_data["det_conf"],
                ocr_confidence=rec_data["ocr_conf"],
                processing_status=rec_data["status"],
                processing_duration_ms=rec_data["duration_ms"],
                source_type=rec_data["source"],
                extra_metadata=rec_data["meta"],
                created_at=now - timedelta(minutes=rec_data["offset_mins"]),
            )
            db.add(rec)
        db.commit()
        logger.info("Successfully seeded realistic ANPR recognition events.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    try:
        init_db(db)
        print("Database initialization and seeding completed successfully.")
    finally:
        db.close()
