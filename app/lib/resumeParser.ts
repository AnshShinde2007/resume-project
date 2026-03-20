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

  const allLabels = LABELS.map(([re]) => re.source).join("|");
  const headerPattern = new RegExp(
    `(?:^|\\s)(${allLabels})[ \\t]*[:\\-|–—]?(?=\\s|$)`,
    "gm"
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

  const fullStart = lines.slice(0, 5).join(" ").trim();
  const words = fullStart.split(/\s+/);
  const nameWords: string[] = [];
  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z]/g, "");
    if (JOB_TITLE_WORDS.has(clean.toLowerCase())) break;
    if (/\d|@/.test(word)) break;
    if (word.includes(":") || /^https?/i.test(word)) break;
    if (!/^[A-Z]/.test(word)) break;
    nameWords.push(clean || word);
    if (nameWords.length >= 4) break;
  }

  if (nameWords.length >= 2) return nameWords.join(" ");
  if (nameWords.length === 1) return nameWords[0];
  return "";
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function extractEmail(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : "";
}

function extractPhone(text: string): string {
  const m = text.match(
    /(?<!\d)(\+?[\d]{1,3}[\s\-]?)?(\(?\d{2,4}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{4,5}(?!\d)/
  );
  if (!m) return "";
  const raw = m[0].trim();
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 ? raw : "";
}

function extractLocation(text: string): string {
  const structured = text.match(/\b([A-Z][a-zA-Z\s]{1,20},\s*[A-Z][a-zA-Z\s]{1,20})\b/);
  if (structured) return structured[0].trim();
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

  for (const skill of TECH_SKILLS) {
    const isAmbiguous = AMBIGUOUS_SKILLS.has(skill);
    const searchIn = isAmbiguous ? skillsSection : fullText;
    if (searchIn && skillInText(skill, searchIn)) {
      found.add(skill);
    }
  }

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

  let normalised = projectsText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+-[ \t]+(?=[A-Z])/g, "\n- ");

  const lines = normalised.split("\n");

  function isProjectTitle(line: string): boolean {
    const t = line.trim();
    if (!t || t.length > 150) return false;
    if (!/[A-Z]/.test(t)) return false;
    const stripped = t.replace(/^[•●◆▸▹\-\*\d]+\.?\s*/, "");
    if (BULLET_VERBS.test(stripped)) return false;
    if (/^https?:\//i.test(t)) return false;
    const wordCount = t.split(/\s+/).length;
    return wordCount >= 1 && wordCount <= 15;
  }

  const projects: Project[] = [];
  let current: { titleLine: string; bodyLines: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

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
  const cleanTitle = rawTitle
    .replace(/link\s*:?\s*https?:\/\/\S+/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const inlineSep = /^(.+?)\s*[—–]\s+(.+)$/;
  let name = cleanTitle;
  let inlineDesc = "";
  const sepMatch = cleanTitle.match(inlineSep);
  if (sepMatch && sepMatch[1].split(/\s+/).length <= 8) {
    name = sepMatch[1].trim();
    inlineDesc = sepMatch[2].trim();
  }

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

/**
 * Matches institution names that contain a school keyword.
 * Used for institution detection ONLY — NOT applied to the degree string itself
 * (it over-greedily matches field names like "Engineering in Computer Science").
 */
const INST_RE = /([A-Z][a-zA-Z\s.'&-]{1,60}(?:College|University|Institute|School|Academy|Polytechnic|Institution)[a-zA-Z\s.,'()-]{0,40})/;

function toEduLines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    .split("\n").map((l) => l.trim()).filter(Boolean);
}

/**
 * Core education scanner.
 *
 * Key design decisions:
 * - Slices from the degree KEYWORD position → drops any prefix text (name, bullets).
 * - Strips "Expected Graduation: AUG/2028" as a whole phrase (not just the year).
 * - Strips the exact known institution string from the degree text instead of
 *   running INST_RE globally (which would eat "Engineering in Computer Science"
 *   because it greedily matches from "Engineering" → "College").
 * - requireInstitution=true (fallback mode): only accepts lines where an
 *   institution keyword is also present in the 3-line window.
 */
function scanEducationLines(lines: string[], requireInstitution: boolean): Education[] {
  const primary = DEGREE_KEYWORDS.filter((k) => !/diploma/i.test(k));
  // No \b — works on dot-abbreviations like B.Tech, M.E., Ph.D
  const degreeRe  = new RegExp(`(?<![A-Za-z])(${primary.join("|")})(?![A-Za-z])`, "i");
  const diplomaRe = /(?<![A-Za-z])Diploma(?![A-Za-z])/i;

  const results: Education[] = [];
  const seenInstitutions = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isDiploma = diplomaRe.test(line);
    if (!degreeRe.test(line) && !isDiploma) continue;

    // 3-line window for institution + year lookup
    const win = lines.slice(i, i + 3).join(" ");

    // ── Institution (detected from window, not from the degree line alone) ──────
    const instMatch = win.match(INST_RE);
    const institution = instMatch
      ? instMatch[1].replace(/\s+/g, " ").trim().slice(0, 120)
      : "";

    // Fallback mode: skip if no institution keyword in vicinity
    if (requireInstitution && !institution) { i += 2; continue; }

    // Diploma must have an associated institution (avoids online cert lines)
    if (isDiploma && !degreeRe.test(line) && !institution) continue;

    // ── Deduplication ─────────────────────────────────────────────────────────
    const instKey = institution.toLowerCase().slice(0, 40);
    if (instKey && seenInstitutions.has(instKey)) { i += 2; continue; }
    if (instKey) seenInstitutions.add(instKey);

    // ── Year (from window) ────────────────────────────────────────────────────
    const yearMatch = win.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : "";

    // ── Degree text ───────────────────────────────────────────────────────────
    // Start at the keyword position — discards any prefix text (name, page #).
    const degreeMatch = degreeRe.exec(line) ?? diplomaRe.exec(line);
    let degree = degreeMatch ? line.slice(degreeMatch.index) : line;

    // 1. Year ranges first (e.g. "2020-2024") so we don't leave orphan dashes.
    degree = degree.replace(/\b(19|20)\d{2}\s*[-\u2013\u2014]\s*(19|20)\d{2}\b/g, "");
    // 2. "Expected Graduation: AUG/2028" — strip phrase AND its attached date token.
    degree = degree.replace(/(?:expected\s+)?graduation\s*[:\s]\s*\S*/gi, "");
    // 3. Remaining standalone years.
    degree = degree.replace(/\b(19|20)\d{2}\b/g, "");
    // 4. Orphan "MON/" leftovers (e.g. "AUG/" after "2028" was stripped).
    degree = degree.replace(/\b[A-Z]{2,4}\/\s*/g, "");
    // 5. Pipe — everything after is noise.
    degree = degree.replace(/[|].*$/, "");
    // 6. Score / grade noise.
    degree = degree.replace(/\bCGPA\b.*$/i, "");
    degree = degree.replace(/\bGPA\b.*$/i, "");
    degree = degree.replace(/\d+\.\d+\s*\/\s*\d+.*$/, "");   // 8.5/10
    degree = degree.replace(/\d+\s*%.*$/, "");               // 85%
    // 7. Strip the EXACT institution string we already found.
    //    Do NOT run INST_RE here — it greedily matches from "Engineering in
    //    Computer Science" all the way to the school name, leaving only "Bachelor of".
    if (institution) {
      const instEsc = institution.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      degree = degree.replace(new RegExp(instEsc, "i"), "");
    }
    // 8. Lone page numbers (e.g. "2" from PDF footer).
    degree = degree.replace(/\s+\d{1,2}\s*$/, "");
    // 9. Trailing separators / whitespace.
    degree = degree.replace(/[|,\-\u2013\u2014\s]+$/, "");
    degree = degree.replace(/\s+/g, " ").trim().slice(0, 100);

    if (degree.length < 3) { i += 2; continue; }

    results.push({ degree, institution, year });
    i += 2;
  }

  return results;
}

function extractEducation(sections: Record<string, string>, fullText: string): Education[] {
  // Primary: dedicated education section
  const eduSection = sections["education"];
  if (eduSection && eduSection.trim()) {
    const found = scanEducationLines(toEduLines(eduSection), false);
    if (found.length > 0) return found.slice(0, 4);
  }

  // Fallback: full text, but only lines that also have an institution nearby
  return scanEducationLines(toEduLines(fullText), true).slice(0, 4);
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
