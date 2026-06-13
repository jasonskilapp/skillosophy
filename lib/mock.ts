import type { CandidateReport, CandidateSummary, RecruiterAccount } from "./types";

/**
 * Seed data used when Supabase is not configured (mock mode) and to seed the
 * database in live mode. The Jason Hall report is transcribed from the
 * reference dashboard screenshots so the UI can be matched against them.
 */

const jasonHall: CandidateReport = {
  contact: {
    name: "Jason Hall",
    location: "Waterdown, ON",
    email: "jason.p.hall@gmail.com",
    phone: "289-921-6291",
    headline: "Sr. Application Support Specialist · Sterling Karamar",
  },
  careerStage: "Senior",
  headlineStats: [
    { value: "20+", label: "Years experience", sublabel: "Since 2004" },
    { value: "60+", label: "Clients implemented", sublabel: "Yardi Genesis" },
    { value: "2,000+", label: "Client portfolio", sublabel: "Yardi TAM role" },
    { value: "$230K+", label: "Sales record", sublabel: "Personal annual target" },
  ],
  skills: {
    hard: [
      { name: "Yardi Voyager / Genesis", strength: "Expert", source: "Experience — Sterling Karamar", evidence: "60+ Yardi Genesis implementations and 6 years as a Technical Account Manager across 2,000+ accounts." },
      { name: "ERP implementation", strength: "Expert", source: "Experience — Yardi (TAM)", evidence: "Led 60+ end-to-end implementations of property-management ERP." },
      { name: "Training design & delivery", strength: "Expert", source: "Experience — multiple roles", evidence: "Built training materials used by Yardi's own staff; training appears in every role across 20 years." },
      { name: "Process documentation / SOPs", strength: "Proficient", source: "Experience — Sterling Karamar", evidence: "Authored standard operating procedures for support and onboarding workflows." },
      { name: "Active Directory / M365 Admin", strength: "Proficient", source: "Experience — Firm Capital (IT Manager)", evidence: "Administered AD and Microsoft 365 for remote users across Canada." },
      { name: "IT service desk / ticketing", strength: "Proficient", source: "Experience — IT roles", evidence: "Ran service-desk and ticketing operations supporting distributed staff." },
      { name: "Accounting workflows (PM)", strength: "Competent", source: "Experience — property management", evidence: "Configured and supported property-accounting workflows in Yardi." },
      { name: "CRM management", strength: "Competent", source: "Experience — account management", evidence: "Managed CRM pipeline against a $230K personal annual sales target." },
      { name: "Vendor management / procurement", strength: "Competent", source: "Experience — Firm Capital", evidence: "Owned vendor relationships and procurement as IT Manager." },
      { name: "SQL server (basic)", strength: "Foundational", source: "Experience — platform support", evidence: "Basic SQL Server querying in support of reporting tasks." },
    ],
    soft: [
      { name: "Stakeholder communication", strength: "Expert", source: "Experience — TAM role", evidence: "Primary technical contact across 2,000+ accounts and executive stakeholders." },
      { name: "Multi-project management", strength: "Expert", source: "Experience — 60+ implementations", evidence: "Ran concurrent implementation projects on overlapping timelines." },
      { name: "Client relationship management", strength: "Expert", source: "Experience — TAM / account roles", evidence: "Retained and grew a 2,000+ account portfolio." },
      { name: "Conflict resolution", strength: "Proficient", source: "Experience — support escalations", evidence: "Owned escalation management for technical and account issues." },
      { name: "Team leadership", strength: "Proficient", source: "Experience — Firm Capital (IT Manager)", evidence: "Led IT staff and set technical direction." },
      { name: "Staff management / scheduling", strength: "Proficient", source: "Experience — building/operations roles", evidence: "Managed staffing and scheduling as building manager / superintendent." },
      { name: "Tenant / client relations", strength: "Proficient", source: "Experience — property operations", evidence: "Front-line tenant and client relations in multi-residential settings." },
      { name: "Documentation discipline", strength: "Proficient", source: "Experience — SOP authoring", evidence: "Consistent documentation of processes and configurations." },
      { name: "Process automation mindset", strength: "Competent", source: "Experience — platform support", evidence: "Identified and automated repetitive support workflows." },
      { name: "Executive reporting", strength: "Competent", source: "Experience — IT Manager", evidence: "Produced executive-facing status and operations reports." },
    ],
  },
  industries: [
    {
      name: "PropTech / Property Mgmt Software",
      type: "Traditional",
      whyItFits:
        "Rare dual fluency: expert-level Yardi + real property operations background. Strongest fit of any industry.",
      demandSignal: "Ontario, BC, Alberta · Growing",
      whatItOpens:
        "Senior support, implementation, and customer-success roles at Yardi and competing PropTech vendors.",
      comp: { low: 75000, median: 92000, high: 115000, region: "ON" },
    },
    {
      name: "Enterprise SaaS / ERP",
      type: "Traditional",
      whyItFits:
        "6 years at Yardi as TAM across 2,000+ accounts. Professional services and customer success profile is fully established.",
      demandSignal: "Toronto, Vancouver, Ottawa · High demand",
      whatItOpens: "Technical account management, professional services, and CSM leadership tracks.",
      comp: { low: 80000, median: 100000, high: 135000, region: "Canada-wide" },
    },
    {
      name: "Real Estate Operations",
      type: "Traditional",
      whyItFits:
        "Property superintendent + building manager + PM software expert. REITs and multi-res operators need this combination.",
      demandSignal: "Ontario, BC, Alberta · Steady",
      whatItOpens: "Operations technology and platform-owner roles inside REITs and property managers.",
      comp: { low: 72000, median: 88000, high: 110000, region: "ON" },
    },
    {
      name: "IT Managed Services (MSP)",
      type: "Non-Traditional",
      whyItFits:
        "Full Director of IT profile + B2B sales background + real estate vertical expertise = rare vCIO/consultant candidate.",
      demandSignal: "Ontario, BC, Alberta · Talent shortage",
      whatItOpens: "vCIO, consulting, and technology-advisory roles with a real-estate niche.",
      comp: { low: 75000, median: 92000, high: 118000, region: "ON" },
    },
    {
      name: "Corporate L&D (Tech focus)",
      type: "Non-Traditional",
      whyItFits:
        "Training appears in every role across 20 years. Built materials used by Yardi's own staff. Subject-matter depth separates him from generalist trainers.",
      demandSignal: "Ontario, BC · Growing (digital transformation)",
      whatItOpens: "Application training, digital adoption, and enablement roles at software firms.",
      comp: { low: 70000, median: 85000, high: 108000, region: "ON" },
    },
  ],
  targetRoles: [
    {
      title: "Senior application support / platform admin",
      whySuited:
        "Current trajectory. Should target Senior or Lead titles, not specialist. Strong at Sterling Karamar; move up or across to a larger org.",
      careerStageFit: "senior",
      whereItExists: "PropTech, Real Estate Operations",
      comp: { low: 75000, high: 115000, region: "ON" },
    },
    {
      title: "ERP implementation consultant",
      whySuited:
        "60+ implementations = senior consultant profile. Should target Implementation PM or Professional Services Lead, not junior IC.",
      careerStageFit: "senior",
      whereItExists: "Enterprise SaaS / ERP",
      comp: { low: 85000, high: 130000, region: "Canada-wide" },
    },
    {
      title: "Customer success manager (senior)",
      whySuited:
        "2,000+ client base, proactive ownership, escalation management. Translates directly to Senior CSM at any SaaS company.",
      careerStageFit: "senior",
      whereItExists: "Enterprise SaaS / ERP",
      comp: { low: 80000, high: 130000, region: "ON" },
    },
    {
      title: "IT manager / director of IT",
      whySuited:
        "Held this title at Firm Capital. AD, M365, vendor management, executive reporting, remote users across Canada. Target same or larger scope.",
      careerStageFit: "senior",
      whereItExists: "IT Managed Services, Real Estate Operations",
      comp: { low: 85000, high: 130000, region: "ON" },
    },
    {
      title: "Operations technology manager",
      whySuited:
        "Unique ops + tech fluency. Best fit for digital transformation, ERP rollout leadership, or platform governance roles inside real estate firms.",
      careerStageFit: "senior",
      whereItExists: "Real Estate Operations, PropTech",
      comp: { low: 85000, high: 125000, region: "ON" },
    },
    {
      title: "Corporate trainer / L&D specialist (tech)",
      whySuited:
        "Non-obvious path but defensible. Training runs through every role. Subject-matter depth in Yardi/ERP is the differentiator over generalists.",
      careerStageFit: "senior",
      whereItExists: "Corporate L&D (Tech focus)",
      comp: { low: 70000, high: 108000, region: "ON" },
    },
  ],
  keywords: [
    {
      industry: "PROPTECH / PROPERTY MANAGEMENT SOFTWARE",
      terms: [
        "Yardi Voyager",
        "Yardi Administrator",
        "Senior Application Support Specialist",
        "Property Vista",
        "Yardi Payscan",
        "ERP Support – Real Estate",
        "Multi-residential technology",
        "REIT technology operations",
      ],
    },
    {
      industry: "ENTERPRISE SAAS / ERP",
      terms: [
        "Technical Account Manager",
        "Senior Implementation Consultant",
        "Customer Success Manager",
        "ERP Implementation Specialist",
        "SaaS Onboarding Specialist",
        "Professional Services Consultant",
        "CRM account management",
      ],
    },
    {
      industry: "IT MANAGED SERVICES / IT LEADERSHIP",
      terms: [
        "Director of IT",
        "IT Manager",
        "vCIO",
        "Active Directory Administrator",
        "Microsoft 365 Administrator",
        "Managed services provider",
        "Hybrid Active Directory",
        "SMB technology consulting",
      ],
    },
    {
      industry: "CORPORATE L&D (TECHNOLOGY FOCUS)",
      terms: [
        "Application Trainer",
        "ERP Training Consultant",
        "Senior Training Specialist",
        "Digital Adoption Specialist",
        "Systems Trainer",
        "Technology enablement",
      ],
    },
  ],
  recruiterNotes: [
    {
      tone: "positive",
      text: "Strong niche — Yardi expertise at expert level is rare in Canada. Any property management firm or PropTech vendor with a Yardi environment should be a priority placement target.",
    },
    {
      tone: "positive",
      text: "Dual fluency (operations + technology) is the key differentiator. Positions him above IT generalists at real estate firms and above pure ops candidates at software companies.",
    },
    {
      tone: "positive",
      text: "Training throughline across 20 years is an underused asset. Flag for L&D, digital adoption, or implementation trainer roles where subject-matter expertise is required.",
    },
    {
      tone: "caution",
      text: "No post-secondary credential listed. May be a screening filter at some employers. Recommend confirming whether any formal education exists. Skills profile is strong regardless.",
    },
    {
      tone: "caution",
      text: "Based in Waterdown, ON (Hamilton area). Commutable to Toronto, Hamilton, Mississauga, and Burlington markets. Remote or hybrid roles open the full Ontario corridor.",
    },
  ],
  estimatesNote:
    "Compensation figures are model estimates based on Canadian market knowledge, not live Job Bank data.",
};

