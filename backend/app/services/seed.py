from sqlalchemy.orm import Session

def seed_demo(db: Session) -> None:
    # Demo data is managed by dbms/seeds/001_demo_data.sql for consistent deployments.
    return None
