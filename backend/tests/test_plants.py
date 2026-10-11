def test_create_and_manage_plant(client, auth_headers):
    plant_data = {
        "common_name": "Monstera Deliciosa",
        "scientific_name": "Monstera deliciosa Liebm.",
        "category": "Foliage",
        "location_type": "indoor",
        "sunlight_requirement": "Bright indirect light",
        "watering_frequency_days": 7,
        "soil_type": "Chunky aroid mix with perlite",
        "care_notes": "Prone to root rot if sitting in cold wet soil."
    }
    create_res = client.post("/api/plants", json=plant_data, headers=auth_headers)
    assert create_res.status_code == 201
    plant = create_res.json()
    assert plant["common_name"] == "Monstera Deliciosa"
    assert plant["days_until_next_water"] == 7
    plant_id = plant["id"]

    # Retrieve all plants
    list_res = client.get("/api/plants", headers=auth_headers)
    assert list_res.status_code == 200
    plants = list_res.json()
    assert any(p["id"] == plant_id for p in plants)

    # Retrieve plant detail
    detail_res = client.get(f"/api/plants/{plant_id}", headers=auth_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["scientific_name"] == "Monstera deliciosa Liebm."

    # Update plant
    update_res = client.put(f"/api/plants/{plant_id}", json={
        "care_notes": "New leaf unfurling! Soil moisture regular.",
        "watering_frequency_days": 10
    }, headers=auth_headers)
    assert update_res.status_code == 200
    assert update_res.json()["watering_frequency_days"] == 10

    # Delete plant
    del_res = client.delete(f"/api/plants/{plant_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # Verify deleted
    get_after_del = client.get(f"/api/plants/{plant_id}", headers=auth_headers)
    assert get_after_del.status_code == 404
