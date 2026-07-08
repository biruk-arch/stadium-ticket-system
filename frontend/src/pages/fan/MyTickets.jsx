import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import client, { apiErrorMessage } from '../../api/client';
import TicketStub from '../../components/TicketStub';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/tickets/mine')
      .then((res) => setTickets(res.data.tickets))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your tickets.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="label-eyebrow">Your Wallet</p>
      <h1 className="mt-1 font-display text-4xl tracking-wide text-chalk">My Tickets</h1>

      {loading && <p className="mt-8 text-chalk-dim">Loading your tickets…</p>}
      {error && <p className="mt-8 rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

      {!loading && !error && tickets.length === 0 && (
        <div className="card mt-8 flex flex-col items-center gap-3 p-10 text-center">
          <Ticket className="text-flood" />
          <p className="text-chalk-dim">You haven't reserved any tickets yet.</p>
          <Link to="/events" className="btn-primary">Browse Matches</Link>
        </div>
      )}

      <div className="mt-8 space-y-5">
        {tickets.map((t) => <TicketStub key={t.ticket_id} ticket={t} />)}
      </div>
    </div>
  );
}
