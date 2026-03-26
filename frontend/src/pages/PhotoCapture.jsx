import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, RotateCcw, Monitor, Upload, Loader } from 'lucide-react'
import { useClient } from '../context/ClientContext'
import { updateClientPhoto } from '../utils/api'
import toast from 'react-hot-toast'

export default function PhotoCapture() {
  const navigate = useNavigate()
  const { setCapturedPhoto, consultation, client } = useClient()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const streamRef = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [facingMode, setFacingMode] = useState('user')
  const [uploading, setUploading] = useState(false)

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
      setCameraError(null)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setCameraReady(true)
          }).catch(() => {
            setCameraReady(true)
          })
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraReady(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('permission')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('notfound')
      } else {
        setCameraError('unknown')
      }
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

  const capturePhoto = async () => {
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

    // Sync to backend if client exists
    if (client?.id) {
      setUploading(true)
      try {
        await updateClientPhoto(client.id, dataUrl)
        toast.success('Photo saved to your profile! ✨')
      } catch (err) {
        console.error('Photo upload error:', err)
        toast.error('Could not save photo to server')
      } finally {
        setUploading(false)
      }
    } else {
      toast.success('Photo captured! ✨')
    }
  }

  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    startCamera(newFacing)
  }

  const retake = () => {
    setPhoto(null)
    startCamera(facingMode)
  }


  const handleShowOnTV = () => {
    if (photo) {
      localStorage.setItem('salon_tv_photo', photo)
      localStorage.setItem('salon_tv_category', category)
      localStorage.setItem('salon_tv_client_name', client?.name || 'Guest')
      toast.success('Sending to TV display... 📺')
    }
    // Open on SAME origin (same port) so localStorage is shared
    const tvUrl = `${window.location.origin}/tv`
    const opened = window.open(tvUrl, 'salon_tv')
    if (opened) {
      setTimeout(() => opened.focus(), 300)
    }
  }


  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target.result
      setPhoto(dataUrl)
      setCapturedPhoto(dataUrl)
      stopCamera()

      if (client?.id) {
        setUploading(true)
        try {
          await updateClientPhoto(client.id, dataUrl)
          toast.success('Photo uploaded to your profile! ✨')
        } catch (err) {
          console.error('Photo upload error:', err)
        } finally {
          setUploading(false)
        }
      } else {
        toast.success('Photo uploaded! ✨')
      }
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

      <div className="page" style={{ paddingBottom: 100 }}>
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
              {/* Loading / Error overlay */}
              {!cameraReady && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', padding: 20, textAlign: 'center'
                }}>
                  {cameraError === 'permission' ? (
                    <>
                      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
                      <p style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>
                        Camera Access Blocked
                      </p>
                      <p style={{ color: '#888', fontSize: '0.78rem', lineHeight: 1.7, marginBottom: 16 }}>
                        To allow camera access:<br />
                        1. Click the <strong style={{ color: '#C9A84C' }}>🔒 lock icon</strong> in your browser address bar<br />
                        2. Set <strong style={{ color: '#C9A84C' }}>Camera → Allow</strong><br />
                        3. Refresh the page
                      </p>
                      <button
                        onClick={() => { setCameraError(null); startCamera(facingMode) }}
                        style={{
                          background: 'linear-gradient(135deg, #C9A84C, #A88B3D)',
                          color: '#1A1A2E', border: 'none', borderRadius: 10,
                          padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                        }}
                      >
                        🔄 Retry Camera
                      </button>
                    </>
                  ) : cameraError === 'notfound' ? (
                    <>
                      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📷</div>
                      <p style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>
                        No Camera Found
                      </p>
                      <p style={{ color: '#888', fontSize: '0.78rem', lineHeight: 1.7 }}>
                        No camera device detected.<br />Please use <strong>Upload from Gallery</strong> below.
                      </p>
                    </>
                  ) : cameraError ? (
                    <>
                      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
                      <p style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>
                        Camera Error
                      </p>
                      <button
                        onClick={() => { setCameraError(null); startCamera(facingMode) }}
                        style={{
                          background: 'linear-gradient(135deg, #C9A84C, #A88B3D)',
                          color: '#1A1A2E', border: 'none', borderRadius: 10,
                          padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                        }}
                      >
                        🔄 Retry Camera
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="camera-spinner" />
                      <p style={{ marginTop: 16, fontSize: '0.9rem', color: '#C9A84C' }}>Opening camera...</p>
                    </>
                  )}
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
              disabled={!cameraReady || uploading}
              style={{ opacity: cameraReady && !uploading ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {uploading ? <Loader size={18} className="spin" /> : <Camera size={18} />}
              <span style={{ marginLeft: 8 }}>{cameraReady ? 'Capture Photo' : 'Waiting for camera...'}</span>
            </button>
          )}
        </div>

        {/* View on TV — shown directly below Retake/Continue after photo is taken */}
        {photo && (
          <button
            onClick={handleShowOnTV}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '13px 20px',
              background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)',
              color: '#C9A84C',
              border: '2px solid #C9A84C',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: '0.95rem',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              letterSpacing: 0.5,
              boxShadow: '0 4px 16px rgba(201,168,76,0.25)',
            }}
          >
            <Monitor size={20} />
            View on TV
          </button>
        )}


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
          style={{ marginTop: 12 }}
          onClick={() => navigate('/summary')}
        >
          Skip to Summary
        </button>
      </div>
    </div>
  )
}
