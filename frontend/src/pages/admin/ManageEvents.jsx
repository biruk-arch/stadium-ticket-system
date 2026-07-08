import { useEffect, useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Calendar, MapPin, X } from 'lucide-react';
import client, { apiErrorMessage } from '../../api/client';

const STATUS_PILL = {
  scheduled: 'pill-available',
  ongoing: 'pill-pending',
  completed: 'pill-closed',
  cancelled: 'pill-danger'
};

function NewEventForm({ onCreated, onClose }) {
  const [form, setForm] = useState({ homeTeam: '', awayTeam: '', eventDate: '', venue: 'Dire Dawa Stadium' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const eventName = `${form.homeTeam} vs ${form.awayTeam}`;
      const { data } = await client.post('/events', { eventName, ...form });
      onCreated(data.event);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create the event.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">Schedule a match</p>
        <button type="button" onClick={onClose} className="text-chalk-dim hover:text-chalk"><X size={16} /></button>
      </div>
      {error && <p className="rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-eyebrow mb-1.5 block">Home team</label>
          <input required className="input-field" value={form.homeTeam} onChange={(e) => setForm({ ...form, homeTeam: e.target.value })} />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Away team</label>
          <input required className="input-field" value={form.awayTeam} onChange={(e) => setForm({ ...form, awayTeam: e.target.value })} />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Kickoff date & time</label>
          <input required type="datetime-local" className="input-field" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Venue</label>
          <input required className="input-field" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
        </div>
      </div>
      <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Creating…' : 'Create Match'}</button>
    </form>
  );
}

function SeatSectionForm({ eventId, onAdded }) {
  const [form, setForm] = useState({ section: '', rows: 4, seatsPerRow: 10, price: 200 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await client.post(`/events/${eventId}/seats`, form);
      onAdded();
      setForm({ section: '', rows: 4, seatsPerRow: 10, price: 200 });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add this seat section.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-5 sm:items-end">
      <div className="sm:col-span-2">
        <label className="label-eyebrow mb-1.5 block">Section name</label>
        <input required className="input-field" placeholder="e.g. VIP" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
      </div>
      <div>
        <label className="label-eyebrow mb-1.5 block">Rows</label>
        <input required type="number" min="1" max="26" className="input-field" value={form.rows} onChange={(e) => setForm({ ...form, rows: Number(e.target.value) })} />
      </div>
      <div>
        <label className="label-eyebrow mb-1.5 block">Seats / row</label>
        <input required type="number" min="1" className="input-field" value={form.seatsPerRow} onChange={(e) => setForm({ ...form, seatsPerRow: Number(e.target.value) })} />
      </div>
      <div>
        <label className="label-eyebrow mb-1.5 block">Price (ETB)</label>
        <input required type="number" min="0" step="0.01" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
      </div>
      <div className="sm:col-span-5">
        {error && <p className="mb-2 rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}
        <button type="submit" disabled={busy} className="btn-secondary">{busy ? 'Adding…' : 'Add Section'}</button>
      </div>
    </form>
  );
}

function EventRow({ event, onChanged }) {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState(null);
  const date = new Date(event.event_date);

  async function loadSections() {
    const { data } = await client.get(`/events/${event.event_id}`);
    setSections(data.sections);
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await loadSections();
  }

  async function updateStatus(status) {
    await client.put(`/events/${event.event_id}`, { status });
    onChanged();
  }

  return (
    <div className="card overflow-hidden">
      <button onClick={toggle} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div>
          <p className="font-semibold text-chalk">{event.home_team ? `${event.home_team} vs ${event.away_team}` : event.event_name}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-chalk-dim">
            <span className="flex items-center gap-1"><Calendar size={12} className="text-flood" />{date.toLocaleString()}</span>
            <span className="flex items-center gap-1"><MapPin size={12} className="text-flood" />{event.venue}</span>
            <span>{event.available_seats}/{event.total_seats} available</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`pill ${STATUS_PILL[event.status]}`}>{event.status}</span>
          {open ? <ChevronUp size={18} className="text-chalk-dim" /> : <ChevronDown size={18} className="text-chalk-dim" />}
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t border-pitch-line p-5">
          <div>
            <p className="label-eyebrow mb-2">Seat sections</p>
            {!sections && <p className="text-sm text-chalk-dim">Loading…</p>}
            {sections && sections.length === 0 && <p className="text-sm text-chalk-dim">No seats configured yet — add a section below.</p>}
            {sections && sections.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {sections.map((s) => (
                  <div key={s.section + s.price} className="flex items-center justify-between rounded-md border border-pitch-line px-3 py-2 text-sm">
                    <span className="text-chalk">{s.section}</span>
                    <span className="text-chalk-dim">{s.available}/{s.total} left · {Number(s.price).toLocaleString()} ETB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-pitch-line pt-4">
            <p className="label-eyebrow mb-2">Add a seat section</p>
            <SeatSectionForm eventId={event.event_id} onAdded={() => { loadSections(); onChanged(); }} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-pitch-line pt-4">
            {event.status !== 'ongoing' && <button onClick={() => updateStatus('ongoing')} className="btn-secondary !px-3 !py-1.5 text-xs">Mark Ongoing</button>}
            {event.status !== 'completed' && <button onClick={() => updateStatus('completed')} className="btn-secondary !px-3 !py-1.5 text-xs">Mark Completed</button>}
            {event.status !== 'cancelled' && <button onClick={() => updateStatus('cancelled')} className="btn-danger !px-3 !py-1.5 text-xs">Cancel Match</button>}
            {event.status === 'cancelled' && <button onClick={() => updateStatus('scheduled')} className="btn-secondary !px-3 !py-1.5 text-xs">Reinstate</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await client.get('/events');
    setEvents(data.events);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow">Fixtures</p>
          <h1 className="mt-1 font-display text-4xl tracking-wide text-chalk">Manage Events</h1>
        </div>
        {!showNew && (
          <button onClick={() => setShowNew(true)} className="btn-primary shrink-0"><Plus size={16} /> New Match</button>
        )}
      </div>

      {showNew && (
        <div className="mt-6">
          <NewEventForm onCreated={() => { setShowNew(false); load(); }} onClose={() => setShowNew(false)} />
        </div>
      )}

      {loading && <p className="mt-8 text-chalk-dim">Loading events…</p>}

      <div className="mt-6 space-y-3">
        {events.map((ev) => <EventRow key={ev.event_id} event={ev} onChanged={load} />)}
      </div>
    </div>
  );
}
