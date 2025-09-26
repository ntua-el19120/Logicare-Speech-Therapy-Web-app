// src/pages/Clinician/EditBundleClinician.jsx

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

//Components 
import Header        from '../../components/Header'
import MediaViewer   from '../../components/MediaViewer'
import FabBack       from '../../components/FabBack'

import '../../../style/MyExercises.css'
import '../../../style/EditBundleClinician.css'

export default function EditBundleClinician() {
  const { id } = useParams()
  const navigate = useNavigate()

  // metadata (title only — no global flag here)
  const [title, setTitle] = useState('')

  // exercises state
  const [exercises, setExercises] = useState([])
  const [removedIds, setRemoved] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // load bundle + steps
  useEffect(() => {
    setLoading(true)
    axios.get(`/api/bundles/${id}`, { withCredentials: true })
      .then(res => {
        const b = res.data
        setTitle(b.title)
        setExercises(
          (b.exercises || []).map(ex => ({
            ...ex,
            mediaType: ex.video_file_path ? 'video' : 'audio',
            uploadFile: null,
            uploadPicture: null,
          }))
        )
      })
      .catch(() => setError('Failed to load bundle.'))
      .finally(() => setLoading(false))
  }, [id])

  // helpers
  const updateField = (i, field, value) => {
    setExercises(exs => {
      const copy = [...exs]
      copy[i] = { ...copy[i], [field]: value }
      return copy
    })
  }

  const removeStep = i => {
    setExercises(exs => {
      const toRemove = exs[i]
      if (toRemove.id) setRemoved(r => [...r, toRemove.id])
      const filtered = exs.filter((_, idx) => idx !== i)
      return filtered.map((e, idx) => ({ ...e, step: idx + 1 }))
    })
  }

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
        uploadPicture: null,
      }
    ])
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      // 1) update bundle (title only; no "global" here)
      await axios.put(`/api/bundles/${id}`, { title }, { withCredentials: true })

      // 2) delete removed steps
      await Promise.all(removedIds.map(exId =>
        axios.delete(`/api/exercises/${exId}`, { withCredentials: true })
      ))

      // 3) upsert steps
      await Promise.all(exercises.map(ex => {
        const form = new FormData()
        form.append('bundle_id', id)
        form.append('step', ex.step)
        form.append('title', ex.title)
        form.append('description', ex.description)

        if (ex.mediaType === 'audio') {
          if (ex.uploadFile    instanceof File) form.append('audio',   ex.uploadFile)
          if (ex.uploadPicture instanceof File) form.append('picture', ex.uploadPicture)
        } else {
          if (ex.uploadFile instanceof File) form.append('video', ex.uploadFile)
        }

        const cfg = { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true }
        return ex.id
          ? axios.put(`/api/exercises/${ex.id}`, form, cfg)
          : axios.post(`/api/exercises`, form, cfg)
      }))

      alert('Οι αλλαγές αποθηκεύτηκαν.')
      navigate('/myexercises', { replace: true })
    } catch (err) {
      console.error(err)
      alert('Save failed: ' + (err.response?.data?.error || err.message))
    }
  }

  if (loading) return <div className="bd-loading">Loading…</div>
  if (error)   return <div className="bd-error">{error}</div>

  return (
    <>
      <Header />

      <div className="bd-container ebc-page">
        <h1 className="bd-title">Επεξεργασία σετ</h1>

        <form onSubmit={handleSubmit}>
          {/* Title only (no global toggle) */}
         {/* Title row (label + input inline) */}
         <div className="ebc-meta">
           <label htmlFor="bundle-title" className="ebc-label">Τίτλος</label>
           <input
             id="bundle-title"
             type="text"
             className="ebc-input"
             value={title}
             onChange={e => setTitle(e.target.value)}
             required
           />
         </div>

          {exercises.map((ex, i) => (
            <div key={i} className="bd-step-card exercise-step">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2 className="bd-step-number">Step {ex.step}</h2>
                <button type="button" className="bd-button" onClick={() => removeStep(i)}>
                  Remove
                </button>
              </div>

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

              {/* New steps can choose media type */}
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

              {/* Preview existing media */}
              {ex.id != null && (
                <div className="bd-media">
                  <MediaViewer
                    videoUrl={ex.mediaType === 'video' ? `/api/exercises/${ex.id}/video` : null}
                    audioUrl={ex.mediaType === 'audio' ? `/api/exercises/${ex.id}/audio` : null}
                    pictureUrl={ex.mediaType === 'audio' ? `/api/exercises/${ex.id}/picture` : null}
                  />
                </div>
              )}

              {/* Uploads */}
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

          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <button type="button" className="bd-button" onClick={addStep}>
              + Add Step
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button type="submit" className="bd-button btn-edit">Save All Changes</button>
          </div>
        </form>
      </div>
      <FabBack to="/myexercises" />
    </>
  )
}
