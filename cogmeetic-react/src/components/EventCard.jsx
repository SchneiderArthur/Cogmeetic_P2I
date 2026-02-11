// src/components/EventCard.jsx
const API_URL = import.meta.env.VITE_API_ADDRESS;

function EventCard({ event }) {
    // event = { id, titre, date, horaire, duree, prix, image }

    // Si l'image commence par http → on la garde
    // Sinon → on la préfixe avec l'URL de l'API (pour /images/...)
    const imageUrl = event.image?.startsWith('http')
        ? event.image
        : `${API_URL}${event.image || ''}`;

    return (
        <article className="event-card">
            {event.image && (
                <div className="event-image-wrapper">
                    <img
                        src={imageUrl}
                        alt={event.titre}
                        className="event-image"
                    />
                </div>
            )}

            <div className="event-content">
                <div className="event-date">{event.date}</div>
                <h3 className="event-title">{event.titre}</h3>

                <p className="event-meta">
                    {event.horaire} • {event.duree} • {event.prix}
                </p>
            </div>
        </article>
    );
}

export default EventCard;
