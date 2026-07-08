import { useEffect, useState } from 'react';
import { Wallet, Ticket, TrendingUp } from 'lucide-react';
import client from '../../api/client';
import StatCard from '../../components/StatCard';

export default function Reports() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [sales, setSales] = useState(null);
  const [gateLog, setGateLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/events').then((res) => setEvents(res.data.events));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = eventId ? { eventId } : {};
    Promise.all([
      client.get('/reports/sales', { params }),
      client.get('/attendance/log', { params: { ...params, limit: 15 } })
    ]).then(([salesRes, logRes]) => {
      setSales(salesRes.data);
      setGateLog(logRes.data.log);
    }).finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="label-eyebrow">Financial Audit</p>
      <h1 className="mt-1 font-display text-4xl tracking-wide text-chalk">Reports</h1>

      <div className="mt-6 max-w-xs">
        <label className="label-eyebrow mb-1.5 block">Filter by match</label>
        <select className="input-field" value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">All matches</option>
          {events.map((ev) => (
            <option key={ev.event_id} value={ev.event_id}>
              {ev.home_team ? `${ev.home_team} vs ${ev.away_team}` : ev.event_name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="mt-8 text-chalk-dim">Loading report…</p>}

      {!loading && sales && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Tickets Sold" value={sales.overall.tickets_sold} icon={Ticket} />
            <StatCard label="Total Revenue (ETB)" value={Number(sales.overall.total_revenue).toLocaleString()} icon={Wallet} />
            <StatCard label="Avg. Ticket Price" value={sales.overall.tickets_sold > 0 ? Math.round(sales.overall.total_revenue / sales.overall.tickets_sold).toLocaleString() : 0} icon={TrendingUp} accent="chalk" />
          </div>

          <div className="mt-8">
            <p className="label-eyebrow mb-2">Revenue by match</p>
            <div className="card divide-y divide-pitch-line">
              {sales.byEvent.length === 0 && <p className="p-5 text-sm text-chalk-dim">No completed sales yet.</p>}
              {sales.byEvent.map((row) => (
                <div key={row.event_id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-chalk">{row.event_name}</span>
                  <span className="text-chalk-dim">{row.tickets_sold} tickets · <span className="font-mono text-flood">{Number(row.revenue).toLocaleString()} ETB</span></span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="label-eyebrow mb-2">Revenue by payment method</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {sales.byMethod.map((row) => (
                <div key={row.payment_method} className="card p-4">
                  <p className="text-xs uppercase tracking-wide text-chalk-dim">{row.payment_method.replace('_', ' ')}</p>
                  <p className="mt-1 font-display text-xl text-chalk">{Number(row.revenue).toLocaleString()} ETB</p>
                  <p className="text-xs text-chalk-dim">{row.count} transactions</p>
                </div>
              ))}
              {sales.byMethod.length === 0 && <p className="text-sm text-chalk-dim">No transactions yet.</p>}
            </div>
          </div>

          <div className="mt-8">
            <p className="label-eyebrow mb-2">Gate log</p>
            <div className="card divide-y divide-pitch-line">
              {gateLog.length === 0 && <p className="p-5 text-sm text-chalk-dim">No gate activity yet.</p>}
              {gateLog.map((entry) => (
                <div key={entry.attendance_id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${entry.status === 'entered' ? 'bg-pitch-bright' : 'bg-alert'}`} />
                    {entry.fan_name} · {entry.section} {entry.seat_number}
                  </span>
                  <span className="font-mono text-xs text-chalk-dim">{new Date(entry.entry_time).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
