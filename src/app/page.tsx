export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-30 w-30 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg shadow-blue-600/30">
          Convo
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome to ChatApp
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Real-time messaging made simple, fast and beautiful.
        </p>

        <button className="mt-8 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98]">
          Get Started
        </button>
      </div>
    </main>
  );
}