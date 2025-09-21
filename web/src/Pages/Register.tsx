// web/src/Pages/Register.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister, login as apiLogin } from '../auth';

export default function Register() {
  const nav = useNavigate();
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [busy, setBusy]           = useState(false);
  const [err, setErr]             = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await apiRegister({ fullName, email, phoneNumber: phone, password });
      // auto-login for convenience
      await apiLogin(email, password);
      nav('/');
    } catch (e: any) {
      const msg =
        (e?.response?.data && (typeof e.response.data === 'string'
          ? e.response.data
          : JSON.stringify(e.response.data))) ||
        e?.message ||
        'Registration failed';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6 mt-10 rounded-2xl border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800">
      <h2 className="text-xl font-semibold mb-4">Create account</h2>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Full name</span>
          <input
            className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-800"
            value={fullName}
            onChange={e=>setFullName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Email</span>
          <input
            className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-800"
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Phone</span>
          <input
            className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-800"
            value={phone}
            onChange={e=>setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Password</span>
          <input
            className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-800"
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <button
          disabled={busy}
          className="mt-2 px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black"
        >
          {busy ? 'Creating…' : 'Create account'}
        </button>
        {err && <div className="text-sm text-red-600 dark:text-red-300">{String(err)}</div>}
        <div className="text-sm mt-2">
          Already have an account? <Link className="underline opacity-80" to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
