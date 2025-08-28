export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md text-center space-y-4">
        <h1 className="text-3xl font-semibold">Gala</h1>
        <p className="text-gray-500">Plan together, faster.</p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/login"
            className="rounded-lg bg-gray-900 text-white px-4 py-2 font-medium hover:bg-black transition"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 transition"
          >
            Sign up
          </a>
        </div>
      </div>
    </main>
  );
}