const priyaNair: CandidateReport = {
  contact: {
    name: "Priya Nair",
    location: "Mississauga, ON",
    email: "priya.nair@gmail.com",
    phone: "647-555-0142",
    headline: "Digital Marketing Specialist · Growth focus",
  },
  careerStage: "Developing",
  headlineStats: [
    { value: "5", label: "Years experience", sublabel: "Since 2020" },
    { value: "3", label: "Channels owned", sublabel: "SEO / paid / email" },
    { value: "40%", label: "Best campaign lift", sublabel: "Lead-gen growth" },
    { value: "B.Comm", label: "Education", sublabel: "Marketing major" },
  ],
  skills: {
    hard: [
      { name: "SEO / SEM", strength: "Proficient", evidence: "Owned organic and paid search for a B2B SaaS funnel." },
      { name: "Google Analytics / GA4", strength: "Proficient", evidence: "Built attribution and conversion dashboards." },
      { name: "Email marketing automation", strength: "Proficient", evidence: "Ran lifecycle campaigns in HubSpot." },
      { name: "Content strategy", strength: "Competent", evidence: "Editorial calendar and content briefs." },
      { name: "Paid social (Meta/LinkedIn)", strength: "Competent", evidence: "Managed paid social budgets and creative testing." },
      { name: "SQL (basic)", strength: "Foundational", evidence: "Basic querying for marketing reporting." },
    ],
    soft: [
      { name: "Cross-functional collaboration", strength: "Proficient", evidence: "Worked across sales and product on launches." },
      { name: "Data storytelling", strength: "Proficient", evidence: "Presented campaign results to leadership." },
      { name: "Project coordination", strength: "Competent", evidence: "Coordinated multi-channel campaign timelines." },
      { name: "Stakeholder communication", strength: "Competent", evidence: "Managed agency and vendor relationships." },
    ],
  },
  industries: [
    {
      name: "B2B SaaS Marketing",
      type: "Traditional",
      whyItFits: "Direct experience running demand-gen for a SaaS funnel with measurable pipeline impact.",
      demandSignal: "Toronto, Waterloo · High demand",
      comp: { low: 65000, median: 78000, high: 95000, region: "ON" },
    },
    {
      name: "E-commerce / Retail",
      type: "Traditional",
      whyItFits: "Performance-marketing and analytics skills transfer cleanly to D2C growth teams.",
      demandSignal: "Ontario · Steady",
      comp: { low: 60000, median: 72000, high: 90000, region: "ON" },
    },
    {
      name: "Healthtech",
      type: "Non-Traditional",
      whyItFits: "Regulated-market discipline plus lifecycle automation is in demand as healthtech scales patient acquisition.",
      demandSignal: "Toronto, Vancouver · Growing",
      comp: { low: 68000, median: 80000, high: 98000, region: "Canada-wide" },
    },
  ],
  targetRoles: [
    {
      title: "Senior digital marketing specialist",
      whySuited: "Five years across owned channels with quantified lift; ready for a senior IC title.",
      careerStageFit: "mid",
      whereItExists: "B2B SaaS, E-commerce",
      comp: { low: 70000, high: 92000, region: "ON" },
    },
    {
      title: "Growth marketing lead",
      whySuited: "Full-funnel ownership and analytics depth support a small-team lead role.",
      careerStageFit: "mid",
      whereItExists: "B2B SaaS, Healthtech",
      comp: { low: 80000, high: 105000, region: "ON" },
    },
  ],
  keywords: [
    {
      industry: "B2B SAAS MARKETING",
      terms: ["Demand Generation", "Growth Marketing", "GA4", "HubSpot", "SEO Specialist", "Marketing Operations"],
    },
    {
      industry: "E-COMMERCE / RETAIL",
      terms: ["Performance Marketing", "Paid Search", "Conversion Rate Optimization", "Lifecycle Marketing"],
    },
  ],
  recruiterNotes: [
    { tone: "positive", text: "Quantified results (40% lead-gen lift) make this resume stand out for mid-level demand-gen roles." },
    { tone: "caution", text: "Limited people-management signal; best positioned as senior IC or first growth hire rather than manager today." },
  ],
  estimatesNote:
    "Compensation figures are model estimates based on Canadian market knowledge, not live Job Bank data.",
};

