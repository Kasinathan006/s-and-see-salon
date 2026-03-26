import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import toast from 'react-hot-toast'

const SERVICES = {
  hair: [
    { id: 'h1', name: 'Classic Haircut', desc: 'Precision cut with styling', price: 300, duration: '30 min' },
    { id: 'h2', name: 'Hair Coloring', desc: 'Premium color with ammonia-free products', price: 1500, duration: '90 min' },
    { id: 'h3', name: 'Hair Spa Treatment', desc: 'Deep conditioning & nourishment', price: 800, duration: '60 min' },
    { id: 'h4', name: 'Keratin Treatment', desc: 'Smoothing & frizz control', price: 3500, duration: '120 min' },
    { id: 'h5', name: 'Hair Straightening', desc: 'Permanent straightening treatment', price: 4000, duration: '150 min' },
    { id: 'h6', name: 'Bridal Hair Styling', desc: 'Complete bridal hair package', price: 5000, duration: '120 min' },
    { id: 'h7', name: 'Kids Haircut', desc: 'Fun & gentle haircut for children', price: 200, duration: '20 min' },
    { id: 'h8', name: 'Hair Highlights', desc: 'Partial or full highlights', price: 2000, duration: '90 min' }
  ],
  skin: [
    { id: 's1', name: 'Classic Facial', desc: 'Deep cleansing & hydration', price: 500, duration: '45 min' },
    { id: 's2', name: 'Gold Facial', desc: 'Premium gold-infused treatment', price: 1200, duration: '60 min' },
    { id: 's3', name: 'Anti-Aging Treatment', desc: 'Wrinkle reduction & firming', price: 2000, duration: '75 min' },
    { id: 's4', name: 'Acne Treatment', desc: 'Targeted acne care & prevention', price: 800, duration: '45 min' },
    { id: 's5', name: 'Skin Brightening', desc: 'Pigmentation & dullness correction', price: 1500, duration: '60 min' },
    { id: 's6', name: 'Chemical Peel', desc: 'Professional exfoliation treatment', price: 1800, duration: '45 min' },
    { id: 's7', name: 'De-Tan Treatment', desc: 'Sun damage repair & even tone', price: 700, duration: '40 min' }
  ],
  scalp: [
    { id: 'sc1', name: 'Scalp Analysis', desc: 'Detailed scalp health assessment', price: 300, duration: '20 min' },
    { id: 'sc2', name: 'Anti-Dandruff Treatment', desc: 'Medicated dandruff solution', price: 600, duration: '45 min' },
    { id: 'sc3', name: 'Hair Fall Treatment', desc: 'Root strengthening therapy', price: 1200, duration: '60 min' },
    { id: 'sc4', name: 'Scalp Detox', desc: 'Deep cleansing & purification', price: 800, duration: '45 min' },
    { id: 'sc5', name: 'PRP-like Scalp Therapy', desc: 'Growth stimulation treatment', price: 2500, duration: '60 min' },
    { id: 'sc6', name: 'Scalp Massage Therapy', desc: 'Relaxation & blood circulation boost', price: 400, duration: '30 min' }
  ]
}

export default function Services() {
  const navigate = useNavigate()
  const { consultation, selectedServices, setSelectedServices } = useClient()
  const category = consultation?.category || 'hair'
  const [activeTab, setActiveTab] = useState(category)

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id)
      if (exists) return prev.filter(s => s.id !== service.id)
      return [...prev, service]
    })
  }

  const total = selectedServices.reduce((sum, s) => sum + s.price, 0)

  return (
    <div>
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/consultation')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Our Services</h1>
          <p>Select the services you're interested in</p>
        </div>
      </div>

      <div className="page" style={{ paddingBottom: 120 }}>
        <div className="tab-bar">
          {Object.keys(SERVICES).map(cat => (
            <button
              key={cat}
              className={`tab ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="service-list">
          {SERVICES[activeTab].map(service => (
            <div
              key={service.id}
              className={`service-card ${selectedServices.find(s => s.id === service.id) ? 'selected' : ''}`}
              onClick={() => toggleService(service)}
            >
              <div className="service-check">
                {selectedServices.find(s => s.id === service.id) && <Check size={14} />}
              </div>
              <div className="service-info">
                <h4>{service.name}</h4>
                <p>{service.desc} - {service.duration}</p>
              </div>
              <div className="service-price">&#8377;{service.price}</div>
            </div>
          ))}
        </div>

        {selectedServices.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 432,
            padding: '16px 24px',
            background: 'white',
            borderTop: '1px solid #E8E8E8',
            zIndex: 50
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>{selectedServices.length} service(s) selected</span>
              <strong>&#8377;{total}</strong>
            </div>
            <button className="btn btn-primary" onClick={() => {
              toast.success('Services selected!')
              navigate('/photo')
            }}>
              Continue to Visualization
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
