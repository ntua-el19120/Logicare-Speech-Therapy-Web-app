// src/pages/Admin/HomeAdminDashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Header from "../../components/Header";
import "../../../style/MyExercises.css"; // reuse bd-* style system

export default function HomeAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/admin/stats", {
          withCredentials: true,
        });
        setStats(data);
      } catch (err) {
        setError("Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <Header />

      <main className="bd-container">
        <h1 className="bd-title" style={{ textAlign: "center" }}>
          📊 Admin Dashboard
        </h1>

        {loading && <div className="bd-loading">Loading…</div>}
        {error && !loading && <div className="bd-error">{error}</div>}

        {stats && !loading && !error && (
          <div
            className="stats-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
              marginTop: "2rem",
            }}
          >
            <div className="bd-step-card">
              <h2>Patients</h2>
              <p>{stats.patients}</p>
            </div>
            <div className="bd-step-card">
              <h2>Clinicians</h2>
              <p>{stats.clinicians}</p>
            </div>
            <div className="bd-step-card">
              <h2>Admins</h2>
              <p>{stats.admins}</p>
            </div>
            {stats.activePatients !== undefined && (
              <div className="bd-step-card">
                <h2>Active Patients (this week)</h2>
                <p>{stats.activePatients}</p>
              </div>
            )}
            {stats.mostUsedExercises && stats.mostUsedExercises.length > 0 && (
              <div className="bd-step-card">
                <h2>Most Used Exercises</h2>
                <ul>
                  {stats.mostUsedExercises.map((ex, i) => (
                    <li key={i}>
                      {ex.title} ({ex.usage_count} uses)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