const marcusChen: CandidateReport = {
  contact: {
    name: "Marcus Chen",
    location: "Toronto, ON",
    email: "marcus.chen@gmail.com",
    phone: "416-555-0199",
    headline: "Junior Data Analyst · New grad",
  },
  careerStage: "Early Career",
  headlineStats: [
    { value: "1", label: "Years experience", sublabel: "Co-op + part-time" },
    { value: "B.Sc", label: "Education", sublabel: "Statistics" },
    { value: "3", label: "Capstone projects", sublabel: "Python / SQL" },
    { value: "2", label: "Internships", sublabel: "Analytics teams" },
  ],
  skills: {
    hard: [
      { name: "SQL", strength: "Proficient", evidence: "Wrote analytical queries across internships and coursework." },
      { name: "Python (pandas)", strength: "Proficient", evidence: "Data cleaning and analysis in capstone projects." },
      { name: "Data visualization (Tableau)", strength: "Competent", evidence: "Built dashboards for a co-op placement." },
      { name: "Statistics", strength: "Proficient", evidence: "B.Sc in Statistics — regression, hypothesis testing." },
      { name: "Excel modelling", strength: "Competent", evidence: "Financial and operational models in internships." },
    ],
    soft: [
      { name: "Analytical reasoning", strength: "Proficient", evidence: "Statistics degree builds quantitative problem-solving." },
      { name: "Written communication", strength: "Competent", evidence: "Documented analysis findings for stakeholders." },
      { name: "Collaboration", strength: "Competent", evidence: "Worked within analytics teams during co-ops." },
    ],
  },
  industries: [
    {
      name: "Financial Services",
      type: "Traditional",
      whyItFits: "Statistics + SQL + modelling map directly to analyst pipelines at banks and insurers.",
      demandSignal: "Toronto · High demand",
      comp: { low: 55000, median: 65000, high: 78000, region: "ON" },
    },
    {
      name: "Tech / Product Analytics",
      type: "Traditional",
      whyItFits: "Python and visualization skills fit product and growth analytics teams.",
      demandSignal: "Toronto, Vancouver · Growing",
      comp: { low: 60000, median: 72000, high: 85000, region: "Canada-wide" },
    },
    {
      name: "Public Sector / Policy Analytics",
      type: "Non-Traditional",
      whyItFits: "Statistical rigour is valued in government data and evaluation roles many new grads overlook.",
      demandSignal: "Ottawa, Toronto · Steady",
      comp: { low: 58000, median: 68000, high: 80000, region: "ON" },
    },
  ],
  targetRoles: [
    {
      title: "Junior / associate data analyst",
      whySuited: "Strong technical fundamentals from degree plus two analytics internships.",
      careerStageFit: "entry",
      whereItExists: "Financial Services, Tech",
      comp: { low: 55000, high: 75000, region: "ON" },
    },
    {
      title: "Business intelligence analyst (entry)",
      whySuited: "Dashboarding and SQL experience suit a BI starter role.",
      careerStageFit: "entry",
      whereItExists: "Tech, Public Sector",
      comp: { low: 58000, high: 78000, region: "ON" },
    },
  ],
  keywords: [
    {
      industry: "FINANCIAL SERVICES",
      terms: ["Data Analyst", "SQL", "Python", "Risk Analytics", "New Graduate", "Co-op"],
    },
    {
      industry: "TECH / PRODUCT ANALYTICS",
      terms: ["Product Analyst", "Tableau", "Business Intelligence", "Junior Analyst", "Entry Level"],
    },
  ],
  recruiterNotes: [
    { tone: "positive", text: "Solid technical base for an entry analyst; two internships reduce ramp-up risk." },
    { tone: "caution", text: "Early career — calibrate expectations to junior/associate scope, not independent ownership yet." },
  ],
  estimatesNote:
    "Compensation figures are model estimates based on Canadian market knowledge, not live Job Bank data.",
};

