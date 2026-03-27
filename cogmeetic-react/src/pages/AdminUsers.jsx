// src/pages/AdminUsers.jsx
import { useEffect, useState } from 'react';
import { authFetch } from '../api';
import '../styles/adminUsers.css';

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tempPasswords, setTempPasswords] = useState({}); // id → tempPassword

    useEffect(() => {
        async function fetchUsers() {
            const res = await authFetch('/api/admin/users');
            setUsers(await res.json());
            setLoading(false);
        }
        fetchUsers();
    }, []);

    async function handleReset(user) {
        if (!confirm(`Réinitialiser le mot de passe de ${user.name} ?`)) return;
        const res = await authFetch(`/api/admin/users/${user.id}/password`, { method: 'PUT' });
        const data = await res.json();
        setTempPasswords(prev => ({ ...prev, [user.id]: data.tempPassword }));
    }

    const oneA = users.filter(u => u.promo === '1A');
    const twoA = users.filter(u => u.promo === '2A');

    if (loading) return <div className="admin-users-container"><p>Chargement...</p></div>;

    return (
        <div className="admin-users-container">
            <h1>Admin — Utilisateurs 👥</h1>

            {['1A', '2A'].map(promo => (
                <section key={promo} className="admin-users-section">
                    <h2>{promo} <span className="admin-users-count">{(promo === '1A' ? oneA : twoA).length} élèves</span></h2>
                    <div className="admin-users-list">
                        {(promo === '1A' ? oneA : twoA).map(u => (
                            <div key={u.id} className="admin-user-row">
                                <div className="admin-user-info">
                                    <span className="admin-user-name">{u.name}</span>
                                    <span className="admin-user-login">{u.login}</span>
                                </div>
                                <div className="admin-user-right">
                                    {tempPasswords[u.id] ? (
                                        <div className="admin-user-temppass">
                                            Mdp temp : <strong>{tempPasswords[u.id]}</strong>
                                        </div>
                                    ) : (
                                        <button
                                            className="admin-user-reset-btn"
                                            onClick={() => handleReset(u)}
                                        >
                                            Réinitialiser mdp
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

export default AdminUsers;
