"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/layout/Wordmark";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { StarChartGrid } from "@/components/layout/StarChart";
import { fadeUp, staggerContainer, cinematicTransition } from "@/lib/motion/variants";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const reg = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const regData = await reg.json();

    if (!regData.success) {
      setLoading(false);
      setError(regData.error ?? "Registration failed");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created but sign-in failed. Try logging in.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-void film-grain px-6">
      <StarChartGrid />
      <Wordmark className="absolute left-6 top-6" />

      <motion.form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={fadeUp}
          transition={cinematicTransition}
          className="mb-2 text-center font-[family-name:var(--font-bebas)] text-sm tracking-[0.3em] text-teal"
        >
          CREATE ACCOUNT
        </motion.h1>
        <motion.p
          variants={fadeUp}
          transition={cinematicTransition}
          className="mb-10 text-center text-sm text-muted"
        >
          Explorer Tier — unlimited tours, synced everywhere.
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={cinematicTransition}
          className="space-y-6 rounded border border-cobalt/20 bg-charcoal/30 p-8 glow-cobalt"
        >
          <label className="block">
            <span className="text-[10px] text-muted tracking-wider">NAME</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full border-b border-parchment/20 bg-transparent py-2 text-parchment focus:border-teal focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-muted tracking-wider">EMAIL</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full border-b border-parchment/20 bg-transparent py-2 text-parchment focus:border-teal focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-muted tracking-wider">PASSWORD (8+ CHARS)</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-2 w-full border-b border-parchment/20 bg-transparent py-2 text-parchment focus:border-teal focus:outline-none"
            />
          </label>

          {error && <p className="text-sm text-amber-bright">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-cobalt-bright py-3 font-[family-name:var(--font-bebas)] text-sm tracking-wider text-white disabled:opacity-50"
          >
            {loading ? "CREATING…" : "CREATE ACCOUNT →"}
          </button>
        </motion.div>

        <motion.p
          variants={fadeUp}
          transition={cinematicTransition}
          className="mt-8 text-center text-sm text-muted"
        >
          Already have an account?{" "}
          <Link href="/login" className="text-teal-bright hover:text-teal">
            Sign in
          </Link>
        </motion.p>
      </motion.form>

      <FilmPerforations className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}
