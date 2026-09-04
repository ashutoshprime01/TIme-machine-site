// Global internet-history timeline (plan §25): a curated, versioned dataset
// of well-documented public events in the web's history. These are matters
// of public record (not our analysis) — the dataset exists so the /history
// page can show eras and link each one to real sites you can then travel
// through in the Time Machine.
//
// Keep entries conservative: only widely documented milestones. If an entry
// is arguable, phrase it as the era's character rather than a claim.

export const HISTORY_VERSION = "1.0";

export type HistoryCategory =
  | "origin"
  | "browsers"
  | "commerce"
  | "search"
  | "social"
  | "mobile"
  | "design"
  | "ai";

export const CATEGORY_LABELS: Record<HistoryCategory, string> = {
  origin: "Origins",
  browsers: "Browsers",
  commerce: "Commerce",
  search: "Search",
  social: "Social web",
  mobile: "Mobile",
  design: "Design",
  ai: "AI era",
};

export interface HistoryEvent {
  /** Display year or range, e.g. "1993" or "2010s". */
  year: string;
  /** Numeric start year for sorting (decades use their first year). */
  sortYear: number;
  title: string;
  description: string;
  category: HistoryCategory;
  /** Real sites to open in the Time Machine for this period. */
  explore?: Array<{ domain: string; note: string }>;
}

export interface HistoryEra {
  /** e.g. "1989–1993" */
  range: string;
  title: string;
  summary: string;
  events: HistoryEvent[];
}

