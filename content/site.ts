/**
 * EVERY string on the site lives here. Nothing else should hard-code copy.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠ SIGN-OFF REQUIRED BEFORE LAUNCH
 * BrandsLifter is a real business, but no real testimonials, client names,
 * metrics, or case studies were supplied for this build. Everything marked
 * `PLACEHOLDER` below was written to be *believable*, not to be true. Replace or
 * approve each one before this site goes live. Same for the contact details.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SITE = {
  wordmark: "BrandsLifter",
  /** <title> and og:title */
  title: "BrandsLifter — Web design & marketing",
  description:
    "A web design and marketing studio for companies that have outgrown the site they built in a hurry. Positioning, build, and growth — in that order.",
} as const;

/**
 * Section ids double as anchor targets and as the nav's active-state keys.
 *
 * "short" is what the nav shows below 640px, where the full set overflows the
 * bar by about 17px. Both strings are rendered and one is display:none'd in
 * CSS rather than swapped via aria-label — an accessible name that does not
 * contain the visible text breaks voice control (WCAG 2.5.3), and display:none
 * keeps the hidden one out of the accessible name entirely.
 */
export const NAV_LINKS = [
  { id: "home", label: "Home", short: "Home" },
  { id: "about", label: "About Us", short: "About" },
  { id: "services", label: "Services", short: "Services" },
  { id: "testimonials", label: "Testimonials", short: "Reviews" },
] as const;

/**
 * The one action in the nav, kept separate from the links above because it is
 * styled and treated differently.
 *
 * The nav is the only thing on screen in every frame of a five-thousand-pixel
 * page, and an enquiry is the only conversion this site has. Without this, the
 * route to the form after the hero scrolls away is either "remember a button
 * you saw two minutes ago" or "keep scrolling to the bottom".
 */
export const NAV_ACTION = {
  id: "contact",
  label: "Contact",
} as const;

export const HERO = {
  eyebrow: "Web design & marketing studio",
  /** Rendered as: <em>lead</em> restOfLine1 / line2 */
  headingLead: "Lift",
  headingRest: "your brand",
  headingLine2: "from the ground up",
  primaryCta: { label: "Contact Us", href: "#contact" },
  /* Not "See Our Work": there is no portfolio behind this link, and there is no
     case-study content to build one from. It points at the services ledger, so
     it says so. See Product Principle 5 — claim nothing unearned. */
  secondaryCta: { label: "How We Work", href: "#services" },
  /** Screen-reader-only description of the illustrated scene. */
  sceneAlt:
    "A hot air balloon rests beside a lone tree on a grassy hill at sunrise.",
} as const;

export const ABOUT = {
  eyebrow: "About us",
  heading: "We don’t launch brands. We give them altitude.",
  body: [
    "BrandsLifter is for companies that have outgrown the site they built in a hurry. We find the one true thing the business is for, build the site that proves it, then put weight behind it until the traffic compounds.",
    "Most clients can describe themselves perfectly out loud and not at all on the homepage. We fix that first.",
  ],
  /** The altimeter marks. Numbers are display strings, not data. */
  marks: [
    {
      n: "001",
      title: "Positioning before pixels",
      body: "No design begins until we can state your value in one sentence you would actually say out loud.",
    },
    {
      n: "002",
      title: "Built to be edited",
      body: "Every site ships as a system your own team can extend — components, tokens, and documentation, not a pile of files.",
    },
    {
      /* PLACEHOLDER: confirm the ninety-day commitment is one you want to make. */
      n: "003",
      title: "Measured after launch",
      body: "We stay on for ninety days minimum. Launch is a checkpoint, not the finish line.",
    },
  ],
} as const;

