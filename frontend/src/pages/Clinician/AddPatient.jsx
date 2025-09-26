// src/pages/Clinician/AddPatient.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

//Components
import Header    from '../../components/Header'

import '../../../style/MyExercises.css';   // for .fab buttons
import '../../../style/MyPatients.css';    // optional
import '../../../style/AddPatient.css';


export default function AddPatient() {
  const [form, setForm] = useState({
    name: '',
    surname: '',
    year_of_birth: '',
    note: ''                     // ← NEW
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      // send note as well
      const { data } = await axios.post('/api/assign-patient', form, { withCredentials: true })
      setSuccess('✅ Ο ασθενής συνδέθηκε με επιτυχία!')
      // if backend returns the patient id, you can jump straight to details:
      // if (data?.patient?.id) return navigate(`/patients/${data.patient.id}`)
      setTimeout(() => navigate('/mypatients'), 800)
    } catch (err) {
      const msg = err.response?.data?.error || 'Αποτυχία σύνδεσης ασθενή'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="add-patient-container">
        <div className="add-patient-card">
          <h1>Προσθήκη Ασθενή</h1>
          <form onSubmit={onSubmit}>
            <label>
              <strong>Όνομα</strong>
              <input
                className="bd-input"
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                required
              />
            </label>

            <label>
              <strong>Επώνυμο</strong>
              <input
                className="bd-input"
                type="text"
                name="surname"
                value={form.surname}
                onChange={onChange}
                required
              />
            </label>

            <label>
              <strong>Έτος Γέννησης</strong>
              <input
                className="bd-input"
                type="number"
                name="year_of_birth"
                value={form.year_of_birth}
                onChange={onChange}
                min="1900"
                max={new Date().getFullYear()}
                required
              />
            </label>

            {/* NEW: initial note */}
            <label>
              <strong>Σημειώσεις (προαιρετικό)</strong>
              <textarea
                className="bd-input"
                rows={6}
                name="note"
                value={form.note}
                onChange={onChange}
                placeholder="Προσωπικές σημειώσεις για τον ασθενή…"
              />
            </label>

            {error && <div className="bd-error" style={{ marginTop: 8 }}>{error}</div>}
            {success && <div className="bd-loading" style={{ color: 'green' }}>{success}</div>}

            <div className="add-patient-actions">
              <button className="bd-button" type="submit" disabled={loading}>
                {loading ? 'Αποθήκευση…' : 'Σύνδεση Ασθενή'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Floating actions — reuse exact styles from MyExercises */}
      <Link to="/home-clinician" className="fab fab-secondary" aria-label="Πίσω">
        ← Πίσω
      </Link>
      <Link to="/mypatients" className="fab fab-primary" aria-label="Οι ασθενείς μου">
        ← Οι ασθενείς μου
      </Link>
    </>
  )
}
