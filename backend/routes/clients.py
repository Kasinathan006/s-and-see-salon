from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Client

router = APIRouter()


class ClientCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    mobile: str
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    region: Optional[str] = None
    photo_url: Optional[str] = None


class ClientResponse(BaseModel):
    id: int
    name: str
    age: Optional[int]
    gender: Optional[str]
    mobile: str
    email: Optional[str]
    whatsapp: Optional[str]
    region: Optional[str]
    photo_url: Optional[str]

    class Config:
        from_attributes = True


@router.post("/clients", response_model=ClientResponse)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    existing = db.query(Client).filter(Client.mobile == client.mobile).first()
    if existing:
        # Update existing client info
        for key, value in client.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing

    db_client = Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


@router.put("/clients/{client_id}/photo")
def update_client_photo(client_id: int, photo_data: dict, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    client.photo_url = photo_data.get("photo_url")
    db.commit()
    return {"status": "success", "photo_url": client.photo_url}


@router.get("/clients/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.get("/clients/search")
def search_client(phone: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.mobile == phone).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client
