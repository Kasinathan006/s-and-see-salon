import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Home, MessageSquare, Calendar, BarChart3 } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import Welcome from './pages/Welcome'
import Register from './pages/Register'
import CategorySelect from './pages/CategorySelect'
import Consultation from './pages/Consultation'
import Services from './pages/Services'
import PhotoCapture from './pages/PhotoCapture'
import Summary from './pages/Summary'
import Dashboard from './pages/Dashboard'
import TreatmentTracker from './pages/TreatmentTracker'
import Feedback from './pages/Feedback'
import TVDisplay from './pages/TVDisplay'
import LiveHairColor from './pages/LiveHairColor'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const isTVMode = location.pathname === '/tv'
  const showNav = !['/tv', '/', '/register', '/live-hair'].includes(location.pathname)

  return (
    <div className={`app-container ${isTVMode ? 'tv-mode' : ''}`}>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/register" element={<Register />} />
        <Route path="/category" element={<CategorySelect />} />
        <Route path="/consultation" element={<Consultation />} />
        <Route path="/services" element={<Services />} />
        <Route path="/photo" element={<PhotoCapture />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/treatment" element={<TreatmentTracker />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/tv" element={<TVDisplay />} />
        <Route path="/live-hair" element={<LiveHairColor />} />
      </Routes>

      {showNav && (
        <nav className="bottom-nav">
          <button className={`nav-item ${location.pathname === '/category' ? 'active' : ''}`} onClick={() => navigate('/category')}>
            <Home size={20} />
            <span>Home</span>
          </button>
          <button className={`nav-item ${location.pathname === '/consultation' ? 'active' : ''}`} onClick={() => navigate('/consultation')}>
            <MessageSquare size={20} />
            <span>Consult</span>
          </button>
          <button className={`nav-item ${location.pathname === '/treatment' ? 'active' : ''}`} onClick={() => navigate('/treatment')}>
            <Calendar size={20} />
            <span>Track</span>
          </button>
          <button className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>
        </nav>
      )}
    </div>
  )
}

export default App