export const INTERNET_HISTORY: HistoryEra[] = [
  {
    range: "1989–1993",
    title: "The Beginning",
    summary:
      "A physicist's document-sharing idea becomes the World Wide Web. Pages are text, links, and almost nothing else.",
    events: [
      {
        year: "1989–1991",
        sortYear: 1989,
        title: "The Web is invented at CERN",
        description:
          "Tim Berners-Lee proposes a hypertext document system at CERN (1989); the first website — info.cern.ch — goes live in 1991. The page is a public, plain-HTML document.",
        category: "origin",
        explore: [
          { domain: "info.cern.ch", note: "The first website, still minimal today" },
          { domain: "w3.org", note: "The standards body's own long history" },
        ],
      },
      {
        year: "1993",
        sortYear: 1993,
        title: "Mosaic makes the web visual",
        description:
          "The NCSA Mosaic browser puts images inline with text, and the web stops being a text-only research tool. Browser adoption explodes.",
        category: "browsers",
        explore: [{ domain: "info.cern.ch", note: "See what the web looked like around Mosaic's launch" }],
      },
    ],
  },
  {
    range: "1994–2000",
    title: "The Commercial Web",
    summary:
      "Domain names become businesses. Homepages turn into storefronts, portals and — by the end — a bubble.",
    events: [
      {
        year: "1994",
        sortYear: 1994,
        title: "Commercial websites grow",
        description:
          "Netscape Navigator ships and the W3C is founded. Companies rush online; banner ads appear. 'Under construction' pages are a genuine design pattern.",
        category: "commerce",
        explore: [
          { domain: "yahoo.com", note: "The directory that organized the early web" },
          { domain: "ibm.com", note: "A corporation's 1990s web presence" },
        ],
      },
      {
        year: "1995",
        sortYear: 1995,
        title: "The e-commerce era begins",
        description:
          "Amazon and eBay launch; secure SSL transactions make credit-card purchases online plausible. Shopping carts and product grids become web staples.",
        category: "commerce",
        explore: [
          { domain: "amazon.com", note: "The bookstore that started it" },
          { domain: "ebay.com", note: "Auctions, online, since 1995" },
        ],
      },
      {
        year: "1998",
        sortYear: 1998,
        title: "Search engines become dominant",
        description:
          "Google launches with PageRank, and navigating the web shifts from curated directories to search boxes. Homepages simplify for findability.",
        category: "search",
        explore: [
          { domain: "google.com", note: "Famously, spartan from day one" },
          { domain: "yahoo.com", note: "The portal era's front door" },
        ],
      },
      {
        year: "1999–2001",
        sortYear: 1999,
        title: "Dot-com bubble and crash",
        description:
          "Web companies reach absurd valuations (1999–2000), then the bubble bursts (2001). Flash intros, frames and table layouts define the era's look.",
        category: "design",
        explore: [
          { domain: "pets.com", note: "The bubble's famous casualty (captures are sparse)" },
          { domain: "geocities.com", note: "Where personal homepages lived" },
        ],
      },
    ],
  },
  {
    range: "2002–2008",
    title: "The Social Web",
    summary:
      "The web stops being read-only. Users become authors, pages become applications, and JavaScript earns its keep.",
    events: [
      {
        year: "2004",
        sortYear: 2004,
        title: "The social web accelerates",
        description:
          "Facebook launches (initially at universities), 'Web 2.0' becomes the buzzword, and user-generated content replaces publisher-only pages. Rounded corners and gradients abound.",
        category: "social",
        explore: [
          { domain: "facebook.com", note: "From college directory to platform" },
          { domain: "flickr.com", note: "Photo sharing, community-tagged" },
        ],
      },
      {
        year: "2005",
        sortYear: 2005,
        title: "AJAX and the rich web",
        description:
          "Gmail and Google Maps prove a page can behave like an application without reloading. AJAX, then jQuery, make dynamic interfaces mainstream. YouTube launches.",
        category: "design",
        explore: [
          { domain: "youtube.com", note: "Video on the web, from the start" },
          { domain: "wikipedia.org", note: "The encyclopedia everyone can edit" },
        ],
      },
      {
        year: "2007",
        sortYear: 2007,
        title: "The smartphone era begins",
        description:
          "The iPhone ships with a real browser. Sites are suddenly viewed on small touch screens, but most aren't ready — pinch-zoom desktop pages are the stopgap.",
        category: "mobile",
        explore: [
          { domain: "apple.com", note: "The company that moved the web to pockets" },
          { domain: "nytimes.com", note: "News pages before responsive design" },
        ],
      },
    ],
  },
  {
    range: "2009–2016",
    title: "The Mobile-First Web",
    summary:
      "Traffic moves to phones, and design follows: fluid grids, flat surfaces, hamburger menus, HTTPS everywhere.",
    events: [
      {
        year: "2010s",
        sortYear: 2010,
        title: "Responsive and mobile-first design",
        description:
          "'Responsive design' is coined (2010); separate m-dot sites give way to fluid layouts. Flat design strips the gloss of the 2000s. Google ranks mobile-friendliness (2015).",
        category: "mobile",
        explore: [
          { domain: "microsoft.com", note: "Flat-design era corporate web" },
          { domain: "wikipedia.org", note: "The same encyclopedia, reflowed" },
        ],
      },
      {
        year: "2010s",
        sortYear: 2012,
        title: "HTTPS, speed and the performance era",
        description:
          "HTTPS becomes the default and eventually a requirement; page weight discipline and loading speed turn into ranking signals and design constraints.",
        category: "design",
        explore: [{ domain: "google.com", note: "Minimalism as performance strategy" }],
      },
    ],
  },
  {
    range: "2017–now",
    title: "The AI-Native Web",
    summary:
      "Assistants read the web alongside humans; interfaces start answering instead of listing.",
    events: [
      {
        year: "2020s",
        sortYear: 2020,
        title: "AI-native interfaces emerge",
        description:
          "Chat interfaces (2022 onward) let people ask instead of browse. Sites begin publishing machine-readable answers alongside human-readable pages — a shift still in progress.",
        category: "ai",
        explore: [
          { domain: "openai.com", note: "Research lab to household name" },
          { domain: "anthropic.com", note: "The frontier-lab era of the web" },
        ],
      },
    ],
  },
];
