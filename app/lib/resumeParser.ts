export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: string[];
  projects: Project[];
  education: Education[];
  rawText: string;
}

import {
  AMBIGUOUS_SKILLS,
  TECH_SKILLS,
  SKILL_ALIASES,
  JOB_TITLE_WORDS,
  DEGREE_KEYWORDS,
  BULLET_VERBS,
} from "./constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resolve an alias → canonical skill name, or null if no match */
function resolveAlias(token: string): string | null {
  const lower = token.toLowerCase().trim();
  if (SKILL_ALIASES[lower]) return SKILL_ALIASES[lower];
  return null;
}

/** Check if `skill` appears as a whole token in `text` */
function skillInText(skill: string, text: string): boolean {
  const esc = escRe(skill);
  const pattern = /^[a-zA-Z]+$/.test(skill)
    ? new RegExp(`(?<![a-zA-Z])${esc}(?![a-zA-Z])`, "i")
    : new RegExp(`(?<![a-zA-Z0-9])${esc}(?![a-zA-Z0-9])`, "i");
  return pattern.test(text);
}

// ─── Section extraction ───────────────────────────────────────────────────────

function extractSections(text: string): Record<string, string> {
  // Case-sensitive: Title Case and ALL-CAPS forms only.
  // Removing `i` flag prevents prose words like "innovative projects" from
  // false-matching the "Projects" section header.
  const LABELS: Array<[RegExp, string]> = [
    [/Professional\s+Summary|PROFESSIONAL\s+SUMMARY|Career\s+Summary/, "summary"],
    [/\bSummary\b|SUMMARY|\bObjective\b|OBJECTIVE|\bProfile\b|PROFILE/, "summary"],
    [/Work\s+Experience|WORK\s+EXPERIENCE|Professional\s+Experience|Employment(?:\s+History)?|\bExperience\b|EXPERIENCE/, "experience"],
    [/\bEducation\b|EDUCATION|Academic\s+Background/, "education"],
    [/Technical\s+Skills|TECHNICAL\s+SKILLS|Core\s+Competencies|\bSkills\b|SKILLS/, "skills"],
    [/Project\s+Experience|Personal\s+Projects|Academic\s+Projects|\bProjects\b|PROJECTS/, "projects"],
    [/Certifications?|CERTIFICATIONS?|\bAwards?\b|Achievements?|Honors?/, "certifications"],
    [/\bInterests\b|\bLanguages\b|\bHobbies\b|\bVolunteer\b/, "misc"],
  ];

  // Build a pattern that matches headers ANYWHERE in the text (not just line-starts).
  // This is critical for PDFs where everything lands on one line.
  // We use a lookahead for the label followed by optional separator.
  const allLabels = LABELS.map(([re]) => re.source).join("|");
  const headerPattern = new RegExp(
    `(?:^|\\s)(${allLabels})[ \t]*[:\\-|–—]?(?=\\s|$)`,
    "gm"   // no 'i' flag — case-sensitive to avoid prose false-matches
  );

  const sections: Record<string, string> = {};
  const matches = [...text.matchAll(headerPattern)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const headerText = match[1].trim().toLowerCase().replace(/\s+/g, " ");

    let key = "misc";
    for (const [re, canonical] of LABELS) {
      if (re.test(headerText)) { key = canonical; break; }
    }

    // Start content AFTER the header word (and its separator)
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[i + 1]?.index ?? text.length;
    const content = text.slice(start, end).trim();

    if (!sections[key] || content.length > sections[key].length) {
      sections[key] = content;
    }
  }

  return sections;
}

// ─── Name ─────────────────────────────────────────────────────────────────────

function extractName(lines: string[]): string {
  // Strategy A: scan clean lines (PDF with proper line-breaks)
  const sectionKeywords = /^(experience|education|skills|projects|summary|objective|work|contact|profile|certifications|awards|languages|interests|volunteer|publications|references)/i;

  function isCleanLine(line: string): boolean {
    if (!line) return false;
    if (line.includes("@")) return false;
    if (/https?:\/\//i.test(line)) return false;
    if (/linkedin|github/i.test(line)) return false;
    if (sectionKeywords.test(line)) return false;
    if (/^\+?[\d\s\-().]{7,}$/.test(line)) return false;
    if (/^\d/.test(line)) return false;
    if (line.split(/\s+/).length > 6) return false;
    if (line.length > 70) return false;
    return true;
  }

  for (const line of lines.slice(0, 15)) {
    const trimmed = line.trim();
    if (!isCleanLine(trimmed)) continue;
    const words = trimmed.split(/\s+/);
    const isTitleCase = words.every((w) => /^[A-Z]/.test(w) || w.length <= 2);
    const isAllCaps   = words.length >= 2 && words.every((w) => w === w.toUpperCase() && /[A-Z]/.test(w));
    const isFirstCap  = /^[A-Z]/.test(trimmed) && words.length <= 5;
    if (isTitleCase || isAllCaps || isFirstCap) {
      if (isAllCaps && !isTitleCase)
        return trimmed.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      return trimmed;
    }
  }

  // Strategy B: for single-line PDFs, grab opening proper-noun words
  // before hitting a job title, digit, or @
  const fullStart = lines.slice(0, 5).join(" ").trim();
  const words = fullStart.split(/\s+/);
  const nameWords: string[] = [];
  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z]/g, "");
    // Stop at job title words, digits, or contact info
    if (JOB_TITLE_WORDS.has(clean.toLowerCase())) break;
    if (/\d|@/.test(word)) break;
    if (word.includes(":") || /^https?/i.test(word)) break;
    // Must start with capital to be part of a name
    if (!/^[A-Z]/.test(word)) break;
    nameWords.push(clean || word);
    if (nameWords.length >= 4) break; // max 4 name words
  }

  if (nameWords.length >= 2) return nameWords.join(" ");
  if (nameWords.length === 1) return nameWords[0]; // single-word name fallback

  return "";
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function extractEmail(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : "";
}

