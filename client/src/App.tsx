import { useEffect, useState } from 'react';
import { api, token } from './api';
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import Plan from './pages/Plan';
import type { User } from './types';

type Page = 'plan' | 'dashboard' | 'master';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState<Page>('plan');

  const signOut = () => { token.clear(); setUser(null); setPage('plan'); };
  useEffect(() => {
    if (token.get()) api.me().then(setUser).catch(() => token.clear()).finally(() => setReady(true)); else setReady(true);
    window.addEventListener('tlo:signed-out', signOut);
    return () => window.removeEventListener('tlo:signed-out', signOut);
  }, []);

  if (!ready) return null;
  if (!user) return <Login onSignedIn={setUser} />;

  const pages: { id: Page; label: string; show: boolean }[] = [
    { id: 'plan', label: 'Plan a train', show: true },
    { id: 'dashboard', label: 'KPI dashboard', show: true },
    { id: 'master', label: 'Master data', show: user.role === 'admin' },
  ];

  return (
    <div className="shell">
      <header className="top">
        <h1>Train Load Optimization</h1>
        <div className="who">
          <span>{user.username} <em>{user.role === 'admin' ? 'Administrator' : 'Planner'}</em></span>
          <button className="ghost" onClick={() => api.logout().finally(signOut)}>Sign out</button>
        </div>
      </header>
      <nav className="tabs" aria-label="Sections">
        {pages.filter((p) => p.show).map((p) => (
          <button key={p.id} className={page === p.id ? 'tab on' : 'tab'} aria-current={page === p.id ? 'page' : undefined} onClick={() => setPage(p.id)}>{p.label}</button>
        ))}
      </nav>
      {page === 'plan' && <Plan />}
      {page === 'dashboard' && <Dashboard key="d" />}
      {page === 'master' && user.role === 'admin' && <MasterData onResetDemo={signOut} />}
    </div>
  );
}

function Login({ onSignedIn }: { onSignedIn: (u: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { const r = await api.login(username, password); token.set(r.token); onSignedIn(r.user); }
    catch (err) { setError((err as Error).message); }
  };
  return (
    <div className="shell narrow">
      <h1>Train Load Optimization</h1>
      <form className="panel" onSubmit={submit}>
        <h2>Sign in</h2>
        {error && <div className="alert" role="alert">{error}</div>}
        <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <div className="actions"><button type="submit" disabled={!username || !password}>Sign in</button></div>
        <p className="muted">Training accounts: <strong>planner</strong> / planner123 and <strong>admin</strong> / admin123</p>
      </form>
    </div>
  );
}
