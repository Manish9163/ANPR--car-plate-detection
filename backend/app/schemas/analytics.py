from typing import Dict, List, Any
from pydantic import BaseModel

class DailyMetric(BaseModel):
    date: str
    total_scans: int
    successful_scans: int
    failed_scans: int

class StateStat(BaseModel):
    state_code: str
    state_name: str
    count: int
    percentage: float

class StatusDistribution(BaseModel):
    status: str
    count: int
    percentage: float

class PerformanceMetrics(BaseModel):
    avg_processing_time_ms: float
    avg_detector_confidence: float
    avg_ocr_confidence: float
    avg_overall_confidence: float

class AnalyticsOverview(BaseModel):
    total_recognitions: int
    today_recognitions: int
    success_rate_percentage: float
    daily_trends: List[DailyMetric]
    state_distribution: List[StateStat]
    status_breakdown: List[StatusDistribution]
    performance: PerformanceMetrics
