import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Camera } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import { chatWithAI } from '../utils/api'

const INITIAL_MESSAGES = {
  hair: "Hello! I'm your AI Hair Consultant at S & See Signature Salon. I'd love to help you find the perfect hair solution. Could you tell me:\n\n1. What's your current hair type? (straight, wavy, curly, coily)\n2. Any specific concerns? (hair fall, dandruff, dryness, damage)\n3. What are you looking for today? (haircut, coloring, treatment, styling)",
  skin: "Hello! I'm your AI Skin Consultant at S & See Signature Salon. Let me help you achieve your best skin. Could you share:\n\n1. What's your skin type? (oily, dry, combination, sensitive)\n2. Any specific concerns? (acne, pigmentation, aging, dullness)\n3. What results are you hoping for? (glow, anti-aging, spot reduction, hydration)",
  scalp: "Hello! I'm your AI Scalp Health Consultant at S & See Signature Salon. Let's assess your scalp health. Could you tell me:\n\n1. Do you experience any scalp issues? (itching, flaking, oiliness, dryness)\n2. How often do you wash your hair?\n3. Any history of hair loss or thinning?"
}

export default function Consultation() {
  const navigate = useNavigate()
  const { client, consultation, setAiResponses } = useClient()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const category = consultation?.category || 'hair'

  useEffect(() => {
    setMessages([{ role: 'ai', content: INITIAL_MESSAGES[category] }])
  }, [category])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await chatWithAI({
        message: userMsg,
        category,
        client_name: client?.name,
        client_age: client?.age,
        client_gender: client?.gender,
        history: messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
      })
      const aiMsg = res.data.response
      setMessages(prev => [...prev, { role: 'ai', content: aiMsg }])
      setAiResponses(prev => [...prev, { question: userMsg, answer: aiMsg }])
    } catch {
      // Fallback for demo mode
      const fallbackResponses = {
        hair: "Based on what you've described, I'd recommend our Premium Hair Care Treatment. This includes a deep conditioning treatment followed by a professional styling session. Would you like to explore our hair services or would you prefer to take a photo so I can give you visual style recommendations?",
        skin: "Thank you for sharing that! Based on your skin profile, I'd suggest our Signature Glow Facial which combines deep cleansing with hydration therapy. It's perfect for your skin type. Shall I show you our skin care services, or would you like to capture a photo for a personalized analysis?",
        scalp: "I understand your concerns. For your scalp condition, I'd recommend our Scalp Rejuvenation Therapy which includes a medicated treatment followed by a soothing massage. Would you like to see our scalp treatment options?"
      }
      const aiMsg = fallbackResponses[category]
      setMessages(prev => [...prev, { role: 'ai', content: aiMsg }])
      setAiResponses(prev => [...prev, { question: userMsg, answer: aiMsg }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
    <div>
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/category')}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1>AI {category.charAt(0).toUpperCase() + category.slice(1)} Consultant</h1>
          <p>Personalized recommendations powered by AI</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/photo')}>
          <Camera size={20} />
        </button>
      </div>

      <div style={{ padding: '0 24px', paddingBottom: 80 }}>
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble ai">
                <div className="loading-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Describe your needs..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="chat-send-btn" onClick={sendMessage} disabled={loading}>
              <Send size={20} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => navigate('/services')}>
            View Services
          </button>
          <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => navigate('/photo')}>
            Take Photo
          </button>
        </div>
      </div>
    </div>
  )
}
