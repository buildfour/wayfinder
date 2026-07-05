import type { Tour, TourStep } from "./types";
import type { SourceDocument } from "./ingest/types";
import { slugify } from "./tour-engine";
import {
  extractKeywords,
  findHighlightPhrase,
  findRelevantParagraph,
} from "./ingest/source-text";

const dkimBaseSteps: TourStep[] = [
  {
    id: "step-1",
    type: "instruction",
    chapter: "Prerequisites",
    previewTitle: "IDENTITY VERIFIED",
    previewDescription: "Validate your ownership of the root domain.",
    headline: "Verify you have admin access to Google Workspace.",
    body: "Open the Google Admin console at admin.google.com. Sign in with an account that has Super Admin or a custom role with Gmail settings access.",
    sourcePassage: {
      text: "You must be signed in as a super administrator for your Google Workspace account to generate DKIM keys.",
      highlight: "super administrator",
      attribution: "Google Workspace Help Guide",
      section: "Prerequisites",
    },
    stuckHelp: {
      mismatch: {
        message:
          "If you don't see Gmail settings, your account may lack admin privileges. Ask your Workspace super admin to grant you the Gmail Settings admin role.",
        quote: "super administrator for your Google Workspace account",
      },
      confused: {
        message:
          "Go to admin.google.com, sign in, and look for the Admin console home. From the left menu: Apps → Google Workspace → Gmail.",
      },
      alreadyDone: {
        message: "Great — we'll skip ahead. Make sure you can still access Apps → Gmail in Admin console.",
      },
    },
  },
  {
    id: "step-2",
    type: "instruction",
    chapter: "Prerequisites",
    previewTitle: "SERVICE ACCESS",
    previewDescription: "Ensure you have admin rights to Google Console.",
    headline: "Generate your DKIM key in Google Admin.",
    body: "Navigate to Apps → Google Workspace → Gmail → Authenticate email. Click 'Generate new record' and select your DKIM key bit length (2048 recommended).",
    sourcePassage: {
      text: "In the Admin console, go to Apps > Google Workspace > Gmail > Authenticate email. Select the domain and click Generate new record. Copy the TXT record value shown.",
      highlight: "Generate new record",
      attribution: "Google Workspace Help Guide",
      section: "DKIM Key Generation",
    },
    stuckHelp: {
      mismatch: {
        message:
          "The Authenticate email page may be under Apps → Google Workspace → Gmail, not the main Gmail settings. Look for 'DKIM authentication'.",
      },
      confused: {
        message:
          "DKIM keys are generated per domain. Select your domain from the dropdown before clicking Generate new record.",
      },
      alreadyDone: {
        message: "If you already have a DKIM record generated, copy the TXT value — you'll need it for DNS.",
      },
    },
  },
  {
    id: "step-3",
    type: "instruction",
    chapter: "Prerequisites",
    previewTitle: "DNS PROVIDER",
    previewDescription: "Locate your authoritative name servers.",
    headline: "Log in to your DNS provider dashboard.",
    body: "Open a new tab and sign in to Cloudflare, GoDaddy, or Route 53. Locate the domain you're connecting and find the 'DNS Records' section.",
    sourcePassage: {
      text: "Access your domain registrar's administration panel and ensure you have edit permissions for the DNS zones. This is typically found under 'Management' or 'DNS Settings' within your provider's dashboard.",
      highlight: "edit permissions",
      attribution: "Google Workspace Help Guide",
      section: "DNS Configuration",
    },
    stuckHelp: {
      mismatch: {
        message:
          "Many registrars hide DNS settings behind a 'Classic View' or 'Advanced' tab. Look for a gear icon or 'Zone Editor.'",
        quote: "DNS Settings within your provider's dashboard",
      },
      confused: {
        message:
          "Your DNS provider is wherever you bought your domain, unless you've moved DNS to Cloudflare or Route 53. Check your domain registrar confirmation email.",
      },
      alreadyDone: {
        message: "Perfect — keep that DNS tab open. You'll add a TXT record in the next steps.",
      },
    },
  },
  {
    id: "step-4",
    type: "branch",
    chapter: "Core Setup",
    previewTitle: "OS BRANCH",
    previewDescription: "Tailor verification to your environment.",
    headline: "Which operating system are you using?",
    body: "Wayfinder will tailor the verification steps to your environment.",
    branchOptions: [
      {
        id: "macos",
        label: "macOS",
        description: "3 steps · Uses Terminal for signature verification.",
        cta: "← CHOOSE THIS PATH",
        accent: "cobalt",
      },
      {
        id: "windows",
        label: "Windows",
        description: "3 steps · Uses PowerShell and GUI tools.",
        cta: "CHOOSE THIS PATH →",
        accent: "amber",
      },
    ],
  },
  {
    id: "step-5-macos",
    type: "instruction",
    chapter: "Core Setup",
    branchId: "macos",
    previewTitle: "TERMINAL VERIFY",
    previewDescription: "Confirm DNS via Terminal dig command.",
    headline: "Verify DNS propagation using Terminal.",
    body: "Open Terminal and run: dig TXT google._domainkey.yourdomain.com +short. You should see the DKIM value returned once propagation completes.",
    sourcePassage: {
      text: "On macOS, use the dig command in Terminal to query your DKIM TXT record. Replace yourdomain.com with your actual domain.",
      highlight: "dig command",
      attribution: "Google Workspace Help Guide",
      section: "macOS Verification",
    },
    stuckHelp: {
      mismatch: {
        message:
          "If dig returns nothing, propagation may still be in progress. Wait 15–30 minutes and try again.",
      },
      confused: {
        message: "Open Terminal (Applications → Utilities → Terminal), paste the dig command, and press Enter.",
      },
      alreadyDone: {
        message: "If dig already returns your DKIM value, you're ready to add or confirm the TXT record.",
      },
    },
  },
  {
    id: "step-5-windows",
    type: "instruction",
    chapter: "Core Setup",
    branchId: "windows",
    previewTitle: "POWERSHELL VERIFY",
    previewDescription: "Confirm DNS via PowerShell Resolve-DnsName.",
    headline: "Verify DNS propagation using PowerShell.",
    body: "Open PowerShell and run: Resolve-DnsName -Name google._domainkey.yourdomain.com -Type TXT. The DKIM value should appear in the output.",
    sourcePassage: {
      text: "On Windows, use Resolve-DnsName in PowerShell to check your DKIM TXT record. Replace yourdomain.com with your actual domain.",
      highlight: "Resolve-DnsName",
      attribution: "Google Workspace Help Guide",
      section: "Windows Verification",
    },
    stuckHelp: {
      mismatch: {
        message:
          "An empty result usually means propagation isn't complete. Most DNS changes appear within 15–30 minutes.",
      },
      confused: {
        message: "Press Win+X, choose Windows PowerShell, paste the command, and press Enter.",
      },
      alreadyDone: {
        message: "If PowerShell already shows your DKIM TXT value, proceed to confirm the record in your DNS dashboard.",
      },
    },
  },
  {
    id: "step-6",
    type: "instruction",
    chapter: "Core Setup",
    previewTitle: "TXT PUBLISHING",
    previewDescription: "Broadcast the public key to global DNS.",
    headline: "Add the DKIM TXT record to your DNS.",
    body: "Create a new TXT record with the hostname from Google Admin (google._domainkey) and paste the full DKIM value. Set TTL to 3600 or automatic.",
    sourcePassage: {
      text: "Add a TXT record to your domain's DNS settings. Use the hostname and value provided in the Admin console. Some providers may require toggling 'Expert Mode' to view TXT records.",
      highlight: "TXT record",
      attribution: "Google Workspace Help Guide",
      section: "DNS Configuration",
    },
    stuckHelp: {
      mismatch: {
        message:
          "Some providers may require toggling 'Expert Mode' to view TXT records. Look for Advanced DNS or Manual DNS settings.",
        quote: "Expert Mode",
      },
      confused: {
        message:
          "Hostname is typically google._domainkey (no domain suffix). The value is the long string from Google Admin — include the full p= key.",
      },
      alreadyDone: {
        message: "If the TXT record is already published, verify the value matches exactly what Google Admin shows.",
      },
    },
  },
  {
    id: "step-7",
    type: "checkpoint",
    chapter: "Core Setup",
    previewTitle: "VERIFICATION",
    previewDescription: "Confirm the sync across all regions.",
    headline: "Verify the DKIM record appears in your DNS.",
    body: "Open your DNS provider dashboard — you should see the DKIM record you just added.",
    checkpointPrompt:
      "Open your DNS provider dashboard — you should see the DKIM record you just added. Does it appear?",
    checkpointYes: "✓ Yes, I can see it",
    checkpointNo: "✗ Not yet",
    checkpointDiagnostic:
      "DNS propagation can take up to 48 hours. Check that the hostname is google._domainkey and the TXT value matches Google Admin exactly — no extra quotes or spaces.",
    sourcePassage: {
      text: "Return to the Admin console and click Start authentication. Google will verify the TXT record exists and matches the expected value.",
      highlight: "Start authentication",
      attribution: "Google Workspace Help Guide",
      section: "Verification",
    },
    stuckHelp: {
      mismatch: {
        message:
          "Double-check the record type is TXT (not CNAME). The name field should be google._domainkey or google._domainkey.yourdomain.com depending on your provider.",
      },
      confused: {
        message: "In your DNS dashboard, look for an existing TXT record list. Filter by TXT type if your provider supports it.",
      },
      alreadyDone: {
        message: "If the record is visible, you're ready to authenticate in Google Admin.",
      },
    },
  },
  {
    id: "step-8",
    type: "instruction",
    chapter: "Verification",
    previewTitle: "AUTHENTICATE",
    previewDescription: "Enable DKIM signing in Google Admin.",
    headline: "Start DKIM authentication in Google Admin.",
    body: "Return to Apps → Gmail → Authenticate email. Click 'Start authentication.' Google will verify the record and enable DKIM signing for your domain.",
    sourcePassage: {
      text: "Once the TXT record is verified, click Start authentication in the Admin console. DKIM signing will be enabled and outgoing mail will be signed automatically.",
      highlight: "Start authentication",
      attribution: "Google Workspace Help Guide",
      section: "Final Steps",
    },
    stuckHelp: {
      mismatch: {
        message:
          "If authentication fails, Google may still be waiting on DNS. Wait 30 minutes and click Start authentication again.",
      },
      confused: {
        message: "Go back to Apps → Google Workspace → Gmail → Authenticate email. The Start authentication button appears after the TXT record is detected.",
      },
      alreadyDone: {
        message: "If DKIM already shows as 'Authenticating email', you're done — outgoing mail is being signed.",
      },
    },
  },
];

