from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Feedback

router = APIRouter()


class FeedbackCreate(BaseModel):
    client_id: int
    rating: int
    text: Optional[str] = None
    video_url: Optional[str] = None


@router.post("/feedback")
def create_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    feedback = Feedback(**data.model_dump())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/feedback")
def get_all_feedback(db: Session = Depends(get_db)):
    return db.query(Feedback).order_by(Feedback.created_at.desc()).all()
