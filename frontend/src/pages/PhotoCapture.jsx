import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, RotateCcw, Monitor, Upload, X } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import toast from 'react-hot-toast'

export default function PhotoCapture() {
  const navigate = useNavigate()
  const { setCapturedPhoto, consultation } = useClient()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [facingMode, setFacingMode] = useState('user')

  const startCamera = useCallback(async (facing = 'user') => {
    try {
      setCameraError(null)
      // Stop existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      setStream(mediaStream)
      setCameraActive(true)
      setFacingMode(facing)
    } catch (err) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device. You can upload a photo instead.')
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is being used by another application. Close other apps and try again.')
      } else {
        setCameraError('Could not access camera. Try uploading a photo instead.')
      }
      toast.error('Camera not available')
    }
  }, [stream])

  // Auto-start camera on mount
  useEffect(() => {
    startCamera()
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
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

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraActive(false)
  }

  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    startCamera(newFacing)
  }

  const retake = () => {
    setPhoto(null)
    setCameraError(null)
    startCamera()
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
      const dataUrl = event.target.result
      setPhoto(dataUrl)
      setCapturedPhoto(dataUrl)
      stopCamera()
      toast.success('Photo uploaded! ✨')
    }
    reader.readAsDataURL(file)
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
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              {/* Switch Camera Button */}
              <button
                onClick={switchCamera}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
                title="Switch Camera"
              >
                <RotateCcw size={18} />
              </button>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#888',
              padding: 24,
              textAlign: 'center'
            }}>
              {cameraError ? (
                <>
                  <X size={48} style={{ marginBottom: 16, color: '#E53935' }} />
                  <p style={{ marginBottom: 8, fontWeight: 600 }}>Camera Unavailable</p>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{cameraError}</p>
                </>
              ) : (
                <>
                  <Camera size={48} style={{ marginBottom: 16 }} />
                  <p>Starting camera...</p>
                </>
              )}
            </div>
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
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => startCamera()}>
                <Camera size={18} /> Try Camera
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => fileInputRef.current?.click()}>
                <Upload size={18} /> Upload Photo
              </button>
            </div>
          )}
        </div>

        {/* Upload alternative always visible when camera is active */}
        {cameraActive && (
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => { stopCamera(); fileInputRef.current?.click(); }}
          >
            <Upload size={16} /> Upload from Gallery Instead
          </button>
        )}

        {photo && (
          <div className="card card-gold" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>✨ AI Style Suggestions</h3>
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
