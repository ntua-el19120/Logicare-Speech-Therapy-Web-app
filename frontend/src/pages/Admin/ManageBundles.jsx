import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Components
import Header from "../../components/Header";
import MediaViewer from "../../components/MediaViewer";
import StepNavigator from "../../components/StepNavigator";

// styles
import "../../../style/MyExercises.css";

const uniqById = (arr) => {
  const seen = new Set();
  return arr.filter((b) => (seen.has(b.id) ? false : seen.add(b.id)));
};

const FILTERS = { ALL: "ALL", GLOBAL: "GLOBAL", CLINICIAN: "CLINICIAN" };

export default function ManageBundles() {
  const [bundles, setBundles] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [deletingId, setDeletingId] = useState(null);

  // drawer state
  const [open, setOpen] = useState(false);

  // preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewBundle, setPreviewBundle] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key !== "Escape") return;
      if (previewOpen) {
        closePreview();
        return;
      }
      if (open) setOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, previewOpen]);

  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        const { data } = await axios.get("/api/admin/bundles", {
          withCredentials: true,
        });
        const merged = uniqById(data || []);
        merged.sort((a, b) => a.title.localeCompare(b.title));
        setBundles(merged);
      } catch {
        setError("Failed to load bundles");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const counts = useMemo(
    () => ({
      all: bundles.length,
      global: bundles.filter((b) => b.global).length,
      clinician: bundles.filter((b) => !b.global).length,
    }),
    [bundles]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = bundles;
    if (filter === FILTERS.GLOBAL) list = list.filter((b) => b.global);
    else if (filter === FILTERS.CLINICIAN) list = list.filter((b) => !b.global);
    if (!s) return list;
    return list.filter((b) => b.title.toLowerCase().includes(s));
  }, [q, filter, bundles]);

  const onDelete = async (bundle) => {
    if (!bundle.global) return; // admin can only delete global
    if (!window.confirm(`Delete “${bundle.title}”?`)) return;
    try {
      setDeletingId(bundle.id);
      await axios.delete(`/api/admin/bundles/${bundle.id}`, {
        withCredentials: true,
      });
      setBundles((prev) => prev.filter((b) => b.id !== bundle.id));
    } catch (e) {
      alert("Delete failed: " + (e.response?.data?.error || e.message));
    } finally {
      setDeletingId(null);
    }
  };

  const openPreview = async (bundleId) => {
    try {
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewIndex(0);

      const { data } = await axios.get(`/api/bundles/${bundleId}`, {
        withCredentials: true,
      });
      const exercises = (data.exercises || [])
        .slice()
        .sort((a, b) => a.step - b.step);
      setPreviewBundle({ ...data, exercises });
    } catch {
      setPreviewError("Failed to load preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewBundle(null);
    setPreviewIndex(0);
  };

  return (
    <>
      <Header />

      {/* Drawer overlay */}
      <div
        className={`me-overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <aside
        id="filter-drawer"
        className={`me-drawer ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        <div className="me-drawer-header">
          <h2>Φίλτρα</h2>
          <button
            className="me-close"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
          >
            ×
          </button>
        </div>

        <button
          className={`me-filter ${filter === FILTERS.ALL ? "active" : ""}`}
          onClick={() => setFilter(FILTERS.ALL)}
        >
          Όλα ({counts.all})
        </button>
        <button
          className={`me-filter ${filter === FILTERS.GLOBAL ? "active" : ""}`}
          onClick={() => setFilter(FILTERS.GLOBAL)}
        >
          Global ({counts.global})
        </button>
        <button
          className={`me-filter ${filter === FILTERS.CLINICIAN ? "active" : ""}`}
          onClick={() => setFilter(FILTERS.CLINICIAN)}
        >
          Clinician ({counts.clinician})
        </button>
      </aside>

      {/* Page content */}
      <main className="bd-container me-content">
        {/* Title centered */}
        <div className="me-titlebar">
          <h1 className="bd-title">📦 Διαχείριση Bundles</h1>
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
              onChange={(e) => setQ(e.target.value)}
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
<ul
  style={{
    listStyle: "none",
    padding: 0,
    maxWidth: 800,
    margin: "1rem auto",
  }}
>
  {filtered.map((b) => (
    <li
      key={b.id}
      className="bd-step-card"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <strong>{b.title}</strong>{" "}
{b.global
  ? "🌍"
  : `👤 Created by clinician ${b.creator_name || ""} ${b.creator_surname || ""}`}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {/* Always available */}
        <button
          className="bd-button btn-view"
          onClick={() => openPreview(b.id)}
        >
          View
        </button>

        {/* Only global bundles get Edit/Delete */}
        {b.global && (
          <>
            <button
              className="bd-button btn-edit"
              onClick={() => navigate(`/admin/bundles/${b.id}/edit`)}
            >
              Edit
            </button>
            <button
              className="bd-button btn-view"
              onClick={() => onDelete(b)}
              disabled={deletingId === b.id}
            >
              {deletingId === b.id ? "Deleting…" : "Delete"}
            </button>
          </>
        )}
      </div>
    </li>
  ))}
</ul>

          )
        )}
      </main>

      {/* PREVIEW MODAL */}
      <div
        className={`me-modal-overlay ${previewOpen ? "show" : ""}`}
        onClick={closePreview}
      />
      <div
        className={`me-modal ${previewOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bundle-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="me-modal-header">
          <h2 id="bundle-preview-title">
            {previewBundle ? previewBundle.title : "Προεπισκόπηση"}
          </h2>
          <button
            className="me-close"
            onClick={closePreview}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        <div className="me-modal-body">
          {previewLoading && <div className="bd-loading">Loading preview…</div>}
          {previewError && !previewLoading && (
            <div className="bd-error">{previewError}</div>
          )}

          {previewBundle &&
            !previewLoading &&
            !previewError &&
            previewBundle.exercises.length > 0 && (
              <>
                {(() => {
                  const step = previewBundle.exercises[previewIndex];
                  const videoUrl = step.video_file_path
                    ? `/api/exercises/${step.id}/video`
                    : null;
                  const audioUrl = step.audio
                    ? `/api/exercises/${step.id}/audio`
                    : null;
                  const pictureUrl = step.picture
                    ? `/api/exercises/${step.id}/picture`
                    : null;

                  return (
                    <div className="bd-step-card">
                      <h3 className="bd-step-number">Step {step.step}</h3>
                      <h4 className="bd-step-title">{step.title}</h4>
                      {step.description && (
                        <p className="bd-description">{step.description}</p>
                      )}

                      <div className="bd-media">
                        <MediaViewer
                          videoUrl={videoUrl}
                          audioUrl={audioUrl}
                          pictureUrl={pictureUrl}
                        />
                      </div>
                    </div>
                  );
                })()}

                <StepNavigator
                  current={previewIndex}
                  total={previewBundle.exercises.length}
                  onPrev={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  onNext={() => {
                    setPreviewIndex((i) => {
                      const last = previewBundle.exercises.length - 1;
                      return i >= last ? (closePreview(), i) : i + 1;
                    });
                  }}
                />
              </>
            )}

          {previewBundle &&
            !previewLoading &&
            !previewError &&
            previewBundle.exercises.length === 0 && (
              <div className="bd-error">No exercises in this bundle.</div>
            )}
        </div>
      </div>

      {/* Floating actions */}
      <Link
        to="/home-admin"
        className="fab fab-secondary"
        aria-label="Αρχική"
      >
        ← Αρχική
      </Link>
      <Link
        to="/admin/bundles/create"
        className="fab fab-primary"
        aria-label="Νέο Global Bundle"
      >
        ＋ Νέο Global
      </Link>
    </>
  );
}