function buildDkimTour(goal: string, sourceUrl?: string, source?: SourceDocument | null): Tour {
  const id = "dkim-google-workspace";
  const steps = enrichStepsFromSource(dkimBaseSteps, goal, source);
  return {
    id,
    title: "DKIM Setup for Google Workspace",
    sourceTitle: source?.title ?? "Google Workspace Help Guide",
    sourceUrl: sourceUrl ?? source?.sourceUrl ?? "https://support.google.com/a/answer/174124",
    goal,
    estimatedMinutes: 12,
    branchCount: 2,
    lastSynced: "2 days ago",
    createdAt: new Date().toISOString(),
    sourceText: source?.text,
    sourceExcerpt: source?.excerpt,
    steps,
  };
}

function buildGenericTour(
  goal: string,
  sourceUrl?: string,
  source?: SourceDocument | null
): Tour {
  const id = slugify(goal) || `tour-${Date.now()}`;
  let sourceTitle = "Uploaded Resource";
  if (sourceUrl) {
    try {
      sourceTitle = new URL(sourceUrl).hostname;
    } catch {
      sourceTitle = sourceUrl.slice(0, 40);
    }
  }
  const steps: TourStep[] = [
    {
      id: "g-1",
      type: "instruction",
      chapter: "Getting Started",
      headline: "Review the source document.",
      body: `Open the resource you provided and skim the sections related to: "${goal}".`,
      previewTitle: "REVIEW SOURCE",
      previewDescription: "Orient yourself with the relevant sections.",
      stuckHelp: {
        confused: { message: "Use your browser's find (Ctrl/Cmd+F) to search for keywords from your goal." },
      },
    },
    {
      id: "g-2",
      type: "instruction",
      chapter: "Getting Started",
      headline: "Gather prerequisites.",
      body: "Check the doc for required accounts, permissions, or tools before proceeding.",
      previewTitle: "PREREQUISITES",
      previewDescription: "Confirm you have required access and tools.",
      stuckHelp: {
        mismatch: { message: "If prerequisites aren't listed upfront, check the doc's introduction or troubleshooting section." },
      },
    },
    {
      id: "g-3",
      type: "checkpoint",
      chapter: "Verification",
      headline: "Confirm you're ready to proceed.",
      body: "Make sure you have everything needed for the next steps.",
      checkpointPrompt: "Do you have the accounts and permissions mentioned in the doc?",
      checkpointYes: "✓ Yes, ready",
      checkpointNo: "✗ Not yet",
      checkpointDiagnostic: "Re-read the prerequisites section of the source doc. Most setup guides list required roles near the top.",
      previewTitle: "READINESS CHECK",
      previewDescription: "Gate before core steps.",
    },
    {
      id: "g-4",
      type: "instruction",
      chapter: "Core Setup",
      headline: "Follow the primary setup steps.",
      body: `Work through the main instructions in the source doc for: ${goal}. Take it one action at a time.`,
      previewTitle: "CORE SETUP",
      previewDescription: "Execute the main procedure.",
      stuckHelp: {
        mismatch: { message: "Your environment may differ from the doc. Check for version notes or alternative paths in the source." },
        confused: { message: "Tap ⌁ SOURCE PASSAGE on any step to see the original doc wording." },
      },
    },
    {
      id: "g-5",
      type: "instruction",
      chapter: "Verification",
      headline: "Verify the outcome.",
      body: "Use the doc's verification or testing section to confirm everything works.",
      previewTitle: "VERIFY",
      previewDescription: "Confirm the setup succeeded.",
      stuckHelp: {
        mismatch: { message: "If verification fails, check the doc's troubleshooting section for your specific error." },
      },
    },
  ];

  const enriched = enrichStepsFromSource(steps, goal, source);

  return {
    id,
    title: goal.length > 50 ? goal.slice(0, 50) + "…" : goal,
    sourceTitle: source?.title ?? sourceTitle,
    sourceUrl: sourceUrl ?? source?.sourceUrl,
    goal,
    estimatedMinutes: 8,
    branchCount: 0,
    createdAt: new Date().toISOString(),
    sourceText: source?.text,
    sourceExcerpt: source?.excerpt,
    steps: enriched,
  };
}

