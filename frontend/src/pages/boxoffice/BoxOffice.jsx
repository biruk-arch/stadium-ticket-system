import { useEffect, useState } from 'react';
import { Banknote, Smartphone, Landmark, RotateCcw, CheckCircle2 } from 'lucide-react';
import client, { apiErrorMessage } from '../../api/client';
import SeatMap from '../../components/SeatMap';
import TicketStub from '../../components/TicketStub';

const METHODS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'telebirr', label: 'Telebirr', icon: Smartphone },
  { value: 'cbe_birr', label: 'CBE Birr', icon: Landmark }
];

const STEPS = ['Pick a match', 'Select a seat', 'Take payment', 'Hand over ticket'];

export default function BoxOffice() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/events', { params: { status: 'scheduled' } }).then((res) => setEvents(res.data.events));
  }, []);

  async function loadSeats(id) {
    setEventId(id);
    setSelected(null);
    if (!id) { setSeats([]); return; }
    const { data } = await client.get(`/events/${id}/seats`);
    setSeats(data.seats);
  }

  async function handleReserve() {
    setError('');
    setBusy(true);
    try {
      const { data } = await client.post('/reservations', { eventId: Number(eventId), seatId: selected.seat_id });
      setReservation(data.reservation);
    } catch (err) {
      setError(apiErrorMessage(err, 'That seat could not be reserved.'));
      loadSeats(eventId);
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await client.post('/payments', {
        reservationId: reservation.reservation_id,
        paymentMethod: method,
        referenceNumber: method === 'cash' ? undefined : reference
      });
      const { data: ticketData } = await client.get(`/tickets/${data.ticket.ticket_id}`);
      setTicket(ticketData.ticket);
    } catch (err) {
      setError(apiErrorMessage(err, 'Payment could not be completed.'));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setEventId(''); setSeats([]); setSelected(null); setReservation(null);
    setMethod('cash'); setReference(''); setTicket(null); setError('');
  }

  const step = ticket ? 4 : reservation ? 3 : eventId ? 2 : 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="label-eyebrow">Box Office</p>
      <h1 className="mt-1 font-display text-4xl tracking-wide text-chalk">Walk-In Ticket Sale</h1>
      <p className="mt-2 max-w-xl text-chalk-dim">Sell a ticket to a fan at the counter — reserve a seat, take cash or mobile payment, and hand over their e-ticket.</p>

      <ol className="mt-6 flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className={`rounded-full border px-3 py-1.5 font-mono uppercase tracking-wide ${
            step === i + 1 ? 'border-flood bg-flood/10 text-flood' : step > i + 1 ? 'border-pitch-bright/40 text-pitch-bright' : 'border-pitch-line text-chalk-dim'
          }`}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {error && <p className="mt-4 rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

      {!reservation && !ticket && (
        <div className="card mt-6 p-5 sm:p-6">
          <label className="label-eyebrow mb-1.5 block">Match</label>
          <select className="input-field" value={eventId} onChange={(e) => loadSeats(e.target.value)}>
            <option value="">Select a match…</option>
            {events.map((ev) => (
              <option key={ev.event_id} value={ev.event_id}>
                {ev.home_team ? `${ev.home_team} vs ${ev.away_team}` : ev.event_name} — {new Date(ev.event_date).toLocaleDateString()}
              </option>
            ))}
          </select>

          {seats.length > 0 && (
            <div className="mt-6">
              <SeatMap seats={seats} selectedSeatId={selected?.seat_id} onSelect={setSelected} />
            </div>
          )}

          {selected && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-pitch-line pt-5 sm:flex-row">
              <p className="text-chalk">
                {selected.section} · Seat {selected.seat_number} — <span className="font-display text-flood">{Number(selected.price).toLocaleString()} ETB</span>
              </p>
              <button onClick={handleReserve} disabled={busy} className="btn-primary">
                {busy ? 'Reserving…' : 'Hold This Seat'}
              </button>
            </div>
          )}
        </div>
      )}

      {reservation && !ticket && (
        <form onSubmit={handlePay} className="card mt-6 space-y-5 p-6">
          <div className="flex items-center justify-between border-b border-pitch-line pb-4">
            <div>
              <p className="font-semibold text-chalk">{reservation.event_name}</p>
              <p className="text-sm text-chalk-dim">{reservation.section} · Seat {reservation.seat_number}</p>
            </div>
            <p className="font-display text-2xl text-flood">{Number(reservation.price).toLocaleString()} ETB</p>
          </div>

          <div>
            <p className="label-eyebrow mb-2">Payment method</p>
            <div className="grid grid-cols-3 gap-3">
              {METHODS.map(({ value, label, icon: Icon }) => (
                <button type="button" key={value} onClick={() => setMethod(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-4 transition ${
                    method === value ? 'border-flood bg-flood/10 text-flood' : 'border-pitch-line text-chalk-dim hover:border-flood/40'
                  }`}>
                  <Icon size={20} />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {method !== 'cash' && (
            <div>
              <label className="label-eyebrow mb-1.5 block">Transaction reference number</label>
              <input required className="input-field font-mono" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. TXN9E4K21A" />
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Processing…' : `Confirm ${Number(reservation.price).toLocaleString()} ETB Payment`}
          </button>
        </form>
      )}

      {ticket && (
        <div className="mt-6">
          <div className="mb-4 flex items-center gap-2 text-pitch-bright">
            <CheckCircle2 size={20} /> <p className="font-semibold">Sale complete — show this to the fan.</p>
          </div>
          <TicketStub ticket={ticket} />
          <button onClick={reset} className="btn-secondary mt-6">
            <RotateCcw size={16} /> Start Next Sale
          </button>
        </div>
      )}
    </div>
  );
}
