import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import { registerClient, searchClients } from '../utils/api'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { setClient } = useClient()
  const [isNew, setIsNew] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'female',
    mobile: '',
    email: '',
    whatsapp: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSameAsMobile = () => {
    setForm({ ...form, whatsapp: form.mobile })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.mobile) {
      toast.error('Name and mobile number are required')
      return
    }
    setLoading(true)
    try {
      const res = await registerClient({
        ...form,
        age: parseInt(form.age) || 0
      })
      setClient(res.data)
      toast.success('Welcome to S & See Signature Salon!')
      navigate('/category')
    } catch (err) {
      // For MVP demo, create local client
      const localClient = {
        id: Date.now().toString(),
        ...form,
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
    if (!form.mobile) {
      toast.error('Enter mobile number to search')
      return
    }
    setLoading(true)
    try {
      const res = await searchClients(form.mobile)
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
              <label>Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                placeholder="Enter your mobile number"
                value={form.mobile}
                onChange={handleChange}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
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
              <input
                type="tel"
                name="mobile"
                placeholder="+91 XXXXX XXXXX"
                value={form.mobile}
                onChange={handleChange}
                required
              />
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
              <input
                type="tel"
                name="whatsapp"
                placeholder="+91 XXXXX XXXXX"
                value={form.whatsapp}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <UserPlus size={18} />
              {loading ? 'Registering...' : 'Start My Experience'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
