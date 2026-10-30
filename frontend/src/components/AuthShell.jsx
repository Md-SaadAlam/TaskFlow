import { Link } from 'react-router-dom';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="TaskFlow introduction">
        <Link className="auth-brand" to="/login" aria-label="TaskFlow home">
          <span className="brand-mark">t</span>
          <span>taskflow</span>
        </Link>

        <div className="story-content">
          <p className="eyebrow"><span className="live-dot" /> A calmer way to move work forward</p>
          <h2>Good work<br />has a <span>place</span><br />to happen.</h2>
          <p className="story-copy">Bring your team, projects and priorities into focus. Then make room for the work that matters.</p>

          <div className="orbit-card" aria-label="A visual preview of team progress">
            <div className="orbit-glow" />
            <div className="orbit-ring orbit-ring-one" />
            <div className="orbit-ring orbit-ring-two" />
            <div className="orbit-core"><span>tf</span></div>
            <span className="orbit-label orbit-label-top">Plan together</span>
            <span className="orbit-label orbit-label-bottom">Make it happen</span>
            <div className="glass-note"><span className="note-check">✓</span><span><b>In sync</b><small>One team, one view</small></span></div>
          </div>
        </div>

        <footer className="auth-foot"><span>Thoughtful work, made visible.</span><span>© {new Date().getFullYear()} TaskFlow</span></footer>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><span className="brand-mark">t</span><span>taskflow</span></div>
          <p className="form-kicker">YOUR TEAM, IN FLOW</p>
          <h1>{title}</h1>
          <p className="form-subtitle">{subtitle}</p>
          <div className="auth-form-content">{children}</div>
          <p className="privacy-note"><span aria-hidden="true">◈</span> Your workspace is private to your team.</p>
        </div>
      </section>
    </main>
  );
}