/** Reports keyed by candidate id. */
export const MOCK_REPORTS: Record<string, CandidateReport> = {
  "jason-hall": jasonHall,
  "priya-nair": priyaNair,
  "marcus-chen": marcusChen,
};

const todayIso = new Date();
function isoDaysAgo(days: number, hour = 9): string {
  const d = new Date(todayIso);
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function isoDaysAhead(days: number): string {
  const d = new Date(todayIso);
  d.setDate(d.getDate() + days);
  d.setHours(14, 0, 0, 0);
  return d.toISOString();
}

export const MOCK_CANDIDATES: CandidateSummary[] = [
  {
    id: "jason-hall",
    name: "Jason Hall",
    uploadedAt: isoDaysAgo(0, 8),
    meetingDate: isoDaysAhead(2),
    status: "done",
    headline: jasonHall.contact.headline,
    recruiterName: "Dana Whitfield",
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    uploadedAt: isoDaysAgo(0, 10),
    meetingDate: isoDaysAhead(1),
    status: "done",
    headline: priyaNair.contact.headline,
    recruiterName: "Dana Whitfield",
  },
  {
    id: "marcus-chen",
    name: "Marcus Chen",
    uploadedAt: isoDaysAgo(1, 16),
    meetingDate: isoDaysAhead(3),
    status: "done",
    headline: marcusChen.contact.headline,
    recruiterName: "Dana Whitfield",
  },
  {
    id: "pending-sample",
    name: "Aisha Mohamed",
    uploadedAt: isoDaysAgo(0, 11),
    meetingDate: isoDaysAhead(4),
    status: "processing",
    headline: null,
    recruiterName: "Dana Whitfield",
  },
];

export const MOCK_RECRUITERS: RecruiterAccount[] = [
  {
    id: "rec-dana",
    name: "Dana Whitfield",
    email: "dana@discova-demo.ca",
    createdAt: isoDaysAgo(30),
    candidateCount: 4,
  },
  {
    id: "rec-omar",
    name: "Omar Reyes",
    email: "omar@discova-demo.ca",
    createdAt: isoDaysAgo(12),
    candidateCount: 0,
  },
];
