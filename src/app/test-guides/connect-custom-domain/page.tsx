import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Connect a Custom Domain — Wayfinder Test Guide",
  description:
    "Step-by-step guide to pointing your custom domain at a Wayfinder-hosted tour lobby.",
};

export default function ConnectCustomDomainGuidePage() {
  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#1a1a1a]">
      <article className="mx-auto max-w-2xl px-6 py-12">
        <header className="mb-10 border-b border-[#d4cfc4] pb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[#5c7a72]">
            Wayfinder test guide
          </p>
          <h1 className="text-3xl font-bold leading-tight">
            How to Connect a Custom Domain to Your Tour Lobby
          </h1>
          <p className="mt-4 text-[#444]">
            Use this page to test URL ingestion in Wayfinder. Paste this page&apos;s URL on the{" "}
            <strong>New Tour → URL</strong> tab, then try the goal:{" "}
            <em>&quot;Connect my domain for the first time&quot;</em>.
          </p>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Before you start</h2>
          <ul className="list-disc space-y-2 pl-6 text-[#333]">
            <li>You own a domain (e.g. <code className="rounded bg-[#ebe6dc] px-1">guides.yourcompany.com</code>)</li>
            <li>You have access to your domain registrar or DNS provider</li>
            <li>Your tour is already published and you have the lobby share URL</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Step 1 — Copy your tour lobby URL</h2>
          <ol className="list-decimal space-y-2 pl-6 text-[#333]">
            <li>Open your published tour in Wayfinder.</li>
            <li>Go to the Share panel and copy the public lobby link.</li>
            <li>Keep this URL handy — you will point your domain at it.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Step 2 — Add a CNAME record</h2>
          <ol className="list-decimal space-y-2 pl-6 text-[#333]">
            <li>Sign in to your DNS provider (Cloudflare, Namecheap, Route 53, etc.).</li>
            <li>Open DNS settings for your domain.</li>
            <li>Create a new <strong>CNAME</strong> record:</li>
          </ol>
          <div className="my-4 overflow-x-auto rounded border border-[#d4cfc4] bg-white p-4 font-mono text-sm">
            <p>Type: CNAME</p>
            <p>Name: guides (or your chosen subdomain)</p>
            <p>Target: wayfinder-9qzr.onrender.com</p>
            <p>TTL: Auto or 300 seconds</p>
          </div>
          <p className="text-[#333]">
            If you use Cloudflare, set the proxy status to <strong>DNS only</strong> (grey cloud)
            until SSL is confirmed working.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Step 3 — Wait for DNS propagation</h2>
          <ol className="list-decimal space-y-2 pl-6 text-[#333]">
            <li>DNS changes can take 5 minutes to 48 hours depending on your provider.</li>
            <li>Run <code className="rounded bg-[#ebe6dc] px-1">dig guides.yourcompany.com CNAME</code> in a terminal to check status.</li>
            <li>When the CNAME points at Render, proceed to the next step.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Step 4 — Configure the redirect</h2>
          <ol className="list-decimal space-y-2 pl-6 text-[#333]">
            <li>In your hosting or edge provider, add a redirect rule from your custom domain to the tour lobby URL.</li>
            <li>Use a <strong>302 temporary</strong> redirect while testing; switch to <strong>301</strong> when you are satisfied.</li>
            <li>Enable HTTPS — most providers issue a free certificate automatically.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Step 5 — Verify in a browser</h2>
          <ol className="list-decimal space-y-2 pl-6 text-[#333]">
            <li>Open an incognito window.</li>
            <li>Visit <code className="rounded bg-[#ebe6dc] px-1">https://guides.yourcompany.com</code>.</li>
            <li>Confirm you land on the correct tour lobby with title and Play button visible.</li>
            <li>Click Play and walk through the first two steps to confirm the tour loads.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Troubleshooting</h2>
          <ul className="list-disc space-y-2 pl-6 text-[#333]">
            <li>
              <strong>SSL certificate error:</strong> Wait 15 minutes after DNS propagates, then retry.
              Ensure CNAME target matches exactly.
            </li>
            <li>
              <strong>Wrong tour loads:</strong> Check the redirect target URL includes the correct tour ID.
            </li>
            <li>
              <strong>404 on subdomain:</strong> CNAME may not have propagated — use{" "}
              <a
                className="text-[#0d6b5c] underline"
                href="https://dnschecker.org"
                rel="noopener noreferrer"
              >
                DNS Checker
              </a>{" "}
              to confirm global resolution.
            </li>
          </ul>
        </section>

        <footer className="border-t border-[#d4cfc4] pt-8 text-sm text-[#666]">
          <p>
            This is a sample document for testing Wayfinder ingestion.{" "}
            <Link className="text-[#0d6b5c] underline" href="/test-guides">
              Back to all test guides
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}
