// src/pages/AdminMatches.jsx
import { useEffect, useState } from 'react';
import '../styles/adminMatches.css';

const API_URL = import.meta.env.VITE_API_ADDRESS;

function AdminMatches() {
    const [data, setData] = useState(null);   // { matches, unmatched1, unmatched2 }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchMatches() {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`${API_URL}/api/matches`);
                if (!res.ok) throw new Error('Erreur API /api/matches');
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error(err);
                setError("Impossible de charger les couples 😢");
            } finally {
                setLoading(false);
            }
        }

        fetchMatches();
    }, []);

    if (loading) return <p>Calcul des couples en cours...</p>;
    if (error) return <p>{error}</p>;
    if (!data) return <p>Aucune donnée de matching.</p>;

    const { matches, unmatched1, unmatched2 } = data;

    const mutualFirst = matches.filter(m => m.from === 'mutual_first');
    const fromTop5 = matches.filter(m => m.from === 'top5');
    const fromCompat = matches.filter(m => m.from === 'compat');

    function formatRank(rank) {
        if (!Number.isFinite(rank)) return '—';
        return `#${rank}`;
    }

    function formatCompat(c) {
        if (c == null) return '0%';
        return `${Math.round(c * 100)}%`;
    }

    return (
        <div className="admin-matches-container">
            <h1>Admin – Couples Parrain / Fillot 🐙</h1>

            <section className="matches-section">
                <h2>1) Couples mutuels #1 💘</h2>
                {mutualFirst.length === 0 && <p>Aucun couple mutuel en #1.</p>}
                <div className="matches-grid">
                    {mutualFirst.map((m, idx) => (
                        <div key={idx} className="match-card mutual">
                            <div className="match-header">
                                <span className="badge badge-mutual">Mutuel #1</span>
                                <span className="compat">{formatCompat(m.compat)}</span>
                            </div>
                            <div className="match-names">
                                <div className="person">
                                    <div className="name">{m.oneA.name}</div>
                                    <div className="promo">{m.oneA.promo}</div>
                                    <div className="rank">Dans le top du 2A : {formatRank(m.rankTwoInOne)}</div>
                                </div>
                                <div className="middle">⇄</div>
                                <div className="person">
                                    <div className="name">{m.twoA.name}</div>
                                    <div className="promo">{m.twoA.promo}</div>
                                    <div className="rank">Dans le top du 1A : {formatRank(m.rankOneInTwo)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="matches-section">
                <h2>2) Couples basés sur les Top 5 ⭐</h2>
                {fromTop5.length === 0 && <p>Aucun couple issu des Top 5.</p>}
                <div className="matches-grid">
                    {fromTop5.map((m, idx) => (
                        <div key={idx} className="match-card top5">
                            <div className="match-header">
                                <span className="badge badge-top5">
                                    {m.mutualTop5 ? 'Top 5 mutuel' : 'Top 5'}
                                </span>
                                <span className="compat">{formatCompat(m.compat)}</span>
                            </div>
                            <div className="match-names">
                                <div className="person">
                                    <div className="name">{m.oneA.name}</div>
                                    <div className="promo">{m.oneA.promo}</div>
                                    <div className="rank">Dans le top du 2A : {formatRank(m.rankTwoInOne)}</div>
                                </div>
                                <div className="middle">⇄</div>
                                <div className="person">
                                    <div className="name">{m.twoA.name}</div>
                                    <div className="promo">{m.twoA.promo}</div>
                                    <div className="rank">Dans le top du 1A : {formatRank(m.rankOneInTwo)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="matches-section">
                <h2>3) Couples par compatibilité (fallback) 🎯</h2>
                {fromCompat.length === 0 && <p>Aucun couple créé uniquement sur la compatibilité.</p>}
                <div className="matches-grid">
                    {fromCompat.map((m, idx) => (
                        <div key={idx} className="match-card compat">
                            <div className="match-header">
                                <span className="badge badge-compat">Compatibilité</span>
                                <span className="compat">{formatCompat(m.compat)}</span>
                            </div>
                            <div className="match-names">
                                <div className="person">
                                    <div className="name">{m.oneA.name}</div>
                                    <div className="promo">{m.oneA.promo}</div>
                                    <div className="rank">Top du 2A : {formatRank(m.rankTwoInOne)}</div>
                                </div>
                                <div className="middle">⇄</div>
                                <div className="person">
                                    <div className="name">{m.twoA.name}</div>
                                    <div className="promo">{m.twoA.promo}</div>
                                    <div className="rank">Top du 1A : {formatRank(m.rankOneInTwo)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="unmatched-section">
                <h2>Sans couple pour le moment</h2>
                <div className="unmatched-columns">
                    <div>
                        <h3>1A</h3>
                        {unmatched1.length === 0 && <p>Tous les 1A ont un couple ✅</p>}
                        <ul>
                            {unmatched1.map(u => (
                                <li key={u.id}>{u.name} ({u.promo})</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3>2A</h3>
                        {unmatched2.length === 0 && <p>Tous les 2A ont un couple ✅</p>}
                        <ul>
                            {unmatched2.map(u => (
                                <li key={u.id}>{u.name} ({u.promo})</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AdminMatches;
