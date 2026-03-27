import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision'

// ===== ADVANCED AI ANALYSIS ENGINE =====
// Uses MediaPipe Face Landmarker for better accuracy

export class SalonAIAnalyzer {
  constructor() {
    this.faceLandmarker = null
    this.hairSegmenter = null
    this.isInitialized = false
    this.modelLoadStatus = {
      faceLandmarks: false,
      hairSegmentation: false
    }
  }

  // Initialize all DL models
  async initialize() {
    if (this.isInitialized) return true
    
    try {
      await Promise.all([
        this.loadFaceLandmarksModel(),
        this.loadHairSegmentationModel()
      ])
      
      this.isInitialized = true
      return true
    } catch (error) {
      console.error('AI Model initialization failed:', error)
      return false
    }
  }

  // Load Face Landmarks Model for detailed facial analysis
  async loadFaceLandmarksModel() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'IMAGE',
        numFaces: 1
      })
      this.modelLoadStatus.faceLandmarks = true
      console.log('✅ Face Landmarks Model Loaded (468 points)')
    } catch (error) {
      console.warn('Face Landmarks failed to load:', error)
    }
  }

  // Load Hair Segmentation Model
  async loadHairSegmentationModel() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
      const { ImageSegmenter } = await import('@mediapipe/tasks-vision')
      this.hairSegmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
          delegate: 'GPU'
        },
        outputCategoryMask: true,
        outputConfidenceMasks: false,
        runningMode: 'IMAGE'
      })
      this.modelLoadStatus.hairSegmentation = true
      console.log('✅ Hair Segmentation Model Loaded')
    } catch (error) {
      console.warn('Hair Segmentation failed to load:', error)
    }
  }

  // ===== COMPREHENSIVE ANALYSIS =====
  async analyzeImage(imageElement) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const analysis = {
      faceShape: null,
      faceFeatures: null,
      hairAnalysis: null,
      recommendations: null,
      confidence: 0,
      timestamp: new Date().toISOString()
    }

    try {
      // Run both analyses in parallel for speed
      const [faceResult, hairResult] = await Promise.all([
        this.analyzeFace(imageElement),
        this.analyzeHair(imageElement)
      ])

      analysis.faceShape = faceResult.shape
      analysis.faceFeatures = faceResult.features
      analysis.hairAnalysis = hairResult
      
      // Generate recommendations based on combined analysis
      analysis.recommendations = this.generateRecommendations(
        faceResult.shape,
        faceResult.features,
        hairResult
      )
      
      // Calculate overall confidence
      analysis.confidence = this.calculateConfidence(faceResult, hairResult)
      
    } catch (error) {
      console.error('Analysis error:', error)
    }

    return analysis
  }

  // ===== FACE SHAPE ANALYSIS with 468 Landmarks =====
  async analyzeFace(imageElement) {
    const result = {
      shape: 'unknown',
      shapeConfidence: 0,
      features: {
        foreheadWidth: 0,
        cheekboneWidth: 0,
        jawWidth: 0,
        faceLength: 0,
        ratios: {}
      },
      landmarks: null
    }

    try {
      if (!this.faceLandmarker) {
        return result
      }

      // Detect face landmarks (468 points for high accuracy)
      const landmarkResult = await this.faceLandmarker.detect(imageElement)
      
      if (landmarkResult?.faceLandmarks?.[0]) {
        const landmarks = landmarkResult.faceLandmarks[0]
        result.landmarks = landmarks
        
        // Calculate precise face measurements using 468 landmarks
        const measurements = this.calculateFaceMeasurements(landmarks)
        result.features = { ...result.features, ...measurements, landmarks }
        
        // Determine face shape based on ratios
        const shapeAnalysis = this.determineFaceShape(measurements.ratios)
        result.shape = shapeAnalysis.shape
        result.shapeConfidence = shapeAnalysis.confidence
      }
    } catch (error) {
      console.error('Face analysis error:', error)
    }

    return result
  }

  // Calculate precise face measurements from 468 landmarks
  calculateFaceMeasurements(landmarks) {
    // MediaPipe face landmarks key indices
    // Full documentation: https://storage.googleapis.com/mediapipe-assets/documentation/face_landmarker_468_points.pdf
    const FOREHEAD_TOP = 10      // Top of forehead
    const FOREHEAD_LEFT = 105    // Left forehead
    const FOREHEAD_RIGHT = 334   // Right forehead
    const LEFT_CHEEK = 234       // Left cheekbone
    const RIGHT_CHEEK = 454      // Right cheekbone
    const JAW_LEFT = 152         // Left jaw
    const JAW_RIGHT = 377        // Right jaw
    const CHIN = 152             // Chin center
    const TOP_HEAD = 10          // Top of head
    const NOSE_TIP = 1           // Nose tip
    const LEFT_EYE = 33          // Left eye outer
    const RIGHT_EYE = 263        // Right eye outer
    const MOUTH_LEFT = 61        // Left mouth corner
    const MOUTH_RIGHT = 291      // Right mouth corner

    const getDist = (i1, i2) => {
      const p1 = landmarks[i1]
      const p2 = landmarks[i2]
      if (!p1 || !p2) return 0
      return Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + 
        Math.pow(p2.y - p1.y, 2) + 
        Math.pow((p2.z || 0) - (p1.z || 0), 2)
      )
    }

    // Precise measurements using 468-point mesh
    const measurements = {
      foreheadWidth: getDist(FOREHEAD_LEFT, FOREHEAD_RIGHT),
      cheekboneWidth: getDist(LEFT_CHEEK, RIGHT_CHEEK),
      jawWidth: getDist(JAW_LEFT, JAW_RIGHT),
      faceLength: getDist(TOP_HEAD, CHIN),
      eyeDistance: getDist(LEFT_EYE, RIGHT_EYE),
      mouthWidth: getDist(MOUTH_LEFT, MOUTH_RIGHT),
      noseToChin: getDist(NOSE_TIP, CHIN),
      ratios: {}
    }

    // Calculate key ratios for shape determination
    const { foreheadWidth, cheekboneWidth, jawWidth, faceLength, eyeDistance } = measurements
    
    measurements.ratios = {
      widthToLength: cheekboneWidth / (faceLength || 1),
      jawToCheek: jawWidth / (cheekboneWidth || 1),
      foreheadToCheek: foreheadWidth / (cheekboneWidth || 1),
      eyeToFaceWidth: eyeDistance / (cheekboneWidth || 1),
      // Golden ratio approximation
      facialRatio: faceLength / ((foreheadWidth + cheekboneWidth + jawWidth) / 3 || 1)
    }

    return measurements
  }

  // Advanced face shape determination from ratios
  determineFaceShape(ratios) {
    const { widthToLength, jawToCheek, foreheadToCheek, eyeToFaceWidth, facialRatio } = ratios
    
    let shape = 'oval'
    let confidence = 0.7
    let scores = {
      oval: 0,
      round: 0,
      square: 0,
      oblong: 0,
      heart: 0,
      diamond: 0,
      triangle: 0
    }

    // Score each face shape based on ratios
    // Round: Width ≈ Length, full cheeks
    if (widthToLength > 0.85 && jawToCheek > 0.9) {
      scores.round += 2
      if (widthToLength > 0.9) scores.round += 1
    }

    // Square: Strong jaw, similar widths
    if (jawToCheek > 0.95 && Math.abs(foreheadToCheek - 1) < 0.15) {
      scores.square += 2
      if (jawToCheek > 0.98) scores.square += 1
    }

    // Oblong: Longer than wide
    if (widthToLength < 0.65) {
      scores.oblong += 2
      if (widthToLength < 0.55) scores.oblong += 1
    }

    // Heart: Wide forehead, narrow jaw
    if (foreheadToCheek > 1.05 && jawToCheek < 0.85) {
      scores.heart += 2
      if (jawToCheek < 0.75) scores.heart += 1
    }

    // Diamond: Narrow forehead & jaw, wide cheeks
    if (foreheadToCheek < 0.95 && jawToCheek < 0.9 && widthToLength > 0.7) {
      scores.diamond += 2
    }

    // Triangle/Triangle: Narrow forehead, wide jaw
    if (foreheadToCheek < 0.9 && jawToCheek > 1.05) {
      scores.triangle += 2
    }

    // Oval: Balanced proportions
    if (Math.abs(widthToLength - 0.75) < 0.15 && Math.abs(jawToCheek - foreheadToCheek) < 0.1) {
      scores.oval += 2
    }

    // Find highest score
    let maxScore = 0
    for (const [shapeType, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        shape = shapeType
      }
    }

    // Calculate confidence based on score
    confidence = Math.min(0.95, 0.5 + maxScore * 0.15)

    return { shape, confidence }
  }

  // ===== HAIR ANALYSIS =====
  async analyzeHair(imageElement) {
    const result = {
      hairCoverage: 0,
      scalpVisibility: 0,
      estimatedHairType: 'unknown',
      estimatedThickness: 'medium',
      estimatedVolume: 'medium',
      confidence: 0,
      mask: null
    }

    try {
      if (!this.hairSegmenter) {
        return result
      }

      // Create canvas for processing
      const canvas = document.createElement('canvas')
      canvas.width = imageElement.naturalWidth || imageElement.width
      canvas.height = imageElement.naturalHeight || imageElement.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(imageElement, 0, 0)

      // Run segmentation
      const segmentation = await this.hairSegmenter.segment(canvas)
      
      if (segmentation?.categoryMask) {
        const maskData = segmentation.categoryMask.getAsUint8Array()
        const maskWidth = segmentation.categoryMask.width
        const maskHeight = segmentation.categoryMask.height
        
        // Analyze mask
        let hairPixels = 0
        let facePixels = 0
        let backgroundPixels = 0
        let totalPixels = maskData.length

        for (let i = 0; i < maskData.length; i++) {
          if (maskData[i] === 1) hairPixels++
          else if (maskData[i] === 2) facePixels++
          else if (maskData[i] === 3) backgroundPixels++
        }

        result.hairCoverage = hairPixels / totalPixels
        result.scalpVisibility = facePixels / totalPixels

        // Estimate hair type based on coverage and distribution
        result.estimatedHairType = this.estimateHairType(
          result.hairCoverage, 
          result.scalpVisibility
        )
        
        result.estimatedThickness = this.estimateHairThickness(result.hairCoverage)
        result.estimatedVolume = this.estimateHairVolume(result.hairCoverage, result.scalpVisibility)
        result.confidence = Math.min(0.95, 0.6 + (hairPixels / totalPixels) * 0.4)
        result.mask = maskData
        result.maskDimensions = { width: maskWidth, height: maskHeight }
        result.pixelCounts = { hair: hairPixels, face: facePixels, background: backgroundPixels }

        segmentation.close()
      }
    } catch (error) {
      console.error('Hair analysis error:', error)
    }

    return result
  }

  estimateHairType(coverage, scalpVisibility) {
    if (coverage > 0.15 && scalpVisibility < 0.25) return 'thick'
    if (coverage > 0.10 && scalpVisibility < 0.30) return 'medium'
    if (coverage > 0.05) return 'thin'
    return 'very_thin'
  }

  estimateHairThickness(coverage) {
    if (coverage > 0.18) return 'very_thick'
    if (coverage > 0.12) return 'thick'
    if (coverage > 0.08) return 'medium'
    if (coverage > 0.04) return 'thin'
    return 'very_thin'
  }

  estimateHairVolume(coverage, scalpVisibility) {
    const density = coverage / (coverage + scalpVisibility + 0.01)
    if (density > 0.7 && coverage > 0.15) return 'high'
    if (density > 0.5 && coverage > 0.10) return 'medium'
    return 'low'
  }

  // ===== RECOMMENDATION ENGINE =====
  generateRecommendations(faceShape, faceFeatures, hairAnalysis) {
    const recommendations = {
      suitableStyles: [],
      avoidStyles: [],
      colorSuggestions: [],
      treatments: [],
      stylingTips: []
    }

    // Face shape based recommendations
    const faceShapeRecommendations = {
      oval: {
        suitable: ['Any style works', 'Pixie Cut', 'Bob', 'Long Layers', 'Bangs', 'Middle Part'],
        avoid: ['Nothing to avoid - most versatile'],
        colors: ['Any color suits', 'Balayage', 'Highlights', 'Ombre']
      },
      round: {
        suitable: ['Long Layers', 'Side-swept Bangs', 'Volume on Top', 'Asymmetrical Cuts', 'High Ponytail'],
        avoid: ['Round Curls', 'Chin-length Bobs', 'Blunt Bangs', 'Center Part'],
        colors: ['Dark roots with lighter ends', 'Ombre', 'Shadow root', 'Face-framing highlights']
      },
      square: {
        suitable: ['Soft Layers', 'Side Parts', 'Waves', 'Textured Cuts', 'Curled Ends'],
        avoid: ['Blunt Cuts', 'Straight Bangs', 'Chin-length Bobs', 'Sleek Ponytails'],
        colors: ['Warm highlights', 'Bronde', 'Soft balayage', 'Caramel tones']
      },
      oblong: {
        suitable: ['Bangs', 'Volume on Sides', 'Curls', 'Shoulder Length', 'Wispy Bangs'],
        avoid: ['Too long straight hair', 'High ponytails', 'Slicked back', 'Top volume'],
        colors: ['Face-framing highlights', 'Money piece', 'Dimensional color']
      },
      heart: {
        suitable: ['Chin-length Bobs', 'Side-swept Bangs', 'Pixie with volume', 'Long Layers'],
        avoid: ['Heavy top volume', 'Short layers at crown', 'Blunt Bangs'],
        colors: ['Subtle highlights', 'Soft ombre', 'Natural tones', 'Warm browns']
      },
      diamond: {
        suitable: ['Bangs', 'Chin-length styles', 'Volume at chin', 'Layered Cuts'],
        avoid: ['Too short cuts', 'Volume at crown', 'Slicked back'],
        colors: ['Rich solid colors', 'Lowlights', 'Deep tones', 'Chocolate brown']
      },
      triangle: {
        suitable: ['Volume on top', 'Layers', 'Asymmetrical styles', 'Textured Pixies'],
        avoid: ['Blunt cuts at jaw', 'Volume at bottom', 'One-length cuts'],
        colors: ['Highlights on top', 'Bright around face', 'Contrast colors', 'Balayage']
      }
    }

    const shapeRecs = faceShapeRecommendations[faceShape?.shape] || faceShapeRecommendations.oval
    recommendations.suitableStyles = shapeRecs.suitable
    recommendations.avoidStyles = shapeRecs.avoid
    recommendations.colorSuggestions = shapeRecs.colors

    // Hair type based recommendations
    if (hairAnalysis?.estimatedHairType === 'thin' || hairAnalysis?.estimatedHairType === 'very_thin') {
      recommendations.treatments.push('Volumizing Treatment')
      recommendations.treatments.push('Thickening Serum')
      recommendations.treatments.push('Root Lift Spray')
      recommendations.stylingTips.push('Use volumizing products at roots')
      recommendations.stylingTips.push('Blow dry upside down for volume')
    } else if (hairAnalysis?.estimatedHairType === 'thick') {
      recommendations.treatments.push('De-bulking Layering')
      recommendations.treatments.push('Smoothing Treatment')
      recommendations.treatments.push('Keratin Treatment')
      recommendations.stylingTips.push('Consider thinning for manageability')
      recommendations.stylingTips.push('Use anti-frizz products')
    }

    if (hairAnalysis?.estimatedVolume === 'low') {
      recommendations.treatments.push('Root Lift Treatment')
      recommendations.treatments.push('Volumizing Mousse')
      recommendations.suitableStyles.push('Textured cuts for volume')
      recommendations.suitableStyles.push('Layers for movement')
    }

    if (hairAnalysis?.estimatedVolume === 'high') {
      recommendations.treatments.push('Weight reduction')
      recommendations.stylingTips.push('Use smoothing serums')
    }

    return recommendations
  }

  // Calculate overall analysis confidence
  calculateConfidence(faceResult, hairResult) {
    let confidence = 0
    
    if (faceResult.shape !== 'unknown') {
      confidence += faceResult.shapeConfidence * 0.5
    }
    
    if (hairResult.confidence > 0) {
      confidence += hairResult.confidence * 0.3
    }
    
    // Bonus for having both analyses
    if (faceResult.shape !== 'unknown' && hairResult.confidence > 0) {
      confidence += 0.2
    }
    
    return Math.min(0.99, confidence)
  }

  // Get model status
  getStatus() {
    return {
      initialized: this.isInitialized,
      models: this.modelLoadStatus,
      ready: Object.values(this.modelLoadStatus).some(v => v)
    }
  }
}

// Export singleton instance
export const salonAI = new SalonAIAnalyzer()

// Utility function for quick analysis
export async function analyzePhotoWithAI(imageElement) {
  const analyzer = new SalonAIAnalyzer()
  await analyzer.initialize()
  return await analyzer.analyzeImage(imageElement)
}
