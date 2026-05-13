# main.py - FastAPI entrypoint
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI()

@app.get("/api/test")
def test_api():
    return {"message": "API is working!"}

@app.get("/")
def read_root():
    return FileResponse(STATIC_DIR / "index.html")

@app.get("/{path:path}")
def serve_frontend(path: str):
    requested_file = STATIC_DIR / path
    if requested_file.exists() and requested_file.is_file():
        return FileResponse(requested_file)
    return FileResponse(STATIC_DIR / "index.html")
