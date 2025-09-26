// src/components/MediaViewer.jsx

/**
 * Component: MediaViewer
 *
 * Renders whichever media is available for a step:
 * 1. Tries to load and play a video (with fallback on error).
 * 2. If no video (or it fails), falls back to:
 *    • An image (if provided), and
 *    • An audio player (if provided).
 *
 * Handles:
 * • Dynamic MIME-type inference by file extension.
 * • Forcing reloads on URL changes via refs, key props, and a cache‐busting token.
 * • Hiding the video element the moment it errors (e.g. 404).
 */

import React, { useState, useRef, useEffect } from 'react'

function getMimeFromUrl(url) {
  if (!url) return null
  const ext = url.split('.').pop().toLowerCase()
  if (['mp4', 'webm', 'ogg'].includes(ext)) return `video/${ext}`
  if (['mp3', 'wav', 'mpeg', 'ogg', 'm4a'].includes(ext)) return `audio/${ext}`
  return null
}

export default function MediaViewer({ videoUrl: videoProp, audioUrl: audioProp, pictureUrl: pictureProp }) {
  const [videoFailed, setVideoFailed] = useState(false)
  const [buster, setBuster] = useState(Date.now())
  const videoRef = useRef()
  const audioRef = useRef()

  // Reset failure state and bump cache-buster whenever the source props change
  useEffect(() => {
    setVideoFailed(false)
    setBuster(Date.now())
  }, [videoProp, audioProp, pictureProp])

  // Force the browser media element to reload when URL changes
  useEffect(() => {
    videoRef.current?.load()
  }, [videoProp, buster])

  useEffect(() => {
    audioRef.current?.load()
  }, [audioProp, buster])

  // Build final URLs with cache-busting query param
  const videoUrl   = videoProp   ? `${videoProp}?t=${buster}`   : null
  const audioUrl   = audioProp   ? `${audioProp}?t=${buster}`   : null
  const pictureUrl = pictureProp ? `${pictureProp}?t=${buster}` : null

  if (videoUrl && !videoFailed) {
    return (
      <video
        key={videoUrl}
        ref={videoRef}
        controls
        preload="metadata"
        style={{ maxWidth: '100%' }}
        onError={() => setVideoFailed(true)}
      >
        <source src={videoUrl} type={getMimeFromUrl(videoUrl)} />
        Your browser doesn’t support video playback.
      </video>
    )
  }

  return (
    <>
      {pictureUrl && (
        <img
          key={pictureUrl}
          src={pictureUrl}
          alt="step"
          style={{ maxWidth: '100%', marginBottom: 12 }}
        />
      )}
      {audioUrl && (
        <audio
          key={audioUrl}
          ref={audioRef}
          controls
          preload="metadata"
          style={{ width: '100%' }}
        >
          <source src={audioUrl} type={getMimeFromUrl(audioUrl)} />
          Your browser doesn’t support audio playback.
        </audio>
      )}
    </>
  )
}
