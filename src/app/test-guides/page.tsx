import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Test Guides — Wayfinder",
  description: "Sample documents and URLs for testing tour creation in Wayfinder.",
};

const files = [
  {
    name: "reset-api-key.md",
    href: "/test-guides/files/reset-api-key.md",
    goal: "Reset my API key for the first time",
    description: "Security SOP with numbered steps and a troubleshooting section.",
  },
  {
    name: "onboard-new-teammate.txt",
    href: "/test-guides/files/onboard-new-teammate.txt",
    goal: "Onboard a new engineer on day one",
    description: "People Ops runbook with access checklist and common issues.",
  },
  {
    name: "vpn-client-setup.md",
    href: "/test-guides/files/vpn-client-setup.md",
    goal: "Set up VPN on my Mac",
    description: "macOS and Windows branches — good for testing OS-specific paths.",
  },
];

export default function TestGuidesIndexPage() {
  return (
    <main className="min-h-screen bg-void px-6 py-12 text-parchment">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 font-[family-name:var(--font-bebas)] text-sm tracking-[0.3em] text-teal">
          TEST ASSETS
        </p>
        <h1 className="mb-4 font-[family-name:var(--font-bebas)] text-4xl tracking-wide">
          Wayfinder Test Guides
        </h1>
        <p className="mb-10 text-muted">
          Use these to test tour creation. Upload the files on <Link href="/new" className="text-teal underline">New Tour</Link>,
          or paste the webpage URL below.
        </p>

        <section className="mb-10 rounded border border-cobalt/20 bg-charcoal/30 p-6">
          <h2 className="mb-2 font-[family-name:var(--font-bebas)] text-lg tracking-widest text-amber">
            URL ingest (webpage)
          </h2>
          <p className="mb-3 text-sm text-muted">
            Paste this URL on the New Tour → URL tab:
          </p>
          <Link
            href="/test-guides/connect-custom-domain"
            className="break-all text-teal underline"
          >
            /test-guides/connect-custom-domain
          </Link>
          <p className="mt-3 text-sm text-muted">
            Suggested goal: <em>&quot;Connect my domain for the first time&quot;</em>
          </p>
        </section>

        <section>
          <h2 className="mb-4 font-[family-name:var(--font-bebas)] text-lg tracking-widest text-amber">
            Upload these files
          </h2>
          <ul className="space-y-4">
            {files.map((file) => (
              <li
                key={file.href}
                className="rounded border border-parchment/10 bg-charcoal/20 p-4"
              >
                <a href={file.href} download className="font-medium text-teal underline">
                  {file.name}
                </a>
                <p className="mt-1 text-sm text-muted">{file.description}</p>
                <p className="mt-2 text-xs text-parchment/60">
                  Suggested goal: <em>&quot;{file.goal}&quot;</em>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-center text-sm text-muted">
          <Link href="/" className="text-teal underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
