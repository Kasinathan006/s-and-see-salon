from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import TreatmentPlan, TreatmentSession

router = APIRouter()


class TreatmentCreate(BaseModel):
    client_id: int
    name: str
    category: str
    total_weeks: int
    notes: Optional[str] = None


class ProgressUpdate(BaseModel):
    current_week: int
    session_status: Optional[str] = None
    missed_reason: Optional[str] = None
    notes: Optional[str] = None


@router.post("/treatments")
def create_treatment(data: TreatmentCreate, db: Session = Depends(get_db)):
    plan = TreatmentPlan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)

    # Create sessions for each week
    for week in range(1, data.total_weeks + 1):
        session = TreatmentSession(plan_id=plan.id, week=week)
        db.add(session)
    db.commit()

    return plan


@router.get("/treatments/{treatment_id}")
def get_treatment(treatment_id: int, db: Session = Depends(get_db)):
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == treatment_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")

    sessions = db.query(TreatmentSession).filter(
        TreatmentSession.plan_id == treatment_id
    ).order_by(TreatmentSession.week).all()

    return {"plan": plan, "sessions": sessions}


@router.put("/treatments/{treatment_id}/progress")
def update_progress(treatment_id: int, data: ProgressUpdate, db: Session = Depends(get_db)):
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == treatment_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")

    plan.current_week = data.current_week
    if data.notes:
        plan.notes = data.notes

    # Update session status
    if data.session_status:
        session = db.query(TreatmentSession).filter(
            TreatmentSession.plan_id == treatment_id,
            TreatmentSession.week == data.current_week
        ).first()
        if session:
            session.status = data.session_status
            if data.missed_reason:
                session.missed_reason = data.missed_reason

    db.commit()
    return {"status": "updated"}