export const SERVICES = {
  eyebrow: "Services",
  heading: "What we actually do",
  /* "Three things, in order" has to match what About promises. The first three
     rows are the sequence; the fourth is what keeps it moving afterwards, and
     the copy now says so rather than calling all four "disciplines". */
  intro:
    "Three disciplines, in that order — each one is worth less without the one above it. Then a fourth, for after the launch.",
  /* PLACEHOLDER: descriptions describe an intended offering, not a documented one.
     Confirm scope and deliverables before launch. */
  items: [
    {
      n: "01",
      name: "Brand Strategy",
      summary: "Decide what you are before you decide how you look.",
      body: "Positioning, naming, voice, and the visual system that carries them. You leave with a one-page brand truth and the assets to enforce it across everything you ship.",
      meta: "2–4 weeks",
    },
    {
      n: "02",
      name: "Web Design & Build",
      summary: "The site that proves the claim.",
      body: "Custom design through production front-end. Next.js, CMS-backed, fast on a bad connection, and editable by someone who has never opened a terminal.",
      meta: "6–10 weeks",
    },
    {
      n: "03",
      name: "Growth Marketing",
      summary: "Put weight behind it.",
      body: "SEO foundations, paid acquisition, and lifecycle email — plus the analytics to tell you honestly which of the three is actually working.",
      meta: "Ongoing",
    },
    {
      n: "04",
      name: "Ongoing Lift",
      summary: "Keep climbing after launch.",
      body: "A retainer for companies past their launch: monthly iteration on the pages that convert, and the discipline to keep shipping when the novelty wears off.",
      meta: "Monthly",
    },
  ],
} as const;

/**
 * One testimonial. Kept as an explicit type rather than inferred from a literal
 * so that dropping a real photograph in later is a one-word edit.
 */
export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  /**
   * Path to a square portrait in /public, or null for the initials fallback.
   * PLACEHOLDER: no real photographs were supplied, so all four are null.
   */
  avatar: string | null;
};

export const TESTIMONIALS: { eyebrow: string; items: Testimonial[] } = {
  eyebrow: "What clients say",
  /* PLACEHOLDER — every quote and attribution below is invented.
     Replace with real, permissioned testimonials before launch. */
  items: [
    {
      quote:
        "They cut half our homepage and conversion went up. I am still a little annoyed about how right that was.",
      name: "Priya Raghunathan",
      role: "Founder, Kettle & Co.",
      avatar: null,
    },
    {
      quote:
        "The site went live on a Thursday. By Monday our sales team had stopped explaining what we do on calls.",
      name: "Marcus Feld",
      role: "VP Revenue, Northbeam Logistics",
      avatar: null,
    },
    {
      quote:
        "Three agencies told us our brand was fine. BrandsLifter told us it was invisible, then showed us the search data.",
      name: "Dana Osei",
      role: "CMO, Arbor Health",
      avatar: null,
    },
    {
      quote:
        "They handed over a system, not a set of files. We have shipped eleven pages ourselves since.",
      name: "Tomás Rivera",
      role: "Head of Product, Slate Interiors",
      avatar: null,
    },
  ],
};

export const CONTACT = {
  eyebrow: "Start here",
  heading: "Tell us what’s grounded",
  intro:
    "A short note is enough. We reply within two business days, with a real person’s name on it.",
  fields: {
    name: { label: "Your name", placeholder: "Dana Osei" },
    email: { label: "Email", placeholder: "dana@company.com" },
    company: { label: "Company", placeholder: "Optional", optional: true },
    message: {
      label: "What are you trying to lift?",
      placeholder:
        "A sentence or two about where you are and what is not moving.",
    },
  },
  submit: "Send it up",
  sending: "Sending…",
  /* This build validates and shows a success state only — no network call.
     See ContactForm.tsx for where to wire a real destination. */
  success: {
    heading: "It’s away.",
    body: "Thanks — we have your note. Expect a reply within two business days.",
    again: "Send another",
  },
  errors: {
    name: "Please tell us your name.",
    email: "Please enter an email we can reply to.",
    emailFormat: "That email doesn’t look right.",
    message: "A sentence is plenty — but we need at least one.",
  },
} as const;

export const FOOTER = {
  tagline: "Web design & marketing. Built for altitude.",
  /* The last frame of a long scroll used to hand a visitor who had not written
     to us precisely nothing. This is the one quiet way back. */
  closer: { label: "Start a conversation", href: "#contact" },
  /* PLACEHOLDER: swap for real contact details and social handles. */
  email: "hello@brandslifter.com",
  socials: [
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Dribbble", href: "#" },
  ],
  legal: `© ${new Date().getFullYear()} BrandsLifter. All rights reserved.`,
  colophon: "Illustrations painted for BrandsLifter.",
} as const;
