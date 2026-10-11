def test_register_and_login(client):
    reg_data = {
        "email": "touchgrass@example.com",
        "username": "grass_grower",
        "password": "Password123!",
        "full_name": "Oliver Grass"
    }
    res = client.post("/api/auth/register", json=reg_data)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["username"] == "grass_grower"

    # Login with username
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "grass_grower",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Login with email
    login_email_res = client.post("/api/auth/login", json={
        "username_or_email": "touchgrass@example.com",
        "password": "Password123!"
    })
    assert login_email_res.status_code == 200

def test_get_profile_and_update_preferences(client, auth_headers):
    me_res = client.get("/api/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["username"] == "botanist_jane"
    assert profile["preference"]["outdoor_goal_minutes"] == 120

    # Update preferences
    pref_res = client.put("/api/auth/preferences", json={
        "theme": "dark",
        "outdoor_goal_minutes": 180,
        "gardening_zone": "Zone 8a",
        "experience_level": "intermediate"
    }, headers=auth_headers)
    assert pref_res.status_code == 200
    updated_pref = pref_res.json()
    assert updated_pref["theme"] == "dark"
    assert updated_pref["outdoor_goal_minutes"] == 180
    assert updated_pref["gardening_zone"] == "Zone 8a"
