import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, TrendingUp, Star, Calendar, Loader, Monitor } from 'lucide-react'
import { getStats } from '../utils/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getStats()
        setData(res.data)
      } catch (err) {
        console.error('Stats error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader size={32} className="spin" color="#C9A84C" />
      </div>
    )
  }

  const iconMap = {
    Users: Users,
    TrendingUp: TrendingUp,
    Star: Star,
    Calendar: Calendar
  }

  const stats = data?.stats || []
  const recentClients = data?.recentClients || []
  const popularServices = data?.popularServices || []

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="header sticky top-0 z-50 shadow-sm">
        <button className="btn-back" onClick={() => navigate('/category')}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Manager Hub</h1>
          <p className="opacity-90">Salon performance & insights</p>
        </div>
        <button
          className="btn-back bg-gold/10 hover:bg-gold/20 text-gold"
          onClick={() => navigate('/tv')}
          title="View on TV"
          style={{ padding: '8px 12px', borderRadius: '10px' }}
        >
          <Monitor size={20} />
        </button>
      </div>

      <div className="page max-w-lg mx-auto">
        {/* Performance Overview */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Performance Overview</h3>
          <div className="stats-grid">
            {stats.map((stat, i) => {
              const Icon = iconMap[stat.icon] || Users
              return (
                <div key={i} className="stat-card group hover:border-gold transition-all cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon size={20} className="text-gold-dark" />
                  </div>
                  <div className="stat-value text-2xl font-bold text-dark">{stat.value}</div>
                  <div className="stat-label text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Popular Services Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest m-0">Top Performing Services</h3>
            <TrendingUp size={14} className="text-gold" />
          </div>
          <div className="card p-5 space-y-5 shadow-sm">
            {popularServices.map((s, i) => (
              <div key={i} className="relative">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-bold text-dark">{s.name}</span>
                  <span className="text-xs font-semibold text-gold-dark">{s.count} sessions</span>
                </div>
                <div className="progress-bar h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="progress-fill h-full bg-gradient-to-r from-gold to-gold-dark rounded-full"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Client Activity */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest m-0">Recent Client Activity</h3>
            <Users size={14} className="text-gold" />
          </div>
          <div className="space-y-3">
            {recentClients.length > 0 ? recentClients.map((c, i) => (
              <div key={i} className="card p-4 hover:shadow-md transition-shadow border-transparent hover:border-gold/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-dark text-sm border-2 border-white shadow-inner">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-dark text-sm mb-0.5">{c.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-gold/10 text-gold-dark px-1.5 py-0.5 rounded font-bold uppercase">{c.service}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{c.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-dark">&#8377;{c.amount}</div>
                  <div className="text-[9px] text-success font-bold uppercase tracking-tight">Paid</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-xs text-gray-400 font-medium">No activity to report yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
