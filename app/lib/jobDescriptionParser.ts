// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ParsedJobDescription {
  /** The role/position title (e.g. "Senior Frontend Engineer") */
  title: string;
  /** Company name */
  company: string;
  /** Work location or "Remote" / "Hybrid" */
  location: string;
  /** Employment type: Full-time, Part-time, Contract, Internship … */
  employmentType: string;
  /** Experience range as a human-readable string, e.g. "2–4 years" */
  experienceRequired: string;
  /** Short description / intro paragraph of the role */
  summary: string;
  /** Bullet-point responsibilities extracted from the JD */
  responsibilities: string[];
  /** Required or minimum qualifications */
  qualifications: string[];
  /** Nice-to-have / preferred qualifications */
  niceToHave: string[];
  /** Technical skills explicitly mentioned */
  skills: string[];
  /** Salary / compensation range if mentioned */
  salaryRange: string;
  /** Raw text passed in, for debugging */
  rawText: string;
}

import {
  TECH_SKILLS,
  SKILL_ALIASES,
  AMBIGUOUS_SKILLS,
} from "./constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-token skill search (re-used verbatim from resumeParser logic) */
function skillInText(skill: string, text: string): boolean {
  const esc = escRe(skill);
  const pattern = /^[a-zA-Z]+$/.test(skill)
    ? new RegExp(`(?<![a-zA-Z])${esc}(?![a-zA-Z])`, "i")
    : new RegExp(`(?<![a-zA-Z0-9])${esc}(?![a-zA-Z0-9])`, "i");
  return pattern.test(text);
}

/** Strip common bullet / list decorators from a line */
function stripBullet(line: string): string {
  return line.replace(/^[\s•●◆▸▹\-\*\d]+\.?\s*/, "").trim();
}

// ─── Section extractor ────────────────────────────────────────────────────────

const JD_SECTION_LABELS: Array<[RegExp, string]> = [
  [/About\s+the\s+(?:Role|Position|Job)|Job\s+(?:Summary|Description|Overview)|Role\s+Overview|Overview|Summary/i, "summary"],
  [/(?:Key\s+)?Responsibilities|What\s+You.?ll\s+Do|Role\s+&?\s*Responsibilities|Duties|Day.to.Day/i, "responsibilities"],
  [/(?:Required|Minimum|Basic|Must.Have)\s+(?:Qualifications?|Requirements?|Skills?)|Requirements?|Qualifications?/i, "requirements"],
  [/(?:Preferred|Desired|Nice.?to.?Have|Bonus|Plus|Optional)\s+(?:Qualifications?|Skills?|Requirements?)|Preferred\b|Nice.?to.?Have/i, "preferred"],
  [/(?:Technical\s+)?Skills?\s+(?:Required|Preferred)?|Technologies?|Tech\s+Stack/i, "skills"],
  [/Compensation|Salary|Pay\s+(?:Range|Scale)|Benefits/i, "compensation"],
  [/About\s+(?:Us|the\s+Company)|Company\s+Overview|Who\s+We\s+Are/i, "about"],
  [/Interview\s+Process|Hiring\s+Process|Next\s+Steps/i, "process"],
];

function extractJDSections(text: string): Record<string, string> {
  const allLabels = JD_SECTION_LABELS.map(([re]) => re.source).join("|");
  const headerPattern = new RegExp(
    `(?:^|\\n)(${allLabels})[ \\t]*[:\\-|–—]?(?=\\s|$)`,
    "gm"
  );

  const sections: Record<string, string> = {};
  const matches = [...text.matchAll(headerPattern)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const headerText = match[1].trim();

    let key = "other";
    for (const [re, canonical] of JD_SECTION_LABELS) {
      if (re.test(headerText)) { key = canonical; break; }
    }

    const start = (match.index ?? 0) + match[0].length;
    const end = matches[i + 1]?.index ?? text.length;
    const content = text.slice(start, end).trim();

    // Keep the longest match for each key
    if (!sections[key] || content.length > sections[key].length) {
      sections[key] = content;
    }
  }

  return sections;
}

// ─── Title ────────────────────────────────────────────────────────────────────

const JOB_TITLE_INDICATORS = [
  "engineer", "developer", "designer", "manager", "analyst", "architect",
  "scientist", "specialist", "lead", "director", "officer", "head", "vp",
  "intern", "consultant", "associate", "coordinator", "administrator",
  "product", "software", "data", "devops", "cloud", "fullstack", "frontend",
  "backend", "mobile", "qa", "sre", "ml", "ai", "stack", "ui", "ux", "web",
  "security", "infrastructure", "systems", "embedded", "firmware",
];

