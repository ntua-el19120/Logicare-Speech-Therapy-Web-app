import { Link } from "react-router-dom";
import Header from "../../components/Header";

// Import icons
import profileIcon from "../../assets/profile.webp";
import usersIcon from "../../assets/patent.png";      // placeholder
import bundlesIcon from "../../assets/exercises.png"; // placeholder
import dashboardIcon from "../../assets/exercises.png"; // or any other


// CSS (you can reuse HomeClinician.css if styles are generic)
import "../../../style/HomeClinician.css";

export default function HomeAdmin() {
  return (
    <>
      <Header />
      <main className="home">
        <h1 className="home-title">Welcome Admin!</h1>

        <nav className="home-grid">
          <Link to="/admin/users" className="home-card">
            <div className="home-icon" aria-hidden>
              <img src={usersIcon} alt="users" />
            </div>
            <h2>Manage Users</h2>
            <p>View, search, reset passwords, delete accounts.</p>
          </Link>

          <Link to="/admin/bundles" className="home-card">
            <div className="home-icon" aria-hidden>
              <img src={bundlesIcon} alt="bundles" />
            </div>
            <h2>Manage Bundles</h2>
            <p>Create/edit global bundles, view clinician bundles.</p>
          </Link>

          {/* <Link to="/home-admin-dashboard" className="home-card">
            <div className="home-icon" aria-hidden>
              <img src={dashboardIcon} alt="dashboard" />
            </div>
            <h2>Dashboard</h2>
            <p>See system statistics and activity.</p>
          </Link> */}

          <Link to="/myAdminprofile" className="home-card">
            <div className="home-icon" aria-hidden>
              <img src={profileIcon} alt="profile" />
            </div>
            <h2>My Profile</h2>
            <p>Update your admin account details.</p>
          </Link>
        </nav>
      </main>
    </>
  );
}
