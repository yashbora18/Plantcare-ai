def test_challenge_missions_and_logging(client, auth_headers):
    # 1. Fetch missions
    missions_res = client.get("/api/challenge/missions", headers=auth_headers)
    assert missions_res.status_code == 200
    missions = missions_res.json()
    assert len(missions) >= 7  # 7 seed missions for Week 1
    
    first_mission = missions[0]
    mission_id = first_mission["id"]
    assert first_mission["is_completed"] is False

    # 2. Complete mission
    complete_res = client.post(f"/api/challenge/missions/{mission_id}/complete", json={
        "notes": "Checked soil on outdoor tomatoes; top inch was dry, subsoil was damp."
    }, headers=auth_headers)
    assert complete_res.status_code == 200
    assert complete_res.json()["is_completed"] is True
    assert complete_res.json()["user_notes"] is not None

    # 3. Log additional outdoor gardening time
    log_res = client.post("/api/challenge/log-activity", json={
        "minutes_spent": 30,
        "activity_type": "Compost Turning",
        "notes": "Aerated backyard compost pile with garden fork"
    }, headers=auth_headers)
    assert log_res.status_code == 201
    assert log_res.json()["minutes_spent"] == 30

    # 4. Get challenge summary
    summary_res = client.get("/api/challenge/summary", headers=auth_headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["completed_missions"] >= 1
    assert summary["weekly_logged_minutes"] >= 40  # 10m from mission + 30m from log
    assert summary["current_streak_days"] >= 1
    assert summary["hacktoberfest_week"] == 1
