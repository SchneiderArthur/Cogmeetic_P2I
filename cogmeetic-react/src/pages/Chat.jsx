// src/pages/Chat.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getUser } from '../api';
import '../styles/chat.css';

function Chat() {
    const user = getUser();
    const CURRENT_USER_ID = user?.id;

    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    if (!CURRENT_USER_ID) {
        return (
            <p>
                Merci de te connecter d’abord sur <a href="/login">/login</a>
            </p>
        );
    }

    useEffect(() => {
        async function fetchMatches() {
            try {
                setLoading(true);
                const res = await authFetch('/api/users');
                const data = await res.json();
                setMatches(data);
            } finally {
                setLoading(false);
            }
        }

        fetchMatches();
    }, [CURRENT_USER_ID]);

    if (loading) {
        return (
            <div className="page-container chat-container">
                <p>Chargement de tes matchs...</p>
            </div>
        );
    }

    return (
        <div className="page-container chat-container">
            <h2 className="chat-title">Mes matchs</h2>

            <div className="chat-list">
                {matches.map((m) => (
                    <Link
                        key={m.id}
                        to={`/chat/${m.id}`}
                        className="chat-list-item"
                    >
                        <div className="avatar-circle small">
                            <span>{m.name.charAt(0)}</span>
                        </div>

                        <div className="chat-list-text">
                            <div className="chat-list-name">
                                {m.name}
                                {typeof m.compatibilite === 'number' && (
                                    <span className="chat-list-score">
                                        {Math.round(m.compatibilite * 100)}%
                                    </span>
                                )}
                            </div>
                            <div className="chat-list-preview">
                                Cette personne vous a envoyé un message…
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default Chat;
