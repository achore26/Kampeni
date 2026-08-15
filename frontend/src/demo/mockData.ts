// Static demo data — Sakaja / Nairobi Senator campaign

export const DEMO_SENTIMENT_SUMMARY = {
  positive: 347, negative: 73, neutral: 189, total: 609,
}

export const DEMO_SENTIMENT_TREND = [
  { date: '2026-07-15', positive: 38, negative: 22, neutral: 40 },
  { date: '2026-07-16', positive: 42, negative: 18, neutral: 40 },
  { date: '2026-07-17', positive: 35, negative: 28, neutral: 37 },
  { date: '2026-07-18', positive: 44, negative: 20, neutral: 36 },
  { date: '2026-07-19', positive: 51, negative: 16, neutral: 33 },
  { date: '2026-07-20', positive: 48, negative: 19, neutral: 33 },
  { date: '2026-07-21', positive: 53, negative: 14, neutral: 33 },
  { date: '2026-07-22', positive: 57, negative: 12, neutral: 31 },
]

export const DEMO_ARTICLES = [
  { article_id: 'demo-1',  title: 'Senator Sakaja Launches Nairobi Affordable Housing Initiative Targeting 10,000 Units', url: 'https://nation.africa', source: 'nation', published_at: '2026-07-22T08:00:00Z', label: 'positive', score: 0.87, language_detected: 'en' },
  { article_id: 'demo-2',  title: 'Nairobi County Receives KES 2.1B in Road Improvement Funds Under Sakaja Administration', url: 'https://standardmedia.co.ke', source: 'standard', published_at: '2026-07-22T07:30:00Z', label: 'positive', score: 0.79, language_detected: 'en' },
  { article_id: 'demo-3',  title: "Youth Leaders Praise Sakaja's Internship Program Placing 3,000 Graduates", url: 'https://citizen.digital', source: 'citizen', published_at: '2026-07-21T14:00:00Z', label: 'positive', score: 0.85, language_detected: 'en' },
  { article_id: 'demo-4',  title: 'Residents Criticize Slow Pace of Nairobi Sewer Rehabilitation Projects', url: 'https://capitalfm.co.ke', source: 'capitalfm', published_at: '2026-07-21T11:00:00Z', label: 'negative', score: -0.62, language_detected: 'en' },
  { article_id: 'demo-5',  title: 'Nairobi County Revenue Collection Exceeds Annual Target by 12%', url: 'https://nation.africa', source: 'nation', published_at: '2026-07-21T09:00:00Z', label: 'positive', score: 0.73, language_detected: 'en' },
  { article_id: 'demo-6',  title: 'Opposition Questions Transparency in Nairobi Tender Awards Worth KES 4.5B', url: 'https://standardmedia.co.ke', source: 'standard', published_at: '2026-07-20T16:00:00Z', label: 'negative', score: -0.71, language_detected: 'en' },
  { article_id: 'demo-7',  title: 'Sakaja Chairs Emergency Security Committee Meeting After Eastlands Incidents', url: 'https://kbc.co.ke', source: 'kbc', published_at: '2026-07-20T10:00:00Z', label: 'neutral', score: 0.11, language_detected: 'en' },
  { article_id: 'demo-8',  title: 'Sakaja Foundation Donates 500 Laptops to Public Schools in Eastlands', url: 'https://citizen.digital', source: 'citizen', published_at: '2026-07-19T13:00:00Z', label: 'positive', score: 0.92, language_detected: 'en' },
  { article_id: 'demo-9',  title: 'Matatu Operators Protest Nairobi County Crackdown on CBD Routes', url: 'https://nation.africa', source: 'nation', published_at: '2026-07-19T08:00:00Z', label: 'negative', score: -0.58, language_detected: 'en' },
  { article_id: 'demo-10', title: 'Sakaja Akizungumzia Mpango wa Maji Safi kwa Mathare na Korogocho', url: 'https://citizen.digital', source: 'citizen', published_at: '2026-07-18T10:00:00Z', label: 'positive', score: 0.81, language_detected: 'sw' },
  { article_id: 'demo-11', title: 'Nairobi Ranked Among Top 5 Most Improved African Cities in Infrastructure', url: 'https://capitalfm.co.ke', source: 'capitalfm', published_at: '2026-07-18T07:00:00Z', label: 'positive', score: 0.76, language_detected: 'en' },
  { article_id: 'demo-12', title: 'Street Families Advocacy Groups Urge County to Expand Rehabilitation Centers', url: 'https://standardmedia.co.ke', source: 'standard', published_at: '2026-07-17T15:00:00Z', label: 'neutral', score: -0.08, language_detected: 'en' },
  { article_id: 'demo-13', title: 'Sakaja Meets World Bank Officials to Secure Urban Resilience Financing', url: 'https://kbc.co.ke', source: 'kbc', published_at: '2026-07-17T09:00:00Z', label: 'positive', score: 0.68, language_detected: 'en' },
  { article_id: 'demo-14', title: 'Nairobi County Staff Strike Over Delayed Salaries — Third Month Running', url: 'https://nation.africa', source: 'nation', published_at: '2026-07-16T11:00:00Z', label: 'negative', score: -0.84, language_detected: 'en' },
  { article_id: 'demo-15', title: 'Tech Startups Welcome Nairobi Innovation Hub Opening in Westlands', url: 'https://citizen.digital', source: 'citizen', published_at: '2026-07-15T14:00:00Z', label: 'positive', score: 0.88, language_detected: 'en' },
]

