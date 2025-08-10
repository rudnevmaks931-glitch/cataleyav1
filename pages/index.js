import Navbar from "../components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <Navbar />
      <main className="mt-8 max-w-5xl mx-auto">
        <div className="glass p-8 rounded-xl">
          <h1 className="text-4xl font-bold text-neon">Cataleya — AI hub</h1>
          <p className="mt-4 text-gray-300">Start with the chat assistant. Add images, video and more later.</p>
          <div className="mt-6 flex gap-4">
            <Link href="/dashboard"><a className="neon-btn">Go to Dashboard</a></Link>
            <a className="text-sm text-gray-400 self-center">Built for fast MVPs</a>
          </div>
        </div>
      </main>
    </div>
  );
}
