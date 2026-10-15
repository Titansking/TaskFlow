/**
 * Registration page.
 *
 * The password rules mirror the server's Zod schema, so the user gets instant
 * feedback instead of a round trip. The server still enforces them.
 */
'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { authService } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.register(form);
      router.replace('/');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg flex min-h-screen items-center justify-center p-4">
      {/* Dynamic floating background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="relative z-10 w-full max-w-md">
        {/* Branding header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
            <span className="text-3xl font-black text-white">T</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            TaskFlow
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Manage your workflow like never before
          </p>
        </div>

        {/* Register Card */}
        <div className="glass-card rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Create an account</h2>
            <p className="mt-1 text-sm text-white/60">
              Get started with TaskFlow today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div role="alert" className="rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-white/90">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                required
                maxLength={80}
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/90">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white/90">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
              />
              <p className="text-xs text-white/50">
                At least 8 characters, including a letter and a number.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                'Creating account...'
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white hover:decoration-white/60 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}