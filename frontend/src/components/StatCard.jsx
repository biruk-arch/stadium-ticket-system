export default function StatCard({ label, value, icon: Icon, accent = 'flood' }) {
  const accentClass = { flood: 'text-flood', bright: 'text-pitch-bright', chalk: 'text-chalk' }[accent] || 'text-flood';
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="label-eyebrow">{label}</p>
        {Icon && <Icon size={16} className={accentClass} />}
      </div>
      <p className={`mt-2 font-display text-3xl tracking-wide ${accentClass}`}>{value}</p>
    </div>
  );
}
