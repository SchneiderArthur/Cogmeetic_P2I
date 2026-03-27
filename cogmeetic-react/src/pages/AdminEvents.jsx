// src/pages/AdminEvents.jsx
import { useEffect, useRef, useState } from 'react';
import { authFetch } from '../api';
import '../styles/adminEvents.css';

const API_URL = import.meta.env.VITE_API_ADDRESS;

const EMPTY = { titre: '', date: '', heureDebut: '', heureFin: '', prix: '', image: '' };

// "2025-11-05" → "ven. 5 nov."
function formatDate(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    if (isNaN(d)) return isoDate; // format inconnu, on affiche brut
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

// "20:00" + "01:00" → "20:00 - 01:00"
function buildHoraire(debut, fin) {
    if (!debut && !fin) return '';
    if (!fin) return debut;
    return `${debut} - ${fin}`;
}

// "20:00 - 01:00" → ["20:00", "01:00"]
function splitHoraire(horaire) {
    if (!horaire) return ['', ''];
    const parts = horaire.split(' - ');
    return [parts[0] || '', parts[1] || ''];
}

// calcule la durée automatiquement
function calcDuree(debut, fin) {
    if (!debut || !fin) return '';
    const [h1, m1] = debut.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}h${m > 0 ? String(m).padStart(2, '0') : '00'}`;
}

function AdminEvents() {
    const [events, setEvents] = useState([]);
    const [form, setForm] = useState(EMPTY);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => { fetchEvents(); }, []);

    async function fetchEvents() {
        const res = await authFetch('/api/events');
        setEvents(await res.json());
    }

    function handleChange(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    function startEdit(event) {
        const [heureDebut, heureFin] = splitHoraire(event.horaire);
        setEditingId(event.id);
        setForm({ titre: event.titre, date: event.date, heureDebut, heureFin, prix: event.prix, image: event.image });
        setMessage(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(EMPTY);
        setMessage(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.titre.trim()) { setMessage('Le titre est obligatoire'); return; }

        const horaire = buildHoraire(form.heureDebut, form.heureFin);
        const duree = calcDuree(form.heureDebut, form.heureFin);
        const payload = { titre: form.titre, date: form.date, horaire, duree, prix: form.prix, image: form.image };

        if (editingId) {
            await authFetch(`/api/events/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
            setMessage('Événement modifié ✅');
        } else {
            await authFetch('/api/events', { method: 'POST', body: JSON.stringify(payload) });
            setMessage('Événement ajouté ✅');
        }

        setEditingId(null);
        setForm(EMPTY);
        fetchEvents();
    }

    async function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const data = new FormData();
        data.append('image', file);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: data,
        });
        const json = await res.json();
        if (json.url) handleChange('image', json.url);
        setUploading(false);
    }

    async function handleDelete(id) {
        if (!confirm('Supprimer cet événement ?')) return;
        await authFetch(`/api/events/${id}`, { method: 'DELETE' });
        setMessage('Événement supprimé');
        fetchEvents();
    }

    return (
        <div className="admin-events-container">
            <h1>Admin — Événements 🎉</h1>

            {message && <p className="admin-events-message">{message}</p>}

            <form className="admin-events-form" onSubmit={handleSubmit}>
                <h2>{editingId ? 'Modifier un événement' : 'Ajouter un événement'}</h2>

                <input
                    placeholder="Titre *"
                    value={form.titre}
                    onChange={e => handleChange('titre', e.target.value)}
                />

                <label className="admin-events-label">
                    Date
                    <input
                        type="date"
                        value={form.date}
                        onChange={e => handleChange('date', e.target.value)}
                    />
                </label>

                <div className="admin-events-time-row">
                    <label className="admin-events-label">
                        Début
                        <input
                            type="time"
                            value={form.heureDebut}
                            onChange={e => handleChange('heureDebut', e.target.value)}
                        />
                    </label>
                    <label className="admin-events-label">
                        Fin
                        <input
                            type="time"
                            value={form.heureFin}
                            onChange={e => handleChange('heureFin', e.target.value)}
                        />
                    </label>
                    {form.heureDebut && form.heureFin && (
                        <span className="admin-events-duree">
                            {calcDuree(form.heureDebut, form.heureFin)}
                        </span>
                    )}
                </div>

                <input
                    placeholder="Prix (ex: 4€)"
                    value={form.prix}
                    onChange={e => handleChange('prix', e.target.value)}
                />

                <div className="admin-events-image-row">
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                    <button
                        type="button"
                        className="admin-events-upload-btn"
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                    >
                        {uploading ? 'Envoi...' : '📁 Importer une image'}
                    </button>
                    {form.image && (
                        <img
                            src={form.image.startsWith('http') ? form.image : `${API_URL}${form.image}`}
                            alt="aperçu"
                            className="admin-events-preview"
                        />
                    )}
                </div>

                <div className="admin-events-form-actions">
                    <button type="submit">{editingId ? 'Enregistrer' : 'Ajouter'}</button>
                    {editingId && <button type="button" onClick={cancelEdit}>Annuler</button>}
                </div>
            </form>

            <div className="admin-events-list">
                {events.length === 0 && <p>Aucun événement pour le moment.</p>}
                {events.map(ev => (
                    <div key={ev.id} className="admin-event-row">
                        <div className="admin-event-info">
                            <strong>{ev.titre}</strong>
                            <span>
                                {formatDate(ev.date)}
                                {ev.horaire && ` • ${ev.horaire}`}
                                {ev.prix && ` • ${ev.prix}`}
                            </span>
                        </div>
                        <div className="admin-event-actions">
                            <button onClick={() => startEdit(ev)}>Modifier</button>
                            <button className="delete" onClick={() => handleDelete(ev.id)}>Supprimer</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AdminEvents;
