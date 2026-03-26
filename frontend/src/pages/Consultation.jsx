import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { useClient } from '../context/ClientContext'

const CONSULTATION_FLOW = {
  hair: {
    title: 'AI Hair Consultant',
    subtitle: 'Personalized recommendations powered by AI',
    steps: [
      {
        id: 'hair_type',
        question: "What's your hair type?",
        options: [
          { label: 'Straight', emoji: '🔳', value: 'straight' },
          { label: 'Wavy', emoji: '🌊', value: 'wavy' },
          { label: 'Curly', emoji: '🌀', value: 'curly' },
          { label: 'Coily', emoji: '➰', value: 'coily' },
        ]
      },
      {
        id: 'hair_concern',
        question: "What's your main concern?",
        multiSelect: true,
        options: [
          { label: 'Hair Fall', emoji: '😟', value: 'hair fall' },
          { label: 'Dandruff', emoji: '❄️', value: 'dandruff' },
          { label: 'Dryness', emoji: '🏜️', value: 'dryness' },
          { label: 'Damage', emoji: '⚡', value: 'damage' },
          { label: 'Split Ends', emoji: '✂️', value: 'split ends' },
          { label: 'Frizz', emoji: '💨', value: 'frizz' },
        ]
      },
      {
        id: 'hair_goal',
        question: "What are you looking for today?",
        options: [
          { label: 'Haircut', emoji: '✂️', value: 'haircut' },
          { label: 'Coloring', emoji: '🎨', value: 'coloring' },
          { label: 'Treatment', emoji: '💆', value: 'treatment' },
          { label: 'Styling', emoji: '💇', value: 'styling' },
          { label: 'Keratin', emoji: '✨', value: 'keratin' },
          { label: 'Rebonding', emoji: '🪄', value: 'rebonding' },
        ]
      },
      {
        id: 'hair_length',
        question: "What's your current hair length?",
        options: [
          { label: 'Short', emoji: '📏', value: 'short' },
          { label: 'Medium', emoji: '📐', value: 'medium' },
          { label: 'Long', emoji: '📎', value: 'long' },
          { label: 'Very Long', emoji: '🧵', value: 'very long' },
        ]
      },
      {
        id: 'hair_budget',
        question: "What's your budget range?",
        options: [
          { label: '₹200 - ₹500', emoji: '💰', value: 'budget' },
          { label: '₹500 - ₹1500', emoji: '💎', value: 'mid-range' },
          { label: '₹1500 - ₹3000', emoji: '👑', value: 'premium' },
          { label: '₹3000+', emoji: '🌟', value: 'luxury' },
        ]
      }
    ]
  },
  skin: {
    title: 'AI Skin Consultant',
    subtitle: 'Personalized skincare recommendations',
    steps: [
      {
        id: 'skin_type',
        question: "What's your skin type?",
        options: [
          { label: 'Oily', emoji: '💧', value: 'oily' },
          { label: 'Dry', emoji: '🏜️', value: 'dry' },
          { label: 'Combination', emoji: '🔀', value: 'combination' },
          { label: 'Sensitive', emoji: '🌸', value: 'sensitive' },
          { label: 'Normal', emoji: '✅', value: 'normal' },
        ]
      },
      {
        id: 'skin_concern',
        question: "What are your skin concerns?",
        multiSelect: true,
        options: [
          { label: 'Acne', emoji: '😣', value: 'acne' },
          { label: 'Pigmentation', emoji: '🟤', value: 'pigmentation' },
          { label: 'Aging', emoji: '⏳', value: 'aging' },
          { label: 'Dullness', emoji: '😶', value: 'dullness' },
          { label: 'Dark Circles', emoji: '👁️', value: 'dark circles' },
          { label: 'Tan', emoji: '☀️', value: 'tan' },
        ]
      },
      {
        id: 'skin_goal',
        question: "What result do you want?",
        options: [
          { label: 'Glow & Radiance', emoji: '✨', value: 'glow' },
          { label: 'Anti-Aging', emoji: '🔄', value: 'anti-aging' },
          { label: 'Spot Reduction', emoji: '🎯', value: 'spot reduction' },
          { label: 'Deep Hydration', emoji: '💦', value: 'hydration' },
          { label: 'Skin Brightening', emoji: '🌟', value: 'brightening' },
          { label: 'Pore Tightening', emoji: '🔬', value: 'pore tightening' },
        ]
      },
      {
        id: 'skin_budget',
        question: "What's your budget range?",
        options: [
          { label: '₹300 - ₹800', emoji: '💰', value: 'budget' },
          { label: '₹800 - ₹2000', emoji: '💎', value: 'mid-range' },
          { label: '₹2000 - ₹5000', emoji: '👑', value: 'premium' },
          { label: '₹5000+', emoji: '🌟', value: 'luxury' },
        ]
      }
    ]
  },
  scalp: {
    title: 'AI Scalp Consultant',
    subtitle: 'Scalp health assessment',
    steps: [
      {
        id: 'scalp_issue',
        question: "What scalp issues do you experience?",
        multiSelect: true,
        options: [
          { label: 'Itching', emoji: '😖', value: 'itching' },
          { label: 'Flaking', emoji: '❄️', value: 'flaking' },
          { label: 'Oiliness', emoji: '💧', value: 'oiliness' },
          { label: 'Dryness', emoji: '🏜️', value: 'dryness' },
          { label: 'Redness', emoji: '🔴', value: 'redness' },
          { label: 'Odour', emoji: '👃', value: 'odour' },
        ]
      },
      {
        id: 'wash_frequency',
        question: "How often do you wash your hair?",
        options: [
          { label: 'Daily', emoji: '📅', value: 'daily' },
          { label: 'Every 2 Days', emoji: '2️⃣', value: 'every 2 days' },
          { label: 'Twice a Week', emoji: '✌️', value: 'twice a week' },
          { label: 'Once a Week', emoji: '1️⃣', value: 'once a week' },
        ]
      },
      {
        id: 'hair_loss',
        question: "Any hair loss or thinning?",
        options: [
          { label: 'No Hair Loss', emoji: '✅', value: 'no' },
          { label: 'Mild Thinning', emoji: '⚠️', value: 'mild' },
          { label: 'Moderate Loss', emoji: '😟', value: 'moderate' },
          { label: 'Heavy Loss', emoji: '🚨', value: 'heavy' },
        ]
      },
      {
        id: 'scalp_budget',
        question: "What's your budget range?",
        options: [
          { label: '₹300 - ₹600', emoji: '💰', value: 'budget' },
          { label: '₹600 - ₹1500', emoji: '💎', value: 'mid-range' },
          { label: '₹1500 - ₹3000', emoji: '👑', value: 'premium' },
          { label: '₹3000+', emoji: '🌟', value: 'luxury' },
        ]
      }
    ]
  }
}

