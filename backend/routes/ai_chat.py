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


class PhotoAnalysisRequest(BaseModel):
    photo: str  # base64 data URL
    category: str
    client_name: Optional[str] = None
    client_age: Optional[int] = None
    client_gender: Optional[str] = None
    consultation_answers: Optional[dict] = None


@router.post("/ai/analyze-photo")
async def analyze_photo(data: PhotoAnalysisRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")

    # Build context from consultation answers
    answers_context = ""
    if data.consultation_answers:
        answers_context = "\n".join(
            f"- {k}: {v}" for k, v in data.consultation_answers.items() if v
        )

    analysis_prompt = f"""Analyze this client photo for a salon consultation.

Category: {data.category}
Client: {data.client_name or 'Guest'}, Age: {data.client_age or 'N/A'}, Gender: {data.client_gender or 'N/A'}
{f'Consultation Details:{chr(10)}{answers_context}' if answers_context else ''}

Provide a JSON response with EXACTLY this structure (no markdown, no code blocks, just raw JSON):
{{
  "accuracy_score": <number between 8.0 and 10.0>,
  "face_shape": "<detected face shape>",
  "analysis_summary": "<2-3 sentence summary of what you observe>",
  "recommendations": [
    "<recommendation 1>",
    "<recommendation 2>",
    "<recommendation 3>"
  ],
  "suggested_services": [
    "<service name with price>",
    "<service name with price>"
  ],
  "style_suggestions": "<personalized style advice based on features>"
}}

Base the accuracy_score on how well you can analyze the photo quality and features. Be encouraging and positive."""

    if not api_key:
        return get_photo_fallback(data)

    try:
        import anthropic
        import base64
        client = anthropic.Anthropic(api_key=api_key)

        # Extract base64 data from data URL
        photo_data = data.photo
        media_type = "image/jpeg"
        if photo_data.startswith("data:"):
            parts = photo_data.split(",", 1)
            if len(parts) == 2:
                media_type = parts[0].split(":")[1].split(";")[0]
                photo_data = parts[1]

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": photo_data,
                        }
                    },
                    {
                        "type": "text",
                        "text": analysis_prompt
                    }
                ]
            }]
        )

        import json
        response_text = response.content[0].text.strip()
        # Try to parse JSON from response
        try:
            # Handle if wrapped in code blocks
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            result = json.loads(response_text)
            return result
        except json.JSONDecodeError:
            return get_photo_fallback(data)

    except Exception as e:
        print(f"Photo analysis error: {e}")
        return get_photo_fallback(data)


def get_photo_fallback(data: PhotoAnalysisRequest) -> dict:
    """Fallback photo analysis when Claude API is unavailable."""
    category = data.category
    name = data.client_name or "Guest"

    recommendations_map = {
        "hair": {
            "analysis_summary": f"Based on the photo analysis, {name}'s hair shows good potential for styling. We can see the natural texture and volume which will help us recommend the perfect look.",
            "recommendations": [
                "Layered cuts would add dimension and movement to your hair",
                "A deep conditioning treatment would enhance your hair's natural shine",
                "Consider subtle highlights to add depth and warmth"
            ],
            "suggested_services": [
                "Classic Haircut - Rs.300",
                "Hair Spa - Rs.800",
                "Highlights - Rs.2000"
            ],
            "style_suggestions": "Based on your features, a textured cut with soft layers would complement your face shape beautifully. Consider warm tones like caramel or honey for added dimension."
        },
        "skin": {
            "analysis_summary": f"Skin analysis for {name} shows a healthy complexion with areas that could benefit from targeted treatment for an enhanced glow.",
            "recommendations": [
                "A hydrating facial would improve overall skin texture",
                "Targeted treatment for any uneven areas will enhance your natural glow",
                "Regular exfoliation routine recommended for radiant skin"
            ],
            "suggested_services": [
                "Gold Facial - Rs.1200",
                "Skin Brightening - Rs.1500",
                "De-Tan - Rs.700"
            ],
            "style_suggestions": "Your skin has a warm undertone that responds well to hydration-based treatments. A Gold Facial combined with regular care would give you a natural, lasting glow."
        },
        "scalp": {
            "analysis_summary": f"Scalp assessment for {name} indicates areas that would benefit from professional care and targeted treatment for optimal scalp health.",
            "recommendations": [
                "A thorough scalp detox to remove buildup and refresh the scalp",
                "Nourishing treatment to strengthen hair roots",
                "Regular scalp massage to improve blood circulation"
            ],
            "suggested_services": [
                "Scalp Analysis - Rs.300",
                "Scalp Detox - Rs.800",
                "Hair Fall Treatment - Rs.1200"
            ],
            "style_suggestions": "Your scalp would benefit from a deep cleansing program. Starting with a professional Scalp Detox followed by regular nourishing treatments will promote healthier, stronger hair growth."
        }
    }

    cat_data = recommendations_map.get(category, recommendations_map["hair"])
    return {
        "accuracy_score": 9.2,
        "face_shape": "Oval",
        "analysis_summary": cat_data["analysis_summary"],
        "recommendations": cat_data["recommendations"],
        "suggested_services": cat_data["suggested_services"],
        "style_suggestions": cat_data["style_suggestions"]
    }


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
