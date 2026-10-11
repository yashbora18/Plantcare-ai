from datetime import datetime, timedelta

def test_tasks_lifecycle(client, auth_headers):
    # 1. Create a plant
    p_res = client.post("/api/plants", json={
        "common_name": "Sweet Basil",
        "category": "Herb",
        "watering_frequency_days": 3
    }, headers=auth_headers)
    assert p_res.status_code == 201
    plant_id = p_res.json()["id"]

    # 2. Plant creation automatically creates initial watering task
    tasks_res = client.get("/api/tasks?filter_by=all", headers=auth_headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) > 0
    task_id = tasks[0]["id"]

    # 3. Create custom task
    custom_task_res = client.post("/api/tasks", json={
        "plant_id": plant_id,
        "task_type": "pruning",
        "title": "Pinch Basil flower tops",
        "description": "Encourage bushier leaf growth by cutting flowers",
        "due_date": (datetime.utcnow() + timedelta(days=2)).isoformat()
    }, headers=auth_headers)
    assert custom_task_res.status_code == 201

    # 4. Complete initial task
    comp_res = client.put(f"/api/tasks/{task_id}/complete", json={
        "notes": "Watered until drainage holes flowed."
    }, headers=auth_headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["is_completed"] is True
    assert comp_res.json()["completed_at"] is not None

    # 5. Check completed filter
    comp_list = client.get("/api/tasks?filter_by=completed", headers=auth_headers)
    assert comp_list.status_code == 200
    assert any(t["id"] == task_id for t in comp_list.json())
