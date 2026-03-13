import { useState, useEffect } from 'react'
import './Events.css'

interface GameEvent {
  id: string
  type: string
  title: string
  description: string
  affectedNations: string[]
  createdAt: string
}

export default function Events() {
  const [events, setEvents] = useState<GameEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events')
        if (response.ok) {
          const data = await response.json()
          setEvents(data.slice(0, 20))
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      military: '⚔️',
      economic: '📉',
      political: '🗳️',
      nuclear: '☢️',
      disaster: '🌪️',
      default: '📰'
    }
    return icons[type] || icons.default
  }

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      military: 'military',
      economic: 'economic',
      political: 'political',
      nuclear: 'nuclear',
      disaster: 'disaster'
    }
    return colors[type] || 'default'
  }

  if (loading) {
    return <div className="page events"><p>Loading events...</p></div>
  }

  return (
    <div className="page events">
      <div className="page-header">
        <h2>📰 World Events</h2>
        <p>Latest news from around the world</p>
      </div>

      <div className="events-list">
        {events.length === 0 ? (
          <p className="empty-state">No events available</p>
        ) : (
          events.map(event => (
            <div key={event.id} className={`event-card event-${getEventColor(event.type)}`}>
              <div className="event-header">
                <span className="event-icon">{getEventIcon(event.type)}</span>
                <div className="event-meta">
                  <span className="event-type">{event.type.toUpperCase()}</span>
                  <span className="event-time">Just now</span>
                </div>
              </div>

              <h3 className="event-title">{event.title}</h3>
              <p className="event-description">{event.description}</p>

              {event.affectedNations && event.affectedNations.length > 0 && (
                <div className="affected-nations">
                  <span className="label">Affected Nations:</span>
                  <div className="nations-tags">
                    {event.affectedNations.map(nation => (
                      <span key={nation} className="nation-tag">{nation}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
