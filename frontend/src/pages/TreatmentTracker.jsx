import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Calendar, MessageCircle, CheckCircle2 } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import toast from 'react-hot-toast'

const DEMO_TREATMENT = {
  name: '4-Week Hair Restoration Program',
  totalWeeks: 4,
  currentWeek: 2,
  sessions: [
    { week: 1, date: '2026-03-18', status: 'completed', notes: 'Initial deep conditioning treatment. Scalp analysis done.' },
    { week: 2, date: '2026-03-25', status: 'current', notes: 'Protein treatment & keratin boost. Progress visible.' },
    { week: 3, date: '2026-04-01', status: 'upcoming', notes: 'Intensive repair session scheduled.' },
    { week: 4, date: '2026-04-08', status: 'upcoming', notes: 'Final treatment & assessment.' }
  ]
}

export default function TreatmentTracker() {
  const navigate = useNavigate()
  const { client } = useClient()
  const [treatment] = useState(DEMO_TREATMENT)
  const [showBooking, setShowBooking] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('10:00')

  const progress = (treatment.currentWeek / treatment.totalWeeks) * 100

  const handleBookAppointment = () => {
    if (!bookingDate) {
      toast.error('Please select a date')
      return
    }
    toast.success(`Appointment booked for ${bookingDate} at ${bookingTime}`)
    setShowBooking(false)
  }

  const handleSendReminder = () => {
    toast.success('WhatsApp reminder sent!')
  }

  return (
    <div>
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/category')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Treatment Tracker</h1>
          <p>Track your treatment progress</p>
        </div>
      </div>

      <div className="page" style={{ paddingBottom: 100 }}>
        {/* Treatment Overview */}
        <div className="card card-gold">
          <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{treatment.name}</h3>
          <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 12 }}>
            Week {treatment.currentWeek} of {treatment.totalWeeks}
          </p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#A88B3D', marginTop: 4 }}>{progress}% Complete</p>
        </div>

        {/* Timeline */}
        <h3 style={{ fontSize: '1rem', margin: '24px 0 16px' }}>Treatment Timeline</h3>
        <div className="timeline">
          {treatment.sessions.map((session) => (
            <div key={session.week} className="timeline-item">
              <div className={`timeline-dot ${session.status}`} />
              <div className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong style={{ fontSize: '0.9rem' }}>Week {session.week}</strong>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: session.status === 'completed' ? '#E8F5E9' : session.status === 'current' ? '#FFF8E1' : '#F5F5F5',
                    color: session.status === 'completed' ? '#4CAF50' : session.status === 'current' ? '#F9A825' : '#888'
                  }}>
                    {session.status === 'completed' ? 'Completed' : session.status === 'current' ? 'This Week' : 'Upcoming'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>{session.date}</p>
                <p style={{ fontSize: '0.85rem', marginTop: 4 }}>{session.notes}</p>
                {session.status === 'current' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => toast.success('Session confirmed!')}>
                      <CheckCircle2 size={14} /> Confirm
                    </button>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => navigate('/consultation')}>
                      <MessageCircle size={14} /> Ask AI
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <button className="btn btn-primary" onClick={() => setShowBooking(!showBooking)}>
            <Calendar size={18} /> Book Next Appointment
          </button>

          {showBooking && (
            <div className="card">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Time</label>
                <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}>
                  {['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleBookAppointment}>
                Confirm Booking
              </button>
            </div>
          )}

          <button className="btn btn-outline" onClick={handleSendReminder}>
            <Bell size={18} /> Send WhatsApp Reminder
          </button>
        </div>
      </div>
    </div>
  )
}
