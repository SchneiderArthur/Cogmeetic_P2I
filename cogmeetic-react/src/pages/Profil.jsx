// src/pages/Profil.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, getUser, logout } from '../api';
import '../styles/profil.css';

function Profil() {
    const navigate = useNavigate();
    const user = getUser();
    const CURRENT_USER_ID = user?.id;

    if (!CURRENT_USER_ID) {
        return (
            <p>
                Merci de te connecter d’abord sur <a href="/login">/login</a>
            </p>
        );
    }

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    // mode lecture / édition
    const [editing, setEditing] = useState(false);

    // Charger le profil depuis le backend
    useEffect(() => {
        async function fetchProfile() {
            try {
                setLoading(true);
                setError(null);
                const res = await authFetch('/api/profile');
                if (!res.ok) throw new Error('Erreur API profil');
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                console.error(err);
                setError("Impossible de charger ton profil 😢");
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [CURRENT_USER_ID]);

    function handleLogout() {
        logout();
        navigate('/login');
    }

    function handleChange(field, value) {
        setProfile((prev) => ({
            ...prev,
            [field]: value,
        }));
        setMessage(null);
    }

    async function handleSave() {
        if (!profile) return;

        try {
            setSaving(true);
            setError(null);
            setMessage(null);

            const res = await authFetch('/api/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    bio: profile.bio || '',
                    centresInterets: profile.centresInterets || '',
                    contact: profile.contact || '',
                }),
            });

            if (!res.ok) throw new Error('Erreur API profil');
            const updated = await res.json();
            setProfile(updated);
            setEditing(false);           // 🔒 repasse en mode lecture
            setMessage('Profil enregistré ✅');
        } catch (err) {
            console.error(err);
            setError("Erreur lors de l'enregistrement du profil 😢");
        } finally {
            setSaving(false);
        }
    }

    if (loading || !profile) {
        return <p>Chargement du profil...</p>;
    }

    const initials =
        profile.name
            ?.split(' ')
            .map((p) => p[0])
            .join('')
            .toUpperCase() || '🙂';

    return (
        <div className="page-container profil-page">
            {/* Bouton déconnexion en haut à droite */}
            <div className="profil-top-bar">
                <button className="profil-logout-btn" onClick={handleLogout}>
                    Se déconnecter
                </button>
            </div>

            <div className="profil-card">
                {/* Header avec avatar + nom + bouton modifier */}
                <header className="profil-header">
                    <div className="profil-header-main">
                        <div className="profil-avatar-circle">
                            <span>{initials}</span>
                        </div>
                        <div className="profil-identity">
                            <h2 className="profil-name">{profile.name}</h2>
                            <p className="profil-promo">{profile.promo}</p>
                        </div>
                    </div>

                    <button
                        className="profil-edit-toggle"
                        onClick={() => {
                            setEditing((old) => !old);
                            setMessage(null);
                        }}
                    >
                        {editing ? 'Terminer' : 'Modifier le profil'}
                    </button>
                </header>

                {/* Section bio */}
                <section className="profil-section">
                    <h3>Biographie</h3>
                    {editing ? (
                        <textarea
                            className="profil-input"
                            rows={3}
                            value={profile.bio || ''}
                            onChange={(e) => handleChange('bio', e.target.value)}
                            placeholder="Parle un peu de toi, de ce que tu aimes, etc."
                        />
                    ) : (
                        <p className="profil-text">
                            {profile.bio && profile.bio.trim().length > 0
                                ? profile.bio
                                : 'Ajoute une petite bio pour que ton futur parrain / ta future marraine te découvre.'}
                        </p>
                    )}
                </section>

                {/* Section centres d'intérêt */}
                <section className="profil-section">
                    <h3>Centres d’intérêt</h3>
                    {editing ? (
                        <textarea
                            className="profil-input"
                            rows={3}
                            value={profile.centresInterets || ''}
                            onChange={(e) => handleChange('centresInterets', e.target.value)}
                            placeholder="Ex : Basket, escalade, jeux vidéo, oenologie, pom-pom…"
                        />
                    ) : (
                        <p className="profil-text">
                            {profile.centresInterets && profile.centresInterets.trim().length > 0
                                ? profile.centresInterets
                                : 'Indique tes activités / passions pour aider à trouver de bonnes affinités.'}
                        </p>
                    )}
                </section>

                {/* Section contact */}
                <section className="profil-section">
                    <h3>Contact (Insta, Discord, etc.)</h3>
                    {editing ? (
                        <input
                            className="profil-input"
                            value={profile.contact || ''}
                            onChange={(e) => handleChange('contact', e.target.value)}
                            placeholder="@tonpseudo, ton Discord..."
                        />
                    ) : (
                        <p className="profil-text">
                            {profile.contact && profile.contact.trim().length > 0
                                ? profile.contact
                                : 'Ajoute un moyen de te contacter si tu es ok pour échanger en dehors de Cogmeetic.'}
                        </p>
                    )}
                </section>

                {/* Bouton enregistrer visible uniquement en mode édition */}
                {editing && (
                    <button
                        className="profil-save-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Enregistrement...' : 'Enregistrer mon profil'}
                    </button>
                )}

                {/* Messages statut */}
                {message && <p className="profil-message success">{message}</p>}
                {error && <p className="profil-message error">{error}</p>}
            </div>
        </div>
    );
}

export default Profil;
