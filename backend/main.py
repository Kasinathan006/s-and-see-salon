from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routes import clients, consultations, services, appointments, feedback, ai_chat, treatments, stats

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="S & See Signature Salon API",
    description="AI-Powered Salon Management System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router, prefix="/api", tags=["Clients"])
app.include_router(consultations.router, prefix="/api", tags=["Consultations"])
app.include_router(services.router, prefix="/api", tags=["Services"])
app.include_router(appointments.router, prefix="/api", tags=["Appointments"])
app.include_router(feedback.router, prefix="/api", tags=["Feedback"])
app.include_router(ai_chat.router, prefix="/api", tags=["AI"])
app.include_router(treatments.router, prefix="/api", tags=["Treatments"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])

@app.get("/")
def root():
    return {"message": "S & See Signature Salon API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
