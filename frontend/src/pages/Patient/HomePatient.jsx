// src/pages/Clinician/HomePatient.jsx

import { Link }  from 'react-router-dom'
import Header    from '../../components/Header'

import clipboardIcon from "../../assets/exercises.png";
import profileIcon from "../../assets/profile.webp";

//CSS style
import '../../../style/HomePatient.css'

export default function HomePatient() {
    return (
        <>
            <Header />
            <main className="home">
                <h1 className="home-title">Καλώς Ήρθατε!</h1>

                <nav className="home-grid">
                    <Link to="/mypatientexercises" className="home-card">
                        <div className="home-icon" aria-hidden>
                            <img src={clipboardIcon} alt="" />
                        </div>
                        <h2>Οι ασκήσεις μου</h2>
                        <p>Δείτε σετ ασκήσεων.</p>
                    </Link>

                    <Link to="/mypatientprofile" className="home-card">
                        <div className="home-icon" aria-hidden>
                            <img src={profileIcon} alt="" />
                        </div>
                        <h2>Το προφίλ μου</h2>
                        <p>Ενημερώστε τα στοιχεία του λογαριασμού σας.</p>
                    </Link>
                </nav>
            </main>
        </>
    )
}
