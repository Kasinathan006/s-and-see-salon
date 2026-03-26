import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import { registerClient, searchClients } from '../utils/api'
import toast from 'react-hot-toast'

const REGIONS = [
  { value: '', label: 'Select your area' },
  { value: 'avadi', label: 'Avadi' },
  { value: 'ambattur', label: 'Ambattur' },
  { value: 'anna_nagar', label: 'Anna Nagar' },
  { value: 'mogappair', label: 'Mogappair' },
  { value: 'poonamallee', label: 'Poonamallee' },
  { value: 'thirumullaivoyal', label: 'Thirumullaivoyal' },
  { value: 'thirumangalam', label: 'Thirumangalam' },
  { value: 'koyambedu', label: 'Koyambedu' },
  { value: 'vadapalani', label: 'Vadapalani' },
  { value: 'porur', label: 'Porur' },
  { value: 'tambaram', label: 'Tambaram' },
  { value: 'chromepet', label: 'Chromepet' },
  { value: 'velachery', label: 'Velachery' },
  { value: 'adyar', label: 'Adyar' },
  { value: 't_nagar', label: 'T. Nagar' },
  { value: 'nungambakkam', label: 'Nungambakkam' },
  { value: 'mylapore', label: 'Mylapore' },
  { value: 'sholinganallur', label: 'Sholinganallur' },
  { value: 'omr', label: 'OMR' },
  { value: 'ecr', label: 'ECR' },
  { value: 'other', label: 'Other' },
]

