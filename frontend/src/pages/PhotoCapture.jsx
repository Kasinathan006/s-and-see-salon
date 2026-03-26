import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, RotateCcw, Monitor, Upload } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import toast from 'react-hot-toast'

export default function PhotoCapture() {
  const navigate = useNavigate()
  const { setCapturedPhoto, consultation } = useClient()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const streamRef = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState('user')

  const category = consultation?.category || 'hair'

  // Core camera start function
  const startCamera = async (facing = 'user') => {
    // Kill any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        }
      })

      streamRef.current = mediaStream
      setFacingMode(facing)

      // Directly attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setCameraReady(true)
          }).catch(() => {
            setCameraReady(true) // Still show even if autoplay has issues
          })
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraReady(false)
      toast.error('Camera access denied — use Upload instead')
    }
  }

  // Kill camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }

  // AUTO-START camera immediately on page load
  useEffect(() => {
    // Small delay to let DOM render the video element first
    const timer = setTimeout(() => {
      startCamera('user')
    }, 100)

    return () => {
      clearTimeout(timer)
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setPhoto(dataUrl)
    setCapturedPhoto(dataUrl)
    stopCamera()
    toast.success('Photo captured! ✨')
  }

  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    startCamera(newFacing)
  }

  const retake = () => {
    setPhoto(null)
    startCamera(facingMode)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setPhoto(event.target.result)
      setCapturedPhoto(event.target.result)
      stopCamera()
      toast.success('Photo uploaded! ✨')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div className="header">
        <button className="btn-back" onClick={() => { stopCamera(); navigate(-1); }}>
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
        {/* Camera / Photo Preview Area */}
        <div className="photo-area">
          {photo ? (
            <img src={photo} alt="Captured" />
          ) : (
            <>
              {/* Video element is ALWAYS rendered — just hidden before ready */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  display: cameraReady ? 'block' : 'none'
                }}
              />
              {/* Loading overlay while camera initializes */}
              {!cameraReady && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#C9A84C'
                }}>
                  <div className="camera-spinner" />
                  <p style={{ marginTop: 16, fontSize: '0.9rem' }}>Opening camera...</p>
                </div>
              )}
              {/* Switch camera button (visible when camera is active) */}
              {cameraReady && (
                <button
                  onClick={switchCamera}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)', border: 'none',
                    color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10
                  }}
                  title="Switch Camera"
                >
                  <RotateCcw size={18} />
                </button>
              )}
            </>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Action Buttons */}
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
          ) : (
            <button
              className="btn btn-primary"
              onClick={capturePhoto}
              disabled={!cameraReady}
              style={{ opacity: cameraReady ? 1 : 0.5 }}
            >
              <Camera size={18} /> {cameraReady ? 'Capture Photo' : 'Waiting for camera...'}
            </button>
          )}
        </div>

        {/* Upload fallback — always available */}
        {!photo && (
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} /> Upload from Gallery
          </button>
        )}

        {/* AI Suggestions after photo capture */}
        {photo && (
          <div className="card card-gold" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>✨ AI Style Suggestions</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6 }}>
              {category === 'hair' && 'Based on your face shape and features, we recommend exploring layered cuts for added volume, or a sleek straight style for a polished look. Color options like caramel highlights would complement your skin tone beautifully.'}
              {category === 'skin' && 'Your skin analysis suggests a combination skin type. We recommend our Signature Glow Facial for overall radiance, with targeted treatment for the T-zone.'}
              {category === 'scalp' && 'Initial assessment suggests your scalp could benefit from a deep cleansing treatment. We recommend our Scalp Detox followed by a nourishing therapy.'}
            </p>
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
