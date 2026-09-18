import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Cake, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInErr } = await signInWithPassword(email, password);
    if (signInErr) {
      setError(signInErr.message || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate(redirect);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 mx-auto">
            <Cake className="w-6 h-6 text-amber-700" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-stone-900">Welcome Back</h1>
          <p className="text-xs text-stone-500">
            Sign in to track your Cake Box orders & custom cake requests
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@example.com"
              className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            loading={loading}
            className="w-full shadow-md"
          >
            Sign In
          </Button>
        </form>

        <div className="text-center pt-2 text-xs text-stone-500">
          Don't have an account?{' '}
          <Link
            to={`/register?redirect=${encodeURIComponent(redirect)}`}
            className="font-bold text-amber-800 hover:text-amber-900 underline"
          >
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
};
