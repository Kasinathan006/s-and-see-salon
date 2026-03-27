import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader, Search } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import { getServices } from '../utils/api'
import toast from 'react-hot-toast'

// Fallback data in case backend is unreachable
const FALLBACK = {
  hair: [
    // Classic Cuts
    { id: 'h1', name: 'Classic Haircut', description: 'Precision cut with styling', price: 300, duration: '30 min' },
    { id: 'h2', name: 'Kids Haircut', description: 'Fun & gentle haircut for children', price: 200, duration: '20 min' },
    
    // Modern & Trending Cuts
    { id: 'h3', name: 'Bob Cut', description: 'Chin-length classic bob style', price: 400, duration: '35 min' },
    { id: 'h4', name: 'Pixie Cut', description: 'Short, chic cropped style', price: 450, duration: '40 min' },
    { id: 'h5', name: 'Layer Cut', description: 'Multi-layer dimensional cut', price: 500, duration: '45 min' },
    { id: 'h6', name: 'Undercut', description: 'Modern fade with longer top', price: 400, duration: '35 min' },
    { id: 'h7', name: 'Fade Cut', description: 'Graduated fade with clean lines', price: 350, duration: '30 min' },
    { id: 'h8', name: 'Buzz Cut', description: 'Short uniform clipper cut', price: 250, duration: '20 min' },
    { id: 'h9', name: 'Crew Cut', description: 'Classic short men\'s cut', price: 300, duration: '25 min' },
    { id: 'h10', name: 'Textured Crop', description: 'Modern textured short style', price: 400, duration: '35 min' },
    { id: 'h11', name: 'Slick Back', description: 'Classic pomaded back style', price: 350, duration: '30 min' },
    { id: 'h12', name: 'Side Part', description: 'Clean professional parted style', price: 350, duration: '30 min' },
    { id: 'h13', name: 'French Crop', description: 'European style with fringe', price: 400, duration: '35 min' },
    { id: 'h14', name: 'Quiff', description: 'Voluminous swept-back style', price: 450, duration: '40 min' },
    { id: 'h15', name: 'Pompadour', description: 'Classic voluminous retro style', price: 500, duration: '45 min' },
    { id: 'h16', name: 'Comb Over', description: 'Sophisticated swept style', price: 400, duration: '35 min' },
    { id: 'h17', name: 'Man Bun', description: 'Long hair tied stylish bun', price: 300, duration: '25 min' },
    { id: 'h18', name: 'Top Knot', description: 'High bun with shaved sides', price: 350, duration: '30 min' },
    { id: 'h19', name: 'Afro', description: 'Natural textured volume style', price: 500, duration: '50 min' },
    { id: 'h20', name: 'Taper Fade', description: 'Gradual fade with tapered neck', price: 400, duration: '35 min' },
    { id: 'h21', name: 'Skin Fade', description: 'Fade to skin with sharp lines', price: 450, duration: '40 min' },
    
    // Asian Styles
    { id: 'h22', name: 'K-Pop Style', description: 'Korean inspired trendy cut', price: 600, duration: '50 min' },
    { id: 'h23', name: 'Two-Block Cut', description: 'Korean disconnected style', price: 550, duration: '45 min' },
    { id: 'h24', name: 'Mullet', description: 'Business front, party back', price: 450, duration: '40 min' },
    { id: 'h25', name: 'Wolf Cut', description: 'Layered shaggy modern style', price: 500, duration: '45 min' },
    { id: 'h26', name: 'Hime Cut', description: 'Japanese princess style with blunt bangs', price: 600, duration: '55 min' },
    { id: 'h27', name: 'Curtain Bangs', description: 'Face-framing parted fringe', price: 350, duration: '30 min' },
    
    // Braids & Special Styles
    { id: 'h28', name: 'Box Braids', description: 'Protective box braid style', price: 2500, duration: '180 min' },
    { id: 'h29', name: 'Cornrows', description: 'Traditional braided rows', price: 1500, duration: '120 min' },
    { id: 'h30', name: 'Dreadlocks', description: 'Natural loc formation & maintenance', price: 3000, duration: '240 min' },
    { id: 'h31', name: 'Fishtail Braid', description: 'Intricate fishtail styling', price: 600, duration: '45 min' },
    { id: 'h32', name: 'French Braid', description: 'Classic elegant braided style', price: 500, duration: '40 min' },
    { id: 'h33', name: 'Dutch Braid', description: 'Reverse French braid style', price: 550, duration: '45 min' },
    
    // Hair Color - Basic
    { id: 'h34', name: 'Hair Coloring', description: 'Premium color with ammonia-free products', price: 1500, duration: '90 min' },
    { id: 'h35', name: 'Hair Highlights', description: 'Partial or full highlights', price: 2000, duration: '90 min' },
    { id: 'h36', name: 'Balayage', description: 'Hand-painted natural gradient', price: 3500, duration: '120 min' },
    { id: 'h37', name: 'Ombre', description: 'Dramatic two-tone fade effect', price: 3000, duration: '120 min' },
    { id: 'h38', name: 'Root Touch-up', description: 'Color refresh for roots only', price: 800, duration: '45 min' },
    
    // Trending Colors
    { id: 'h39', name: 'Platinum Blonde', description: 'Ice blonde transformation', price: 4000, duration: '180 min' },
    { id: 'h40', name: 'Rose Gold', description: 'Pink-tinted metallic blonde', price: 3500, duration: '150 min' },
    { id: 'h41', name: 'Ash Brown', description: 'Cool-toned brown shade', price: 2000, duration: '90 min' },
    { id: 'h42', name: 'Caramel Highlights', description: 'Warm golden streaks', price: 2200, duration: '100 min' },
    { id: 'h43', name: 'Burgundy Red', description: 'Deep wine red color', price: 2500, duration: '120 min' },
    { id: 'h44', name: 'Copper Red', description: 'Warm copper tones', price: 2500, duration: '120 min' },
    { id: 'h45', name: 'Jet Black', description: 'Intense deep black', price: 1500, duration: '90 min' },
    { id: 'h46', name: 'Silver/Grey', description: 'Metallic grey transformation', price: 4500, duration: '180 min' },
    { id: 'h47', name: 'Pastel Colors', description: 'Pink, blue, lavender fantasy shades', price: 4000, duration: '180 min' },
    { id: 'h48', name: 'Neon Colors', description: 'Vivid electric color statements', price: 4500, duration: '200 min' },
    { id: 'h49', name: 'Money Piece', description: 'Face-framing highlight streaks', price: 1200, duration: '60 min' },
    { id: 'h50', name: 'Bronde', description: 'Brown-blonde hybrid shade', price: 2800, duration: '120 min' },
    { id: 'h51', name: 'Cherry Cola', description: 'Dark red-brown rich shade', price: 2500, duration: '120 min' },
    { id: 'h52', name: 'Honey Blonde', description: 'Warm golden blonde', price: 2500, duration: '120 min' },
    { id: 'h53', name: 'Smokey Blue', description: 'Muted blue-grey tone', price: 3500, duration: '150 min' },
    
    // Treatments
    { id: 'h54', name: 'Hair Spa Treatment', description: 'Deep conditioning & nourishment', price: 800, duration: '60 min' },
    { id: 'h55', name: 'Keratin Treatment', description: 'Smoothing & frizz control', price: 3500, duration: '120 min' },
    { id: 'h56', name: 'Hair Straightening', description: 'Permanent straightening treatment', price: 4000, duration: '150 min' },
    { id: 'h57', name: 'Hair Rebonding', description: 'Chemical straightening treatment', price: 4500, duration: '180 min' },
    { id: 'h58', name: 'Deep Conditioning', description: 'Intensive moisture treatment', price: 600, duration: '45 min' },
    { id: 'h59', name: 'Hot Oil Treatment', description: 'Nourishing oil therapy', price: 500, duration: '40 min' },
    { id: 'h60', name: 'Protein Treatment', description: 'Strengthening protein boost', price: 1200, duration: '60 min' },
    { id: 'h61', name: 'Botox Hair Treatment', description: 'Anti-aging for hair', price: 4000, duration: '120 min' },
    { id: 'h62', name: 'Perm/Permanent Waves', description: 'Long-lasting curl formation', price: 2500, duration: '150 min' },
    { id: 'h63', name: 'Digital Perm', description: 'Modern heat perm technology', price: 3500, duration: '180 min' },
    
    // Special Styling
    { id: 'h64', name: 'Bridal Hair Styling', description: 'Complete bridal hair package', price: 5000, duration: '120 min' },
    { id: 'h65', name: 'Event Styling', description: 'Party/Special occasion styling', price: 1500, duration: '60 min' },
    { id: 'h66', name: 'Blow Dry', description: 'Professional blowout styling', price: 500, duration: '30 min' },
    { id: 'h67', name: 'Beard Trim', description: 'Shape and style beard', price: 200, duration: '15 min' },
    { id: 'h68', name: 'Beard Coloring', description: 'Match or enhance beard color', price: 800, duration: '45 min' }
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
  const [searchQuery, setSearchQuery] = useState('')

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

  // Filter services based on search query
  const filteredServices = currentServices.filter(service => 
    searchQuery === '' || 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (service.desc && service.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
        {/* Search Bar */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{
            position: 'relative',
            marginBottom: 16,
          }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#888',
                zIndex: 1,
              }} 
            />
            <input
              type="text"
              placeholder="Search for hairstyles, treatments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                border: '1px solid #E8E8E8',
                borderRadius: 12,
                fontSize: '0.9rem',
                background: '#FAFAFA',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#C9A84C'
                e.target.style.background = 'white'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E8E8E8'
                e.target.style.background = '#FAFAFA'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '4px 8px',
                  borderRadius: 4,
                }}
                onMouseOver={(e) => e.target.style.background = '#F0F0F0'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                Clear
              </button>
            )}
          </div>
        </div>

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
            {filteredServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.3 }}>🔍</div>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>
                  {searchQuery ? `No results found for "${searchQuery}"` : 'No services available'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      marginTop: 12,
                      padding: '8px 16px',
                      background: '#C9A84C',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              filteredServices.map(service => (
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
              ))
            )}
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