export const DEMO_OPPONENTS = [
  { id: 'opp-1', name: 'Mike Sonko', constituency: 'Nairobi', party: 'Jubilee', position: 'Former Governor', is_incumbent: false, mention_count: 45 },
  { id: 'opp-2', name: 'Agnes Kagure', constituency: 'Nairobi', party: 'UDA', position: 'Senatorial Candidate', is_incumbent: false, mention_count: 32 },
  { id: 'opp-3', name: 'Polycarp Igathe', constituency: 'Nairobi', party: 'Independent', position: 'Candidate', is_incumbent: false, mention_count: 28 },
  { id: 'opp-4', name: 'Richard Ngatia', constituency: 'Nairobi', party: 'Independent', position: 'Former NSE Chairman', is_incumbent: false, mention_count: 19 },
]

export const DEMO_OPPONENT_MENTIONS: Record<string, any[]> = {
  'opp-1': [
    { article_id: 'm-1', article_title: 'Sonko Vows Political Comeback Through Nairobi Senate Race', article_url: 'https://nation.africa', source: 'nation', published_at: '2026-07-20T09:00:00Z', context: 'Former governor Mike Sonko confirmed plans to contest the Nairobi Senate seat...', mention_type: 'political_statement' },
    { article_id: 'm-2', article_title: 'Court Dismisses Misconduct Case Against Sonko', article_url: 'https://standardmedia.co.ke', source: 'standard', published_at: '2026-07-18T14:00:00Z', context: 'A Nairobi court dismissed charges related to the impeachment...', mention_type: 'legal' },
  ],
  'opp-2': [
    { article_id: 'm-3', article_title: 'Agnes Kagure Unveils KES 1B Women Enterprise Fund Proposal', article_url: 'https://citizen.digital', source: 'citizen', published_at: '2026-07-19T11:00:00Z', context: 'Candidate Agnes Kagure launched her flagship policy targeting women-led SMEs...', mention_type: 'policy' },
  ],
}

