from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Appointment

router = APIRouter()


class AppointmentCreate(BaseModel):
    client_id: int
    service_ids: str
    date: str
    time: str
    notes: Optional[str] = None


@router.post("/appointments")
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db)):
    appointment = Appointment(**data.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/appointments")
def get_appointments(client_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Appointment)
    if client_id:
        query = query.filter(Appointment.client_id == client_id)
    return query.order_by(Appointment.created_at.desc()).all()


@router.put("/appointments/{appointment_id}")
def update_appointment(appointment_id: int, status: str, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appointment.status = status
    db.commit()
    return appointment
