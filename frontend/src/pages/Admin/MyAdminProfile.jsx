// src/pages/MyProfile.jsx


import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

//Components
import Header from '../../components/Header'
import { useAuth } from '../../AuthContext'

//icons
import profileIcon from '../../assets/profile.webp'

//CSS
import '../../../style/MyProfile.css'



export default function MyProfile() {
  const { user, loading, logout } = useAuth()
  const [displayUser, setDisplayUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ name: '', surname: '', year_of_birth: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const navigate = useNavigate() 



  
    const [showPwdForm, setShowPwdForm] = useState(false);
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd1, setNewPwd1] = useState('');
    const [newPwd2, setNewPwd2] = useState('');
    const [pwdError, setPwdError] = useState('');
    const [pwdOk, setPwdOk] = useState('');


    const changePassword = async () => {
  setPwdError(''); setPwdOk('');
  if (!oldPwd || !newPwd1 || !newPwd2) {
    setPwdError('Συμπλήρωσε όλα τα πεδία.');
    return;
  }
  if (newPwd1 !== newPwd2) {
    setPwdError('Οι νέοι κωδικοί δεν ταιριάζουν.');
    return;
  }
  try {
    await axios.put(`/api/users/${displayUser.id}/password`, {
      oldPassword: oldPwd,
      newPassword: newPwd1,
    }, { withCredentials: true });
    setPwdOk('Ο κωδικός ενημερώθηκε!');
    setOldPwd(''); setNewPwd1(''); setNewPwd2('');
    setShowPwdForm(false);
  } catch (e) {
    setPwdError(e.response?.data?.error || 'Αποτυχία αλλαγής κωδικού.');
  }
};

  

  useEffect(() => {
    if (!loading && user) {
      setDisplayUser(user)
      setForm({
        name: user.name || '',
        surname: user.surname || '',
        year_of_birth: user.year_of_birth ?? '',
        email: user.email || '',
      })
    }
  }, [loading, user])

  if (loading) return <div>Loading profile...</div>
  if (!user || !displayUser) return <div>Error: No user data found.</div>

  const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : '')

  const startEdit = () => {
    setForm({
      name: displayUser.name || '',
      surname: displayUser.surname || '',
      year_of_birth: displayUser.year_of_birth ?? '',
      email: displayUser.email || '',
    })
    setIsEditing(true)
    setError('')
    setOk('')
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setError('')
    setOk('')
  }

  const onChange = e => {
    const { name, value } = e.target
    setForm(f => ({
      ...f,
      [name]: name === 'year_of_birth' ? (value === '' ? '' : Number(value)) : value
    }))
  }

  const validate = () => {
    if (!form.name.trim() || !form.surname.trim()) return 'Συμπλήρωσε όνομα & επώνυμο.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Μη έγκυρο email.'
    const y = Number(form.year_of_birth)
    const now = new Date().getFullYear()
    if (form.year_of_birth !== '' && (y < 1900 || y > now)) return 'Μη έγκυρο έτος γέννησης.'
    return ''
  }

  const save = async () => {
    const msg = validate()
    if (msg) { setError(msg); return }

    try {
      setSaving(true); setError(''); setOk('')
      await axios.put(`/api/users/${displayUser.id}`, {
        name: form.name,
        surname: form.surname,
        email: form.email,
        year_of_birth: form.year_of_birth === '' ? null : Number(form.year_of_birth),
        type: displayUser.type,  // <-- keep existing type so it’s not lost
      }, { withCredentials: true })


      const { data } = await axios.get('/api/me', { withCredentials: true })
      setDisplayUser(data)
      setOk('Αποθηκεύτηκε!')
      setIsEditing(false)
    } catch (e) {
      setError(e.response?.data?.error || 'Κάτι πήγε στραβά.')
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async () => {
    const confirmed = window.confirm(
      'Είστε σίγουροι ότι θέλετε να διαγράψετε το λογαριασμό σας; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί!'
    )
    if (!confirmed) return

    try {
      await axios.delete(`/api/users/${displayUser.id}`, { withCredentials: true })
      await logout()
      navigate('/login', { replace: true }) // <-- REDIRECT straight to login
    } catch (e) {
      alert('Η διαγραφή απέτυχε.')
    }
  }

  return (
    <>
      <Header />
      <main className="profile-page">
        <h1 className="home-title">Το προφίλ μου</h1>

        <div className="profile-card">
          <div className="profile-icon">
            <img src={profileIcon} alt="Profile icon" />
          </div>

          {!isEditing ? (
            <div className="profile-info">
              <p><strong>Όνομα:</strong> {displayUser.name || '—'}</p>
              <p><strong>Επώνυμο:</strong> {displayUser.surname || '—'}</p>
              <p><strong>Έτος Γέννησης:</strong> {displayUser.year_of_birth ?? '—'}</p>
              <p><strong>Email:</strong> {displayUser.email || '—'}</p>
              <p><strong>Ιδιότητα:</strong> {cap(displayUser.type) || '—'}</p>
            </div>
          ) : (
            <div className="profile-form">
              <label className="field">
                <span>Όνομα</span>
                <input name="name" value={form.name} onChange={onChange} />
              </label>
              <label className="field">
                <span>Επώνυμο</span>
                <input name="surname" value={form.surname} onChange={onChange} />
              </label>
              <label className="field">
                <span>Έτος Γέννησης</span>
                <input type="number" name="year_of_birth" value={form.year_of_birth} onChange={onChange} />
              </label>
              <label className="field full">
                <span>Email</span>
                <input type="email" name="email" value={form.email} onChange={onChange} />
              </label>
            </div>
          )}

          <div className="profile-actions">
            {!isEditing ? (
              <button className="btn" onClick={startEdit}>Edit</button>
            ) : (
              <>
                <button className="btn secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
                <button className="btn primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
          </div>

          {error && <div className="profile-msg error">{error}</div>}
          {ok && <div className="profile-msg ok">{ok}</div>}

          {/* Delete Account button */}
          <div className="delete-account-container">
            <button className="delete-account-btn" onClick={deleteAccount}>
              Διαγραφή Λογαριασμού
            </button>
          </div>
{/* Password change section */}
{!showPwdForm ? (
  <div className="profile-actions">
    <button className="btn secondary" onClick={() => setShowPwdForm(true)}>
      Αλλαγή Κωδικού
    </button>
  </div>
) : (
  <div className="password-form">
    <h3 className="section-title">Αλλαγή Κωδικού</h3>

    <div className="field full">
      <label>Παλιός κωδικός</label>
      <input
        type="password"
        value={oldPwd}
        onChange={e => setOldPwd(e.target.value)}
      />
    </div>

    <div className="field full">
      <label>Νέος κωδικός</label>
      <input
        type="password"
        value={newPwd1}
        onChange={e => setNewPwd1(e.target.value)}
      />
    </div>

    <div className="field full">
      <label>Επαλήθευση νέου</label>
      <input
        type="password"
        value={newPwd2}
        onChange={e => setNewPwd2(e.target.value)}
      />
    </div>

    <div className="profile-actions">
      <button
        className="btn secondary"
        onClick={() => {
          setShowPwdForm(false) // hide form
          setOldPwd('')
          setNewPwd1('')
          setNewPwd2('')
        }}
      >
        Άκυρο
      </button>
      <button className="btn primary" onClick={changePassword}>
        Αποθήκευση
      </button>
    </div>

    {pwdError && <div className="profile-msg error">{pwdError}</div>}
    {pwdOk && <div className="profile-msg ok">{pwdOk}</div>}
  </div>
)}

        </div>
      </main>
          <Link to="/home-admin" className="fab fab-secondary">
      ← Πίσω
    </Link>
    </>
  )
}