const DEMO_PAIN_POINTS_ITEMS = [
  { id: 'pp-1',  article_id: 'a1', category: 'roads',       description: 'Persistent flooding on Outering Road affecting thousands of commuters during rainy season', severity: 'high',   location: 'Embakasi East',     county: 'Nairobi', constituency: 'Embakasi East', politicians: ['Sakaja'], confidence: 0.89, used_mock: false, created_at: '2026-07-22T00:00:00Z' },
  { id: 'pp-2',  article_id: 'a2', category: 'water',       description: 'Chronic water shortages in Mathare North — residents rely on expensive water vendors charging 5× municipal rates', severity: 'high',   location: 'Mathare North',     county: 'Nairobi', constituency: 'Mathare', politicians: ['Sakaja'], confidence: 0.92, used_mock: false, created_at: '2026-07-21T00:00:00Z' },
  { id: 'pp-3',  article_id: 'a3', category: 'security',    description: 'Rising gang activity in Kayole Central causing businesses to close before sunset', severity: 'high',   location: 'Kayole Central',    county: 'Nairobi', constituency: 'Embakasi East', politicians: ['Sakaja'], confidence: 0.86, used_mock: false, created_at: '2026-07-20T00:00:00Z' },
  { id: 'pp-4',  article_id: 'a4', category: 'health',      description: 'Pumwani Maternity Hospital facing critical equipment shortage — patients turned away at peak hours', severity: 'high',   location: 'Pumwani',           county: 'Nairobi', constituency: 'Kamukunji', politicians: ['Sakaja'], confidence: 0.95, used_mock: false, created_at: '2026-07-20T00:00:00Z' },
  { id: 'pp-5',  article_id: 'a5', category: 'jobs',        description: 'Youth unemployment in Korogocho estimated at 68% — calls for county youth fund expansion', severity: 'medium', location: 'Korogocho',         county: 'Nairobi', constituency: 'Kasarani', politicians: ['Sakaja'], confidence: 0.78, used_mock: false, created_at: '2026-07-19T00:00:00Z' },
  { id: 'pp-6',  article_id: 'a6', category: 'school_fees', description: 'Parents in Kibra struggle with school levies despite free primary education policy', severity: 'medium', location: 'Kibra',             county: 'Nairobi', constituency: 'Kibra', politicians: ['Sakaja'], confidence: 0.81, used_mock: false, created_at: '2026-07-19T00:00:00Z' },
  { id: 'pp-7',  article_id: 'a7', category: 'housing',     description: 'Forced evictions in Mukuru kwa Njenga displacing 2,000 families without resettlement plan', severity: 'high',   location: 'Mukuru kwa Njenga', county: 'Nairobi', constituency: 'Makadara', politicians: ['Sakaja'], confidence: 0.91, used_mock: false, created_at: '2026-07-18T00:00:00Z' },
  { id: 'pp-8',  article_id: 'a8', category: 'corruption',  description: 'Hawkers accuse county askaris of extorting KES 200–500 weekly in the CBD', severity: 'medium', location: 'Nairobi CBD',        county: 'Nairobi', constituency: 'Starehe', politicians: ['Sakaja'], confidence: 0.74, used_mock: false, created_at: '2026-07-17T00:00:00Z' },
  { id: 'pp-9',  article_id: 'a9', category: 'economy',     description: 'Small traders in South B cite high stall fees as barrier to business survival', severity: 'low',    location: 'South B',           county: 'Nairobi', constituency: 'Langata', politicians: ['Sakaja'], confidence: 0.69, used_mock: false, created_at: '2026-07-17T00:00:00Z' },
  { id: 'pp-10', article_id: 'a10', category: 'roads',      description: 'Pothole-riddled roads in Roysambu causing vehicle damage and pedestrian accidents', severity: 'medium', location: 'Roysambu',          county: 'Nairobi', constituency: 'Roysambu', politicians: ['Sakaja'], confidence: 0.83, used_mock: false, created_at: '2026-07-16T00:00:00Z' },
  { id: 'pp-11', article_id: 'a11', category: 'water',      description: 'Sewer overflow in Mathare during rainfall contaminating water sources', severity: 'high',   location: 'Mathare',           county: 'Nairobi', constituency: 'Mathare', politicians: ['Sakaja'], confidence: 0.88, used_mock: false, created_at: '2026-07-15T00:00:00Z' },
  { id: 'pp-12', article_id: 'a12', category: 'security',   description: 'Residents in Eastlands report inadequate street lighting heightening night-time risks', severity: 'medium', location: 'Eastlands',         county: 'Nairobi', constituency: 'Makadara', politicians: ['Sakaja'], confidence: 0.77, used_mock: false, created_at: '2026-07-15T00:00:00Z' },
]

