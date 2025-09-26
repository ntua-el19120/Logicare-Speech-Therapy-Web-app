// src/hooks/useBundle.js

/**
 * Hook: useBundle
 *
 * Fetches a bundle (and its exercises) by ID from the API.
 * • Manages loading, error, and bundle state.
 * • Sorts exercises by their `step` field.
 * • Returns `{ bundle, loading, error }` for use in components.
 */


import { useState, useEffect } from 'react'
import axios from 'axios'

export default function useBundle(id) {
  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/bundles/${id}`)
      .then(res => {
        const exercises = res.data.exercises.slice().sort((a, b) => a.step - b.step)
        setBundle({ ...res.data, exercises })
      })
      .catch(() => setError('Failed to load bundle.'))
      .finally(() => setLoading(false))
  }, [id])

  return { bundle, loading, error }
}