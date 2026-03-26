import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClient } from '../context/ClientContext'

const categories = [
  { id: 'hair', icon: '\u2702\uFE0F', label: 'Hair', desc: 'Cut, Color, Style, Treatment' },
  { id: 'skin', icon: '\u2728', label: 'Skin', desc: 'Facial, Glow, Anti-aging' },
  { id: 'scalp', icon: '\uD83E\uDDF4', label: 'Scalp', desc: 'Health, Dandruff, Growth' }
]

export default function CategorySelect() {
  const navigate = useNavigate()
  const { client, setConsultation } = useClient()
  const [selected, setSelected] = useState(null)

  const handleContinue = () => {
    if (!selected) return
    setConsultation({ category: selected, startedAt: new Date().toISOString() })
    navigate('/consultation')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="header shadow-sm">
        <div className="header-logo shadow-inner">S&S</div>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Welcome, {client?.name?.split(' ')[0] || 'Guest'}</h1>
          <p className="opacity-90">What brings you in today?</p>
        </div>
      </div>

      <div className="page max-w-lg mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-dark mb-2">Service Categories</h2>
          <p className="text-sm text-gray-500">
            Select a focus area to start your proprietary AI analysis.
          </p>
        </div>

        <div className="grid gap-4 mb-10">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`flex items-center gap-5 p-5 rounded-3xl border-2 transition-all cursor-pointer group
                ${selected === cat.id
                  ? 'border-gold bg-gold/5 shadow-md shadow-gold/10'
                  : 'border-gray-100 bg-gray-50/50 hover:border-gold-light hover:bg-white'}`}
              onClick={() => setSelected(cat.id)}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-110
                ${selected === cat.id ? 'bg-gold text-white' : 'bg-white'}`}>
                {cat.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-0.5 ${selected === cat.id ? 'text-dark' : 'text-gray-700'}`}>
                  {cat.label}
                </h3>
                <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
                  {cat.desc}
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                ${selected === cat.id ? 'border-gold bg-gold text-white' : 'border-gray-200'}`}>
                {selected === cat.id && <CheckCircle2 size={14} />}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <button
            className="btn btn-primary py-5 text-lg font-bold shadow-xl hover:shadow-gold/20 flex items-center justify-center gap-2 group"
            disabled={!selected}
            onClick={handleContinue}
          >
            Start Analysis
            <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
          </button>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Specialized for: Men • Women • Kids
          </p>
        </div>
      </div>
    </div>
  )
}
