// src/pages/Clinician/HomeClinician.jsx

import { Link }  from 'react-router-dom'
import Header    from '../../components/Header'


// Import icons from your assets
import userIcon from '../../assets/patent.png'
import clipboardIcon from '../../assets/exercises.png'
import profileIcon from '../../assets/profile.webp'

//CSS style
import '../../../style/HomeClinician.css'


export default function HomeClinician() {
  return (
    <>
      <Header />
      <main className="home">
        <h1 className="home-title">Καλώς Ήρθατε!</h1>

        <nav className="home-grid">
          <Link to="/mypatients" className="home-card">
            <div className="home-icon" aria-hidden>
              <img src={userIcon} alt="" />
            </div>
            <h2>Οι ασθενείς μου</h2>
            <p>Δείτε και διαχειριστείτε τους ασθενείς σας.</p>
          </Link>

          <Link to="/myexercises" className="home-card">
            <div className="home-icon" aria-hidden>
              <img src={clipboardIcon} alt="" />
            </div>
            <h2>Οι έτοιμες ασκήσεις μου</h2>
            <p>Δείτε ή επεξεργαστείτε σετ ασκήσεων.</p>
          </Link>

          <Link to="/myprofile" className="home-card">
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
