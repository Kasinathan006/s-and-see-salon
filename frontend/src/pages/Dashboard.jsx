import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, TrendingUp, Star, Calendar } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()

  const stats = [
    { label: 'Total Clients', value: '847', icon: Users },
    { label: 'This Week', value: '52', icon: TrendingUp },
    { label: 'Avg Rating', value: '4.8', icon: Star },
    { label: 'Appointments', value: '12', icon: Calendar }
  ]

  const recentClients = [
    { name: 'Priya S.', service: 'Hair Coloring', time: '2 hrs ago', amount: 1500 },
    { name: 'Karthik R.', service: 'Classic Haircut', time: '3 hrs ago', amount: 300 },
    { name: 'Meena V.', service: 'Gold Facial', time: '5 hrs ago', amount: 1200 },
    { name: 'Arjun K.', service: 'Scalp Treatment', time: 'Yesterday', amount: 600 }
  ]

  return (
    <div>
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/category')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Dashboard</h1>
          <p>Salon analytics & overview</p>
        </div>
      </div>

      <div className="page" style={{ paddingBottom: 100 }}>
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <stat.icon size={24} color="#A88B3D" style={{ marginBottom: 8 }} />
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '1rem', margin: '24px 0 12px' }}>Recent Clients</h3>
        {recentClients.map((c, i) => (
          <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>{c.name}</strong>
              <p style={{ fontSize: '0.8rem', color: '#888' }}>{c.service}</p>
              <p style={{ fontSize: '0.75rem', color: '#aaa' }}>{c.time}</p>
            </div>
            <strong style={{ color: '#A88B3D' }}>&#8377;{c.amount}</strong>
          </div>
        ))}

        <h3 style={{ fontSize: '1rem', margin: '24px 0 12px' }}>Popular Services</h3>
        {[
          { name: 'Classic Haircut', count: 156, pct: 85 },
          { name: 'Gold Facial', count: 98, pct: 65 },
          { name: 'Hair Coloring', count: 87, pct: 55 },
          { name: 'Scalp Treatment', count: 64, pct: 40 }
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
              <span>{s.name}</span>
              <span style={{ color: '#888' }}>{s.count} bookings</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