const RECOMMENDATIONS = {
  hair: {
    haircut: [
      { name: 'Classic Haircut', price: '₹300', time: '30 min' },
      { name: 'Layered Cut', price: '₹500', time: '45 min' },
      { name: 'Premium Styling Cut', price: '₹800', time: '60 min' },
    ],
    coloring: [
      { name: 'Global Color', price: '₹1500', time: '90 min' },
      { name: 'Highlights', price: '₹2000', time: '120 min' },
      { name: 'Balayage', price: '₹3500', time: '150 min' },
    ],
    treatment: [
      { name: 'Deep Conditioning', price: '₹600', time: '45 min' },
      { name: 'Hair Spa', price: '₹900', time: '60 min' },
      { name: 'Protein Treatment', price: '₹1200', time: '75 min' },
    ],
    styling: [
      { name: 'Blow Dry', price: '₹300', time: '30 min' },
      { name: 'Iron Styling', price: '₹500', time: '45 min' },
      { name: 'Bridal Styling', price: '₹3000', time: '120 min' },
    ],
    keratin: [
      { name: 'Keratin Express', price: '₹2500', time: '90 min' },
      { name: 'Full Keratin', price: '₹5000', time: '180 min' },
    ],
    rebonding: [
      { name: 'Rebonding (Short)', price: '₹3000', time: '180 min' },
      { name: 'Rebonding (Long)', price: '₹5000', time: '240 min' },
    ],
  },
  skin: {
    glow: [
      { name: 'Gold Facial', price: '₹1200', time: '60 min' },
      { name: 'Signature Glow', price: '₹2500', time: '90 min' },
    ],
    'anti-aging': [
      { name: 'Anti-Aging Facial', price: '₹1800', time: '75 min' },
      { name: 'Collagen Boost', price: '₹3000', time: '90 min' },
    ],
    'spot reduction': [
      { name: 'De-Pigmentation', price: '₹1500', time: '60 min' },
      { name: 'Laser Spot Treatment', price: '₹3500', time: '45 min' },
    ],
    hydration: [
      { name: 'Hydra Facial', price: '₹2000', time: '75 min' },
      { name: 'Moisture Surge', price: '₹1200', time: '60 min' },
    ],
    brightening: [
      { name: 'Vitamin C Facial', price: '₹1500', time: '60 min' },
      { name: 'Brightening Peel', price: '₹2000', time: '45 min' },
    ],
    'pore tightening': [
      { name: 'Pore Minimizer', price: '₹1200', time: '60 min' },
      { name: 'Micro-Needling', price: '₹3000', time: '45 min' },
    ],
  },
  scalp: {
    default: [
      { name: 'Scalp Detox', price: '₹600', time: '45 min' },
      { name: 'Scalp Rejuvenation', price: '₹1200', time: '60 min' },
      { name: 'Anti-Hair Fall Therapy', price: '₹1800', time: '75 min' },
      { name: 'PRP Treatment', price: '₹5000', time: '60 min' },
    ]
  }
}

