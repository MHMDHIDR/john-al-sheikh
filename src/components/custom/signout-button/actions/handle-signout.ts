"use server";

import { signOut } from "@/server/auth";

export async function handleSignout() {
  await signOut({ redirectTo: "/signin" });
}
