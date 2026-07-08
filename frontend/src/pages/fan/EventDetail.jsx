import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import client, { apiErrorMessage } from '../../api/client';
import SeatMap from '../../components/SeatMap';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reserving, setReserving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [evRes, seatRes] = await Promise.all([
        client.get(`/events/${id}`),
        client.get(`/events/${id}/seats`)
      ]);
      setEvent(evRes.data.event);
      setSeats(seatRes.data.seats);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load this match.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function handleReserve() {
    if (!selected) return;
    setReserving(true);
    setError('');
    try {
      const { data } = await client.post('/reservations', { eventId: Number(id), seatId: selected.seat_id });
      navigate(`/checkout/${data.reservation.reservation_id}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'That seat could not be reserved.'));
      load(); // refresh seat map in case it was taken by someone else
      setSelected(null);
    } finally {
      setReserving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-10 text-chalk-dim">Loading match…</div>;
  if (!event) return <div className="mx-auto max-w-5xl px-4 py-10 text-alert">{error || 'Match not found.'}</div>;

  const date = new Date(event.event_date);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/events" className="mb-4 inline-flex items-center gap-1.5 text-sm text-chalk-dim hover:text-flood">
        <ArrowLeft size={14} /> All matches
      </Link>

      <p className="label-eyebrow">{event.venue}</p>
      <h1 className="mt-1 font-display text-3xl tracking-wide text-chalk sm:text-4xl">
        {event.home_team ? `${event.home_team} vs ${event.away_team}` : event.event_name}
      </h1>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-chalk-dim">
        <span className="flex items-center gap-1.5"><Calendar size={14} className="text-flood" />
          {date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-flood" />{event.venue}</span>
      </div>

      {error && <p className="mt-4 rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

      <div className="card mt-6 p-5 sm:p-6">
        <SeatMap seats={seats} selectedSeatId={selected?.seat_id} onSelect={setSelected} />
      </div>

      {selected && (
        <div className="sticky bottom-4 mt-6">
          <div className="card flex flex-col items-center justify-between gap-3 border-flood/40 p-4 sm:flex-row">
            <div>
              <p className="label-eyebrow">Selected seat</p>
              <p className="font-display text-xl tracking-wide text-chalk">
                {selected.section} · {selected.seat_number} — {Number(selected.price).toLocaleString()} ETB
              </p>
              <p className="text-xs text-chalk-dim">Seat is held for 10 minutes once reserved so you can complete payment.</p>
            </div>
            <button onClick={handleReserve} disabled={reserving} className="btn-primary w-full sm:w-auto">
              {reserving ? 'Reserving…' : 'Reserve & Continue to Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
