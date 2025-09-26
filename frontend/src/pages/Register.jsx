// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../style/Login.css"; // Χρησιμοποιούμε το ίδιο CSS με το Login
import logo from "../assets/OURLOGO.jpg";
import Footer from "../components/Footer";

export default function Register() {
  const [formData, setFormData] = useState({
    type: "patient",
    email: "",
    password: "",
    year: "",
    name: "",
    surname: ""
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Ο λογαριασμός δημιουργήθηκε!");
        if (formData.type === "clinician") {
          navigate("/home-clinician");
        } else {
          navigate("/home-patient");
        }
      } else {
        setMessage(`❌ ${data.message || "Σφάλμα κατά την εγγραφή"}`);
      }
    } catch (err) {
      setMessage("❌ Πρόβλημα σύνδεσης με τον server");
    }
  }

  return (
    <div className="auth-page">
      {/* Back link πάνω αριστερά */}
      <div className="back-container">
        <Link to="/" className="back-link">← Πίσω στην αρχική</Link>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <img src={logo} alt="LogiCare Logo" className="auth-logo" />

          <h2 className="auth-title">Εγγραφή</h2>
          <p className="auth-subtitle">Δημιούργησε τον λογαριασμό σου στο LogiCare</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="patient">Ασθενής</option>
              <option value="clinician">Λογοθεραπευτής</option>
            </select>

            <input
              type="text"
              name="name"
              placeholder="Όνομα"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="surname"
              placeholder="Επώνυμο"
              value={formData.surname}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              name="year"
              placeholder="Έτος γέννησης"
              value={formData.year}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Κωδικός"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <button type="submit" className="btn primary">
              Εγγραφή
            </button>
          </form>

          {message && <p className="auth-msg">{message}</p>}

          <p className="auth-switch">
            Έχεις ήδη λογαριασμό; <Link to="/login">Σύνδεση</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
