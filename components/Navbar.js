import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full py-4 px-6 glass flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-extrabold text-accent tracking-tight">CATALeya</div>
        <span className="small text-muted">AI hub</span>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/"><a className="text-default hover:text-white small">Home</a></Link>
        <Link href="/dashboard"><a className="text-default hover:text-white small">Dashboard</a></Link>
        <Link href="/login"><a className="neon-btn">Sign in</a></Link>
      </div>
    </nav>
  );
}
