// src/pages/Clinician/PatientDetail.jsx

import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

//Components
import Header               from '../../components/Header';
import AssignExerciseModal  from '../../components/AssignExerciseModal';
import PreviewExerciseModal from '../../components/PreviewExerciseModal';

//Styles
import '../../../style/MyExercises.css';
import '../../../style/MyPatients.css';
import '../../../style/PatientDetail.css';


export default function PatientDetail() {
  const { id: patientId } = useParams();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Notes
  const [note, setNote] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const saveTimer = useRef(null);

  // Bundles
  const [bundles, setBundles] = useState([]);
  const [bundlesBusy, setBundlesBusy] = useState(true);
  const [bundlesError, setBundlesError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  // Modals
  const [assignOpen, setAssignOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

    const DAY_LABELS = {
        mon: 'Mon',
        tue: 'Tue',
        wed: 'Wed',
        thu: 'Thu',
        fri: 'Fri',
        sat: 'Sat',
        sun: 'Sun'
    };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    axios.get(`/api/patients/${patientId}`, { withCredentials: true })
      .then(res => {
        if (!alive) return;
        setPatient(res.data);
        setNote(res.data?.note ?? '');
        setSavedAt(res.data?.note_updated_at ?? null);
      })
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false };
  }, [patientId]);

  useEffect(() => {
    refreshAssignments();
  }, [patientId]);

  function refreshAssignments() {
    if (!patientId) return;
    let alive = true;
    setBundlesBusy(true);
    axios.get(`/api/bundles/users/${patientId}`, { withCredentials: true })
      .then(res => {
        if (!alive) return;
        const list = (res.data || []).slice().sort((a, b) => a.title.localeCompare(b.title));
        setBundles(list);
      })
      .catch(err => setBundlesError(err.response?.data?.error || err.message))
      .finally(() => alive && setBundlesBusy(false));
    return () => { alive = false };
  }

  async function saveNote() {
    if (!dirty) return;
    try {
      setSaving(true);
      await axios.put(`/api/patients/${patientId}/note`, { note }, { withCredentials: true });
      setSavedAt(new Date().toISOString());
      setDirty(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNote, 800);
    return () => clearTimeout(saveTimer.current);
  }, [note]);

  function onChangeNote(e) {
    setNote(e.target.value);
    setDirty(true);
  }

  async function removeAssignment(bundleId) {
    if (!confirm('Να αφαιρεθεί αυτή η ανάθεση;')) return;
    try {
      setRemovingId(bundleId);
      await axios.delete(`/api/bundles/${bundleId}/users/${patientId}`, { withCredentials: true });
      refreshAssignments();
    } catch (err) {
      alert(err.response?.data?.error || 'Αποτυχία');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <Header />
      <main className="bd-container">
        <h1 className="bd-title" style={{ textAlign: 'center' }}>Στοιχεία Ασθενή</h1>

        {loading && <div className="bd-loading">Φόρτωση…</div>}
        {error && !loading && <div className="bd-error">{error}</div>}

        {patient && !loading && !error && (
          <div className="bd-step-card" style={{ maxWidth: 720, margin: '0 auto' }}>
            <h2>{patient.surname} {patient.name}</h2>
            <div className="muted">Email: {patient.email}</div>
            {patient.year_of_birth && <div className="muted">Έτος γέννησης: {patient.year_of_birth}</div>}
            <hr />
<div className="notes-section">
  <label className="notes-label">
    <strong>Προσωπικές σημειώσεις</strong>
    <textarea
      className="notes-textarea"
      rows={8}
      value={note}
      onChange={onChangeNote}
    />
  </label>
  <div className="notes-actions">
    <button className="bd-button btn-view" onClick={saveNote} disabled={saving || !dirty}>
      {saving ? 'Αποθήκευση…' : 'Αποθήκευση'}
    </button>
    <span className="notes-status">
      {dirty ? 'Μη αποθηκευμένες αλλαγές' :
        savedAt ? `Τελευταία ενημέρωση: ${new Date(savedAt).toLocaleString()}` : ''}
    </span>
  </div>
</div>

          </div>
        )}

        <h2 style={{ textAlign: 'center', marginTop: 40 }}>Ενεργές αναθέσεις ασκήσεων</h2>
        {bundlesBusy && <div className="bd-loading">Φόρτωση…</div>}
        {bundlesError && !bundlesBusy && <div className="bd-error">{bundlesError}</div>}
        {!bundlesBusy && !bundlesError && (
          bundles.length === 0
            ? <p style={{ textAlign: 'center' }}>Δεν υπάρχουν αναθέσεις.</p>
            : <ul style={{ listStyle: 'none', padding: 0 }}>
                  {bundles.map(b => (
                      <li
                          key={b.id}
                          className="bd-step-card"
                          style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}
                      >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong>{b.title}</strong>
                              <div style={{ display: 'flex', gap: 8 }}>
                                  <button className="bd-button btn-view" onClick={() => setPreviewData(b.id)}>View</button>
                                  <button
                                      className="bd-button btn-view"
                                      onClick={() => removeAssignment(b.id)}
                                      disabled={removingId === b.id}
                                  >
                                      {removingId === b.id ? 'Removing…' : 'Delete'}
                                  </button>
                              </div>
                          </div>

                          {/* Show notifications info */}
                          <div style={{ fontSize: '0.9rem', color: '#555' }}>
                              <strong>Notifications:</strong>{' '}
                              {b.notifications && b.notifications.length > 0
                                  ? b.notifications.map(d => DAY_LABELS[d] || d).join(', ')
                                  : 'Disabled'}
                          </div>
                      </li>
                  ))}
              </ul>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
<button
  className="fab-assign"
  onClick={() => setAssignOpen(true)}
>
  ＋ Ανάθεση άσκησης
</button>        </div>
      </main>

      {assignOpen && (
        <AssignExerciseModal
          patientId={patientId}
          onClose={() => setAssignOpen(false)}
          onAssigned={refreshAssignments}
          onPreview={setPreviewData}
        />
      )}

      {previewData && (
        <PreviewExerciseModal
          bundleId={previewData}
          onClose={() => setPreviewData(null)}
        />
      )}

      <Link to="/mypatients" className="fab fab-secondary">← Πίσω</Link>
    </>
  );
}
