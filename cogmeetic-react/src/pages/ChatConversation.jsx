// src/pages/ChatConversation.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/chat.css';

const API_URL = import.meta.env.VITE_API_ADDRESS;

// Quelques messages fake pour la démo
const FAKE_MESSAGES = {
    1: [
        { from: 'me', text: 'Salut Josepha, ça va ?' },
        { from: 'them', text: 'Yes et toi ? Hâte de découvrir mon fillot 😄' },
    ],
    2: [
        { from: 'me', text: 'Mais sois mon parrain stp' },
        { from: 'me', text: 'Le second degré humour ou température ?' },
        { from: 'them', text: 'Toujours humour 🔥' },
    ],
    3: [
        { from: 'me', text: 'Tu viens à la soirée masquée ?' },
        { from: 'them', text: 'Grave, j’ai déjà mon costume !' },
    ],
    4: [
        { from: 'them', text: 'Bonjour' },
    ],
};

function ChatConversation() {
    const { id } = useParams();            // id du contact
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const CURRENT_USER_ID = user?.id;

    const [contact, setContact] = useState(null);

    // Si pas connecté → on bloque
    if (!CURRENT_USER_ID) {
        return (
            <p>
                Merci de te connecter d’abord sur <a href="/login">/login</a>
            </p>
        );
    }

    // Récupérer les infos du contact
    useEffect(() => {
        async function fetchContact() {
            try {
                const res = await fetch(`${API_URL}/api/users/${id}`);
                if (!res.ok) throw new Error('User not found');
                const data = await res.json();
                setContact(data);
            } catch (err) {
                console.error(err);
            }
        }

        fetchContact();
    }, [id]);

    const messages = FAKE_MESSAGES[id] || [];

    if (!contact) {
        return (
            <div className="page-container chat-conversation-container">
                <p>Chargement de la conversation...</p>
            </div>
        );
    }

    return (
        <div className="page-container chat-conversation-container">
            {/* Header de la conversation */}
            <div className="chat-conversation-header">
                <button
                    className="back-button"
                    onClick={() => navigate('/chat')}
                >
                    ←
                </button>

                <div className="chat-conversation-user">
                    <div className="avatar-circle">
                        {/* initiale si pas d’image */}
                        <span>{contact.name.charAt(0)}</span>
                    </div>
                    <div>
                        <div className="chat-conversation-name">{contact.name}</div>
                        <div className="chat-conversation-sub">
                            {contact.promo}
                        </div>
                    </div>
                </div>

                <div className="chat-level">
                    <span>Nv. 0</span>
                    <div className="chat-level-bar">
                        <div className="chat-level-progress" />
                    </div>
                    <span>Nv. 1</span>
                </div>
            </div>

            <button className="preset-msg-button">
                Voir les messages prédéfinis
            </button>

            {/* Zone des messages */}
            <div className="chat-messages">
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        className={
                            m.from === 'me'
                                ? 'chat-bubble chat-bubble-me'
                                : 'chat-bubble chat-bubble-them'
                        }
                    >
                        {m.text}
                    </div>
                ))}
            </div>

            {/* Zone de saisie (fake pour l’instant) */}
            <div className="chat-input-bar">
                <input
                    type="text"
                    placeholder="Écrire un message..."
                    disabled
                />
                <button disabled>Envoyer</button>
            </div>
        </div>
    );
}

export default ChatConversation;
