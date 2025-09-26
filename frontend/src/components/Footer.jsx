// src/components/Footer.jsx
import React from "react";
import "../../style/Footer.css";

export default function Footer() {
  return (
    <footer className="app-footer">
      <p>© {new Date().getFullYear()} LogiCare — Όλα τα δικαιώματα διατηρούνται</p>
      <p className="footer-sub">Αναπτύχθηκε με ❤️ για τη λογοθεραπεία</p>
    </footer>
  );
}
