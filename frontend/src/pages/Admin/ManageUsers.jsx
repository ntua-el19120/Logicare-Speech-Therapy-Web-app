import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Header from "../../components/Header";

// Reuse the same style language as MyExercises
import "../../../style/MyExercises.css";

const FILTERS = { ALL: "ALL", PATIENT: "PATIENT", CLINICIAN: "CLINICIAN", ADMIN: "ADMIN" };

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(FILTERS.ALL);

  // fetch users
  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        const { data } = await axios.get("/api/admin/users", { withCredentials: true });
        setUsers(data);
      } catch {
        setError("Failed to load users");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const counts = useMemo(
    () => ({
      all: users.length,
      patients: users.filter((u) => u.type === "patient").length,
      clinicians: users.filter((u) => u.type === "clinician").length,
      admins: users.filter((u) => u.type === "admin").length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = users;
    if (filter === FILTERS.PATIENT) list = list.filter((u) => u.type === "patient");
    else if (filter === FILTERS.CLINICIAN) list = list.filter((u) => u.type === "clinician");
    else if (filter === FILTERS.ADMIN) list = list.filter((u) => u.type === "admin");
    if (!s) return list;
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(s) ||
        u.surname.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
    );
  }, [q, filter, users]);

  // actions
  const resetPassword = async (id) => {
    const { data } = await axios.put(`/api/admin/users/${id}/reset-password`, {}, { withCredentials: true });
    alert(`Temporary password: ${data.tempPassword}`);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await axios.delete(`/api/admin/users/${id}`, { withCredentials: true });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <>
      <Header />

      <main className="bd-container me-content">
        <div className="me-titlebar">
          <h1 className="bd-title">👥 Διαχείριση Χρηστών</h1>
        </div>

        {/* Controls row */}
        <div className="me-controls">
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`me-filter ${filter === FILTERS.ALL ? "active" : ""}`}
              onClick={() => setFilter(FILTERS.ALL)}
            >
              Όλοι ({counts.all})
            </button>
            <button
              className={`me-filter ${filter === FILTERS.PATIENT ? "active" : ""}`}
              onClick={() => setFilter(FILTERS.PATIENT)}
            >
              Ασθενείς ({counts.patients})
            </button>
            <button
              className={`me-filter ${filter === FILTERS.CLINICIAN ? "active" : ""}`}
              onClick={() => setFilter(FILTERS.CLINICIAN)}
            >
              Θεραπευτές ({counts.clinicians})
            </button>
            <button
              className={`me-filter ${filter === FILTERS.ADMIN ? "active" : ""}`}
              onClick={() => setFilter(FILTERS.ADMIN)}
            >
              Admins ({counts.admins})
            </button>
          </div>

          <div className="me-search">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Αναζήτηση ονόματος ή email..."
              className="bd-input"
            />
          </div>
        </div>

        {/* Content */}
        {busy && <div className="bd-loading">Loading…</div>}
        {error && !busy && <div className="bd-error">{error}</div>}

        {!busy && !error && (
          filtered.length === 0 ? (
            <p>Δεν βρέθηκαν χρήστες.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, maxWidth: 800, margin: "1rem auto" }}>
              {filtered.map((u) => (
                <li
                  key={u.id}
                  className="bd-step-card"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem" }}
                >
                  <div>
                    <strong>{u.name} {u.surname}</strong>
                    <div style={{ fontSize: ".9rem", color: "#555" }}>{u.email}</div>
                    <div style={{ fontSize: ".85rem", color: "#777" }}>{u.type} • {u.year_of_birth || "-"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="bd-button btn-view" onClick={() => resetPassword(u.id)}>🔑 Reset</button>
                    <button className="bd-button btn-edit" onClick={() => deleteUser(u.id)}>🗑️ Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {/* Floating actions */}
        <Link to="/home-admin" className="fab fab-secondary">← Αρχική</Link>
      </main>
    </>
  );
}
