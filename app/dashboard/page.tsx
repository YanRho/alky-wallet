
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    // if not logged in, send them back to login
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-100 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-neutral-200 p-6 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Authenticated page</h1>
        <p className="text-gray-700">
          Welcome{session.user?.name ? `, ${session.user.name}` : ""}! You are logged in.
        </p>
        <p className="text-sm text-gray-500">Email: {session.user?.email}</p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <a
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 transition"
          >
            Home
          </a>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
