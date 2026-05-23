from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from config import settings
from database import engine
import models

from routers import auth, tickets, operators, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    os.makedirs("uploads", exist_ok=True)
    yield


app = FastAPI(
    title="HelpDesk AI API",
    version="1.0.0",
    description="Інтелектуальна система автоматизації служби підтримки",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(operators.router)
app.include_router(dashboard.router)

if os.path.isdir("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs"}
