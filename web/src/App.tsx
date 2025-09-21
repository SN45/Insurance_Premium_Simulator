import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './components/ThemeToggle';
import Simulator from './Simulator';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Pay from './Pages/Pay';
import { currentUser, clearSession } from './auth';

export default function App() {
  const nav = useNavigate();
  const u = currentUser();

  return (
    <div className="min-h-screen bg-neutral-100 text-black dark:bg-black dark:text-white">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/85 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-2xl font-bold">Dynamic Premium Simulator</Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link to="/" className="hover:underline">Simulator</Link>
              <Link to="/pay" className="hover:underline">Pay</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {u ? (
              <>
                <span className="text-sm opacity-80">Hi, {u.fullName}</span>
                <button
                  onClick={() => { clearSession(); nav('/login'); }}
                  className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-900">Login</Link>
                <Link to="/register" className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-900">Register</Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Simulator />} />
        <Route path="/pay" element={<Pay />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}
