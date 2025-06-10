import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.database import get_session
from app.models import User
from app.auth import get_password_hash

# Create test database
TEST_DATABASE_URL = "sqlite://"  # In-memory database

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def test_create_user(client: TestClient):
    response = client.post(
        "/token",
        data={
            "username": "test@example.com",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_create_patient(client: TestClient, test_user: User):
    # First login to get token
    response = client.post(
        "/token",
        data={
            "username": "test@example.com",
            "password": "testpassword"
        }
    )
    token = response.json()["access_token"]
    
    # Create patient with token
    patient_data = {
        "nombre": "Test Patient",
        "fecha_nacimiento": "1990-01-01",
        "telefono": "1234567890",
        "email": "patient@example.com",
        "direccion": "Test Address",
        "requiere_factura": False
    }
    response = client.post(
        "/patients/",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == patient_data["nombre"]
    assert "id" in data

def test_get_patients(client: TestClient, test_user: User):
    # First login to get token
    response = client.post(
        "/token",
        data={
            "username": "test@example.com",
            "password": "testpassword"
        }
    )
    token = response.json()["access_token"]
    
    # Get patients list
    response = client.get(
        "/patients/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_unauthorized_access(client: TestClient):
    response = client.get("/patients/")
    assert response.status_code == 401