export const DEMO_PAINPOINTS_RESPONSE = {
  total: DEMO_PAIN_POINTS_ITEMS.length,
  items: DEMO_PAIN_POINTS_ITEMS,
}

export const DEMO_PAINPOINTS_SUMMARY = {
  total: 90,
  by_category: [
    { category: 'roads',       count: 18 },
    { category: 'water',       count: 14 },
    { category: 'jobs',        count: 12 },
    { category: 'health',      count: 11 },
    { category: 'security',    count: 9  },
    { category: 'housing',     count: 8  },
    { category: 'school_fees', count: 6  },
    { category: 'corruption',  count: 5  },
    { category: 'economy',     count: 4  },
    { category: 'other',       count: 3  },
  ],
}

export const DEMO_BRIEFING = {
  id: 'demo-briefing-001',
  candidate_id: 'sakaja-001',
  briefing_date: '2026-07-22',
  language: 'en',
  is_approved: true,
  approved_by: 'Kampeni AI',
  approved_at: '2026-07-22T06:30:00Z',
  delivered_at: null,
  delivery_channels: [],
  created_at: '2026-07-22T06:00:00Z',
  used_mock: true,
  sections: [
    {
      title: 'Executive Summary',
      content: `Senator Johnson Sakaja maintains a **strong positive media presence** this week, with 57% of coverage carrying a favorable tone — up 4 percentage points from the previous period. The affordable housing launch and the Sakaja Foundation laptop donation were the top-performing stories by engagement.\n\nKey risk: The county staff salary dispute (now entering its third month) is the most negatively covered issue and requires immediate communication.`,
    },
    {
      title: 'Top Opportunities',
      content: `1. **Housing launch momentum** — The 10,000-unit affordable housing initiative is gaining traction in both Swahili and English press. Consider a site visit with community leaders to sustain coverage.\n\n2. **World Bank partnership** — The urban resilience financing meeting generated 68% positive coverage. A follow-up announcement on disbursement timelines would capitalise on this.\n\n3. **Youth employment** — Internship program placement figures resonate strongly with 18–35 demographic. Recommend a social media push with graduate testimonials.`,
    },
    {
      title: 'Key Risks',
      content: `1. **Salary crisis** — County staff strike coverage is the most damaging narrative this week (sentiment score: –0.84). A public statement or emergency budget review is advised within 48 hours.\n\n2. **Tender transparency** — Opposition's KES 4.5B tender claims are gaining traction in Standard Media. Proactive disclosure of procurement records recommended.\n\n3. **Sewer rehabilitation delays** — Resident complaints in Eastlands and Mathare are being amplified on social channels. Field team should confirm timeline updates.`,
    },
    {
      title: 'Opponent Watch',
      content: `**Mike Sonko** (45 mentions this week) continues to dominate opposition press with his Senate comeback narrative. A court dismissal ruling has boosted his coverage positivity.\n\n**Agnes Kagure** (32 mentions) unveiled a KES 1B Women Enterprise Fund proposal that attracted positive coverage in Citizen Digital — watch for resonance with women voters in Kibra and Langata.\n\n**Polycarp Igathe** (28 mentions) remains low-profile but is gaining quiet support from the business community in Westlands.`,
    },
    {
      title: 'Grassroots Intelligence',
      content: `Field reports from 6 wards this week highlight **water and roads** as the dominant pain points. Mathare North water shortage (confidence: 92%) and Outering Road flooding (confidence: 89%) are the highest-priority unresolved issues.\n\nRecommendation: A targeted infrastructure tour of Mathare and Embakasi East would directly address the top two community grievances and generate positive media.`,
    },
  ],
}

function sourceParam(url: string): string | null {
  return new URLSearchParams(url.split('?')[1] ?? '').get('source')
}

function summaryFromArticles(articles: typeof DEMO_ARTICLES) {
  const positive = articles.filter(a => a.label === 'positive').length
  const negative = articles.filter(a => a.label === 'negative').length
  const neutral  = articles.filter(a => a.label === 'neutral').length
  return { positive, negative, neutral, total: articles.length }
}

