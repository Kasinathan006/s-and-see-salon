from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer)
    gender = Column(String(20))
    mobile = Column(String(15), unique=True, nullable=False, index=True)
    email = Column(String(100))
    whatsapp = Column(String(15))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    consultations = relationship("Consultation", back_populates="client")
    appointments = relationship("Appointment", back_populates="client")
    feedbacks = relationship("Feedback", back_populates="client")
    treatments = relationship("TreatmentPlan", back_populates="client")


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    category = Column(String(20), nullable=False)  # hair, skin, scalp
    status = Column(String(20), default="active")
    ai_summary = Column(Text)
    accuracy_score = Column(Float, default=9.5)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    client = relationship("Client", back_populates="consultations")
    messages = relationship("ConsultationMessage", back_populates="consultation")


class ConsultationMessage(Base):
    __tablename__ = "consultation_messages"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False)
    role = Column(String(10), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    consultation = relationship("Consultation", back_populates="messages")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(20), nullable=False)
    price = Column(Float, nullable=False)
    duration = Column(String(20))
    is_active = Column(Boolean, default=True)


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    service_ids = Column(Text)  # Comma-separated service IDs
    date = Column(String(10), nullable=False)
    time = Column(String(5), nullable=False)
    status = Column(String(20), default="scheduled")
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    client = relationship("Client", back_populates="appointments")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(Text)
    video_url = Column(String(500))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    client = relationship("Client", back_populates="feedbacks")


class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(20), nullable=False)
    total_weeks = Column(Integer, nullable=False)
    current_week = Column(Integer, default=1)
    status = Column(String(20), default="active")
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    client = relationship("Client", back_populates="treatments")
    sessions = relationship("TreatmentSession", back_populates="plan")


class TreatmentSession(Base):
    __tablename__ = "treatment_sessions"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False)
    week = Column(Integer, nullable=False)
    date = Column(String(10))
    status = Column(String(20), default="upcoming")
    notes = Column(Text)
    missed_reason = Column(Text)

    plan = relationship("TreatmentPlan", back_populates="sessions")
