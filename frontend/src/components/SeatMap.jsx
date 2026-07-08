import { useMemo } from 'react';

const STATUS_STYLES = {
  available: 'border-pitch-line bg-pitch-night text-chalk-dim hover:border-flood hover:text-flood cursor-pointer',
  locked: 'border-pitch-line bg-pitch-ink text-chalk-dim/30 cursor-not-allowed line-through',
  reserved: 'border-pitch-line bg-pitch-ink text-chalk-dim/30 cursor-not-allowed line-through',
  blocked: 'border-alert/20 bg-alert/5 text-alert/30 cursor-not-allowed'
};

// Groups a flat seat list into sections, each rendered as a grid of seat
// buttons. Rows are inferred from the seat_number's leading letter (A, B, C...)
// which is how seatController/seed.js label rows.
export default function SeatMap({ seats, selectedSeatId, onSelect }) {
  const sections = useMemo(() => {
    const bySection = new Map();
    for (const seat of seats) {
      if (!bySection.has(seat.section)) bySection.set(seat.section, []);
      bySection.get(seat.section).push(seat);
    }
    for (const list of bySection.values()) {
      list.sort((a, b) => {
        const rowA = a.seat_number.match(/[A-Z]+/)?.[0] || '';
        const rowB = b.seat_number.match(/[A-Z]+/)?.[0] || '';
        const numA = parseInt(a.seat_number.replace(/[A-Z]+/, ''), 10) || 0;
        const numB = parseInt(b.seat_number.replace(/[A-Z]+/, ''), 10) || 0;
        return rowA === rowB ? numA - numB : rowA.localeCompare(rowB);
      });
    }
    return Array.from(bySection.entries()).map(([name, list]) => {
      const rows = new Map();
      list.forEach((seat) => {
        const row = seat.seat_number.match(/[A-Z]+/)?.[0] || '—';
        if (!rows.has(row)) rows.set(row, []);
        rows.get(row).push(seat);
      });
      return { name, price: list[0]?.price, rows: Array.from(rows.entries()) };
    });
  }, [seats]);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-flood/30 bg-pitch-lines bg-pitch-green/10 py-3 text-center">
        <p className="label-eyebrow text-flood">The Pitch</p>
      </div>

      {sections.map((section) => (
        <div key={section.name}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide text-chalk">{section.name}</h3>
            <span className="pill pill-pending">{Number(section.price).toLocaleString()} ETB / seat</span>
          </div>
          <div className="space-y-1.5 overflow-x-auto pb-2">
            {section.rows.map(([row, rowSeats]) => (
              <div key={row} className="flex items-center gap-1.5">
                <span className="w-5 shrink-0 font-mono text-xs text-chalk-dim/60">{row}</span>
                <div className="flex flex-wrap gap-1.5">
                  {rowSeats.map((seat) => {
                    const isSelected = seat.seat_id === selectedSeatId;
                    const disabled = seat.status !== 'available' && !isSelected;
                    return (
                      <button
                        key={seat.seat_id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(seat)}
                        title={`${section.name} ${seat.seat_number} — ${seat.status}`}
                        className={`flex h-8 w-9 shrink-0 items-center justify-center rounded border font-mono text-[11px] transition ${
                          isSelected
                            ? 'border-flood bg-flood text-pitch-night font-bold'
                            : STATUS_STYLES[seat.status] || STATUS_STYLES.available
                        }`}
                      >
                        {seat.seat_number.replace(/^[A-Z]+/, '')}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-4 border-t border-pitch-line pt-4 text-xs text-chalk-dim">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-pitch-line" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-flood bg-flood" /> Selected</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-pitch-line bg-pitch-ink" /> Taken / held</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-alert/20 bg-alert/5" /> Blocked</span>
      </div>
    </div>
  );
}
