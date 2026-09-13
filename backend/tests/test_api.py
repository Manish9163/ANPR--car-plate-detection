"""
Integration tests for FastAPI endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["status"] == "online"
    assert "PlateVision" in json_data["name"]


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["status"] == "healthy"
    assert "acceleration" in json_data


def test_recognitions_list():
    res = client.get("/api/recognitions")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["success"] is True
    assert "data" in json_data
    assert "meta" in json_data


def test_analytics_overview():
    res = client.get("/api/analytics/overview")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["success"] is True
    assert "total_recognitions" in json_data["data"]