export default function Consultation() {
  const navigate = useNavigate()
  const { consultation, setAiResponses } = useClient()
  const category = consultation?.category || 'hair'
  const flow = CONSULTATION_FLOW[category]

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [multiSelections, setMultiSelections] = useState([])
  const [showResult, setShowResult] = useState(false)
  const contentRef = useRef(null)

  const step = flow.steps[currentStep]
  const totalSteps = flow.steps.length
  const progress = ((currentStep) / totalSteps) * 100

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentStep])

  const handleOptionSelect = (option) => {
    if (step.multiSelect) {
      setMultiSelections(prev =>
        prev.includes(option.value)
          ? prev.filter(v => v !== option.value)
          : [...prev, option.value]
      )
    } else {
      const newAnswers = { ...answers, [step.id]: option.value }
      setAnswers(newAnswers)

      setTimeout(() => {
        if (currentStep < totalSteps - 1) {
          setCurrentStep(prev => prev + 1)
        } else {
          generateResult(newAnswers)
        }
      }, 300)
    }
  }

  const handleMultiContinue = () => {
    if (multiSelections.length === 0) return
    const newAnswers = { ...answers, [step.id]: multiSelections.join(', ') }
    setAnswers(newAnswers)
    setMultiSelections([])

    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      generateResult(newAnswers)
    }
  }

  const generateResult = (finalAnswers) => {
    setShowResult(true)
    const summary = Object.entries(finalAnswers)
      .map(([key, val]) => `${key.replace(/_/g, ' ')}: ${val}`)
      .join('\n')
    setAiResponses(prev => [...prev, {
      question: 'Consultation Summary',
      answer: summary
    }])
  }

  const getRecommendations = () => {
    if (category === 'scalp') return RECOMMENDATIONS.scalp.default
    const goalKey = answers[`${category}_goal`] || Object.keys(RECOMMENDATIONS[category])[0]
    return RECOMMENDATIONS[category][goalKey] || RECOMMENDATIONS[category][Object.keys(RECOMMENDATIONS[category])[0]]
  }

  const goBack = () => {
    if (showResult) {
      setShowResult(false)
      setCurrentStep(totalSteps - 1)
    } else if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    } else {
      navigate('/category')
    }
  }

  if (showResult) {
    const recs = getRecommendations()
    return (
      <div>
        <div className="header">
          <button className="btn-back" onClick={goBack}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1>Your Recommendations</h1>
            <p>Based on your consultation</p>
          </div>
          <Sparkles size={24} color="#C9A84C" />
        </div>

        <div className="page" style={{ paddingBottom: 120 }}>
          {/* Summary Cards */}
          <div className="card card-gold" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={20} color="#4CAF50" /> Consultation Complete
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(answers).map(([key, val]) => (
                <span key={key} style={{
                  background: '#f0ead6',
                  color: '#8B7635',
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}>
                  {val}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended Services */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, fontFamily: 'Playfair Display, serif' }}>
            ✨ Recommended For You
          </h3>
          <div className="service-list">
            {recs.map((svc, i) => (
              <div key={i} className="service-card" style={{ cursor: 'default' }}>
                <div style={{
                  width: 44, height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C9A84C, #A88B3D)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '0.9rem'
                }}>
                  {i + 1}
                </div>
                <div className="service-info">
                  <h4>{svc.name}</h4>
                  <p>⏱ {svc.time}</p>
                </div>
                <span className="service-price">{svc.price}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('/photo')}>
              <Camera size={18} /> Take Photo
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/services')}>
              Book Now <ChevronRight size={18} />
            </button>
          </div>

          <button
            className="btn btn-secondary"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/summary')}
          >
            View Full Summary
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <button className="btn-back" onClick={goBack}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1>{flow.title}</h1>
          <p>{flow.subtitle}</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/photo')}>
          <Camera size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ padding: '0 24px', paddingTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#C9A84C', fontWeight: 600 }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question & Options */}
      <div className="page" ref={contentRef} style={{ paddingTop: 16, paddingBottom: 120 }}>
        <h2 style={{
          fontSize: '1.3rem',
          marginBottom: 24,
          fontFamily: 'Playfair Display, serif',
          lineHeight: 1.4,
          animation: 'fadeIn 0.3s ease'
        }}>
          {step.question}
        </h2>

        {step.multiSelect && (
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 16 }}>
            Select all that apply, then tap Continue
          </p>
        )}

        <div className="option-grid">
          {step.options.map((option) => {
            const isSelected = step.multiSelect
              ? multiSelections.includes(option.value)
              : answers[step.id] === option.value

            return (
              <button
                key={option.value}
                className={`option-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option)}
              >
                <span className="option-emoji">{option.emoji}</span>
                <span className="option-label">{option.label}</span>
                {isSelected && <CheckCircle2 size={18} className="option-check" />}
              </button>
            )
          })}
        </div>

        {step.multiSelect && (
          <button
            className="btn btn-primary"
            style={{ marginTop: 24 }}
            onClick={handleMultiContinue}
            disabled={multiSelections.length === 0}
          >
            Continue <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
