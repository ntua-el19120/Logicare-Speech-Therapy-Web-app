// src/components/StepNavigator.jsx


/**
 * Component: StepNavigator
 *
 * Renders “Previous” / “Next” (or “Finish”) controls for paginating
 * through the list of exercises.
 * 
 * Props:
 * • current (number) — zero-based index of current step
 * • total   (number) — total number of steps
 * • onPrev  (fn)    — callback when “Previous” is clicked
 * • onNext  (fn)    — callback when “Next” / “Finish” is clicked
 */


import React from 'react'



export default function StepNavigator({ current, total, onPrev, onNext }) {
  return (
    <nav className="bd-navigation" style={{ marginTop: 16 }}>
      <button onClick={onPrev} disabled={current === 0}>
        Previous
      </button>
      <span style={{ margin: '0 8px' }}>
        {current + 1} / {total}
      </span>
      <button onClick={onNext}>
        {current === total - 1 ? 'Finish' : 'Next'}
      </button>
    </nav>
  )
}