function extractTitle(lines: string[], sections: Record<string, string>): string {
  // 1. Explicit labels
  const first30 = lines.slice(0, 30).join("\n");
  const labelMatch = first30.match(
    /(?:position|role|job\s+title|opening|vacancy)\s*:\s*(.+)/i
  );
  if (labelMatch && labelMatch[1].trim().length > 2) return labelMatch[1].trim().slice(0, 100);

  // 2. Heuristic: Check first 20 lines for common title indicators
  for (const line of lines.slice(0, 20)) {
    const t = line.trim();
    if (!t || t.length > 100 || t.length < 3) continue;
    
    // Skip common generic lines
    if (/^[0-9\W]+$/.test(t)) continue; 
    
    const lower = t.toLowerCase();
    if (JOB_TITLE_INDICATORS.some((kw) => lower.includes(kw))) {
      const words = t.split(/\s+/);
      if (words.length <= 12) return t;
    }
  }

  // 3. Last resort: First non-empty line that isn't a URL/Email
  for (const line of lines.slice(0, 5)) {
    const t = line.trim();
    if (t.length > 2 && t.length < 80 && !t.includes("@") && !t.includes("http")) {
      return t;
    }
  }

  return "";
}


// ─── Company ──────────────────────────────────────────────────────────────────

function extractCompany(text: string, lines: string[]): string {
  // "Company:" or "Organization:" label
  const labelMatch = text.match(
    /(?:company|employer|organization|hiring\s+for)\s*:\s*(.+)/i
  );
  if (labelMatch) return labelMatch[1].split(/\n/)[0].trim().slice(0, 100);

  // "at <Company>" pattern near a title indicator
  const atMatch = text.slice(0, 800).match(/\bat\s+([A-Z][A-Za-z0-9\s&.,'-]{2,50}?)(?:\s*[-|,\n]|$)/);
  if (atMatch) return atMatch[1].trim().slice(0, 80);

  // "Inc.", "Ltd", "Corp", "LLC" pattern
  for (const line of lines.slice(0, 30)) {
    if (/\b(?:Inc\.|Ltd\.?|Corp\.?|LLC|Limited|Technologies|Solutions|Systems|Labs)\b/.test(line)) {
      const t = line.trim();
      if (t.split(/\s+/).length <= 8) return t.slice(0, 80);
    }
  }

  return "";
}

// ─── Location ─────────────────────────────────────────────────────────────────

function extractJDLocation(text: string): string {
  // "Remote", "Hybrid", "On-site", "In-office"
  const workMode =
    text.match(/\b(Remote(?:\s*\/\s*Hybrid)?|Hybrid(?:\s*\/\s*Remote)?|On-?site|In-?office)\b/i);
  if (workMode) {
    // Try to also grab a city next to the work-mode
    const cityNearby = text.match(
      new RegExp(`${escRe(workMode[1])}.{0,60}?([A-Z][a-zA-Z]+(?:,\\s*[A-Z]{2})?)`, "i")
    );
    if (cityNearby) return `${cityNearby[1]} (${workMode[1]})`;
    return workMode[1];
  }

  // City, STATE or City, Country
  const loc = text.match(/\b([A-Z][a-zA-Z\s]{1,20},\s*[A-Z]{2,})\b/);
  if (loc) return loc[0].trim();

  // Well-known cities
  const city = text.match(
    /\b(New York|San Francisco|Seattle|Austin|Boston|Chicago|Los Angeles|London|Berlin|Bangalore|Bengaluru|Hyderabad|Pune|Mumbai|Delhi|NCR|Noida|Gurgaon)\b/i
  );
  return city ? city[0] : "";
}

// ─── Employment type ──────────────────────────────────────────────────────────

function extractEmploymentType(text: string): string {
  const m = text.match(
    /\b(Full[- ]?[Tt]ime|Part[- ]?[Tt]ime|Contract(?:or)?|Freelance|Internship|Temporary|Permanent)\b/i
  );
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

// ─── Experience ───────────────────────────────────────────────────────────────

function extractExperience(text: string): string {
  // "3–5 years", "2+ years", "at least 3 years"
  const patterns = [
    /(\d+)\s*[-–to]+\s*(\d+)\s*\+?\s*years?(?:\s+of)?\s+(?:experience|exp)/i,
    /(\d+)\s*\+\s*years?(?:\s+of)?\s+(?:experience|exp)/i,
    /at\s+least\s+(\d+)\s+years?(?:\s+of)?\s+(?:experience|exp)/i,
    /(\d+)\s*years?(?:\s+of)?\s+(?:experience|exp)/i,
    /(?:experience|exp)\s+of\s+(\d+)\s*[-–to]+\s*(\d+)\s*years?/i,
    /(?:experience|exp)\s+of\s+(\d+)\+?\s*years?/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      if (m[2]) return `${m[1]}–${m[2]} years`;
      return `${m[1]}+ years`;
    }
  }

  // "entry-level", "mid-level", "senior", "junior"
  const level = text.match(/\b(entry[- ]?level|junior|mid[- ]?level|senior|lead|principal|staff)\b/i);
  return level ? level[1] : "";
}

// ─── Bullet-list extractors ───────────────────────────────────────────────────

/**
 * Turn a section body into an array of bullet items.
 * Handles both newline-separated bullets and inline comma/semicolons when there
 * are no newline bullets.
 */
function extractBullets(sectionText: string, maxItems = 20): string[] {
  if (!sectionText.trim()) return [];

  const lines = sectionText.split(/\n/).map((l) => l.trim()).filter(Boolean);

  // Prefer newline-delimited bullets
  const bullets = lines
    .map(stripBullet)
    .filter((l) => l.length > 10 && l.length < 400);

  if (bullets.length >= 2) return bullets.slice(0, maxItems);

  // Fallback: split on ". " or "; "
  const flat = sectionText.replace(/\n/g, " ").trim();
  return flat
    .split(/(?<=\.)\s+(?=[A-Z])|;\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10)
    .slice(0, maxItems);
}

// ─── Responsibilities ─────────────────────────────────────────────────────────

function extractResponsibilities(sections: Record<string, string>): string[] {
  const src = sections["responsibilities"] ?? "";
  return extractBullets(src, 15);
}

// ─── Qualifications ───────────────────────────────────────────────────────────

function extractQualifications(sections: Record<string, string>): string[] {
  const src = sections["requirements"] ?? "";
  return extractBullets(src, 15);
}

function extractNiceToHave(sections: Record<string, string>): string[] {
  const src = sections["preferred"] ?? "";
  return extractBullets(src, 10);
}

// ─── Skills ───────────────────────────────────────────────────────────────────

function extractJDSkills(fullText: string, sections: Record<string, string>): string[] {
  const found = new Set<string>();
  const skillsSection = (sections["skills"] ?? "") + " " + (sections["requirements"] ?? "") + " " + (sections["preferred"] ?? "");

  for (const skill of TECH_SKILLS) {
    const isAmbiguous = AMBIGUOUS_SKILLS.has(skill);
    // For ambiguous skills, only search in skill-related sections (not the whole text)
    const searchIn = isAmbiguous ? skillsSection : fullText;
    if (searchIn && skillInText(skill, searchIn)) {
      found.add(skill);
    }
  }

  // Resolve aliases (e.g. "reactjs" → "React")
  for (const alias of Object.keys(SKILL_ALIASES)) {
    const esc = escRe(alias);
    const pattern = new RegExp(`(?<![a-zA-Z0-9])${esc}(?![a-zA-Z0-9])`, "i");
    if (pattern.test(fullText)) {
      found.add(SKILL_ALIASES[alias]);
    }
  }

  return Array.from(found).sort();
}

// ─── Salary ───────────────────────────────────────────────────────────────────

function extractSalary(text: string): string {
  // "$80,000 – $120,000", "₹12–18 LPA", "80k–120k USD"
  const m =
    text.match(/[$₹£€]\s*[\d,]+(?:k|K|L|LPA)?\s*[-–to]+\s*[$₹£€]?\s*[\d,]+(?:k|K|L|LPA)?(?:\s*(?:USD|INR|EUR|GBP|per\s+year|annually|pa|CTC))?/i) ??
    text.match(/[\d,]+(?:k|K|L|LPA)\s*[-–to]+\s*[\d,]+(?:k|K|L|LPA)?(?:\s*(?:USD|INR|EUR|GBP))?/i) ??
    text.match(/(?:up\s+to|upto)\s+[$₹£€]?\s*[\d,]+(?:k|K|L|LPA)?/i);
  return m ? m[0].trim() : "";
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function extractJDSummary(sections: Record<string, string>, lines: string[]): string {
  if (sections["summary"]) {
    return sections["summary"].replace(/\s+/g, " ").trim().slice(0, 600);
  }
  // Fall back to the first substantial paragraph in the raw text
  let para = "";
  for (const line of lines) {
    const t = line.trim();
    if (t.length > 60) { para = t; break; }
  }
  return para.slice(0, 600);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function parseJobDescription(rawText: string): ParsedJobDescription {
  const lines = rawText.split(/\r?\n/);
  const sections = extractJDSections(rawText);

  return {
    title: extractTitle(lines, sections),
    company: extractCompany(rawText, lines),
    location: extractJDLocation(rawText),
    employmentType: extractEmploymentType(rawText),
    experienceRequired: extractExperience(rawText),
    summary: extractJDSummary(sections, lines),
    responsibilities: extractResponsibilities(sections),
    qualifications: extractQualifications(sections),
    niceToHave: extractNiceToHave(sections),
    skills: extractJDSkills(rawText, sections),
    salaryRange: extractSalary(rawText),
    rawText,
  };
}
