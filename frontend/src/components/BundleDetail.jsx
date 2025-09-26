// src/components/BundleDetail.jsx

/**
 * Page: BundleDetail
 *
 * Orchestrates the entire “walkthrough” view for a bundle:
 * • Uses `useBundle(id)` to fetch bundle data.
 * • Keeps `current` step index in state.
 * • Renders step header (title, description).
 * • Delegates media rendering to <MediaViewer>.
 * • Delegates navigation to <StepNavigator>.
 * • Handles “Finish” by navigating to /complete.
 */



import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import useBundle from '../hooks/useBundle'
import MediaViewer from './MediaViewer'
import StepNavigator from './StepNavigator'

export default function BundleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { bundle, loading, error } = useBundle(id)
  const [current, setCurrent] = useState(0)

  if (loading) return <div>Loading…</div>
  if (error) return <div style={{ color: 'red' }}>{error}</div>
  if (!bundle) return null

  const step = bundle.exercises[current]
  const videoUrl = step.video_file_path && `/api/exercises/${step.id}/video`
  const audioUrl = step.audio && `/api/exercises/${step.id}/audio`
  const pictureUrl = step.picture && `/api/exercises/${step.id}/picture`
  
  const advance = () =>
    current === bundle.exercises.length - 1
      ? navigate('/complete')
      : setCurrent(c => c + 1)

  return (
    <div className="bd-container">
      <header className="bd-header">
        <h1>{bundle.title}</h1>
        <Link to={`/bundles/${id}/edit`}>Edit</Link>
      </header>

      <div className="bd-step-card">
        <h2>Step {step.step}</h2>
        <h3>{step.title}</h3>
        {step.description && <p>{step.description}</p>}

        <MediaViewer
          videoUrl={videoUrl}
          audioUrl={audioUrl}
          pictureUrl={pictureUrl}
        />
      </div>

      <StepNavigator
        current={current}
        total={bundle.exercises.length}
        onPrev={() => setCurrent(c => Math.max(c - 1, 0))}
        onNext={advance}
      />
    </div>
  )
}
