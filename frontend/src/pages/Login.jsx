import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';
  const [accountType, setAccountType] = useState('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Enter your email and password to continue.'); return; }
    setSubmitting(true);
    try {
      await login(email.trim(), password, accountType);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Welcome back." subtitle="Pick up where your team left off.">
      <div className="signin-switch" role="group" aria-label="Sign in as">
        <button type="button" aria-pressed={accountType === 'employee'} className={accountType === 'employee' ? 'is-active' : ''} onClick={() => setAccountType('employee')}>Employee</button>
        <button type="button" aria-pressed={accountType === 'company'} className={accountType === 'company' ? 'is-active' : ''} onClick={() => setAccountType('company')}>Company</button>
      </div>
      <p className="signin-context">{accountType === 'company' ? 'Sign in to manage your company workspace.' : 'Sign in to see your work and team updates.'}</p>
      <form onSubmit={handleSubmit} className="auth-form login-form">
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="field-block">
          <label htmlFor="email" className="auth-label">Work email</label>
          <input id="email" type="email" autoComplete="email" className="auth-input" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="field-block">
          <label htmlFor="password" className="auth-label">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="auth-input" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        <button type="submit" className="auth-submit" disabled={submitting}>
          <span>{submitting ? 'Signing you in…' : 'Continue'}</span><span aria-hidden="true">→</span>
        </button>
      </form>
      <p className="auth-switch">New to TaskFlow? <Link to="/register">Create an account</Link></p>
    </AuthShell>
  );
}
