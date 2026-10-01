import { useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export default function LoginForm({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError('Incorrect email or password.');
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-2xl border border-brand-sage/30 bg-brand-sage-light p-8 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-brand-forest">Admin sign in</h1>
      <p className="mt-1 text-sm text-brand-ink/60">Manage bookings, services and availability.</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-brand-ink">Email</span>
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-sage/40 px-3 py-2 focus:border-brand-forest focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-brand-ink">Password</span>
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-sage/40 px-3 py-2 focus:border-brand-forest focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-brand-forest px-6 py-2.5 text-sm font-semibold tracking-wide text-brand-cream uppercase hover:bg-brand-forest-dark disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
