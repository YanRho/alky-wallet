
"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-lg bg-gray-900 text-white px-4 py-2 font-medium hover:bg-black transition"
    >
      Sign out
    </button>
  );
}
