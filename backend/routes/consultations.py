from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import Consultation, ConsultationMessage

router = APIRouter()


class ConsultationCreate(BaseModel):
    client_id: int
    category: str


class AnswerSubmit(BaseModel):
    answers: List[dict]


@router.post("/consultations")
def create_consultation(data: ConsultationCreate, db: Session = Depends(get_db)):
    consultation = Consultation(client_id=data.client_id, category=data.category)
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return consultation


@router.get("/consultations/{consultation_id}")
def get_consultation(consultation_id: int, db: Session = Depends(get_db)):
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation


@router.post("/consultations/{consultation_id}/answers")
def submit_answers(consultation_id: int, data: AnswerSubmit, db: Session = Depends(get_db)):
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    for answer in data.answers:
        msg = ConsultationMessage(
            consultation_id=consultation_id,
            role=answer.get("role", "user"),
            content=answer.get("content", "")
        )
        db.add(msg)

    db.commit()
    return {"status": "answers saved"}


@router.get("/consultations/{consultation_id}/summary")
def get_summary(consultation_id: int, db: Session = Depends(get_db)):
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    messages = db.query(ConsultationMessage).filter(
        ConsultationMessage.consultation_id == consultation_id
    ).all()

    return {
        "consultation": consultation,
        "messages": messages,
        "accuracy_score": consultation.accuracy_score
    }
