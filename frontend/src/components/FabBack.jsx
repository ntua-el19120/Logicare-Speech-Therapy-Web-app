import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../../style/MyExercises.css'

/**
 * Floating back button (bottom-left by default using your .fab .fab-secondary styles)
 *
 * Props:
 * - to?: string        -> if provided, Link to this path; otherwise navigate(-1)
 * - label?: string     -> button text (default "← Πίσω")
 * - replace?: boolean  -> use history replace when using `to`
 * - onClick?: fn       -> custom handler (falls back to navigate(-1) if no `to`)
 * - variant?: "secondary" | "primary" -> maps to .fab-secondary / .fab-primary
 * - className?: string -> extra classes
 */
export default function FabBack({
  to,
  label = '← Πίσω',
  replace = false,
  onClick,
  variant = 'secondary',
  className = ''
}) {
  const navigate = useNavigate()

  if (to) {
    return (
      <Link
        to={to}
        replace={replace}
        className={`fab fab-${variant} ${className}`}
        aria-label="Πίσω"
      >
        {label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={`fab fab-${variant} ${className}`}
      aria-label="Πίσω"
      onClick={onClick || (() => navigate(-1))}
    >
      {label}
    </button>
  )
}
