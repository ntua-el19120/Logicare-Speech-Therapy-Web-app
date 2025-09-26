// src/components/AssignExerciseModal.jsx
import {useEffect, useState} from 'react';
import axios from 'axios';
import '../../style/MyExercises.css';

function uniqById(list) {
    const map = new Map();
    list.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
}

const DAYS = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

export default function AssignExerciseModal({ patientId, onClose, onAssigned, onPreview }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bundles, setBundles] = useState([]);
    const [assigningId, setAssigningId] = useState(null);
    const [selectedDaysByBundle, setSelectedDaysByBundle] = useState({}); // { [bundleId]: ['mon','wed'] }

    useEffect(() => {
        let alive = true;
        async function load() {
            try {
                setLoading(true);
                setError(null);
                const me = await axios.get('/api/me', { withCredentials: true });
                const clinicianId = me.data?.id;

                const [globals, mine] = await Promise.all([
                    axios.get('/api/globalexercises', { withCredentials: true }),
                    axios.get(`/api/bundles/users/${clinicianId}`, { withCredentials: true })
                ]);

                const merged = uniqById([...(globals.data || []), ...(mine.data || [])]);
                merged.sort((a, b) => a.title.localeCompare(b.title));

                if (alive) setBundles(merged);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, []);

    function toggleDay(bundleId, dayKey) {
        setSelectedDaysByBundle(prev => {
            const current = prev[bundleId] || [];
            const next = current.includes(dayKey)
                ? current.filter(d => d !== dayKey)
                : [...current, dayKey];
            return { ...prev, [bundleId]: next };
        });
    }

    async function assignBundle(bundleId) {
        const notifications = selectedDaysByBundle[bundleId] || []
        try {
            setAssigningId(bundleId);
            await axios.post(
                `/api/bundles/${bundleId}/users/${patientId}`,
                { notifications },
                { withCredentials: true }
            );
            onAssigned?.();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || 'Αποτυχία ανάθεσης');
        } finally {
            setAssigningId(null);
        }
    }

    return (
        <>
            <div className="me-modal-overlay show" onClick={onClose} />
            <div className="me-modal open" onClick={e => e.stopPropagation()}>
                <div className="me-modal-header">
                    <h2>Διαθέσιμες Ασκήσεις</h2>
                    <button className="me-close" onClick={onClose}>×</button>
                </div>
                <div className="me-modal-body">
                    {loading && <div className="bd-loading">Φόρτωση…</div>}
                    {error && !loading && <div className="bd-error">{error}</div>}
                    {!loading && !error && (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {bundles.map(b => {
                                const selected = selectedDaysByBundle[b.id] || [];
                                return (
                                    <li
                                        key={b.id}
                                        className="bd-step-card"
                                        style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong>{b.title}</strong>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="bd-button btn-view" onClick={() => onPreview(b.id)}>View</button>
                                                <button
                                                    className="bd-button btn-view"
                                                    onClick={() => assignBundle(b.id)}
                                                    disabled={assigningId === b.id}
                                                >
                                                    {assigningId === b.id ? 'Assigning…' : 'Assign'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Constant text field */}
                                        <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: 4 }}>
                                            Enable Notifications
                                        </div>

                                        {/* Day selector for this bundle */}
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {DAYS.map(d => {
                                                const isActive = selected.includes(d.key);
                                                return (
                                                    <button
                                                        key={d.key}
                                                        className={`bd-button ${isActive ? 'btn-active' : ''}`}
                                                        onClick={() => toggleDay(b.id, d.key)}
                                                    >
                                                        {d.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}
