import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SALON_SYSTEM_PROMPT = """You are an expert AI beauty consultant for S & See Signature Salon, located in Avadi, Chennai.
You specialize in Hair, Skin, and Scalp care for Men, Women, and Kids.

Your role:
- Ask relevant questions to understand the client's needs
- Provide personalized recommendations based on their profile
- Suggest appropriate services from the salon's menu
- Be warm, professional, and knowledgeable
- Consider the client's age, gender, and specific concerns
- Recommend treatment plans when appropriate (e.g., 4-week programs)
- Always be encouraging and positive about potential results

Salon Services Available:
HAIR: Classic Haircut (Rs.300), Hair Coloring (Rs.1500), Hair Spa (Rs.800), Keratin Treatment (Rs.3500),
      Hair Straightening (Rs.4000), Bridal Styling (Rs.5000), Kids Haircut (Rs.200), Highlights (Rs.2000)
SKIN: Classic Facial (Rs.500), Gold Facial (Rs.1200), Anti-Aging (Rs.2000), Acne Treatment (Rs.800),
      Skin Brightening (Rs.1500), Chemical Peel (Rs.1800), De-Tan (Rs.700)
SCALP: Scalp Analysis (Rs.300), Anti-Dandruff (Rs.600), Hair Fall Treatment (Rs.1200),
       Scalp Detox (Rs.800), Scalp Massage (Rs.400)

Keep responses concise, friendly, and actionable. Use simple language that anyone can understand.
When suggesting services, mention the price. Always end with a question to keep the conversation going."""


class ChatRequest(BaseModel):
    message: str
    category: str
    client_name: Optional[str] = None
    client_age: Optional[int] = None
    client_gender: Optional[str] = None
    history: Optional[List[dict]] = None


@router.post("/ai/chat")
async def chat_with_ai(data: ChatRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        # Return intelligent fallback responses when no API key
        return {"response": get_fallback_response(data)}

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        system = SALON_SYSTEM_PROMPT
        if data.client_name:
            system += f"\n\nCurrent client: {data.client_name}"
        if data.client_age:
            system += f", Age: {data.client_age}"
        if data.client_gender:
            system += f", Gender: {data.client_gender}"
        system += f"\nConsultation category: {data.category}"

        messages = []
        if data.history:
            for msg in data.history:
                role = msg.get("role", "user")
                if role not in ("user", "assistant"):
                    role = "assistant" if role == "ai" else "user"
                messages.append({"role": role, "content": msg.get("content", "")})

        messages.append({"role": "user", "content": data.message})

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system=system,
            messages=messages
        )

        return {"response": response.content[0].text}

    except Exception as e:
        return {"response": get_fallback_response(data)}


def get_fallback_response(data: ChatRequest) -> str:
    """Intelligent fallback when Claude API is unavailable."""
    category = data.category
    message_lower = data.message.lower()

    # Greeting detection
    if any(w in message_lower for w in ['hi', 'hello', 'hey', 'good morning', 'good evening']):
        name = data.client_name or 'there'
        return f"Hello {name}! Welcome to S & See Signature Salon. I'm your AI {category} consultant. I'm here to help you find the perfect {category} solution. Could you tell me about your current {category} concerns or what you're looking for today?"

    # Category-specific responses
    responses = {
        'hair': {
            'color': "Great choice! Hair coloring can completely transform your look. At S & See, we use premium ammonia-free products (Rs.1500). Popular options include caramel highlights, balayage, and global coloring. What shade are you thinking of? Would you like to see some style options?",
            'cut': "A fresh haircut can make all the difference! We offer Classic Haircuts (Rs.300) and specialized styling. Based on your profile, I'd love to suggest some styles. Do you prefer a low-maintenance cut or something more styled?",
            'fall': "Hair fall is a common concern that we can definitely help with. I'd recommend starting with our Hair Fall Treatment (Rs.1200) which strengthens roots, combined with a Scalp Analysis (Rs.300) to identify the root cause. Would you like to know about our 4-week hair restoration program?",
            'default': "Based on what you've shared, I'd suggest considering our Hair Spa Treatment (Rs.800) for deep nourishment, or if you're looking for a style change, our expert stylists can guide you. Would you like to explore specific hair services or shall I recommend a treatment plan?"
        },
        'skin': {
            'acne': "Acne can be frustrating, but our specialized Acne Treatment (Rs.800) targets the root cause. For long-term results, I'd recommend a 4-week program combining deep cleansing with our specialized products. Would you like to know more about the treatment plan?",
            'glow': "Everyone deserves glowing skin! Our Gold Facial (Rs.1200) is our most popular treatment for instant radiance. For deeper results, try our Skin Brightening treatment (Rs.1500). Which would interest you more?",
            'aging': "Our Anti-Aging Treatment (Rs.2000) combines advanced techniques for visible results. It's perfect for wrinkle reduction and skin firming. Would you like to start with a single session or explore our multi-week program?",
            'default': "For your skin goals, I'd suggest starting with our Classic Facial (Rs.500) to assess your skin condition, followed by a targeted treatment. Our Gold Facial (Rs.1200) is a client favorite for overall skin health. What specific results are you hoping for?"
        },
        'scalp': {
            'dandruff': "Dandruff can be effectively treated with our Anti-Dandruff Treatment (Rs.600). It uses medicated solutions for lasting relief. For severe cases, I'd recommend a 4-week program. How long have you been dealing with dandruff?",
            'loss': "Hair loss concerns are best addressed with our comprehensive approach: Scalp Analysis (Rs.300) first to identify the cause, followed by our Hair Fall Treatment (Rs.1200). Would you like to explore our growth-stimulation program?",
            'default': "Scalp health is the foundation of beautiful hair! I'd recommend starting with a Scalp Analysis (Rs.300) to understand your scalp condition, followed by our Scalp Detox (Rs.800) for a fresh start. What specific scalp concerns do you have?"
        }
    }

    cat_responses = responses.get(category, responses['hair'])
    for keyword, response in cat_responses.items():
        if keyword != 'default' and keyword in message_lower:
            return response

    return cat_responses['default']
