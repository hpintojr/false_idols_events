'use client';

export default function NavToggle() {
  return (
    <button
      className="nav-toggle"
      aria-label="Menu"
      onClick={() => document.body.classList.toggle('nav-open')}
    >
      ☰
    </button>
  );
}