export default function Register() {
  const navigate = useNavigate()
  const { setClient } = useClient()
  const [isNew, setIsNew] = useState(true)
  const [loading, setLoading] = useState(false)
  const [mobileError, setMobileError] = useState('')
  const [whatsappError, setWhatsappError] = useState('')
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'female',
    mobile: '',
    email: '',
    whatsapp: '',
    region: ''
  })

  // Only allow digits, max 10
  const handleMobileChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '') // strip non-digits
    if (raw.length <= 10) {
      setForm({ ...form, mobile: raw })
      if (raw.length > 0 && raw.length < 10) {
        setMobileError(`${10 - raw.length} more digit${10 - raw.length > 1 ? 's' : ''} needed`)
      } else if (raw.length === 10) {
        setMobileError('')
      } else {
        setMobileError('')
      }
    }
  }

  const handleWhatsappChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length <= 10) {
      setForm({ ...form, whatsapp: raw })
      if (raw.length > 0 && raw.length < 10) {
        setWhatsappError(`${10 - raw.length} more digit${10 - raw.length > 1 ? 's' : ''} needed`)
      } else {
        setWhatsappError('')
      }
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSameAsMobile = () => {
    setForm({ ...form, whatsapp: form.mobile })
    setWhatsappError('')
  }

  const formatDisplay = (num) => {
    if (!num) return ''
    if (num.length <= 5) return num
    return `${num.slice(0, 5)} ${num.slice(5)}`
  }

  const isMobileValid = form.mobile.length === 10
  const isWhatsappValid = form.whatsapp.length === 0 || form.whatsapp.length === 10

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!isMobileValid) {
      toast.error('Please enter a valid 10-digit mobile number')
      setMobileError('Must be exactly 10 digits')
      return
    }
    if (form.whatsapp && !isWhatsappValid) {
      toast.error('WhatsApp number must be 10 digits')
      setWhatsappError('Must be exactly 10 digits')
      return
    }
    if (!form.region) {
      toast.error('Please select your area')
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...form,
        mobile: `+91${form.mobile}`,
        whatsapp: form.whatsapp ? `+91${form.whatsapp}` : '',
        age: parseInt(form.age) || 0
      }
      const res = await registerClient(submitData)
      setClient(res.data)
      toast.success('Welcome to S & See Signature Salon!')
      navigate('/category')
    } catch {
      // For MVP demo, create local client
      const localClient = {
        id: Date.now().toString(),
        ...form,
        mobile: `+91${form.mobile}`,
        whatsapp: form.whatsapp ? `+91${form.whatsapp}` : '',
        age: parseInt(form.age) || 0,
        created_at: new Date().toISOString()
      }
      setClient(localClient)
      toast.success('Welcome to S & See Signature Salon!')
      navigate('/category')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (form.mobile.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number')
      setMobileError('Must be exactly 10 digits')
      return
    }
    setLoading(true)
    try {
      const res = await searchClients(`+91${form.mobile}`)
      if (res.data) {
        setClient(res.data)
        toast.success(`Welcome back, ${res.data.name}!`)
        navigate('/category')
      } else {
        toast.error('No client found. Please register.')
        setIsNew(true)
      }
    } catch {
      toast.error('Client not found. Please register as new.')
      setIsNew(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>{isNew ? 'New Client' : 'Welcome Back'}</h1>
          <p>Enter your details to get started</p>
        </div>
      </div>

      <div className="page" style={{ paddingBottom: 40 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            className={`btn btn-sm ${isNew ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setIsNew(true)}
            style={{ flex: 1 }}
          >
            New Client
          </button>
          <button
            className={`btn btn-sm ${!isNew ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setIsNew(false)}
            style={{ flex: 1 }}
          >
            Returning Client
          </button>
        </div>

        {!isNew ? (
          <div>
            <div className="form-group">
              <label>Mobile Number *</label>
              <div className="mobile-input-wrapper">
                <span className="mobile-prefix">+91</span>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="XXXXX XXXXX"
                  value={formatDisplay(form.mobile)}
                  onChange={handleMobileChange}
                  maxLength={11}
                  style={{ paddingLeft: 52 }}
                />
              </div>
              {mobileError && (
                <span className="field-error">
                  <AlertCircle size={14} /> {mobileError}
                </span>
              )}
              {isMobileValid && (
                <span className="field-success">✓ Valid number</span>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading || !isMobileValid}>
              {loading ? 'Searching...' : 'Find My Profile'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={form.age}
                  onChange={handleChange}
                  min="1"
                  max="120"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="kid_male">Kid (Boy)</option>
                  <option value="kid_female">Kid (Girl)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>
              <div className="mobile-input-wrapper">
                <span className="mobile-prefix">+91</span>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="XXXXX XXXXX"
                  value={formatDisplay(form.mobile)}
                  onChange={handleMobileChange}
                  maxLength={11}
                  required
                  style={{ paddingLeft: 52 }}
                />
              </div>
              {mobileError && (
                <span className="field-error">
                  <AlertCircle size={14} /> {mobileError}
                </span>
              )}
              {isMobileValid && (
                <span className="field-success">✓ Valid number</span>
              )}
              <div className="digit-counter">
                <span className={form.mobile.length === 10 ? 'count-done' : ''}>
                  {form.mobile.length}/10 digits
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>
                WhatsApp Number
                <button
                  type="button"
                  onClick={handleSameAsMobile}
                  style={{
                    marginLeft: 8,
                    fontSize: '0.75rem',
                    color: '#C9A84C',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Same as mobile
                </button>
              </label>
              <div className="mobile-input-wrapper">
                <span className="mobile-prefix">+91</span>
                <input
                  type="tel"
                  name="whatsapp"
                  placeholder="XXXXX XXXXX"
                  value={formatDisplay(form.whatsapp)}
                  onChange={handleWhatsappChange}
                  maxLength={11}
                  style={{ paddingLeft: 52 }}
                />
              </div>
              {whatsappError && (
                <span className="field-error">
                  <AlertCircle size={14} /> {whatsappError}
                </span>
              )}
            </div>

            {/* Region Selection */}
            <div className="form-group">
              <label>Area / Region *</label>
              <select name="region" value={form.region} onChange={handleChange} required>
                {REGIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !isMobileValid}
            >
              <UserPlus size={18} />
              {loading ? 'Registering...' : 'Start My Experience'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