// FIX 3: safer phone regex — requires structured digit groupings
function extractPhone(text: string): string {
  const m = text.match(
    /(?<!\d)(\+?[\d]{1,3}[\s\-]?)?(\(?\d{2,4}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{4,5}(?!\d)/
  );
  if (!m) return "";
  const raw = m[0].trim();
  // Sanity check: must have at least 7 digits total
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 ? raw : "";
}

// FIX 2: global-friendly location — handles "Mumbai, India", "Pune, Maharashtra", "Delhi NCR"
function extractLocation(text: string): string {
  // Try structured "City, Region/Country" first
  const structured = text.match(/\b([A-Z][a-zA-Z\s]{1,20},\s*[A-Z][a-zA-Z\s]{1,20})\b/);
  if (structured) return structured[0].trim();
  // Fallback: known Indian cities / NCR patterns
  const city = text.match(/\b(Mumbai|Delhi|NCR|Bangalore|Bengaluru|Chennai|Hyderabad|Pune|Kolkata|Ahmedabad|Jaipur|Surat|Lucknow|Noida|Gurgaon|Gurugram)\b/i);
  return city ? city[0] : "";
}

function extractLinkedIn(text: string): string {
  const m = text.match(/linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i);
  return m ? `https://${m[0]}` : "";
}

function extractGitHub(text: string): string {
  const m = text.match(/github\.com\/[a-zA-Z0-9\-_]+/i);
  return m ? `https://${m[0]}` : "";
}

function extractSummary(sections: Record<string, string>): string {
  const raw = sections["summary"] ?? "";
  return raw.replace(/\s+/g, " ").trim().slice(0, 500);
}

// ─── Skills ───────────────────────────────────────────────────────────────────

function extractSkills(fullText: string, sections: Record<string, string>): string[] {
  const found = new Set<string>();
  const skillsSection = sections["skills"] ?? "";

  // Pass 1: canonical skill names
  for (const skill of TECH_SKILLS) {
    const isAmbiguous = AMBIGUOUS_SKILLS.has(skill);
    const searchIn = isAmbiguous ? skillsSection : fullText;
    if (searchIn && skillInText(skill, searchIn)) {
      found.add(skill);
    }
  }

  // Pass 2: alias scan — look for aliases anywhere in text, resolve to canonical
  const aliasTargets = Object.keys(SKILL_ALIASES);
  for (const alias of aliasTargets) {
    const esc = escRe(alias);
    const pattern = new RegExp(`(?<![a-zA-Z0-9])${esc}(?![a-zA-Z0-9])`, "i");
    if (pattern.test(fullText)) {
      const canonical = SKILL_ALIASES[alias];
      found.add(canonical);
    }
  }

  return Array.from(found).sort();
}

// ─── Projects ─────────────────────────────────────────────────────────────────

function extractProjects(sections: Record<string, string>): Project[] {
  const projectsText = sections["projects"] ?? "";
  if (!projectsText.trim()) return [];

  // ── Pre-process: expand inline bullets into separate lines ──────────────────
  // For single-line PDFs: "Title - Built x - Developed y" → proper lines
  // Only split on " - " where dash is preceded by a word char and followed by
  // a capital or known bullet-starter verb, to avoid splitting hyphenated words.

  let normalised = projectsText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Insert newline before " - Verb" patterns (inline bullets)
    .replace(/[ \t]+-[ \t]+(?=[A-Z])/g, "\n- ");

  const lines = normalised.split("\n");

  // ── Title detection ──────────────────────────────────────────────────────────
  function isProjectTitle(line: string): boolean {
    const t = line.trim();
    if (!t || t.length > 150) return false;
    if (!/[A-Z]/.test(t)) return false;
    // Pure bullet body lines start with action verbs after stripping the bullet
    const stripped = t.replace(/^[•●◆▸▹\-\*\d]+\.?\s*/, "");
    if (BULLET_VERBS.test(stripped)) return false;
    // URLs are not titles
    if (/^https?:\//i.test(t)) return false;
    const wordCount = t.split(/\s+/).length;
    return wordCount >= 1 && wordCount <= 15;
  }

  const projects: Project[] = [];
  let current: { titleLine: string; bodyLines: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Strip leading bullets/numbers
    const strippedLine = line.replace(/^[•●◆▸▹\-\*\d]+\.?\s*/, "").trim();

    if (isProjectTitle(strippedLine) && strippedLine.length > 1) {
      if (current && current.titleLine.length > 1) {
        projects.push(buildProject(current.titleLine, current.bodyLines));
      }
      current = { titleLine: strippedLine, bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  if (current && current.titleLine.length > 1) {
    projects.push(buildProject(current.titleLine, current.bodyLines));
  }

  const valid = projects.filter(
    (p) => p.name.split(/\s+/).length >= 2 || p.description.length > 10 || p.technologies.length > 0
  );

  return valid.slice(0, 8);
}

function buildProject(rawTitle: string, bodyLines: string[]): Project {
  // Strip URLs and "link:" patterns from the title
  // e.g. "E-commerce Website (MERN Stack) link: https://..." → "E-commerce Website (MERN Stack)"
  const cleanTitle = rawTitle
    .replace(/link\s*:?\s*https?:\/\/\S+/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Handle inline "Title — description" / "Title: desc" separator
  const inlineSep = /^(.+?)\s*[—–]\s+(.+)$/;
  let name = cleanTitle;
  let inlineDesc = "";
  const sepMatch = cleanTitle.match(inlineSep);
  if (sepMatch && sepMatch[1].split(/\s+/).length <= 8) {
    name = sepMatch[1].trim();
    inlineDesc = sepMatch[2].trim();
  }

  // Strip bullet markers from body lines, remove bare URLs
  const cleanBody = bodyLines
    .map((l) => l.replace(/^[•●◆▸▹\-\*]\s*/, "").replace(/https?:\/\/\S+/g, "").trim())
    .filter(Boolean);

  const allBodyText = [inlineDesc, ...cleanBody].filter(Boolean);
  const description = allBodyText
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);

  const blockText = rawTitle + " " + bodyLines.join(" ");
  const techs: string[] = [];

  for (const skill of TECH_SKILLS) {
    if (skillInText(skill, blockText)) {
      if (AMBIGUOUS_SKILLS.has(skill)) {
        const ambiguousPattern = new RegExp(
          `[,|•·(]\\s*${escRe(skill)}\\s*[,|•·)]`, "i"
        );
        if (!ambiguousPattern.test(blockText)) continue;
      }
      techs.push(skill);
    }
  }

  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    const esc = escRe(alias);
    const pat = new RegExp(`(?<![a-zA-Z0-9])${esc}(?![a-zA-Z0-9])`, "i");
    if (pat.test(blockText) && !techs.includes(canonical)) {
      techs.push(canonical);
    }
  }

  return { name, description, technologies: techs.slice(0, 8) };
}

// ─── Education ────────────────────────────────────────────────────────────────

function extractEducation(sections: Record<string, string>, fullText: string): Education[] {
  const searchText = sections["education"] || fullText;
  const results: Education[] = [];

  const degreePattern = new RegExp(
    `(${DEGREE_KEYWORDS.join("|")})[^\n]{0,150}`,
    "gi"
  );

  for (const m of searchText.matchAll(degreePattern)) {
    const chunk = m[0].trim();

    // Year: 4-digit 19xx or 20xx
    const yearMatch = chunk.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : "";

    // Degree: clean up the matched text
    const degree = chunk
      .replace(/(?:expected\s+)?graduation\s*:?\s*/gi, "")
      .replace(/\b(19|20)\d{2}\b/g, "")
      .replace(/[|,].*$/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100);

    // Institution: look ahead for College / University / Institute / School
    const after = searchText.slice(m.index ?? 0, (m.index ?? 0) + 300);
    const instMatch = after.match(
      /([A-Z][a-zA-Z\s.']+(?:College|University|Institute|School|Academy|Institution)[a-zA-Z\s.,']*)/
    );
    const institution = instMatch
      ? instMatch[1].replace(/\s+/g, " ").trim().slice(0, 120)
      : "";

    if (degree.length > 3) {
      results.push({ degree, institution, year });
    }
  }

  return results.slice(0, 4);
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function parseResumeText(rawText: string): ParsedResume {
  const lines = rawText.split(/\r?\n/);
  const sections = extractSections(rawText);

  return {
    name: extractName(lines),
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    location: extractLocation(rawText),
    linkedin: extractLinkedIn(rawText),
    github: extractGitHub(rawText),
    summary: extractSummary(sections),
    skills: extractSkills(rawText, sections),
    projects: extractProjects(sections),
    education: extractEducation(sections, rawText),
    rawText,
  };
}
