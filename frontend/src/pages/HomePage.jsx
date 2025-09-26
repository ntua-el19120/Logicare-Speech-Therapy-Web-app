// src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/OURLOGO.jpg"; 
import "../../style/HomePage.css";

export default function HomePage() {
  return (
<div className="homepage">
  <section className="hero">
    <img src={logo} alt="LogiCare logo" />
    <h1>Καλώς ήρθατε στο LogiCare</h1>
    <p>Η πλατφόρμα λογοθεραπείας που φέρνει κοντά ασθενείς και ειδικούς.</p>
    <div className="actions">
      <Link to="/login" className="btn primary">Σύνδεση</Link>
      <Link to="/register" className="btn secondary">Εγγραφή</Link>
    </div>
  </section>

  <section className="info">
    <img src={logo} alt="Speech therapy illustration" />
    <div className="info-text">
      <h2>Τι είναι το LogiCare;</h2>
      <p>
        Το LogiCare γεφυρώνει το κενό ανάμεσα στη συνεδρία και την εξάσκηση στο σπίτι.
        Ο λογοθεραπευτής δημιουργεί εξατομικευμένα ασκησιολόγια, ενώ ο ασθενής
        έχει σαφείς οδηγίες, εικόνες και ηχογραφήσεις.
      </p>
      <p>
        Στόχος μας είναι η συνεχής καθοδήγηση, η συνέπεια στην εξάσκηση
        και η καλύτερη αποκατάσταση της φωνής και της επικοινωνίας.
      </p>
    </div>
  </section>

  <footer style={{textAlign:"center", padding:"1rem", fontSize:"0.9rem", color:"#777"}}>
    © 2025 LogiCare | Όλα τα δικαιώματα διατηρούνται
  </footer>
</div>



  );
}
