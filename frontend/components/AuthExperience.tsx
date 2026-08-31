'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Activity, ArrowRight, LockKeyhole, Plus, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { apiRequest } from '../apiClient';
import { login, register, type AppUser } from '../authService';

type Mode = 'login' | 'register';
type Props = { mode: Mode; onAuthenticated: (user: AppUser) => void };

function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Something went wrong. Please try again.';
  try { return JSON.parse(error.message).detail || 'Something went wrong. Please try again.'; } catch { return error.message || 'Something went wrong. Please try again.'; }
}

export function AuthExperience({ mode: initialMode, onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setMode(initialMode), [initialMode]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (mode === 'register' && password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      if (mode === 'register') await register({ full_name: name, email, password });
      await login(email, password);
      const user = await apiRequest<AppUser>('/api/v1/auth/me');
      onAuthenticated(user);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  const registering = mode === 'register';
  return <main className="auth-page"><div className="auth-grid" /><section className="auth-intro"><div className="auth-brand"><div className="logo-mark"><Plus size={23} strokeWidth={2.6} /></div><div><strong>MedSync</strong><span>AI Operations Command Center</span></div></div><div className="auth-intro-copy"><span className="eyebrow">Secure clinical operations</span><h1>Bring clarity to every <span>critical decision.</span></h1><p>One protected workspace for hospital leaders to understand demand, coordinate capacity, and respond early.</p></div><div className="auth-benefits"><div><Activity size={17} /><span><strong>Live operational intelligence</strong><small>Capacity, patient flow, and demand signals in one place.</small></span></div><div><ShieldCheck size={17} /><span><strong>Role-aware access</strong><small>Users and workspace access are managed by your administrators.</small></span></div></div></section><section className="auth-panel-wrap"><div className="auth-panel"><div className="auth-panel-head"><div className="auth-icon"><LockKeyhole size={18} /></div><span className="eyebrow">{registering ? 'Create your workspace access' : 'Welcome back'}</span><h2>{registering ? 'Create an account' : 'Sign in to MedSync'}</h2><p>{registering ? 'Register to start using the command center.' : 'Enter your credentials to continue.'}</p></div><form onSubmit={submit} className="auth-form">{registering && <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Dr. Avery Chen" autoComplete="name" /></label>}<label>Work email<input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@hospital.org" autoComplete="email" /></label><label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" minLength={8} placeholder="At least 8 characters" autoComplete={registering ? 'new-password' : 'current-password'} /></label>{registering && <label>Confirm password<input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required type="password" placeholder="Re-enter your password" autoComplete="new-password" /></label>}{error && <p className="auth-error" role="alert">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? 'Please wait…' : registering ? <>Create account <ArrowRight size={16} /></> : <>Sign in <ArrowRight size={16} /></>}</button></form><p className="auth-switch">{registering ? 'Already have an account?' : 'New to MedSync?'} <button type="button" onClick={() => { setMode(registering ? 'login' : 'register'); setError(''); }}>{registering ? 'Sign in' : 'Create an account'}</button></p></div></section></main>;
}

type AdminProps = { currentUser: AppUser };
export function AdminUsers({ currentUser }: AdminProps) {
  const [users, setUsers] = useState<AppUser[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'operations_manager' });
  const admin = ['system_admin', 'hospital_admin'].includes(currentUser.role);
  async function load() { setLoading(true); try { setUsers(await apiRequest<AppUser[]>('/api/v1/auth/users')); } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); } }
  useEffect(() => { if (admin) load(); }, [admin]);
  async function add(event: FormEvent) { event.preventDefault(); setError(''); try { const user = await apiRequest<AppUser>('/api/v1/auth/users', { method: 'POST', body: JSON.stringify(form) }); setUsers((items) => [...items, user].sort((a, b) => a.full_name.localeCompare(b.full_name))); setForm({ full_name: '', email: '', password: '', role: 'operations_manager' }); } catch (err) { setError(errorMessage(err)); } }
  async function remove(user: AppUser) { if (!window.confirm(`Remove ${user.full_name}'s account?`)) return; setError(''); try { await apiRequest<void>(`/api/v1/auth/users/${user.id}`, { method: 'DELETE' }); setUsers((items) => items.filter((item) => item.id !== user.id)); } catch (err) { setError(errorMessage(err)); } }
  if (!admin) return <div className="empty-page"><span className="eyebrow">Access restricted</span><h1>Administrator access required</h1><p>Your account does not have permission to manage users.</p></div>;
  return <div className="admin-page"><div className="page-header"><div><span className="eyebrow">Workspace administration</span><h1>User management</h1><p>Review registered users, provision access, and remove accounts when needed.</p></div><div className="admin-count"><Users size={17} /><strong>{users.length}</strong><span>registered users</span></div></div><div className="admin-layout"><section className="panel admin-users-panel"><div className="section-title"><div><h2>Registered users</h2><span>{loading ? 'Loading user records…' : 'Accounts stored in the MedSync database'}</span></div></div>{error && <p className="auth-error">{error}</p>}<div className="user-table">{!loading && users.map((user) => <div className="user-row" key={user.id}><div className="user-avatar">{user.full_name.slice(0, 1).toUpperCase()}</div><div><strong>{user.full_name}</strong><span>{user.email}</span></div><em>{user.role.replace('_', ' ')}</em><button className="icon-button danger-button" title={`Delete ${user.full_name}`} onClick={() => remove(user)} disabled={user.id === currentUser.id}><Trash2 size={16} /></button></div>)}{!loading && users.length === 0 && <p className="admin-empty">No users registered yet.</p>}</div></section><section className="panel add-user-panel"><div className="section-title"><div><h2>Add a user</h2><span>Create an account with the right role.</span></div><UserPlus size={18} className="teal-text" /></div><form className="admin-form" onSubmit={add}><label>Full name<input value={form.full_name} required minLength={2} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label><label>Email address<input value={form.email} required type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Temporary password<input value={form.password} required type="password" minLength={8} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="operations_manager">Operations manager</option><option value="hospital_admin">Hospital administrator</option><option value="doctor">Doctor</option><option value="nurse">Nurse</option></select></label><button className="primary-button wide"><UserPlus size={16} /> Add user</button></form></section></div></div>;
}
