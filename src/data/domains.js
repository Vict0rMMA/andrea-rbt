// Official 2026 RBT Test Content Outline (3rd Edition) domain weights.
export const DOMAINS = [
  { id: 'A', name: 'Data Collection & Graphing', short: 'Data', weight: 17, emoji: '📊', color: '#7C3AED', soft: 'rgba(124,58,237,.12)', blurb: 'Count it, time it, graph it.' },
  { id: 'B', name: 'Behavior Assessment', short: 'Assessment', weight: 11, emoji: '🔍', color: '#C026D3', soft: 'rgba(192,38,211,.12)', blurb: 'Find out what she likes and why behavior happens.' },
  { id: 'C', name: 'Behavior Acquisition', short: 'Acquisition', weight: 25, emoji: '🌱', color: '#9333EA', soft: 'rgba(147,51,234,.12)', blurb: 'Teach new skills. The biggest part of the exam!' },
  { id: 'D', name: 'Behavior Reduction', short: 'Reduction', weight: 19, emoji: '🛡️', color: '#DB2777', soft: 'rgba(219,39,119,.12)', blurb: 'Follow the plan to lower problem behavior.' },
  { id: 'E', name: 'Documentation & Reporting', short: 'Documentation', weight: 13, emoji: '📝', color: '#6366F1', soft: 'rgba(99,102,241,.12)', blurb: 'Write facts. Tell your BCBA. Protect privacy.' },
  { id: 'F', name: 'Ethics & Professional Conduct', short: 'Ethics', weight: 15, emoji: '💜', color: '#E11D48', soft: 'rgba(225,29,72,.12)', blurb: 'Stay in your role. Protect the client.' },
];

export const DOMAIN = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));

// Mock exam: 85 questions (75 scored + 10 unscored pilot), weighted like the real exam.
export const EXAM_PLAN = { A: 14, B: 9, C: 22, D: 16, E: 11, F: 13 };
export const EXAM_MINUTES = 90;
export const PASS_TARGET = 80;
