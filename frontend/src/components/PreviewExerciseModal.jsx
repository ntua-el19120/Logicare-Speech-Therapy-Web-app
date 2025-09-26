// src/components/PreviewExerciseModal.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import MediaViewer from './MediaViewer';
import StepNavigator from './StepNavigator';
import '../../style/MyExercises.css';

export default function PreviewExerciseModal({ bundleId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`/api/bundles/${bundleId}`, { withCredentials: true });
        const exercises = (data.exercises || []).slice().sort((a, b) => a.step - b.step);
        if (alive) setBundle({ ...data, exercises });
      } catch {
        setError('Failed to load preview');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [bundleId]);

  return (
    <>
      <div className="me-modal-overlay show" onClick={onClose} />
      <div className="me-modal open" onClick={e => e.stopPropagation()}>
        <div className="me-modal-header">
          <h2>{bundle?.title || 'Προεπισκόπηση'}</h2>
          <button className="me-close" onClick={onClose}>×</button>
        </div>
        <div className="me-modal-body">
          {loading && <div className="bd-loading">Loading preview…</div>}
          {error && !loading && <div className="bd-error">{error}</div>}

          {bundle && !loading && !error && bundle.exercises.length > 0 && (
            <>
              {(() => {
                const step = bundle.exercises[index];
                return (
                  <div className="bd-step-card">
                    <h3 className="bd-step-number">Step {step.step}</h3>
                    <h4 className="bd-step-title">{step.title}</h4>
                    {step.description && <p>{step.description}</p>}
                    <MediaViewer
                      videoUrl={step.video_file_path ? `/api/exercises/${step.id}/video` : null}
                      audioUrl={step.audio ? `/api/exercises/${step.id}/audio` : null}
                      pictureUrl={step.picture ? `/api/exercises/${step.id}/picture` : null}
                    />
                  </div>
                );
              })()}

              <StepNavigator
                current={index}
                total={bundle.exercises.length}
                onPrev={() => setIndex(i => Math.max(0, i - 1))}
                onNext={() => {
                  if (index >= bundle.exercises.length - 1) {
                    onClose(); // close when last step
                  } else {
                    setIndex(i => i + 1);
                  }
                }}
              />
            </>
          )}

          {bundle && !loading && !error && bundle.exercises.length === 0 && (
            <div className="bd-error">No exercises in this bundle.</div>
          )}
        </div>
      </div>
    </>
  );
}
