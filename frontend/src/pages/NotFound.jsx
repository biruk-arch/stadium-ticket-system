import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <TriangleAlert className="text-flood" size={36} />
      <h1 className="mt-4 font-display text-4xl tracking-wide text-chalk">Offside</h1>
      <p className="mt-2 text-chalk-dim">That page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">Back to Safety</Link>
    </div>
  );
}
