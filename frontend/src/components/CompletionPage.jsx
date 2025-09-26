import React from 'react'
import { Link } from 'react-router-dom'

export default function CompletionPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          🎉 Exercise Completed!
        </h1>
        <p className="text-gray-700 mb-6">
          You’ve successfully finished all steps.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
