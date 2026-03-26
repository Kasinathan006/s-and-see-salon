import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Video, Send } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import toast from 'react-hot-toast'
import { submitFeedback } from '../utils/api'

export default function Feedback() {
  const navigate = useNavigate()
  const { client, consultation } = useClient()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      if (client?.id) {
        await submitFeedback({
          client_id: client.id,
          consultation_id: consultation?.id || null,
          rating: rating,
          feedback_text: text
        })
      }
      setSubmitted(true)
      toast.success('Thank you for your feedback!')
    } catch (err) {
      toast.error('Could not save to server. Thank you anyway!')
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div>
        <div className="header">
          <div className="header-logo">S&S</div>
          <div>
            <h1>Thank You!</h1>
            <p>Your feedback means the world to us</p>
          </div>
        </div>
        <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: '4rem', marginBottom: 24 }}>&#x1F49B;</div>
          <h2 style={{ marginBottom: 8 }}>Feedback Submitted</h2>
          <p style={{ color: '#888', marginBottom: 32 }}>
            We appreciate you taking the time to share your experience at S & See Signature Salon.
          </p>
          <button className="btn btn-primary" style={{ maxWidth: 300, margin: '0 auto' }} onClick={() => navigate('/category')}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/summary')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Your Feedback</h1>
          <p>Help us improve your experience</p>
        </div>
      </div>

      <div className="page" style={{ paddingBottom: 100 }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Rate Your Experience</h3>
          <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 16 }}>
            How was your visit to S & See Signature Salon?
          </p>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map(i => (
              <span
                key={i}
                className={`star ${i <= rating ? 'active' : ''}`}
                onClick={() => setRating(i)}
              >
                <Star size={32} fill={i <= rating ? '#C9A84C' : 'none'} />
              </span>
            ))}
          </div>
          {rating > 0 && (
            <p style={{ fontSize: '0.85rem', color: '#A88B3D', marginTop: 4 }}>
              {rating <= 2 ? 'We\'re sorry to hear that. Please tell us how we can improve.' :
                rating <= 4 ? 'Thank you! We\'d love to know what we can do better.' :
                  'Wonderful! We\'re thrilled you had a great experience!'}
            </p>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Share Your Thoughts</h3>
          <div className="form-group">
            <textarea
              placeholder="Tell us about your experience..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Video Feedback</h3>
          <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 12 }}>
            Record a short video testimonial (optional)
          </p>
          <button className="btn btn-outline btn-sm" onClick={() => toast('Video recording coming soon!')}>
            <Video size={16} /> Record Video
          </button>
        </div>

        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleSubmit}>
          <Send size={18} /> Submit Feedback
        </button>
      </div>
    </div>
  )
}
