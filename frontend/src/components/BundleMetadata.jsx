import React from 'react'

export default function BundleMetadata({ title, setTitle, globalFlag, setGlobalFlag }) {
  return (
    <div className="bundle-metadata">
      <div>
        <label>Bundle Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="checkbox-row">
        <input
          type="checkbox"
          checked={globalFlag}
          onChange={e => setGlobalFlag(e.target.checked)}
        />
        <label>Global (visible to all users)</label>
      </div>
    </div>
  )
}
