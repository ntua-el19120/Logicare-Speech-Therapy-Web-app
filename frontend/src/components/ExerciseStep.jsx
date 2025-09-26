import React from 'react'
import MediaViewer from './MediaViewer'

export default function ExerciseStep({
  stepData,
  index,
  updateField,
  removeStep,
  mode = 'edit'   // 'edit' for EditBundle, 'create' for CreateExerciseSet
}) {
  const {
    id,
    step,
    title,
    description,
    mediaType,
    uploadFile,
    uploadPicture
  } = stepData

  return (
    <div className="bd-step-card exercise-step">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2 className="bd-step-number">Step {step}</h2>
        <button
          type="button"
          className="bd-button"
          onClick={() => removeStep(index)}
        >
          Remove
        </button>
      </div>

      <label>
        <strong>Title</strong>
        <input
          type="text"
          value={title}
          onChange={e => updateField(index, 'title', e.target.value)}
          className="bd-input"
          required
        />
      </label>

      <label>
        <strong>Description</strong>
        <textarea
          value={description}
          onChange={e => updateField(index, 'description', e.target.value)}
          className="bd-input"
        />
      </label>

      {/* Only show media-type chooser on new (id == null) steps */}
      {id == null && (
        <div style={{ margin: '1rem 0' }}>
          <label style={{ marginRight: '1rem' }}>
            <input
              type="radio"
              name={`mediaType-${index}`}
              value="audio"
              checked={mediaType === 'audio'}
              onChange={() => updateField(index, 'mediaType', 'audio')}
            />{' '}
            Audio + Picture
          </label>
          <label>
            <input
              type="radio"
              name={`mediaType-${index}`}
              value="video"
              checked={mediaType === 'video'}
              onChange={() => updateField(index, 'mediaType', 'video')}
            />{' '}
            Video Only
          </label>
        </div>
      )}

      {/* Preview for existing media in Edit mode */}
      {id != null && (
        <div className="bd-media">
          <MediaViewer
            videoUrl={mediaType === 'video' ? `/api/exercises/${id}/video` : null}
            audioUrl={mediaType === 'audio' ? `/api/exercises/${id}/audio` : null}
            pictureUrl={mediaType === 'audio' ? `/api/exercises/${id}/picture` : null}
          />
        </div>
      )}

      {/* File inputs as styled buttons */}
      {mediaType === 'video' ? (
        <label className="bd-button" style={{ marginTop: '1rem' }}>
          {mode === 'create' ? 'Add Video' : 'Replace Video'}
          <input
            type="file"
            accept="video/*"
            onChange={e => {
              const f = e.target.files[0]
              if (f?.type.startsWith('video/')) updateField(index, 'uploadFile', f)
              else alert('Please choose a valid video file')
            }}
            style={{ display: 'none' }}
          />
        </label>
      ) : (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <label className="bd-button">
            {mode === 'create' ? 'Add Audio' : 'Replace Audio'}
            <input
              type="file"
              accept="audio/*"
              onChange={e => {
                const f = e.target.files[0]
                if (f?.type.startsWith('audio/')) updateField(index, 'uploadFile', f)
                else alert('Please choose a valid audio file')
              }}
              style={{ display: 'none' }}
            />
          </label>
          <label className="bd-button">
            {mode === 'create' ? 'Add Picture' : 'Replace Picture'}
            <input
              type="file"
              accept="image/*"
              onChange={e => updateField(index, 'uploadPicture', e.target.files[0])}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}
    </div>
  )
}
