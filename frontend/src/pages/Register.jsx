import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';

const ACCOUNT_OPTIONS = [
  { value: 'company', title: 'I’m setting up a team', note: 'Create a company workspace and invite people.', icon: '↗' },
  { value: 'employee', title: 'I’m joining a team', note: 'Create your account to work with your team.', icon: '◌' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('company');
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '', companyName: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function validate() {
    if (values.name.trim().length < 2) return 'Enter your name (at least 2 characters).';
    if (accountType === 'company' && values.companyName.trim().length < 2) return 'Enter your company name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return 'Enter a valid work email address.';
    if (values.password.length < 8 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) return 'Use at least 8 characters, including a letter and a number.';
    if (values.password !== values.confirmPassword) return 'Your passwords do not match.';
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError('');
    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        accountType,
        companyName: accountType === 'company' ? values.companyName.trim() : undefined,
      });
      navigate(accountType === 'company' ? '/workspaces' : '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create your space." subtitle="Start with the people and work that matter.">
      <div className="account-choice" role="group" aria-label="Choose account type">
        {ACCOUNT_OPTIONS.map((option) => (
          <button key={option.value} type="button" className={`account-choice-card ${accountType === option.value ? 'is-selected' : ''}`} onClick={() => setAccountType(option.value)} aria-pressed={accountType === option.value}>
            <span className="choice-icon" aria-hidden="true">{option.icon}</span>
            <span className="choice-copy"><b>{option.title}</b><small>{option.note}</small></span>
            <span className="choice-radio" aria-hidden="true" />
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="auth-error" role="alert">{error}</p>}
        {accountType === 'company' && (
          <div className="field-block">
            <label htmlFor="companyName" className="auth-label">Company name</label>
            <input id="companyName" name="companyName" className="auth-input" autoComplete="organization" maxLength={60} placeholder="Northstar Studio" value={values.companyName} onChange={handleChange} required />
          </div>
        )}
        <div className="field-block">
          <label htmlFor="name" className="auth-label">Your full name</label>
          <input id="name" name="name" className="auth-input" autoComplete="name" placeholder="Jordan Lee" value={values.name} onChange={handleChange} required />
        </div>
        <div className="field-block">
          <label htmlFor="email" className="auth-label">Work email</label>
          <input id="email" name="email" type="email" className="auth-input" autoComplete="email" placeholder="you@company.com" value={values.email} onChange={handleChange} required />
        </div>
        <div className="auth-field-row">
          <div className="field-block">
            <label htmlFor="password" className="auth-label">Password</label>
            <input id="password" name="password" type="password" className="auth-input" autoComplete="new-password" placeholder="8+ characters" value={values.password} onChange={handleChange} required />
          </div>
          <div className="field-block">
            <label htmlFor="confirmPassword" className="auth-label">Confirm</label>
            <input id="confirmPassword" name="confirmPassword" type="password" className="auth-input" autoComplete="new-password" placeholder="Repeat password" value={values.confirmPassword} onChange={handleChange} required />
          </div>
        </div>
        <button type="submit" className="auth-submit" disabled={submitting}>
          <span>{submitting ? 'Setting things up…' : accountType === 'company' ? 'Create company workspace' : 'Create employee account'}</span>
          <span aria-hidden="true">→</span>
        </button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthShell>
  );
}
