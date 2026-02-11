// src/pages/Evenements.jsx
import { useEffect, useState } from 'react';
import '../styles/evenements.css';
import EventCard from '../components/EventCard.jsx';

const API_URL = import.meta.env.VITE_API_ADDRESS;

function Evenements() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/api/events`);
                const data = await res.json();
                setEvents(data);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="page-container events-container">
                <p>Chargement des évènements...</p>
            </div>
        );
    }

    return (
        <div className="page-container events-container">
            <h2>Évènements à venir</h2>

            <div className="events-list">
                {events.map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                ))}
            </div>
        </div>
    );
}

export default Evenements;
