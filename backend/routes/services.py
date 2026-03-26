from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Service

router = APIRouter()

# Default services to seed
DEFAULT_SERVICES = [
    {"name": "Classic Haircut", "description": "Precision cut with styling", "category": "hair", "price": 300, "duration": "30 min"},
    {"name": "Hair Coloring", "description": "Premium color with ammonia-free products", "category": "hair", "price": 1500, "duration": "90 min"},
    {"name": "Hair Spa Treatment", "description": "Deep conditioning & nourishment", "category": "hair", "price": 800, "duration": "60 min"},
    {"name": "Keratin Treatment", "description": "Smoothing & frizz control", "category": "hair", "price": 3500, "duration": "120 min"},
    {"name": "Hair Straightening", "description": "Permanent straightening treatment", "category": "hair", "price": 4000, "duration": "150 min"},
    {"name": "Bridal Hair Styling", "description": "Complete bridal hair package", "category": "hair", "price": 5000, "duration": "120 min"},
    {"name": "Kids Haircut", "description": "Fun & gentle haircut for children", "category": "hair", "price": 200, "duration": "20 min"},
    {"name": "Hair Highlights", "description": "Partial or full highlights", "category": "hair", "price": 2000, "duration": "90 min"},
    {"name": "Classic Facial", "description": "Deep cleansing & hydration", "category": "skin", "price": 500, "duration": "45 min"},
    {"name": "Gold Facial", "description": "Premium gold-infused treatment", "category": "skin", "price": 1200, "duration": "60 min"},
    {"name": "Anti-Aging Treatment", "description": "Wrinkle reduction & firming", "category": "skin", "price": 2000, "duration": "75 min"},
    {"name": "Acne Treatment", "description": "Targeted acne care & prevention", "category": "skin", "price": 800, "duration": "45 min"},
    {"name": "Skin Brightening", "description": "Pigmentation & dullness correction", "category": "skin", "price": 1500, "duration": "60 min"},
    {"name": "De-Tan Treatment", "description": "Sun damage repair & even tone", "category": "skin", "price": 700, "duration": "40 min"},
    {"name": "Scalp Analysis", "description": "Detailed scalp health assessment", "category": "scalp", "price": 300, "duration": "20 min"},
    {"name": "Anti-Dandruff Treatment", "description": "Medicated dandruff solution", "category": "scalp", "price": 600, "duration": "45 min"},
    {"name": "Hair Fall Treatment", "description": "Root strengthening therapy", "category": "scalp", "price": 1200, "duration": "60 min"},
    {"name": "Scalp Detox", "description": "Deep cleansing & purification", "category": "scalp", "price": 800, "duration": "45 min"},
    {"name": "Scalp Massage Therapy", "description": "Relaxation & blood circulation boost", "category": "scalp", "price": 400, "duration": "30 min"},
]


@router.get("/services")
def get_services(category: Optional[str] = Query(None), db: Session = Depends(get_db)):
    # Seed services if empty
    if db.query(Service).count() == 0:
        for s in DEFAULT_SERVICES:
            db.add(Service(**s))
        db.commit()

    query = db.query(Service).filter(Service.is_active == True)
    if category:
        query = query.filter(Service.category == category)
    return query.all()