// ── County map data ─────────────────────────────────────────────────────────
export const DEMO_COUNTY_DATA = [
  { county: 'Nairobi',   painpoint_count: 47, top_issues: ['roads', 'water', 'security', 'housing', 'jobs'], sentiment_score:  0.23 },
  { county: 'Kiambu',    painpoint_count: 12, top_issues: ['water', 'roads', 'school_fees'],                 sentiment_score:  0.15 },
  { county: 'Machakos',  painpoint_count:  8, top_issues: ['roads', 'water', 'jobs'],                        sentiment_score: -0.05 },
  { county: 'Kajiado',   painpoint_count:  6, top_issues: ['water', 'roads'],                                sentiment_score:  0.08 },
  { county: "Murang'a",  painpoint_count:  5, top_issues: ['roads', 'health'],                               sentiment_score:  0.12 },
  { county: 'Nakuru',    painpoint_count:  4, top_issues: ['economy', 'jobs'],                               sentiment_score:  0.05 },
  { county: 'Mombasa',   painpoint_count:  3, top_issues: ['security', 'housing'],                           sentiment_score: -0.10 },
]

// ── Field Reports data ───────────────────────────────────────────────────────
const DEMO_FIELD_REPORTS = [
  { id: 'fr-1',  agent_id: 'agent-001', ward: 'Kayole Central',    report_type: 'canvassing', top_issue: 'roads',       support_level: 'strong_support',    notes: 'Residents strongly back Sakaja — road works in Outering Rd cited as proof of delivery.',  created_at: '2026-07-22T09:00:00Z' },
  { id: 'fr-2',  agent_id: 'agent-002', ward: 'Mathare North',     report_type: 'canvassing', top_issue: 'water',       support_level: 'lean_support',      notes: "Support solid but water shortage remains top concern. Senator's office should respond.", created_at: '2026-07-22T08:30:00Z' },
  { id: 'fr-3',  agent_id: 'agent-003', ward: 'Embakasi East',     report_type: 'canvassing', top_issue: 'security',    support_level: 'strong_support',    notes: 'Night patrols increase noted positively. Youth unemployment secondary concern.',          created_at: '2026-07-21T16:00:00Z' },
  { id: 'fr-4',  agent_id: 'agent-004', ward: 'Kibra',             report_type: 'canvassing', top_issue: 'housing',     support_level: 'undecided',         notes: 'Eviction fears in Mukuru making residents cautious. Need clear communication.',          created_at: '2026-07-21T15:00:00Z' },
  { id: 'fr-5',  agent_id: 'agent-001', ward: 'Westlands',         report_type: 'canvassing', top_issue: 'economy',     support_level: 'strong_support',    notes: 'Business community very positive on Innovation Hub and World Bank partnership news.',    created_at: '2026-07-21T11:00:00Z' },
  { id: 'fr-6',  agent_id: 'agent-005', ward: 'Pumwani',           report_type: 'canvassing', top_issue: 'health',      support_level: 'lean_opposition',   notes: 'Maternity hospital equipment shortage causing frustration. Urgent action needed.',      created_at: '2026-07-20T14:00:00Z' },
  { id: 'fr-7',  agent_id: 'agent-002', ward: 'Roysambu',          report_type: 'canvassing', top_issue: 'roads',       support_level: 'lean_support',      notes: 'Pothole concerns but residents appreciate county responsiveness compared to before.',     created_at: '2026-07-20T10:00:00Z' },
  { id: 'fr-8',  agent_id: 'agent-006', ward: 'Starehe',           report_type: 'canvassing', top_issue: 'corruption',  support_level: 'undecided',         notes: "CBD hawker extortion widely discussed. Trust issue affecting Senator's urban rating.",   created_at: '2026-07-19T13:00:00Z' },
  { id: 'fr-9',  agent_id: 'agent-003', ward: 'Kasarani',          report_type: 'canvassing', top_issue: 'jobs',        support_level: 'strong_support',    notes: 'Youth internship program praised. Residents want more. Strong energy for campaign.',     created_at: '2026-07-19T09:00:00Z' },
  { id: 'fr-10', agent_id: 'agent-007', ward: 'Langata',           report_type: 'canvassing', top_issue: 'school_fees', support_level: 'lean_opposition',   notes: 'County school levy dispute unresolved. Parents frustrated. Needs policy clarification.', created_at: '2026-07-18T15:00:00Z' },
  { id: 'fr-11', agent_id: 'agent-004', ward: 'Korogocho',         report_type: 'canvassing', top_issue: 'jobs',        support_level: 'undecided',         notes: '68% youth unemployment makes residents sceptical despite goodwill toward Senator.',      created_at: '2026-07-18T11:00:00Z' },
  { id: 'fr-12', agent_id: 'agent-005', ward: 'Kilimani',          report_type: 'canvassing', top_issue: 'economy',     support_level: 'strong_support',    notes: 'Upper-income ward strongly backing Sakaja. Innovation Hub and World Bank seen as wins.', created_at: '2026-07-17T14:00:00Z' },
]

