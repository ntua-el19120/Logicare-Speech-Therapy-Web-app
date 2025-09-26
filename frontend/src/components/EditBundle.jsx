// src/components/EditBundle.jsx

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

import BundleMetadata from './BundleMetadata'
import MediaViewer    from './MediaViewer'

export default function EditBundle() {
  const { id } = useParams()
  const navigate = useNavigate()

  // bundle metadata
  const [title, setTitle]       = useState('')
  const [globalFlag, setGlobal] = useState(false)

  // exercises state
  const [exercises, setExercises] = useState([])
  const [removedIds, setRemoved]   = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Fetch bundle + its exercises
  useEffect(() => {
    axios.get(`/api/bundles/${id}`)
      .then(res => {
        const bundle = res.data
        setTitle(bundle.title)
        setGlobal(bundle.global)
        setExercises(bundle.exercises.map(ex => ({
          ...ex,
          mediaType: ex.video_file_path ? 'video' : 'audio',
          uploadFile: null,
          uploadPicture: null
        })))
      })
      .catch(() => setError('Failed to load bundle.'))
      .finally(() => setLoading(false))
  }, [id])

  // Update any field on an exercise
  const updateField = (i, field, value) => {
    setExercises(exs => {
      const copy = [...exs]
      copy[i] = { ...copy[i], [field]: value }
      return copy
    })
  }

  // Remove step
  const removeStep = i => {
    setExercises(exs => {
      const toRemove = exs[i]
      if (toRemove.id) setRemoved(r => [...r, toRemove.id])
      const filtered = exs.filter((_, idx) => idx !== i)
      return filtered.map((e, idx) => ({ ...e, step: idx + 1 }))
    })
  }

  // Add new audio step
  const addStep = () => {
    setExercises(exs => [
      ...exs,
      {
        id: null,
        bundle_id: id,
        step: exs.length + 1,
        title: '',
        description: '',
        mediaType: 'audio',
        uploadFile: null,
        uploadPicture: null
      }
    ])
  }

  // Submit handler
  const handleSubmit = async e => {
    e.preventDefault()
    try {
      // 1) update bundle metadata
      await axios.put(`/api/bundles/${id}`, { title, global: globalFlag })

      // 2) delete removed exercises
      await Promise.all(removedIds.map(exId =>
        axios.delete(`/api/exercises/${exId}`)
      ))

      // 3) create/update exercises
      await Promise.all(exercises.map(ex => {
        const form = new FormData()
        form.append('bundle_id', id)
        form.append('step', ex.step)
        form.append('title', ex.title)
        form.append('description', ex.description)

        if (ex.mediaType === 'audio') {
          if (ex.uploadFile   instanceof File) form.append('audio', ex.uploadFile)
          if (ex.uploadPicture instanceof File) form.append('picture', ex.uploadPicture)
        } else {
          if (ex.uploadFile instanceof File) form.append('video', ex.uploadFile)
        }

        const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
        return ex.id
          ? axios.put(`/api/exercises/${ex.id}`, form, cfg)
          : axios.post(`/api/exercises`, form, cfg)
      }))

      alert('Bundle and exercises updated!')
      navigate(`/bundles/${id}`)
    } catch (err) {
      console.error(err)
      alert('Save failed: ' + (err.response?.data?.error || err.message))
    }
  }

  if (loading) return <div className="bd-loading">Loading…</div>
  if (error)   return <div className="bd-error">{error}</div>

  return (
    <div className="bd-container">
      <h1 className="bd-title">Edit Bundle & Exercises</h1>

      <form onSubmit={handleSubmit}>
        {/* Bundle metadata */}
        <div className="bundle-metadata">
          <BundleMetadata
            title={title}
            setTitle={setTitle}
            globalFlag={globalFlag}
            setGlobalFlag={setGlobal}
          />
        </div>

        {/* Exercises list */}
        {exercises.map((ex, i) => (
          <div key={i} className="bd-step-card exercise-step">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h2 className="bd-step-number">Step {ex.step}</h2>
              <button type="button" className="bd-button" onClick={() => removeStep(i)}>
                Remove
              </button>
            </div>

            {/* Title & Description */}
            <label>
              <strong>Title</strong>
              <input
                type="text"
                value={ex.title}
                onChange={e => updateField(i, 'title', e.target.value)}
                className="bd-input"
                required
              />
            </label>
            <label>
              <strong>Description</strong>
              <textarea
                value={ex.description}
                onChange={e => updateField(i, 'description', e.target.value)}
                className="bd-input"
              />
            </label>

            {/* Media-type chooser for NEW steps */}
            {ex.id == null && (
              <div style={{ margin: '1rem 0' }}>
                <label style={{ marginRight: '1rem' }}>
                  <input
                    type="radio"
                    name={`mediaType-${i}`}
                    value="audio"
                    checked={ex.mediaType === 'audio'}
                    onChange={() => updateField(i, 'mediaType', 'audio')}
                  /> Audio + Picture
                </label>
                <label>
                  <input
                    type="radio"
                    name={`mediaType-${i}`}
                    value="video"
                    checked={ex.mediaType === 'video'}
                    onChange={() => updateField(i, 'mediaType', 'video')}
                  /> Video Only
                </label>
              </div>
            )}

            {/* Existing media preview (only for saved steps) */}
            {ex.id != null && (
              <div className="bd-media">
                <MediaViewer
                  videoUrl={ex.mediaType === 'video' ? `/api/exercises/${ex.id}/video` : null}
                  audioUrl={ex.mediaType === 'audio' ? `/api/exercises/${ex.id}/audio` : null}
                  pictureUrl={ex.mediaType === 'audio' ? `/api/exercises/${ex.id}/picture` : null}
                />
              </div>
            )}

            {/* File inputs */}
            {ex.mediaType === 'video' ? (
              <label className="bd-button" style={{ marginTop: '1rem' }}>
                {ex.id != null ? 'Replace Video' : 'Add Video'}
                <input
                  type="file"
                  accept=".mp4,.webm,.ogg"
                  onChange={e => {
                    const f = e.target.files[0]
                    if (f?.type.startsWith('video/')) updateField(i, 'uploadFile', f)
                    else alert('Please choose a valid video file (.mp4, .webm, .ogg)')
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <label className="bd-button">
                  {ex.id != null ? 'Replace Audio' : 'Add Audio'}
                  <input
                    type="file"
                    accept=".mp3,.wav,.ogg,.m4a"
                    onChange={e => {
                      const f = e.target.files[0]
                      if (f?.type.startsWith('audio/')) updateField(i, 'uploadFile', f)
                      else alert('Please choose a valid audio file (.mp3, .wav, .ogg, .m4a)')
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
                <label className="bd-button">
                  {ex.id != null ? 'Replace Picture' : 'Add Picture'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => updateField(i, 'uploadPicture', e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>
        ))}

        {/* Add new step */}
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <button type="button" className="bd-button" onClick={addStep}>
            + Add Step
          </button>
        </div>

        {/* Save */}
        <div style={{ textAlign: 'center' }}>
          <button type="submit" className="bd-button">Save All Changes</button>
        </div>
      </form>
    </div>
  )
}
            