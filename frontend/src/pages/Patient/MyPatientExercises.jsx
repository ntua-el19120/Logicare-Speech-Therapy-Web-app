// src/pages/Patient/MyPatientExercises.jsx

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

//Components
import { useAuth }   from '../../AuthContext.jsx'
import Header        from '../../components/Header.jsx'
import MediaViewer   from '../../components/MediaViewer.jsx'
import StepNavigator from '../../components/StepNavigator.jsx'

//styles
import '../../../style/MyPatientExercises.css'

const uniqById = (arr) => {
  const seen = new Set()
  return arr.filter(b => (seen.has(b.id) ? false : seen.add(b.id)))
}

const FILTERS = { ALL: 'ALL', MINE: 'MINE', DEFAULTS: 'DEFAULT' }

export default function MyExercises() {
  const { user, loading } = useAuth()

  const [bundles, setBundles] = useState([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState(FILTERS.ALL)

  // drawer state
  const [open, setOpen] = useState(false)

  // preview modal state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [previewBundle, setPreviewBundle] = useState(null)
  const [previewIndex, setPreviewIndex] = useState(0)

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key !== 'Escape') return
      if (previewOpen) {
        closePreview()
        return
      }
      if (open) setOpen(false)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, previewOpen])

  useEffect(() => {
    if (loading) return
    if (!user) { setError('Not authenticated'); setBusy(false); return }

    ; (async () => {
      try {
        setBusy(true)
        const [assigned] = await Promise.all([
          axios.get(`/api/bundles/users/${user.id}`, { withCredentials: true })
        ])
        const merged = uniqById([...(assigned.data || [])])
        merged.sort((a, b) => a.title.localeCompare(b.title))
        setBundles(merged)
      } catch {
        setError('Failed to load exercises')
      } finally {
        setBusy(false)
      }
    })()
  }, [loading, user])

  const counts = useMemo(() => ({
    all: bundles.length,
    mine: bundles.filter(b => !b.global).length,
    defaults: bundles.filter(b => b.global).length
  }), [bundles])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    let list = bundles
    if (filter === FILTERS.MINE) list = list.filter(b => !b.global)
    else if (filter === FILTERS.DEFAULTS) list = list.filter(b => b.global)
    if (!s) return list
    return list.filter(b => b.title.toLowerCase().includes(s))
  }, [q, filter, bundles])


  const openPreview = async (bundleId) => {
    try {
      setPreviewOpen(true)
      setPreviewLoading(true)
      setPreviewError(null)
      setPreviewIndex(0)

      const { data } = await axios.get(`/api/bundles/${bundleId}`, { withCredentials: true })
      const exercises = (data.exercises || []).slice().sort((a, b) => a.step - b.step)
      setPreviewBundle({ ...data, exercises })
    } catch {
      setPreviewError('Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    setPreviewOpen(false)
    setPreviewBundle(null)
    setPreviewIndex(0)
  }

    const closePreviewAndLogBundle = async (bundleId, userId, step) => {
        setPreviewOpen(false)
        setPreviewBundle(null)
        setPreviewIndex(0)

        await axios.post(`api/log/bundles/${bundleId}/users/${userId}`,{state: "ENDED", step: step, timestamp: new Date().toISOString()}, {withCredentials: true})
    }
    useNavigate();


    return (
        <>
      <Header />

      {/* Drawer overlay */}
      <div className={`me-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      {/* Drawer */}
      <aside id="filter-drawer" className={`me-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="me-drawer-header">
          <h2>Φίλτρα</h2>
          <button className="me-close" onClick={() => setOpen(false)} aria-label="Close filters">×</button>
        </div>

        <button
          className={`me-filter ${filter === FILTERS.ALL ? 'active' : ''}`}
          onClick={() => setFilter(FILTERS.ALL)}
        >
          Όλα ({counts.all})
        </button>
        <button
          className={`me-filter ${filter === FILTERS.MINE ? 'active' : ''}`}
          onClick={() => setFilter(FILTERS.MINE)}
        >
          Δικά μου ({counts.mine})
        </button>
        <button
          className={`me-filter ${filter === FILTERS.DEFAULTS ? 'active' : ''}`}
          onClick={() => setFilter(FILTERS.DEFAULTS)}
        >
          Προεπιλεγμένα ({counts.defaults})
        </button>
      </aside>

      {/* Page content */}
      <main className="bd-container me-content">
        {/* Title centered */}
        <div className="me-titlebar">
          <h1 className="bd-title">Οι ασκήσεις μου</h1>
        </div>

        {/* Controls: Filters left, Search right */}
        <div className="me-controls">
          <button
            className="bd-button"
            onClick={() => setOpen(true)}
            aria-controls="filter-drawer"
            aria-expanded={open}
          >
            ☰ Φίλτρα
          </button>

          <div className="me-search">
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Αναζήτηση τίτλου..."
              className="bd-input"
            />
          </div>
        </div>

        {busy && <div className="bd-loading">Loading…</div>}
        {error && !busy && <div className="bd-error">{error}</div>}

        {!busy && !error && (
          filtered.length === 0 ? (
            <p>Δεν βρέθηκαν σετ.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, maxWidth: 800, margin: '1rem auto' }}>
              {filtered.map(b => (
                <li
                  key={b.id}
                  className="bd-step-card"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div><strong>{b.title}</strong> {b.global ? '🌍' : ''}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="bd-button btn-view" onClick={() => openPreview(b.id)}>View</button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </main>

      {/* PREVIEW MODAL */}
      <div
        className={`me-modal-overlay ${previewOpen ? 'show' : ''}`}
        onClick={closePreview}
      />
      <div
        className={`me-modal ${previewOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bundle-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="me-modal-header">
          <h2 id="bundle-preview-title">{previewBundle ? previewBundle.title : 'Προεπισκόπηση'}</h2>
          <button className="me-close" onClick={closePreview} aria-label="Close preview">×</button>
        </div>

        <div className="me-modal-body">
          {previewLoading && <div className="bd-loading">Loading preview…</div>}
          {previewError && !previewLoading && <div className="bd-error">{previewError}</div>}

          {previewBundle && !previewLoading && !previewError && previewBundle.exercises.length > 0 && (
            <>
              {(() => {
                const step = previewBundle.exercises[previewIndex]
                const videoUrl = step.video_file_path ? `/api/exercises/${step.id}/video` : null
                const audioUrl = step.audio ? `/api/exercises/${step.id}/audio` : null
                const pictureUrl = step.picture ? `/api/exercises/${step.id}/picture` : null

                return (
                  <div className="bd-step-card">
                    <h3 className="bd-step-number">Step {step.step}</h3>
                    <h4 className="bd-step-title">{step.title}</h4>
                    {step.description && <p className="bd-description">{step.description}</p>}

                    <div className="bd-media">
                      <MediaViewer videoUrl={videoUrl} audioUrl={audioUrl} pictureUrl={pictureUrl} />
                    </div>
                  </div>
                )
              })()}

              <StepNavigator
                current={previewIndex}
                total={previewBundle.exercises.length}
                onPrev={() => setPreviewIndex(i => Math.max(0, i - 1))}
                onNext={() => {
                  setPreviewIndex(i => {
                    const last = previewBundle.exercises.length - 1
                    return i >= last ? (closePreviewAndLogBundle(previewBundle.id, user.id, i), i) : i + 1
                  })
                }}
              />
            </>
          )}

          {previewBundle && !previewLoading && !previewError && previewBundle.exercises.length === 0 && (
            <div className="bd-error">No exercises in this bundle.</div>
          )}
        </div>

      </div>

      {/* Floating actions */}
      <Link to="/home-patient" className="fab fab-secondary" aria-label="Αρχική">
        ← Αρχική
      </Link>
    </>
  )
}
