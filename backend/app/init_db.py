from sqlmodel import Session
from .database import engine, create_db_and_tables
from .models import User
from .auth import get_password_hash

def init_db():
    create_db_and_tables()
    
    # Create admin user if it doesn't exist
    with Session(engine) as session:
        admin_email = "admin@consultorio.com"
        admin = session.query(User).filter(User.email == admin_email).first()
        
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=get_password_hash("admin123"),  # Change this in production!
                is_active=True,
                is_superuser=True
            )
            session.add(admin)
            session.commit()
            print("Admin user created successfully!")
        else:
            print("Admin user already exists.")

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization completed!")
