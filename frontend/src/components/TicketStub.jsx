import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Calendar } from 'lucide-react';

const STATUS_COPY = {
  active: { label: 'Active', pill: 'pill-available' },
  scanned: { label: 'Scanned · Entered', pill: 'pill-closed' },
  expired: { label: 'Expired', pill: 'pill-danger' },
  cancelled: { label: 'Cancelled', pill: 'pill-danger' }
};

// The signature element of the whole app: a perforated e-ticket stub. The two
// notch circles are drawn in the page's base background color so they read as
// cut-outs against whatever sits behind the card.
export default function TicketStub({ ticket }) {
  const status = STATUS_COPY[ticket.ticket_status] || STATUS_COPY.active;
  const eventDate = new Date(ticket.event_date);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-pitch-line bg-pitch-ink shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)] sm:flex-row">
      <div className="flex-1 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label-eyebrow">E-Ticket</p>
            <h3 className="mt-1 font-display text-2xl leading-tight tracking-wide text-chalk">
              {ticket.event_name}
            </h3>
          </div>
          <span className={`pill ${status.pill} shrink-0`}>{status.label}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-chalk-dim">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-flood" />
            {eventDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            {' · '}
            {eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-flood" />
            {ticket.venue}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-dashed border-pitch-line pt-4">
          <div>
            <p className="label-eyebrow">Section</p>
            <p className="mt-1 font-mono text-base text-chalk">{ticket.section}</p>
          </div>
          <div>
            <p className="label-eyebrow">Seat</p>
            <p className="mt-1 font-mono text-base text-chalk">{ticket.seat_number}</p>
          </div>
          <div>
            <p className="label-eyebrow">Price</p>
            <p className="mt-1 font-mono text-base text-chalk">{Number(ticket.price).toLocaleString()} ETB</p>
          </div>
        </div>
      </div>

      {/* Perforated divider with cut-out notches, stacked layout on mobile / side-by-side on desktop */}
      <div className="relative flex shrink-0 items-center justify-center border-t border-dashed border-pitch-line sm:w-px sm:border-l sm:border-t-0">
        <span className="absolute -top-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-pitch-night sm:-left-2.5 sm:top-1/2 sm:-translate-x-0 sm:-translate-y-1/2" />
        <span className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-pitch-night sm:-right-2.5 sm:bottom-1/2 sm:left-auto sm:translate-x-0 sm:translate-y-1/2" />
      </div>

      <div className="flex flex-col items-center justify-center gap-2 p-5 sm:w-44 sm:p-6">
        <div className="rounded-lg bg-chalk p-2">
          <QRCodeSVG value={ticket.qr_code} size={112} />
        </div>
        <p className="text-center font-mono text-[10px] leading-tight text-chalk-dim/70 break-all">{ticket.qr_code}</p>
      </div>
    </div>
  );
}