export const DEMO_FIELD_SUMMARY = {
  total: DEMO_FIELD_REPORTS.length,
  by_support: {
    strong_support:    4,
    lean_support:      3,
    undecided:         3,
    lean_opposition:   2,
    strong_opposition: 0,
  },
  top_wards: [
    { ward: 'Kayole Central', count: 2 },
    { ward: 'Mathare North',  count: 2 },
    { ward: 'Kasarani',       count: 2 },
    { ward: 'Embakasi East',  count: 1 },
    { ward: 'Kibra',          count: 1 },
    { ward: 'Pumwani',        count: 1 },
    { ward: 'Westlands',      count: 1 },
  ],
  by_issue: {
    roads:       3,
    jobs:        3,
    water:       1,
    security:    1,
    health:      1,
    housing:     1,
    economy:     2,
    corruption:  1,
    school_fees: 1,
  },
}

export function getDemoResponse(url: string, _method: string): unknown | null {
  const u = url.toLowerCase()

  if (u.includes('/sentiment/trend'))   return DEMO_SENTIMENT_TREND

  if (u.includes('/sentiment/summary')) {
    const src = sourceParam(url)
    if (src && src !== 'all') {
      return summaryFromArticles(DEMO_ARTICLES.filter(a => a.source === src))
    }
    return DEMO_SENTIMENT_SUMMARY
  }

  if (u.includes('/sentiment/articles')) {
    const src = sourceParam(url)
    if (src && src !== 'all') {
      return DEMO_ARTICLES.filter(a => a.source === src)
    }
    return DEMO_ARTICLES
  }

  if (u.includes('/briefings/latest'))            return DEMO_BRIEFING
  if (u.includes('/briefings/generate'))          return DEMO_BRIEFING

  if (u.includes('/opponents/') && u.includes('/mentions')) {
    const parts = url.split('/')
    const id = parts[parts.indexOf('opponents') + 1]
    return DEMO_OPPONENT_MENTIONS[id] ?? []
  }
  if (u.includes('/opponents/'))                  return DEMO_OPPONENTS

  // County map — must come before generic /painpoints/ check
  if (u.includes('/painpoints/by-county'))        return DEMO_COUNTY_DATA
  if (u.includes('/painpoints/summary'))          return DEMO_PAINPOINTS_SUMMARY
  if (u.includes('/painpoints/'))                 return DEMO_PAINPOINTS_RESPONSE

  // Field reports — summary before list, and uses /intake/ prefix
  if (u.includes('/field-reports/summary'))       return DEMO_FIELD_SUMMARY
  if (u.includes('/field-reports')) {
    const level = new URLSearchParams(url.split('?')[1] ?? '').get('support_level')
    const reports = level && level !== 'all'
      ? DEMO_FIELD_REPORTS.filter(r => r.support_level === level)
      : DEMO_FIELD_REPORTS
    return { total: reports.length, reports }
  }

  if (u.includes('/pipeline/refresh'))            return { ingestion: { saved: 14 }, sentiment: { processed: 9 } }

  return null
}
