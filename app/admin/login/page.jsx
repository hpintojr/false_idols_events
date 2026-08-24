export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team Login' };

export default function LoginPage({ searchParams }) {
  const err = searchParams?.err;
  return (
    <div className="login-wrap">
      <h1>TEAM LOGIN</h1>
      {err === '1' && <div className="error-box" style={{ marginBottom: 14 }}>Wrong email or password.</div>}
      {err === 'rate' && <div className="error-box" style={{ marginBottom: 14 }}>Too many attempts — wait a few minutes.</div>}
      <form method="post" action="/api/login" className="stack">
        <div className="field"><label htmlFor="e">EMAIL</label><input id="e" type="email" name="email" required autoComplete="username" /></div>
        <div className="field"><label htmlFor="p">PASSWORD</label><input id="p" type="password" name="password" required autoComplete="current-password" /></div>
        <button className="btn" type="submit">LOG IN</button>
      </form>
    </div>
  );
}
