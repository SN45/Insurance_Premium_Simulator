// web/src/Pages/Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../auth'; // << fixed path

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(email, password);
      nav('/'); // go to simulator
    } catch (e: any) {
      setErr(e?.response?.data ?? e?.message ?? 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6 mt-10 rounded-2xl border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800">
      <h2 className="text-xl font-semibold mb-4">Sign in</h2>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Email</span>
          <input className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-800"
                 type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Password</span>
          <input className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-800"
                 type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <button disabled={busy}
                className="mt-2 px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {err && <div className="text-sm text-red-600 dark:text-red-300">{String(err)}</div>}
        <div className="text-sm flex gap-2 justify-between mt-2">
          <Link className="underline opacity-80" to="/register">Create account</Link>
          <a className="underline opacity-80" href="#" onClick={e=>e.preventDefault()}>Forgot password?</a>
        </div>
      </form>
    </div>
  );
}
