// src/pages/Clinician/MyPatients.jsx
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

//Components
import Header    from '../../components/Header'

//CSS style
import '../../../style/MyPatients.css'
import '../../../style/MyExercises.css'  // for .me-* and .fab styles


// Import icons from your assets
import userIcon from '../../assets/patent.png'



export default function MyPatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('') // search query

  useEffect(() => {
    let alive = true
    axios
      .get('/api/my-patients', { withCredentials: true })
      .then(res => { if (alive) setPatients(res.data || []) })
      .catch(err => {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message
        setError(msg || 'Failed to load patients')
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  // filter by name or surname (case-insensitive)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return patients
    return patients.filter(p =>
      p.name?.toLowerCase().includes(s) || p.surname?.toLowerCase().includes(s)
    )
  }, [q, patients])

  return (
    <>
      <Header />
      <div className="patients-page">
        {/* Centered title */}
        <div className="me-titlebar">
          <h1 className="bd-title">Οι ασθενείς μου</h1>
        </div>

        {/* Controls: search */}
        <div className="me-controls">
          <div className="me-search">
            <input
              type="text"
              className="bd-input"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Αναζήτηση ονόματος ή επωνύμου..."
            />
          </div>
        </div>

        {loading && <div className="patients-status">Φόρτωση…</div>}
        {!loading && error && <div className="patients-error">{error}</div>}

        {!loading && !error && (
          <ul className="patients-grid">
            {filtered.length === 0 && (
              <li className="patients-empty">Δεν βρέθηκαν ασθενείς.</li>
            )}

            {filtered.map(p => (
              <li key={p.id} className="patient-card">
                <div className="patient-avatar home-icon" aria-hidden>
                  <img src={userIcon} alt="" />
                </div>

                <div className="patient-info">
                  <strong>{p.surname} {p.name}</strong>
                  <div className="muted">{p.email}</div>
                  {p.year_of_birth && (
                    <div className="muted">Έτος γέννησης: {p.year_of_birth}</div>
                  )}
                </div>

                {/* Actions (right side) */}
                <div className="patient-actions">
                  <Link className="bd-button btn-view" to={`/patients/${p.id}`}>
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Floating actions (reuse MyExercises styles) */}
      <Link to="/home-clinician" className="fab fab-secondary" aria-label="Πίσω">
        ← Πίσω
      </Link>
      <Link to="/add-patient" className="fab fab-primary" aria-label="Προσθήκη ασθενή">
        ＋ Προσθήκη ασθενή
      </Link>
    </>
  )
}
