import { useState } from 'react';
import { userApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showSuccess } = useToast();

  const [name, setName] = useState(user.name);
  const [companyName, setCompanyName] = useState(user.companyName || '');
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleNameSubmit(event) {
    event.preventDefault();
    setNameError('');
    setSavingName(true);
    try {
      const data = await userApi.updateProfile({ name: name.trim(), ...(user.accountType === 'company' ? { companyName: companyName.trim() } : {}) });
      setUser(data.user);
      setCompanyName(data.user.companyName || '');
      showSuccess('Profile updated.');
    } catch (err) {
      setNameError(getErrorMessage(err));
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await userApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showSuccess('Password changed.');
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  const handlePasswordField = (event) => setPasswords({ ...passwords, [event.target.name]: event.target.value });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} size="h-14 w-14 text-lg" />
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleNameSubmit} className="card space-y-4 p-5">
        <h2 className="text-base font-bold text-slate-900">{user.accountType === 'company' ? 'Company profile' : 'Your details'}</h2>
        {nameError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{nameError}</p>}
        <p className="text-sm text-slate-500">{user.accountType === 'company' ? 'Manage the name your team sees across TaskFlow.' : 'Your account is ready to join a company workspace.'}</p>
        {user.accountType === 'company' && (
          <div>
            <label htmlFor="company-name" className="label">Company name</label>
            <input id="company-name" className="input" value={companyName} maxLength={60} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>
        )}
        <div>
          <label htmlFor="profile-name" className="label">Full name</label>
          <input id="profile-name" className="input" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="profile-email" className="label">Email</label>
          <input id="profile-email" className="input bg-slate-100" value={user.email} disabled />
        </div>
        <button type="submit" className="btn-primary" disabled={savingName}>{savingName ? 'Saving...' : 'Save changes'}</button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="card space-y-4 p-5">
        <h2 className="text-base font-bold text-slate-900">Change password</h2>
        {passwordError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{passwordError}</p>}
        <div>
          <label htmlFor="currentPassword" className="label">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" className="input" value={passwords.currentPassword} onChange={handlePasswordField} required />
        </div>
        <div>
          <label htmlFor="newPassword" className="label">New password</label>
          <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" className="input" value={passwords.newPassword} onChange={handlePasswordField} required />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="label">Confirm new password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className="input" value={passwords.confirmPassword} onChange={handlePasswordField} required />
        </div>
        <button type="submit" className="btn-primary" disabled={savingPassword}>{savingPassword ? 'Updating...' : 'Update password'}</button>
      </form>
    </div>
  );
}
