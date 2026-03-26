import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, RotateCcw, Monitor } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import toast from 'react-hot-toast'

export default function PhotoCapture() {
  const navigate = useNavigate()
  const { setCapturedPhoto, consultation } = useClient()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setStream(mediaStream)
      setCameraActive(true)
    } catch {
      toast.error('Camera access denied. Please allow camera permissions.')
    }
  }, [])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setPhoto(dataUrl)
    setCapturedPhoto(dataUrl)
    stopCamera()
    toast.success('Photo captured!')
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraActive(false)
  }

  const retake = () => {
    setPhoto(null)
    startCamera()
  }

  const category = consultation?.category || 'hair'

  return (
    <div>
      <div className="header">
        <button className="btn-back" onClick={() => { stopCamera(); navigate('/consultation'); }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1>Photo Capture</h1>
          <p>Capture your photo for AI visualization</p>
        </div>
        <button className="btn-back" onClick={() => window.open('/tv', '_blank')}>
          <Monitor size={20} />
        </button>
      </div>

      <div className="page">
        <div className="photo-area">
          {photo ? (
            <img src={photo} alt="Captured" />
          ) : cameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#888'
            }}>
              <Camera size={48} style={{ marginBottom: 16 }} />
              <p>Camera preview will appear here</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {photo ? (
            <>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={retake}>
                <RotateCcw size={18} /> Retake
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/summary')}>
                Continue
              </button>
            </>
          ) : cameraActive ? (
            <button className="btn btn-primary" onClick={capturePhoto}>
              <Camera size={18} /> Capture Photo
            </button>
          ) : (
            <button className="btn btn-primary" onClick={startCamera}>
              <Camera size={18} /> Start Camera
            </button>
          )}
        </div>

        {photo && (
          <div className="card card-gold" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>AI Style Suggestions</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6 }}>
              {category === 'hair' && 'Based on your face shape and features, we recommend exploring layered cuts for added volume, or a sleek straight style for a polished look. Color options like caramel highlights would complement your skin tone beautifully.'}
              {category === 'skin' && 'Your skin analysis suggests a combination skin type. We recommend our Signature Glow Facial for overall radiance, with targeted treatment for the T-zone. A regular skincare routine with our recommended products will maintain results.'}
              {category === 'scalp' && 'Initial assessment suggests your scalp could benefit from a deep cleansing treatment. We recommend our Scalp Detox followed by a nourishing therapy to restore balance and promote healthy hair growth.'}
            </p>
            <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => window.open('/tv', '_blank')}>
              <Monitor size={16} /> View on TV Display
            </button>
          </div>
        )}

        <button
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
          onClick={() => navigate('/summary')}
        >
          Skip to Summary
        </button>
      </div>
    </div>
  )
}
