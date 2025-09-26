// src/components/Header.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { Bell } from 'lucide-react'
import '../../style/header.css'
import logo from '../assets/logo.png'

export default function Header() {
    const { user, loading, logout } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState([])
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef(null)

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/login', { replace: true })
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        if (!user) return
        const fetchNotifications = async () => {
            try {
                const res = await fetch(`/api/users/notifications/${user.id}`)
                if (!res.ok) throw new Error('Failed to fetch notifications')
                const data = await res.json()
                setNotifications(data || []) // plain array of strings
            } catch (err) {
                console.error(err)
            }
        }
        fetchNotifications()
    }, [user])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    if (loading) return null

    return (
        <>
            <header className="app-header">
                <Link
                    to={
                        user?.type === 'clinician'
                            ? '/home-clinician'
                            : user?.type === 'patient'
                                ? '/home-patient'
                                : '/'
                    }
                    className="app-header__brand"
                >
                    <img src={logo} alt="Logo" className="app-header__logo" />
                </Link>

                <div className="app-header__welcome">
                    {user ? (
                        <>
                            <span className="app-header__role">{user.type}</span>{' '}
                            {user.name} {user.surname}!
                        </>
                    ) : (
                        'Welcome!'
                    )}
                </div>

                <div className="app-header__spacer" />

                {/* Notifications */}
                <div className="app-header__notifications" ref={dropdownRef}>
                    <button
                        className="notification-button"
                        onClick={() => setOpen(!open)}
                    >
                        <Bell size={22} />
                        {notifications.length > 0 && (
                            <span className="notification-badge">{notifications.length}</span>
                        )}
                    </button>

                    {open && (
                        <div className="notification-dropdown">
                            <h3>Ειδοποιήσεις</h3>
                            {notifications.length === 0 ? (
                                <p>Δεν υπάρχουν ειδοποιήσεις</p>
                            ) : (
                                <ul>
                                    {notifications.map((exercise, idx) => (
                                        <li key={idx}>
                                            Πρέπει να ολοκληρώσετε την άσκηση{' '}
                                            <strong>{exercise}</strong>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* Logout button */}
                <button className="app-header__logout" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <div className="app-header-spacer" />
        </>
    )
}
