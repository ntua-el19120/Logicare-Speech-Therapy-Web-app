import React from 'react'
import axios from 'axios'
import { usePersistedState } from '../hooks/usePersistedState'
import BundleMetadata from './BundleMetadata'
import ExerciseStep from './ExerciseStep'

const STORAGE_KEY = 'createExerciseSetForm'

export default function CreateExerciseSet() {
  const [title, setTitle] = usePersistedState(`${STORAGE_KEY}-title`, '')
  const [globalFlag, setGlobalFlag] = usePersistedState(`${STORAGE_KEY}-global`, false)
  const [exercises, setExercises] = usePersistedState(
    `${STORAGE_KEY}-exs`,
    [{ id: null, step: 1, title: '', description: '', mediaType: 'audio', uploadFile: null, uploadPicture: null }]
  )

  const updateField = (idx, field, value) =>
    setExercises(exs => exs.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex))

  const removeStep = idx =>
    setExercises(exs =>
      exs
        .filter((_, i) => i !== idx)
        .map((ex, i) => ({ ...ex, step: i + 1 }))
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
        uploadFile: exs[exs.length - 1]?.uploadFile || null,
        uploadPicture: exs[exs.length - 1]?.uploadPicture || null,
      }
    ])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!title.trim()) {
      return alert('Bundle title is required')
    }
    for (let ex of exercises) {
      if (ex.mediaType === 'audio' && (!ex.uploadFile || !ex.uploadPicture)) {
        return alert(`Step ${ex.step} needs both an audio file and a picture`)
      }
      if (ex.mediaType === 'video' && !ex.uploadFile) {
        return alert(`Step ${ex.step} needs a video file`)
      }
    }

    try {
      // 1) create bundle
      const { data: bundle } = await axios.post('/api/bundles', { title, global: globalFlag })
      const bundleId = bundle.id

      // 2) upload exercises
      await Promise.all(
        exercises.map(ex => {
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

          return axios.post('/api/exercises', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        })
      )

      alert('Exercise set created!')
      // reset form + storage
      setTitle('')
      setGlobalFlag(false)
      setExercises([{ id: null, step: 1, title: '', description: '', mediaType: 'audio', uploadFile: null, uploadPicture: null }])
      localStorage.removeItem(`${STORAGE_KEY}-title`)
      localStorage.removeItem(`${STORAGE_KEY}-global`)
      localStorage.removeItem(`${STORAGE_KEY}-exs`)
    } catch (err) {
      console.error(err)
      alert('Error: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <div className="bd-container">
      <h1 className="bd-title" style={{ textAlign: 'center' }}>
        Create New Exercise Set
      </h1>
      <form onSubmit={handleSubmit} className="bundle-form">
        <BundleMetadata
          title={title}
          setTitle={setTitle}
          globalFlag={globalFlag}
          setGlobalFlag={setGlobalFlag}
        />

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

        <div className="actions">
          <button type="button" className="bd-button" onClick={addStep}>
            + Add Step
          </button>
          <button type="submit" className="bd-button">
            Save Exercise Set
          </button>
        </div>
      </form>
    </div>
  )
}
