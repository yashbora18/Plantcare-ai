import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.utils.seed_missions import seed_missions_if_empty

TEST_DATABASE_URL = "sqlite:///./test_plantcare.db"

test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as db:
        seed_missions_if_empty(db)
    yield
    Base.metadata.drop_all(bind=test_engine)
    import os
    if os.path.exists("./test_plantcare.db"):
        try:
            os.remove("./test_plantcare.db")
        except Exception:
            pass

@pytest.fixture()
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture()
def auth_headers(client):
    # Register test user
    payload = {
        "email": "gardener@example.com",
        "username": "botanist_jane",
        "password": "SecurePassword123!",
        "full_name": "Jane Green"
    }
    res = client.post("/api/auth/register", json=payload)
    if res.status_code == 201:
        token = res.json()["access_token"]
    else:
        # login if already registered
        res = client.post("/api/auth/login", json={"username_or_email": "botanist_jane", "password": "SecurePassword123!"})
        token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
