def test_dashboard_and_analytics_endpoints(client, auth_headers):
    # Call dashboard stats
    dash_res = client.get("/api/analytics/dashboard", headers=auth_headers)
    assert dash_res.status_code == 200
    stats = dash_res.json()
    assert "total_plants" in stats
    assert "weekly_outdoor_minutes" in stats
    assert "outdoor_progress_pct" in stats
    assert "ai_status" in stats

    # Call overview analytics
    over_res = client.get("/api/analytics/overview", headers=auth_headers)
    assert over_res.status_code == 200
    overview = over_res.json()
    assert "total_plants" in overview
    assert "category_breakdown" in overview
    assert "tasks_completion_rate" in overview
    assert "seven_day_activity" in overview
    assert len(overview["seven_day_activity"]) == 7
