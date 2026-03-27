import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Clock, AlertCircle, Loader, Sparkles } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import { getClientTreatmentPlan, updateTreatmentProgress } from '../utils/api'
import toast from 'react-hot-toast'

export default function TreatmentTracker() {
  const navigate = useNavigate()
  const { client } = useClient()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [sessions, setSessions] = useState([])
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchProgress = async () => {
      if (!client?.id) {
        setLoading(false)
        return
      }
      try {
        const res = await getClientTreatmentPlan(client.id)
        setPlan(res.data.plan)
        setSessions(res.data.sessions)
      } catch (err) {
        console.error('Treatment fetch error:', err)
        toast.error('Could not load treatment plan')
      } finally {
        setLoading(false)
      }
    }
    fetchProgress()
  }, [client])

  const markComplete = async (week) => {
    if (!plan) return
    setUpdating(true)
    try {
      await updateTreatmentProgress(plan.id, {
        current_week: week,
        session_status: 'completed'
      })
      // Refresh data
      const res = await getClientTreatmentPlan(client.id)
      setPlan(res.data.plan)
      setSessions(res.data.sessions)
      toast.success(`Week ${week} marked as complete!`)
    } catch (err) {
      toast.error('Failed to update progress')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader size={32} className="spin" color="#C9A84C" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="page">
        <div className="header">
          <button className="btn-back" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
          <h1>No Active Client</h1>
        </div>
        <p style={{ marginTop: 40, textAlign: 'center', color: '#888' }}>Please register or login first.</p>
        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/')}>Go Home</button>
      </div>
    )
  }

  const currentWeek = plan?.current_week || 1

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="header shadow-sm">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Treatment Tracker</h1>
          <p className="opacity-90">{plan?.name || 'Your Journey'}</p>
        </div>
      </div>

      <div className="page max-w-lg mx-auto">
        {/* Progress Overview */}
        <div className="card card-gold mb-8 transform hover:scale-[1.01] transition-transform">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-xs font-bold text-gold-dark uppercase tracking-wider block mb-1">Overall Progress</span>
              <h2 className="text-3xl font-bold text-dark">{Math.round((currentWeek / (plan?.total_weeks || 1)) * 100)}%</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 block mb-1">Status</span>
              <span className="badge badge-primary font-bold">Active</span>
            </div>
          </div>

          <div className="progress-bar h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="progress-fill h-full bg-gradient-to-r from-gold to-gold-dark shadow-lg transition-all duration-1000"
              style={{ width: `${(currentWeek / (plan?.total_weeks || 1)) * 100}%` }}
            />
          </div>
          <p className="text-xs text-center text-gray-500 mt-4 italic">
            "Every step brings you closer to your signature look."
          </p>
        </div>

        {/* Sessions Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-dark">Schedule</h3>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {sessions.length} Planned Sessions
            </span>
          </div>

          <div className="timeline relative border-l-2 border-gray-200 ml-4 pl-8 space-y-8">
            {sessions.map((session, index) => {
              const isCompleted = session.status === 'completed' || session.week < currentWeek
              const isCurrent = session.week === currentWeek
              const isLocked = session.week > currentWeek

              return (
                <div key={session.id || index} className={`relative transition-all duration-300
                  ${isLocked ? 'opacity-60 grayscale-[0.5]' : ''}`}>

                  {/* Timeline Dot */}
                  <div className={`absolute -left-11 top-1 w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all bg-white
                    ${isCompleted ? 'border-success bg-white scale-110' : isCurrent ? 'border-gold scale-125' : 'border-gray-200'}`}>
                    {isCompleted ? <CheckCircle2 size={12} className="text-success" /> : null}
                  </div>

                  {/* Session Card */}
                  <div className={`card p-5 border-2 transition-all hover:shadow-md
                    ${isCurrent ? 'border-gold ring-4 ring-gold/5 bg-white' : 'border-transparent bg-white shadow-sm'}`}>

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-dark text-lg">Session {session.week}</h4>
                        <p className="text-xs font-semibold text-gold-dark uppercase tracking-wide">
                          {isCurrent ? 'Current Focus' : 'Phase ' + session.week}
                        </p>
                      </div>
                      <span className={`badge ${isCompleted ? 'badge-success' : isCurrent ? 'badge-primary' : 'badge-secondary'}`}>
                        {isCompleted ? 'Done' : isCurrent ? 'Today' : 'Upcoming'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {session.notes || `Advanced ${plan?.category} treatment targeting specific concerns identified in your AI profile.`}
                    </p>

                    {isCurrent && (
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <button
                          className="btn btn-primary shadow-lg hover:shadow-gold/20 flex items-center justify-center gap-2 group"
                          onClick={() => markComplete(session.week)}
                          disabled={updating}
                        >
                          {updating ? <Loader size={18} className="spin" /> : (
                            <>
                              Complete Session
                              <CheckCircle2 size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tip Box */}
        <div className="mt-12 bg-white rounded-3xl p-6 shadow-sm border border-gold/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-12 -mt-12" />
          <div className="flex gap-4 relative z-10">
            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center shrink-0">
              <Sparkles size={24} className="text-gold" />
            </div>
            <div>
              <h4 className="font-bold text-dark mb-1">Pro Tip for Results</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                Drinking plenty of water and following the post-treatment care routine strictly will help your results last 30% longer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
