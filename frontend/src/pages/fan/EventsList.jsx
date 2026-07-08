import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, Trophy } from 'lucide-react';
import client, { apiErrorMessage } from '../../api/client';

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/events', { params: { status: 'scheduled' } })
      .then((res) => setEvents(res.data.events))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load matches.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="label-eyebrow">Upcoming Fixtures</p>
      <h1 className="mt-1 font-display text-4xl tracking-wide text-chalk">Reserve Your Seat</h1>
      <p className="mt-2 max-w-xl text-chalk-dim">
        Pick a match, choose a seat on the live stadium map, and pay securely with Telebirr or CBE Birr.
      </p>

      {loading && <p className="mt-8 text-chalk-dim">Loading matches…</p>}
      {error && <p className="mt-8 rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <div className="card mt-8 flex flex-col items-center gap-2 p-10 text-center">
          <Trophy className="text-flood" />
          <p className="text-chalk-dim">No matches are scheduled right now. Check back soon.</p>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {events.map((ev) => {
          const date = new Date(ev.event_date);
          const pct = ev.total_seats ? Math.round((ev.available_seats / ev.total_seats) * 100) : 0;
          return (
            <Link key={ev.event_id} to={`/events/${ev.event_id}`} className="card group flex flex-col p-5 transition hover:border-flood/50">
              <p className="label-eyebrow">{ev.venue}</p>
              <h2 className="mt-1 font-display text-2xl leading-tight tracking-wide text-chalk">
                {ev.home_team ? `${ev.home_team} vs ${ev.away_team}` : ev.event_name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-chalk-dim">
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-flood" />
                  {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-flood" />{ev.venue}</span>
              </div>

              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-pitch-line">
                  <div className="h-full rounded-full bg-flood" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-chalk-dim">{ev.available_seats} of {ev.total_seats} seats available</p>
              </div>

              <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-flood opacity-0 transition group-hover:opacity-100">
                Select seats <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
