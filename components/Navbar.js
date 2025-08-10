// components/Navbar.js
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full py-4 px-6 glass flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-2xl font-extrabold text-neon tracking-tight">CATALeya</div>
        <span className="small text-muted">AI hub</span>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/">
          <a className="text-sm text-[var(--text)] hover:text-white">Home</a>
        </Link>
        <Link href="/dashboard">
          <a className="text-sm text-[var(--text)] hover:text-white">Dashboard</a>
        </Link>
        <Link href="/login">
          <a className="btn-neon">Sign in</a>
        </Link>
      </div>
    </nav>
  );
}
