from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Service

router = APIRouter()

# Default services to seed
DEFAULT_SERVICES = [
    # ===== HAIR CUTS & STYLES =====
    # Classic Cuts
    {"name": "Classic Haircut", "description": "Precision cut with styling", "category": "hair", "price": 300, "duration": "30 min"},
    {"name": "Kids Haircut", "description": "Fun & gentle haircut for children", "category": "hair", "price": 200, "duration": "20 min"},
    
    # Modern & Trending Cuts
    {"name": "Bob Cut", "description": "Chin-length classic bob style", "category": "hair", "price": 400, "duration": "35 min"},
    {"name": "Pixie Cut", "description": "Short, chic cropped style", "category": "hair", "price": 450, "duration": "40 min"},
    {"name": "Layer Cut", "description": "Multi-layer dimensional cut", "category": "hair", "price": 500, "duration": "45 min"},
    {"name": "Undercut", "description": "Modern fade with longer top", "category": "hair", "price": 400, "duration": "35 min"},
    {"name": "Fade Cut", "description": "Graduated fade with clean lines", "category": "hair", "price": 350, "duration": "30 min"},
    {"name": "Buzz Cut", "description": "Short uniform clipper cut", "category": "hair", "price": 250, "duration": "20 min"},
    {"name": "Crew Cut", "description": "Classic short men's cut", "category": "hair", "price": 300, "duration": "25 min"},
    {"name": "Textured Crop", "description": "Modern textured short style", "category": "hair", "price": 400, "duration": "35 min"},
    {"name": "Slick Back", "description": "Classic pomaded back style", "category": "hair", "price": 350, "duration": "30 min"},
    {"name": "Side Part", "description": "Clean professional parted style", "category": "hair", "price": 350, "duration": "30 min"},
    {"name": "French Crop", "description": "European style with fringe", "category": "hair", "price": 400, "duration": "35 min"},
    {"name": "Quiff", "description": "Voluminous swept-back style", "category": "hair", "price": 450, "duration": "40 min"},
    {"name": "Pompadour", "description": "Classic voluminous retro style", "category": "hair", "price": 500, "duration": "45 min"},
    {"name": "Comb Over", "description": "Sophisticated swept style", "category": "hair", "price": 400, "duration": "35 min"},
    {"name": "Man Bun", "description": "Long hair tied stylish bun", "category": "hair", "price": 300, "duration": "25 min"},
    {"name": "Top Knot", "description": "High bun with shaved sides", "category": "hair", "price": 350, "duration": "30 min"},
    {"name": "Afro", "description": "Natural textured volume style", "category": "hair", "price": 500, "duration": "50 min"},
    {"name": "Taper Fade", "description": "Gradual fade with tapered neck", "category": "hair", "price": 400, "duration": "35 min"},
    {"name": "Skin Fade", "description": "Fade to skin with sharp lines", "category": "hair", "price": 450, "duration": "40 min"},
    
    # Asian Styles
    {"name": "K-Pop Style", "description": "Korean inspired trendy cut", "category": "hair", "price": 600, "duration": "50 min"},
    {"name": "Two-Block Cut", "description": "Korean disconnected style", "category": "hair", "price": 550, "duration": "45 min"},
    {"name": "Mullet", "description": "Business front, party back", "category": "hair", "price": 450, "duration": "40 min"},
    {"name": "Wolf Cut", "description": "Layered shaggy modern style", "category": "hair", "price": 500, "duration": "45 min"},
    {"name": "Hime Cut", "description": "Japanese princess style with blunt bangs", "category": "hair", "price": 600, "duration": "55 min"},
    {"name": "Curtain Bangs", "description": "Face-framing parted fringe", "category": "hair", "price": 350, "duration": "30 min"},
    
    # Braids & Special Styles
    {"name": "Box Braids", "description": "Protective box braid style", "category": "hair", "price": 2500, "duration": "180 min"},
    {"name": "Cornrows", "description": "Traditional braided rows", "category": "hair", "price": 1500, "duration": "120 min"},
    {"name": "Dreadlocks", "description": "Natural loc formation & maintenance", "category": "hair", "price": 3000, "duration": "240 min"},
    {"name": "Fishtail Braid", "description": "Intricate fishtail styling", "category": "hair", "price": 600, "duration": "45 min"},
    {"name": "French Braid", "description": "Classic elegant braided style", "category": "hair", "price": 500, "duration": "40 min"},
    {"name": "Dutch Braid", "description": "Reverse French braid style", "category": "hair", "price": 550, "duration": "45 min"},
    
    # ===== HAIR COLOR =====
    # Basic Coloring
    {"name": "Hair Coloring", "description": "Premium color with ammonia-free products", "category": "hair", "price": 1500, "duration": "90 min"},
    {"name": "Hair Highlights", "description": "Partial or full highlights", "category": "hair", "price": 2000, "duration": "90 min"},
    {"name": "Balayage", "description": "Hand-painted natural gradient", "category": "hair", "price": 3500, "duration": "120 min"},
    {"name": "Ombre", "description": "Dramatic two-tone fade effect", "category": "hair", "price": 3000, "duration": "120 min"},
    {"name": "Root Touch-up", "description": "Color refresh for roots only", "category": "hair", "price": 800, "duration": "45 min"},
    
    # Trending Colors
    {"name": "Platinum Blonde", "description": "Ice blonde transformation", "category": "hair", "price": 4000, "duration": "180 min"},
    {"name": "Rose Gold", "description": "Pink-tinted metallic blonde", "category": "hair", "price": 3500, "duration": "150 min"},
    {"name": "Ash Brown", "description": "Cool-toned brown shade", "category": "hair", "price": 2000, "duration": "90 min"},
    {"name": "Caramel Highlights", "description": "Warm golden streaks", "category": "hair", "price": 2200, "duration": "100 min"},
    {"name": "Burgundy Red", "description": "Deep wine red color", "category": "hair", "price": 2500, "duration": "120 min"},
    {"name": "Copper Red", "description": "Warm copper tones", "category": "hair", "price": 2500, "duration": "120 min"},
    {"name": "Jet Black", "description": "Intense deep black", "category": "hair", "price": 1500, "duration": "90 min"},
    {"name": "Silver/Grey", "description": "Metallic grey transformation", "category": "hair", "price": 4500, "duration": "180 min"},
    {"name": "Pastel Colors", "description": "Pink, blue, lavender fantasy shades", "category": "hair", "price": 4000, "duration": "180 min"},
    {"name": "Neon Colors", "description": "Vivid electric color statements", "category": "hair", "price": 4500, "duration": "200 min"},
    {"name": "Money Piece", "description": "Face-framing highlight streaks", "category": "hair", "price": 1200, "duration": "60 min"},
    {"name": "Bronde", "description": "Brown-blonde hybrid shade", "category": "hair", "price": 2800, "duration": "120 min"},
    {"name": "Cherry Cola", "description": "Dark red-brown rich shade", "category": "hair", "price": 2500, "duration": "120 min"},
    {"name": "Honey Blonde", "description": "Warm golden blonde", "category": "hair", "price": 2500, "duration": "120 min"},
    {"name": "Smokey Blue", "description": "Muted blue-grey tone", "category": "hair", "price": 3500, "duration": "150 min"},
    
    # ===== HAIR TREATMENTS =====
    {"name": "Hair Spa Treatment", "description": "Deep conditioning & nourishment", "category": "hair", "price": 800, "duration": "60 min"},
    {"name": "Keratin Treatment", "description": "Smoothing & frizz control", "category": "hair", "price": 3500, "duration": "120 min"},
    {"name": "Hair Straightening", "description": "Permanent straightening treatment", "category": "hair", "price": 4000, "duration": "150 min"},
    {"name": "Hair Rebonding", "description": "Chemical straightening treatment", "category": "hair", "price": 4500, "duration": "180 min"},
    {"name": "Deep Conditioning", "description": "Intensive moisture treatment", "category": "hair", "price": 600, "duration": "45 min"},
    {"name": "Hot Oil Treatment", "description": "Nourishing oil therapy", "category": "hair", "price": 500, "duration": "40 min"},
    {"name": "Protein Treatment", "description": "Strengthening protein boost", "category": "hair", "price": 1200, "duration": "60 min"},
    {"name": "Botox Hair Treatment", "description": "Anti-aging for hair", "category": "hair", "price": 4000, "duration": "120 min"},
    {"name": "Perm/Permanent Waves", "description": "Long-lasting curl formation", "category": "hair", "price": 2500, "duration": "150 min"},
    {"name": "Digital Perm", "description": "Modern heat perm technology", "category": "hair", "price": 3500, "duration": "180 min"},
    
    # ===== SPECIAL STYLING =====
    {"name": "Bridal Hair Styling", "description": "Complete bridal hair package", "category": "hair", "price": 5000, "duration": "120 min"},
    {"name": "Event Styling", "description": "Party/Special occasion styling", "category": "hair", "price": 1500, "duration": "60 min"},
    {"name": "Blow Dry", "description": "Professional blowout styling", "category": "hair", "price": 500, "duration": "30 min"},
    {"name": "Beard Trim", "description": "Shape and style beard", "category": "hair", "price": 200, "duration": "15 min"},
    {"name": "Beard Coloring", "description": "Match or enhance beard color", "category": "hair", "price": 800, "duration": "45 min"},
    
    # ===== SKIN SERVICES =====
    {"name": "Classic Facial", "description": "Deep cleansing & hydration", "category": "skin", "price": 500, "duration": "45 min"},
    {"name": "Gold Facial", "description": "Premium gold-infused treatment", "category": "skin", "price": 1200, "duration": "60 min"},
    {"name": "Anti-Aging Treatment", "description": "Wrinkle reduction & firming", "category": "skin", "price": 2000, "duration": "75 min"},
    {"name": "Acne Treatment", "description": "Targeted acne care & prevention", "category": "skin", "price": 800, "duration": "45 min"},
    {"name": "Skin Brightening", "description": "Pigmentation & dullness correction", "category": "skin", "price": 1500, "duration": "60 min"},
    {"name": "De-Tan Treatment", "description": "Sun damage repair & even tone", "category": "skin", "price": 700, "duration": "40 min"},
    
    # ===== SCALP SERVICES =====
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
