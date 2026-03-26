import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import { getServices } from '../utils/api'
import toast from 'react-hot-toast'

// Fallback data in case backend is unreachable
const FALLBACK = {
  hair: [
    { id: 'h1', name: 'Classic Haircut', description: 'Precision cut with styling', price: 300, duration: '30 min' },
    { id: 'h2', name: 'Hair Coloring', description: 'Premium color with ammonia-free products', price: 1500, duration: '90 min' },
    { id: 'h3', name: 'Hair Spa Treatment', description: 'Deep conditioning & nourishment', price: 800, duration: '60 min' },
    { id: 'h4', name: 'Keratin Treatment', description: 'Smoothing & frizz control', price: 3500, duration: '120 min' },
    { id: 'h5', name: 'Hair Straightening', description: 'Permanent straightening treatment', price: 4000, duration: '150 min' },
    { id: 'h6', name: 'Bridal Hair Styling', description: 'Complete bridal hair package', price: 5000, duration: '120 min' },
    { id: 'h7', name: 'Kids Haircut', description: 'Fun & gentle haircut for children', price: 200, duration: '20 min' },
    { id: 'h8', name: 'Hair Highlights', description: 'Partial or full highlights', price: 2000, duration: '90 min' }
  ],
  skin: [
    { id: 's1', name: 'Classic Facial', description: 'Deep cleansing & hydration', price: 500, duration: '45 min' },
    { id: 's2', name: 'Gold Facial', description: 'Premium gold-infused treatment', price: 1200, duration: '60 min' },
    { id: 's3', name: 'Anti-Aging Treatment', description: 'Wrinkle reduction & firming', price: 2000, duration: '75 min' },
    { id: 's4', name: 'Acne Treatment', description: 'Targeted acne care & prevention', price: 800, duration: '45 min' },
    { id: 's5', name: 'Skin Brightening', description: 'Pigmentation & dullness correction', price: 1500, duration: '60 min' },
    { id: 's6', name: 'De-Tan Treatment', description: 'Sun damage repair & even tone', price: 700, duration: '40 min' }
  ],
  scalp: [
    { id: 'sc1', name: 'Scalp Analysis', description: 'Detailed scalp health assessment', price: 300, duration: '20 min' },
    { id: 'sc2', name: 'Anti-Dandruff Treatment', description: 'Medicated dandruff solution', price: 600, duration: '45 min' },
    { id: 'sc3', name: 'Hair Fall Treatment', description: 'Root strengthening therapy', price: 1200, duration: '60 min' },
    { id: 'sc4', name: 'Scalp Detox', description: 'Deep cleansing & purification', price: 800, duration: '45 min' },
    { id: 'sc5', name: 'Scalp Massage Therapy', description: 'Relaxation & blood circulation boost', price: 400, duration: '30 min' }
  ]
}

export default function Services() {
  const navigate = useNavigate()
  const { consultation, selectedServices, setSelectedServices } = useClient()
  const category = consultation?.category || 'hair'
  const [activeTab, setActiveTab] = useState(category)
  const [services, setServices] = useState({})
  const [loading, setLoading] = useState(true)

  // Fetch services from backend
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [hairRes, skinRes, scalpRes] = await Promise.all([
          getServices('hair'),
          getServices('skin'),
          getServices('scalp')
        ])
        setServices({
          hair: hairRes.data.length > 0 ? hairRes.data : FALLBACK.hair,
          skin: skinRes.data.length > 0 ? skinRes.data : FALLBACK.skin,
          scalp: scalpRes.data.length > 0 ? scalpRes.data : FALLBACK.scalp
        })
      } catch {
        // Backend unreachable, use fallback
        setServices(FALLBACK)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id)
      if (exists) return prev.filter(s => s.id !== service.id)
      return [...prev, service]
    })
  }

  const total = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const currentServices = services[activeTab] || []

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
          {['hair', 'skin', 'scalp'].map(cat => (
            <button
              key={cat}
              className={`tab ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader size={32} className="spin" />
            <p style={{ marginTop: 12, color: '#888' }}>Loading services...</p>
          </div>
        ) : (
          <div className="service-list">
            {currentServices.map(service => (
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
                  <p>{service.description || service.desc} - {service.duration}</p>
                </div>
                <div className="service-price">&#8377;{service.price}</div>
              </div>
            ))}
          </div>
        )}

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
