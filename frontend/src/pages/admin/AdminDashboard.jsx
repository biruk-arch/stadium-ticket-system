import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Wallet, Ticket, ScanLine, Users, ArrowRight } from 'lucide-react';
import client from '../../api/client';
import StatCard from '../../components/StatCard';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [log, setLog] = useState([]);

  useEffect(() => {
    client.get('/reports/summary').then((res) => setSummary(res.data));
    client.get('/attendance/log', { params: { limit: 6 } }).then((res) => setLog(res.data.log)).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="label-eyebrow">Control Room</p>
      <h1 className="mt-1 font-display text-4xl tracking-wide text-chalk">Administrator Dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Upcoming Matches" value={summary?.upcomingEvents ?? '—'} icon={CalendarCheck} />
        <StatCard label="Total Events" value={summary?.totalEvents ?? '—'} icon={CalendarCheck} accent="chalk" />
        <StatCard label="Revenue (ETB)" value={summary ? Number(summary.totalRevenue).toLocaleString() : '—'} icon={Wallet} />
        <StatCard label="Tickets Issued" value={summary?.ticketsIssued ?? '—'} icon={Ticket} />
        <StatCard label="Entries Today" value={summary?.attendanceToday ?? '—'} icon={ScanLine} accent="bright" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link to="/admin/events" className="card group flex items-center justify-between p-5 hover:border-flood/50">
          <div><p className="font-semibold text-chalk">Manage Events</p><p className="text-sm text-chalk-dim">Schedule matches & configure seating</p></div>
          <ArrowRight className="text-flood opacity-0 transition group-hover:opacity-100" size={18} />
        </Link>
        <Link to="/admin/reports" className="card group flex items-center justify-between p-5 hover:border-flood/50">
          <div><p className="font-semibold text-chalk">Reports & Audits</p><p className="text-sm text-chalk-dim">Sales, revenue and gate logs</p></div>
          <ArrowRight className="text-flood opacity-0 transition group-hover:opacity-100" size={18} />
        </Link>
        <Link to="/admin/users" className="card group flex items-center justify-between p-5 hover:border-flood/50">
          <div><p className="font-semibold text-chalk">Staff Accounts</p><p className="text-sm text-chalk-dim">Box office, gate & commission logins</p></div>
          <Users className="text-flood opacity-0 transition group-hover:opacity-100" size={18} />
        </Link>
      </div>

      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <p className="label-eyebrow">Live gate log</p>
          <Link to="/admin/reports" className="text-xs font-semibold text-flood hover:underline">View full report</Link>
        </div>
        <div className="card divide-y divide-pitch-line">
          {log.length === 0 && <p className="p-5 text-sm text-chalk-dim">No gate activity yet.</p>}
          {log.map((entry) => (
            <div key={entry.attendance_id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${entry.status === 'entered' ? 'bg-pitch-bright' : 'bg-alert'}`} />
                {entry.fan_name} · {entry.section} {entry.seat_number} · {entry.event_name}
              </span>
              <span className="font-mono text-xs text-chalk-dim">{new Date(entry.entry_time).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
