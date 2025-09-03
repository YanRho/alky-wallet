
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/*
    NextAuth route handler for authentication.
    It handles both GET and POST requests for authentication.
    
*/

export const runtime = "nodejs";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
