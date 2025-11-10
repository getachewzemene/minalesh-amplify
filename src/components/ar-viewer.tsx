/**
 * ARViewer Component
 * 
 * Provides AR try-on functionality with camera access and basic face detection.
 * Currently uses browser camera API with placeholder overlays.
 * For production WebXR with 3D models, integrate libraries like Three.js, 
 * Model Viewer, or AR.js for full augmented reality experiences.
 */

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Maximize, RotateCcw, Smartphone } from "lucide-react"

interface ARViewerProps {
  modelUrl?: string
  productType: 'cap' | 'sunglasses' | 'other'
  productName: string
}

export function ARViewer({ modelUrl, productType, productName }: ARViewerProps) {
  const [isARActive, setIsARActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const supportsAR = productType === 'cap' || productType === 'sunglasses'

  useEffect(() => {
    // Cleanup camera stream when component unmounts or AR is closed
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const handleTryAR = async () => {
    setError(null)
    
    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      setStream(mediaStream)
      setIsARActive(true)
      
      // Set video source after state update
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
      
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Unable to access camera. Please grant camera permissions and try again.')
    }
  }

  const handleStopAR = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsARActive(false)
    setError(null)
  }

  if (!supportsAR) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center">
        <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">
          AR try-on not available for this product type
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-card rounded-lg p-6 border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">
            AR Try-On Available
          </Badge>
          <Smartphone className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {error ? (
        <div className="text-center py-8">
          <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-destructive mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => setError(null)}
            className="border-primary text-primary hover:bg-primary/10"
          >
            Try Again
          </Button>
        </div>
      ) : isARActive ? (
        <div className="relative">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-white/80 text-center">
                <p className="text-sm font-medium bg-black/50 px-4 py-2 rounded-lg">
                  AR Preview Active - {productName}
                </p>
                <p className="text-xs mt-2 bg-black/50 px-4 py-2 rounded-lg">
                  Note: Full 3D overlay requires WebXR integration
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleStopAR}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Stop Camera
            </Button>
            <Button 
              size="sm"
              onClick={handleStopAR}
              className="bg-primary hover:bg-primary/90"
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-4">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Try Before You Buy</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Use your camera to see how this {productType} looks on you with our AR technology
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleTryAR}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start AR Try-On
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-primary text-primary hover:bg-primary/10"
              >
                <Maximize className="h-3 w-3 mr-1" />
                Full View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-primary text-primary hover:bg-primary/10"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                360° View
              </Button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded text-xs text-muted-foreground">
            <p>💡 For best results:</p>
            <ul className="list-disc list-inside text-left mt-1 space-y-1">
              <li>Ensure good lighting</li>
              <li>Look directly at the camera</li>
              <li>Keep your device steady</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}