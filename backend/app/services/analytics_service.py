"""
PlateVision — Analytics & Reporting Service

Aggregates ANPR platform performance, throughput, geographic distribution,
and accuracy metrics for the dashboard.
"""

from typing import Dict, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.recognition import Recognition
from backend.app.schemas.analytics import (
    AnalyticsOverview,
    DailyMetric,
    StateStat,
    StatusDistribution,
    PerformanceMetrics,
)
from backend.app.ocr.validator import INDIAN_STATE_CODES


class AnalyticsService:
    """Computes analytics aggregations for the ANPR platform."""

    def get_overview(self, db: Session) -> AnalyticsOverview:
        total = db.query(Recognition).count()

        # Today's count
        now_utc = datetime.now(timezone.utc)
        today_start = datetime(now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc)
        today_count = db.query(Recognition).filter(Recognition.created_at >= today_start).count()

        # Success rate
        success_count = (
            db.query(Recognition)
            .filter(Recognition.processing_status == "SUCCESS")
            .count()
        )
        success_rate = round((success_count / total * 100), 1) if total > 0 else 100.0

        # Status distribution
        status_rows = (
            db.query(Recognition.processing_status, func.count(Recognition.id))
            .group_by(Recognition.processing_status)
            .all()
        )
        status_breakdown = [
            StatusDistribution(
                status=status or "UNKNOWN",
                count=count,
                percentage=round((count / total * 100), 1) if total > 0 else 0.0,
            )
            for status, count in status_rows
        ]

        # Performance averages
        perf_row = (
            db.query(
                func.avg(Recognition.processing_duration_ms),
                func.avg(Recognition.detector_confidence),
                func.avg(Recognition.ocr_confidence),
                func.avg(Recognition.overall_confidence),
            )
            .filter(Recognition.processing_status == "SUCCESS")
            .first()
        )

        avg_dur = round(float(perf_row[0] or 0.0), 1) if perf_row and perf_row[0] else 0.0
        avg_det = round(float(perf_row[1] or 0.0), 3) if perf_row and perf_row[1] else 0.0
        avg_ocr = round(float(perf_row[2] or 0.0), 3) if perf_row and perf_row[2] else 0.0
        avg_ovr = round(float(perf_row[3] or 0.0), 3) if perf_row and perf_row[3] else 0.0

        performance = PerformanceMetrics(
            avg_processing_time_ms=avg_dur,
            avg_detector_confidence=avg_det,
            avg_ocr_confidence=avg_ocr,
            avg_overall_confidence=avg_ovr,
        )

        # Daily trends for the last 7 days
        daily_trends: List[DailyMetric] = []
        for i in range(6, -1, -1):
            day_dt = today_start - timedelta(days=i)
            next_day_dt = day_dt + timedelta(days=1)
            date_str = day_dt.strftime("%b %d")

            day_total = (
                db.query(Recognition)
                .filter(Recognition.created_at >= day_dt, Recognition.created_at < next_day_dt)
                .count()
            )
            day_success = (
                db.query(Recognition)
                .filter(
                    Recognition.created_at >= day_dt,
                    Recognition.created_at < next_day_dt,
                    Recognition.processing_status == "SUCCESS",
                )
                .count()
            )
            day_failed = day_total - day_success

            daily_trends.append(
                DailyMetric(
                    date=date_str,
                    total_scans=day_total,
                    successful_scans=day_success,
                    failed_scans=day_failed,
                )
            )

        # State distribution
        state_counts: Dict[str, int] = {}
        successful_records = (
            db.query(Recognition.extra_metadata)
            .filter(Recognition.processing_status == "SUCCESS")
            .all()
        )

        for (meta,) in successful_records:
            if meta and isinstance(meta, dict) and "validation" in meta:
                val = meta.get("validation")
                if val and isinstance(val, dict):
                    st = val.get("state_code")
                    if st:
                        state_counts[st] = state_counts.get(st, 0) + 1

        state_stats: List[StateStat] = []
        for st_code, count in sorted(state_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            name = INDIAN_STATE_CODES.get(st_code, st_code)
            pct = round((count / total * 100), 1) if total > 0 else 0.0
            state_stats.append(
                StateStat(
                    state_code=st_code,
                    state_name=name,
                    count=count,
                    percentage=pct,
                )
            )

        return AnalyticsOverview(
            total_recognitions=total,
            today_recognitions=today_count,
            success_rate_percentage=success_rate,
            daily_trends=daily_trends,
            state_distribution=state_stats,
            status_breakdown=status_breakdown,
            performance=performance,
        )


analytics_service = AnalyticsService()
