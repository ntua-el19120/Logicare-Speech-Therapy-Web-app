// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "../../style/Login.css"; // <-- νέο CSS
import logo from "../assets/OURLOGO.jpg";   // <-- το logo σου
import Footer from "../components/Footer";




export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.type === "clinician") {
        navigate("/home-clinician");
      } else if (loggedInUser.type === "patient") {
        navigate("/home-patient");
      } else {
        navigate("/home-admin");
      }
    } catch {
      setError("Λάθος email ή κωδικός");
    }
  }

return (
  <div className="auth-page">
    {/* Back link πάνω αριστερά */}
    <div className="back-container">
      <Link to="/" className="back-link">← Πίσω στην αρχική</Link>
    </div>

    {/* Main content */}
    <div className="auth-main">
      <div className="auth-card">
        <img src={logo} alt="LogiCare Logo" className="auth-logo" />

        <h2 className="auth-title">Σύνδεση</h2>
        <p className="auth-subtitle">Καλώς ήρθες στο LogiCare 👋</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Κωδικός"
            required
          />
          <button type="submit" className="btn primary">
            Σύνδεση
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        <p className="auth-switch">
          Δεν έχεις λογαριασμό; <Link to="/register">Εγγραφή</Link>
        </p>
      </div>
    </div>

    {/* Footer full-width */}
    <Footer />
  </div>
);


}
