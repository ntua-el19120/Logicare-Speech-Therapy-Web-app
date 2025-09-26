// src/pages/Clinician/CreateClinicianExerciseSet.jsx

import React from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

//Components
import Header                from '../../components/Header'
import { usePersistedState } from '../../hooks/usePersistedState'
import ExerciseStep          from '../../components/ExerciseStep'

//style
import '../../../style/MyExercises.css'       // reuse bd-* styles (cards/buttons)

const STORAGE_KEY = 'createClinicianExerciseSet'

export default function CreateClinicianExerciseSet() {
    const [title, setTitle] = usePersistedState(`${STORAGE_KEY}-title`, '')
    const [exercises, setExercises] = usePersistedState(
        `${STORAGE_KEY}-exs`,
        [{ id: null, step: 1, title: '', description: '', mediaType: 'audio', uploadFile: null, uploadPicture: null }]
    )

    const updateField = (idx, field, value) =>
        setExercises(exs => exs.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex))

    const removeStep = idx =>
        setExercises(exs =>
            exs.filter((_, i) => i !== idx).map((ex, i) => ({ ...ex, step: i + 1 }))
        )

    const addStep = () =>
        setExercises(exs => [
            ...exs,
            {
                id: null,
                step: exs.length + 1,
                title: '',
                description: '',
                mediaType: 'audio',
                uploadFile: exs[exs.length - 1]?.uploadFile ?? null,
                uploadPicture: exs[exs.length - 1]?.uploadPicture ?? null,
            }
        ])

    const handleSubmit = async e => {
        e.preventDefault()
        if (!title.trim()) return alert('Bundle title is required')

        for (let ex of exercises) {
            if (ex.mediaType === 'audio' && (!ex.uploadFile || !ex.uploadPicture)) {
                return alert(`Step ${ex.step} needs both an audio file and a picture`)
            }
            if (ex.mediaType === 'video' && !ex.uploadFile) {
                return alert(`Step ${ex.step} needs a video file`)
            }
        }

        try {
            // create NON-global bundle and auto-assign to clinician
            const { data: bundle } = await axios.post('/api/bundles/clinician', { title }, { withCredentials: true })
            const bundleId = bundle.id

            // upload steps
            await Promise.all(exercises.map(ex => {
                const form = new FormData()
                form.append('bundle_id', bundleId)
                form.append('step', ex.step)
                form.append('title', ex.title)
                form.append('description', ex.description)

                if (ex.mediaType === 'audio') {
                    form.append('audio', ex.uploadFile)
                    form.append('picture', ex.uploadPicture)
                } else {
                    form.append('video', ex.uploadFile)
                }
                return axios.post('/api/exercises', form, { headers: { 'Content-Type': 'multipart/form-data' } })
            }))

            alert('Το σετ δημιουργήθηκε!')
            setTitle('')
            setExercises([{ id: null, step: 1, title: '', description: '', mediaType: 'audio', uploadFile: null, uploadPicture: null }])
            localStorage.removeItem(`${STORAGE_KEY}-title`)
            localStorage.removeItem(`${STORAGE_KEY}-exs`)
        } catch (err) {
            console.error(err)
            alert('Error: ' + (err.response?.data?.error || err.message))
        }
    }
    const navigate = useNavigate()

    return (
        <>
            <Header /> {/* fixed brand header; spacer is rendered by Header.jsx */}

            <div className="bd-container">
                <h1 className="bd-title" style={{ textAlign: 'center' }}>
                    Δημιουργία νέου σετ (Κλινικός)
                </h1>

                <form onSubmit={handleSubmit} className="bundle-form">
                    {/* Title only (no global toggle) */}
                    <div className="bundle-metadata">
                        <div>
                            <label>Τίτλος Σετ</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                            Το σετ θα είναι ορατό μόνο σε εσάς και στους ασθενείς στους οποίους το αναθέτετε.
                        </p>
                    </div>

                    {exercises.map((ex, i) => (
                        <ExerciseStep
                            key={i}
                            mode="create"
                            stepData={ex}
                            index={i}
                            updateField={updateField}
                            removeStep={removeStep}
                        />
                    ))}

                    <div className="actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                        <button type="button" className="bd-button" onClick={addStep}>
                            + Προσθήκη Βήματος
                        </button>
                        <button type="submit" className="bd-button btn-edit">Αποθήκευση Σετ</button>
                    </div>
                </form>
            </div>
            <button
                type="button"
                className="fab fab-secondary"
                aria-label="Πίσω"
                onClick={() => navigate(-1)}>
                ← Πίσω
            </button>
        </>
    )
}