function enrichStepsFromSource(
  steps: TourStep[],
  goal: string,
  source?: SourceDocument | null
): TourStep[] {
  if (!source?.text) return steps;

  const keywords = extractKeywords(goal);
  const attribution = source.title;

  return steps.map((step) => {
    const passage = findRelevantParagraph(
      source.text,
      keywords.length ? keywords : [step.headline.split(" ")[0].toLowerCase()]
    );
    if (!passage) return step;

    const highlight = findHighlightPhrase(passage, keywords);
    const enrichedPassage = {
      text: passage.slice(0, 500),
      highlight,
      attribution,
      section: step.chapter ?? "Source",
      url: source.sourceUrl,
    };

    return {
      ...step,
      sourcePassage: step.sourcePassage ?? enrichedPassage,
      stuckHelp: {
        ...step.stuckHelp,
        mismatch: step.stuckHelp?.mismatch ?? {
          message: `From the source: "${passage.slice(0, 120)}…"`,
          quote: highlight,
        },
      },
    };
  });
}

export function generateTourFromGoal(
  goal: string,
  resourceUrl?: string,
  source?: SourceDocument | null
): Tour {
  const normalized = goal.toLowerCase();
  const isDkim =
    normalized.includes("dkim") ||
    (normalized.includes("google") && normalized.includes("workspace")) ||
    normalized.includes("email authentication");

  if (isDkim) return buildDkimTour(goal, resourceUrl, source);
  return buildGenericTour(goal, resourceUrl, source);
}

export const dkimTour = buildDkimTour(
  "I just need to get DKIM working for Google Workspace"
);

export function seedDefaultTour(): Tour {
  return dkimTour;
}
