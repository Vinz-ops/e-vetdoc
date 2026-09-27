"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2, Lock, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { resetPassword } from '@/services/auth';
import { createRecoveryClient } from '@/utils/supabase/client';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function BrandPanel() {
  return (
    <aside className="reset-brand-panel">
      <div>
        <div className="reset-brand-lockup">
          <div className="reset-logo">E</div>
          <span className="reset-brand-name">E-VetDoc</span>
          <span className="reset-brand-tag">Clinic portal</span>
        </div>
        <h1>Care for every pet.<br /><span>With clarity.</span></h1>
        <p>One secure workspace for appointments, pet records, billing, and the people who care for them.</p>
        <ul>
          {['Secure accounts for pet owners', 'Role-aware access for clinic staff', 'Appointments and records in one place', 'Clear billing and receipt history'].map((item) => (
            <li key={item}><Check size={12} />{item}</li>
          ))}
        </ul>
      </div>
      <div className="reset-status"><i />Secure clinic workspace</div>
    </aside>
  );
}

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await createRecoveryClient().auth.getSession();
      setHasSession(Boolean(session));
      setSessionLoading(false);
    };
    void checkSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(password);
      toast.success('Password updated', { description: 'Your new password is ready to use.' });
      router.push('/login');
    } catch (error: unknown) {
      toast.error('Error resetting password', { description: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return <div className="reset-loading"><Loader2 size={28} /> <span>Verifying your reset link…</span></div>;
  }

  if (errorCode || !hasSession) {
    const description = errorDescription?.replace(/\+/g, ' ') || 'This recovery link is invalid, expired, or has already been used.';
    return (
      <div className="reset-message">
        <div className="reset-message-icon"><AlertCircle size={24} /></div>
        <h2>{errorCode === 'access_denied' ? 'Link expired' : 'Reset link unavailable'}</h2>
        <p>{description}</p>
        <Link href="/login?mode=recovery" className="reset-secondary-action"><RefreshCcw size={16} /> Request a new link</Link>
      </div>
    );
  }

  return (
    <>
      <div className="reset-heading">
        <p className="reset-kicker">Account recovery</p>
        <h2>Choose a new password</h2>
        <p>Use a password you have not used elsewhere to keep your clinic account secure.</p>
      </div>
      <form onSubmit={handleSubmit} className="reset-form">
        <label htmlFor="new-password">New password</label>
        <div className="reset-input-wrap">
          <Lock size={18} aria-hidden="true" />
          <input id="new-password" name="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete="new-password" required />
          <button type="button" className="reset-eye" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide new password' : 'Show new password'}>
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
        <label htmlFor="confirm-password">Confirm new password</label>
        <div className="reset-input-wrap">
          <Lock size={18} aria-hidden="true" />
          <input id="confirm-password" name="confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your new password" autoComplete="new-password" required />
          <button type="button" className="reset-eye" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>
            {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
        <button type="submit" className="reset-submit" disabled={loading}>
          {loading ? <Loader2 size={18} /> : <>Save new password <ArrowRight size={18} /></>}
        </button>
      </form>
      <Link href="/login" className="reset-back">Back to sign in</Link>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="reset-page">
      <div className="reset-grid" />
      <div className="reset-content">
        <BrandPanel />
        <section className="reset-form-panel">
          <div className="reset-mobile-brand"><div className="reset-logo">E</div><strong>E-VetDoc</strong><span>Clinic portal</span></div>
          <div className="reset-form-container">
            <Suspense fallback={<div className="reset-loading"><Loader2 size={28} /> <span>Loading recovery form…</span></div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </section>
      </div>
      <footer><span>© 2026 E-VetDoc</span><div><Link href="#">Privacy</Link><Link href="#">Terms</Link></div></footer>
      <style jsx global>{`
        .reset-page { min-height: 100vh; background: var(--color-background); color: var(--color-foreground); display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .reset-grid { position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px); background-size: 48px 48px; opacity: .025; }
        .reset-content { flex: 1; display: flex; position: relative; z-index: 1; }
        .reset-brand-panel { width: 400px; flex: 0 0 400px; padding: 52px 44px; border-right: 1px solid var(--color-border); display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 55%); }
        .reset-brand-lockup, .reset-mobile-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 56px; }
        .reset-logo { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 8px; background: var(--color-primary); color: var(--color-primary-foreground); font-weight: 700; }
        .reset-brand-name { font-size: 18px; font-weight: 700; letter-spacing: -.025em; }
        .reset-brand-tag, .reset-mobile-brand span { padding: 2px 7px; border-radius: 5px; border: 1px solid var(--color-border); background: var(--color-accent); color: var(--color-primary); font-size: 10px; }
        .reset-brand-panel h1 { margin: 0 0 14px; font-size: 32px; line-height: 1.18; letter-spacing: -.03em; } .reset-brand-panel h1 span { color: var(--color-primary); }
        .reset-brand-panel > div > p { max-width: 290px; margin: 0 0 36px; color: var(--color-muted-foreground); font-size: 13.5px; line-height: 1.7; }
        ul { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; } li { display: flex; align-items: center; gap: 11px; color: var(--color-muted-foreground); font-size: 13px; } li :global(svg) { padding: 4px; box-sizing: content-box; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-accent); color: var(--color-primary); }
        .reset-status { display: flex; align-items: center; gap: 10px; padding: 13px 15px; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-accent); color: var(--color-muted-foreground); font-size: 11px; } .reset-status i { width: 7px; height: 7px; border-radius: 50%; background: var(--color-primary); }
        .reset-form-panel { flex: 1; display: flex; justify-content: center; align-items: center; padding: 40px 44px; position: relative; z-index: 1; } .reset-form-container { width: 100%; max-width: 400px; }
        .reset-mobile-brand { display: none; justify-content: center; margin: 0 0 22px; } .reset-mobile-brand .reset-logo { width: 32px; height: 32px; font-size: 13px; } .reset-mobile-brand strong { font-size: 17px; letter-spacing: -.025em; }
        .reset-heading { margin-bottom: 26px; } .reset-kicker { margin: 0 0 8px; color: var(--color-primary); font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; } .reset-heading h2, .reset-message h2 { margin: 0 0 6px; font-size: 26px; letter-spacing: -.025em; } .reset-heading > p:last-child, .reset-message p { margin: 0; color: var(--color-muted-foreground); font-size: 13px; line-height: 1.55; }
        .reset-form { display: grid; gap: 8px; } .reset-form label { margin-top: 8px; color: var(--color-muted-foreground); font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; } .reset-input-wrap { min-height: 52px; display: flex; align-items: center; gap: 10px; padding-left: 13px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-card); } .reset-input-wrap:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent); } .reset-input-wrap > :global(svg) { flex: 0 0 auto; color: var(--color-muted-foreground); } .reset-input-wrap input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--color-foreground); font-size: 14px; } .reset-input-wrap input::placeholder { color: var(--color-muted-foreground); opacity: .75; }
        .reset-eye { width: 48px; min-height: 48px; display: grid; place-items: center; border: 0; background: transparent; color: var(--color-muted-foreground); cursor: pointer; } .reset-eye:hover { color: var(--color-primary); }
        .reset-submit, .reset-secondary-action { min-height: 52px; width: 100%; margin-top: 10px; display: flex; justify-content: center; align-items: center; gap: 8px; border: 0; border-radius: 10px; background: var(--color-primary); color: var(--color-primary-foreground); font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 18px color-mix(in srgb, var(--color-primary) 18%, transparent); } .reset-submit:disabled { cursor: not-allowed; opacity: .65; } .reset-submit :global(svg) { animation: spin .75s linear infinite; }
        .reset-back { display: block; margin-top: 18px; color: var(--color-muted-foreground); text-align: center; font-size: 13px; text-decoration: none; } .reset-back:hover { color: var(--color-primary); }
        .reset-loading { min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--color-muted-foreground); font-size: 13px; } .reset-loading :global(svg) { color: var(--color-primary); animation: spin .75s linear infinite; }
        .reset-message { text-align: center; } .reset-message-icon { width: 52px; height: 52px; margin: 0 auto 16px; display: grid; place-items: center; border: 1px solid var(--color-destructive); border-radius: 50%; color: var(--color-destructive); background: color-mix(in srgb, var(--color-destructive) 10%, transparent); } .reset-message .reset-secondary-action { margin-top: 24px; border: 1px solid var(--color-border); background: var(--color-card); color: var(--color-foreground); text-decoration: none; box-shadow: none; }
        footer { position: relative; z-index: 1; display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; padding: 10px 44px; border-top: 1px solid var(--color-border); background: var(--color-muted); color: var(--color-muted-foreground); font-size: 11px; } footer div { display: flex; gap: 18px; } footer a { color: inherit; text-decoration: none; } footer a:hover { color: var(--color-primary); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 899px) { .reset-brand-panel { display: none; } .reset-form-panel { align-items: flex-start; padding: 24px 20px 28px; } .reset-form-container { max-width: 460px; } .reset-mobile-brand { display: flex; } footer { padding: 10px 20px; } }
      `}</style>
    </main>
  );
}
