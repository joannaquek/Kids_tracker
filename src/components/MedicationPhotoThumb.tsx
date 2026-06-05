import { useEffect, useState } from 'react'
import { getMedicationPhoto } from '../lib/medicationPhotos'

interface MedicationPhotoThumbProps {
  photoId: string
  alt: string
  className?: string
  onClick?: () => void
}

export const MedicationPhotoThumb = ({ photoId, alt, className = '', onClick }: MedicationPhotoThumbProps) => {
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadPhoto = async () => {
      setLoading(true)
      try {
        const dataUrl = await getMedicationPhoto(photoId)
        if (!cancelled) {
          setSrc(dataUrl)
        }
      } catch (error) {
        console.error('Failed to load medication photo', error)
        if (!cancelled) {
          setSrc(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPhoto()

    return () => {
      cancelled = true
    }
  }, [photoId])

  if (loading) {
    return <div className={`med-photo-thumb med-photo-thumb--loading ${className}`} aria-hidden="true" />
  }

  if (!src) {
    return (
      <div className={`med-photo-thumb med-photo-thumb--missing ${className}`} aria-label="Photo unavailable">
        💊
      </div>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={`med-photo-thumb med-photo-thumb--button ${className}`}
        onClick={onClick}
        aria-label={`View photo of ${alt}`}
      >
        <img src={src} alt={alt} />
      </button>
    )
  }

  return (
    <div className={`med-photo-thumb ${className}`}>
      <img src={src} alt={alt} />
    </div>
  )
}
