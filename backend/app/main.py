from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.middleware import ErrorHandlingMiddleware
from app.database.session import Base, SessionLocal, engine
from app.models import models  # register models
from app.api.routes import auth, dashboard, forecast, simulation, operations, admin
from app.services.seed import seed_demo

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    if settings.AUTO_SEED and settings.ENVIRONMENT != "testing":
        db = SessionLocal()
        try:
            seed_demo(db)
        finally:
            db.close()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered hospital operational forecasting, simulation and resource decision support.",
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(forecast.router, prefix="/api/v1")
app.include_router(simulation.router, prefix="/api/v1")
app.include_router(operations.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.get("/", tags=["System"])
def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "status": "operational", "docs": "/docs"}

@app.get("/health", tags=["System"])
def health():
    return {"status": "healthy", "service": "hospital-command-center", "version": settings.APP_VERSION}
