import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Landmark, Clock, CheckCircle2 } from 'lucide-react';
import client, { apiErrorMessage } from '../../api/client';
import TicketStub from '../../components/TicketStub';

const METHODS = [
  { value: 'telebirr', label: 'Telebirr', icon: Smartphone, hint: 'Pay with your Telebirr wallet, then enter the transaction reference from the confirmation SMS.' },
  { value: 'cbe_birr', label: 'CBE Birr', icon: Landmark, hint: 'Pay with CBE Birr, then enter the transaction reference from your receipt.' }
];

function useCountdown(target) {
  const [msLeft, setMsLeft] = useState(target ? target - Date.now() : 0);
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setMsLeft(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return Math.max(0, msLeft);
}

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('telebirr');
  const [reference, setReference] = useState('');
  const [paying, setPaying] = useState(false);
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    client.get(`/reservations/${id}`)
      .then((res) => setReservation(res.data.reservation))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load this reservation.')))
      .finally(() => setLoading(false));
  }, [id]);

  const lockExpiresAt = reservation?.lock_expires_at ? new Date(reservation.lock_expires_at).getTime() : null;
  const msLeft = useCountdown(lockExpiresAt);
  const expired = reservation?.status === 'pending' && lockExpiresAt && msLeft <= 0;
  const minutes = Math.floor(msLeft / 60000);
  const seconds = Math.floor((msLeft % 60000) / 1000);

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    setPaying(true);
    try {
      const { data } = await client.post('/payments', {
        reservationId: Number(id),
        paymentMethod: method,
        referenceNumber: reference
      });
      const { data: ticketData } = await client.get(`/tickets/${data.ticket.ticket_id}`);
      setTicket(ticketData.ticket);
    } catch (err) {
      setError(apiErrorMessage(err, 'Payment could not be completed.'));
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-10 text-chalk-dim">Loading…</div>;
  if (!reservation) return <div className="mx-auto max-w-2xl px-4 py-10 text-alert">{error}</div>;

  if (ticket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <CheckCircle2 className="text-pitch-bright" size={40} />
          <h1 className="mt-3 font-display text-3xl tracking-wide text-chalk">Payment Confirmed</h1>
          <p className="mt-1 text-chalk-dim">Your e-ticket is ready. Show this QR code at the gate.</p>
        </div>
        <TicketStub ticket={ticket} />
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/my-tickets" className="btn-primary">View My Tickets</Link>
          <Link to="/events" className="btn-secondary">Browse More Matches</Link>
        </div>
      </div>
    );
  }

  if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl tracking-wide text-chalk">This reservation is {reservation.status}</h1>
        <p className="mt-2 text-chalk-dim">Please head back and choose a seat again.</p>
        <Link to="/events" className="btn-primary mt-6 inline-flex">Back to Matches</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link to={`/events/${reservation.event_id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-chalk-dim hover:text-flood">
        <ArrowLeft size={14} /> Change seat
      </Link>

      <p className="label-eyebrow">Checkout</p>
      <h1 className="mt-1 font-display text-3xl tracking-wide text-chalk">Complete Your Payment</h1>

      <div className="card mt-6 flex items-center justify-between p-4">
        <div>
          <p className="font-semibold text-chalk">{reservation.event_name}</p>
          <p className="text-sm text-chalk-dim">{reservation.section} · Seat {reservation.seat_number}</p>
        </div>
        <p className="font-display text-2xl text-flood">{Number(reservation.price).toLocaleString()} ETB</p>
      </div>

      {!expired && lockExpiresAt && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-chalk-dim">
          <Clock size={14} className="text-flood" />
          Seat held for {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>
      )}

      {expired ? (
        <div className="card mt-6 border-alert/30 p-6 text-center">
          <p className="text-alert">Your seat hold has expired.</p>
          <Link to={`/events/${reservation.event_id}`} className="btn-primary mt-4 inline-flex">Choose a Seat Again</Link>
        </div>
      ) : (
        <form onSubmit={handlePay} className="card mt-6 space-y-5 p-6">
          {error && <p className="rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

          <div>
            <p className="label-eyebrow mb-2">Payment method</p>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setMethod(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-4 transition ${
                    method === value ? 'border-flood bg-flood/10 text-flood' : 'border-pitch-line text-chalk-dim hover:border-flood/40'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-chalk-dim">{METHODS.find((m) => m.value === method)?.hint}</p>
          </div>

          <div>
            <label className="label-eyebrow mb-1.5 block">Transaction reference number</label>
            <input
              required
              className="input-field font-mono"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TXN9E4K21A"
            />
          </div>

          <button type="submit" disabled={paying} className="btn-primary w-full">
            {paying ? 'Processing…' : `Pay ${Number(reservation.price).toLocaleString()} ETB`}
          </button>
        </form>
      )}
    </div>
  );
}
