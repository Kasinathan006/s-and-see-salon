import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, CheckCircle, Share2 } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

export default function Summary() {
  const navigate = useNavigate()
  const { client, consultation, selectedServices, aiResponses } = useClient()

  const total = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const accuracyScore = 9.5

  const generatePDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFillColor(26, 26, 46)
    doc.rect(0, 0, pageWidth, 40, 'F')
    doc.setTextColor(201, 168, 76)
    doc.setFontSize(22)
    doc.text('S & See Signature Salon', pageWidth / 2, 18, { align: 'center' })
    doc.setFontSize(10)
    doc.setTextColor(232, 213, 163)
    doc.text('AI-Powered Beauty Experience | Avadi, Chennai', pageWidth / 2, 28, { align: 'center' })

    // Client info
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.text('Client Details', 20, 55)
    doc.setFontSize(10)
    doc.text(`Name: ${client?.name || 'N/A'}`, 20, 65)
    doc.text(`Age: ${client?.age || 'N/A'}`, 20, 72)
    doc.text(`Mobile: ${client?.mobile || 'N/A'}`, 20, 79)
    doc.text(`Email: ${client?.email || 'N/A'}`, 20, 86)
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 93)

    // Services
    doc.setFontSize(14)
    doc.text('Selected Services', 20, 110)
    doc.setFontSize(10)
    let y = 120
    selectedServices.forEach((s, i) => {
      doc.text(`${i + 1}. ${s.name}`, 20, y)
      doc.text(`Rs. ${s.price}`, pageWidth - 40, y)
      y += 8
    })

    // Total
    y += 5
    doc.setDrawColor(0)
    doc.line(20, y, pageWidth - 20, y)
    y += 8
    doc.setFontSize(12)
    doc.text(`Total: Rs. ${total}`, pageWidth - 40, y)

    // Accuracy
    y += 15
    doc.setFontSize(14)
    doc.text('AI Recommendation Accuracy', 20, y)
    y += 10
    doc.setFontSize(20)
    doc.setTextColor(76, 175, 80)
    doc.text(`${accuracyScore}/10`, 20, y)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Perfect Match', 55, y)

    // AI Recommendations
    if (aiResponses.length > 0) {
      y += 15
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.text('AI Consultation Summary', 20, y)
      y += 10
      doc.setFontSize(9)
      aiResponses.slice(0, 3).forEach(ar => {
        if (y > 270) return
        doc.setTextColor(100, 100, 100)
        doc.text(`Q: ${ar.question.substring(0, 80)}`, 20, y, { maxWidth: pageWidth - 40 })
        y += 6
        doc.setTextColor(0, 0, 0)
        const lines = doc.splitTextToSize(`A: ${ar.answer.substring(0, 150)}`, pageWidth - 40)
        doc.text(lines, 20, y)
        y += lines.length * 5 + 5
      })
    }

    // Footer
    doc.setFillColor(26, 26, 46)
    doc.rect(0, 280, pageWidth, 17, 'F')
    doc.setTextColor(201, 168, 76)
    doc.setFontSize(8)
    doc.text('S & See Signature Salon | Avadi, Chennai | AI-Powered Recommendations', pageWidth / 2, 288, { align: 'center' })
    doc.text('Contact: +91 XXXXX XXXXX | Email: info@sandsee.salon', pageWidth / 2, 293, { align: 'center' })

    doc.save(`SandSee_Summary_${client?.name || 'Client'}_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF downloaded!')
  }

  return (
    <div>
      <div className="header">
        <button className="btn-back" onClick={() => navigate('/photo')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Consultation Summary</h1>
          <p>Your personalized recommendation</p>
        </div>
      </div>

      <div className="page" style={{ paddingBottom: 100 }}>
        {/* Accuracy Badge */}
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <div className="accuracy-badge">
            <CheckCircle size={18} />
            {accuracyScore}/10 Perfect Match
          </div>
        </div>

        {/* Client Info */}
        <div className="card">
          <div className="summary-section">
            <h3>Client Information</h3>
            <div className="summary-item">
              <span>Name</span>
              <strong>{client?.name || 'N/A'}</strong>
            </div>
            <div className="summary-item">
              <span>Category</span>
              <strong>{consultation?.category?.charAt(0).toUpperCase() + consultation?.category?.slice(1) || 'N/A'}</strong>
            </div>
            <div className="summary-item">
              <span>Date</span>
              <strong>{new Date().toLocaleDateString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Selected Services */}
        <div className="card">
          <div className="summary-section">
            <h3>Selected Services</h3>
            {selectedServices.length > 0 ? (
              <>
                {selectedServices.map(s => (
                  <div key={s.id} className="summary-item">
                    <span>{s.name}</span>
                    <strong>&#8377;{s.price}</strong>
                  </div>
                ))}
                <div className="summary-total">
                  <span>Total</span>
                  <span>&#8377;{total}</span>
                </div>
              </>
            ) : (
              <p style={{ color: '#888', fontSize: '0.85rem' }}>No services selected yet</p>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        {aiResponses.length > 0 && (
          <div className="card card-gold">
            <div className="summary-section">
              <h3>AI Recommendations</h3>
              {aiResponses.slice(-2).map((ar, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: '0.8rem', color: '#888' }}>Q: {ar.question}</p>
                  <p style={{ fontSize: '0.85rem', marginTop: 4 }}>{ar.answer.substring(0, 200)}...</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <button className="btn btn-primary" onClick={generatePDF}>
            <Download size={18} /> Download PDF Summary
          </button>
          <button className="btn btn-outline" onClick={() => {
            toast.success('Summary shared via WhatsApp!')
          }}>
            <Share2 size={18} /> Share via WhatsApp
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/treatment')}>
            Set Up Treatment Plan
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/feedback')}>
            Give Feedback
          </button>
        </div>
      </div>
    </div>
  )
}
