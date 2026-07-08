import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function Layout() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main><Outlet /></main>
    </div>
  );
}
