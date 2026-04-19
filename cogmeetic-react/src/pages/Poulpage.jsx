// src/pages/Poulpage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, getUser } from '../api';
import '../styles/poulpage.css';

function Poulpage() {
    const user = getUser();
    const CURRENT_USER_ID = user?.id;

    if (!CURRENT_USER_ID) {
        return (
            <p>
                Merci de te connecter d’abord sur <a href="/login">/login</a>
            </p>
        );
    }

    const navigate = useNavigate();
    const [allUsers, setAllUsers] = useState([]);
    const [top5, setTop5] = useState([null, null, null, null, null]);
    const [autoMode, setAutoMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setMessage(null);

                // 1) users de l'autre promo + compat
                const resUsers = await authFetch('/api/users');
                if (!resUsers.ok) throw new Error('Erreur users');
                const users = await resUsers.json();

                const sorted = [...users].sort(
                    (a, b) => (b.compatibilite || 0) - (a.compatibilite || 0)
                );
                setAllUsers(sorted);

                // 2) top5 déjà enregistré
                const resTop = await authFetch('/api/top5');
                if (!resTop.ok) throw new Error('Erreur top5');
                const topUsers = await resTop.json();

                if (topUsers.length > 0) {
                    setTop5(topUsers.map((u) => u.id));
                } else {
                    setTop5(sorted.slice(0, 5).map((u) => u.id));
                }
            } catch (err) {
                console.error(err);
                setMessage("Impossible de charger les données Poulpage 😢");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [CURRENT_USER_ID]);

    // ✅ toggle auto
    function handleToggleAuto(e) {
        const checked = e.target.checked;
        setAutoMode(checked);
        setMessage(null);

        if (checked) {
            const auto = [...allUsers]
                .sort((a, b) => (b.compatibilite || 0) - (a.compatibilite || 0))
                .slice(0, 5)
                .map((u) => u.id);
            setTop5(auto);
            setMessage('Top 5 généré automatiquement 🧠');
        }
    }

    // ✅ changement dans un select (rang)
    function handleChangeRank(index, newId) {
        if (!newId) return;

        setTop5((prev) => {
            const filtered = prev.filter((id) => id !== Number(newId));
            const copy = [...filtered];

            while (copy.length < 5) copy.push(null);
            copy[index] = Number(newId);
            return copy.slice(0, 5);
        });
    }

    // ✅ sauvegarde du top 5
    async function handleSaveTop5() {
        try {
            setSaving(true);
            setMessage(null);

            const cleanTop = top5.filter(Boolean);

            const res = await authFetch('/api/top5', {
                method: 'POST',
                body: JSON.stringify({ top5: cleanTop }),
            });

            if (!res.ok) throw new Error('Erreur API');
            await res.json();

            setMessage('Top 5 enregistré ✅');
        } catch (err) {
            console.error(err);
            setMessage("Erreur lors de l'enregistrement du Top 5 😢");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p>Chargement du Top 5...</p>;

    const effectiveTop5 = top5.length ? top5 : [null, null, null, null, null];

    return (
        <div className="page-container poulpage-container">
            <div className="poul-card">
                {/* Titre */}
                <h2 className="poul-title">Classe ton Top 5 🐙</h2>

                {/* Message éventuel */}
                {message && <p className="poul-message">{message}</p>}

                {/* Checkbox algo */}
                <label className="poul-auto-row">
                    <input
                        type="checkbox"
                        checked={autoMode}
                        onChange={handleToggleAuto}
                    />
                    <span>Je laisse l’algorithme choisir pour moi</span>
                </label>

                {/* Slots Top 5 */}
                <div className="poul-slots">
                    {effectiveTop5.map((value, index) => (
                        <div
                            key={index}
                            className={`poul-slot rank-${index + 1}`}
                        >
                            <div className="poul-rank">{index + 1}</div>

                            <div className="poul-slot-inner">
                                <div className="poul-avatar">🐙</div>

                                <select
                                    className="poul-select"
                                    value={value || ''}
                                    onChange={(e) =>
                                        handleChangeRank(index, e.target.value)
                                    }
                                    disabled={autoMode}
                                >
                                    <option value="">
                                        — Choisir un utilisateur —
                                    </option>
                                    {allUsers.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} (
                                            {typeof u.compatibilite === 'number'
                                                ? `${Math.round(
                                                    u.compatibilite * 100
                                                )}%`
                                                : '0%'}
                                            )
                                        </option>
                                    ))}
                                </select>

                                {value && (
                                    <button
                                        className="poul-profil-btn"
                                        onClick={() => navigate(`/profil/${value}`)}
                                        title="Voir le profil"
                                    >
                                        👤
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Texte d’aide */}
                <div className="poul-help-text">
                    <p>
                        Classez, dans l&apos;ordre de vos préférences, les
                        personnes avec lesquelles vous avez ressenti le plus
                        d&apos;affinités.
                    </p>
                    <p>
                        Si le ressenti est partagé et qu&apos;il y a un match,
                        vous en serez informé lors des sessions de poulpage !
                    </p>
                </div>

                {/* Barre temps restant */}
                <div className="poul-timer-card">
                    <div className="poul-timer-header">
                        Temps restant avant Session Poulpage
                    </div>
                    <div className="poul-timer-body">
                        <span className="poul-timer-icon">❗</span>
                        <span className="poul-timer-text">3 semaines</span>
                        <span className="poul-timer-icon">⏰</span>
                    </div>
                </div>

                {/* Bouton de sauvegarde */}
                <button
                    className="poul-save-btn"
                    onClick={handleSaveTop5}
                    disabled={saving}
                >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder mon Top 5'}
                </button>
            </div>
        </div>
    );
}

export default Poulpage;
