import { ParsedJobDescription } from "../lib/jobDescriptionParser";

export interface UserProject {
  id: string;
  name: string;
  link: string;
  description: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserUsage {
  savedSessions: number;
  aiTokensUsed: number;
  resumesParsed: number;
  interviewsCompleted: number;
  monthlyUsageReset: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro";
  usage: UserUsage;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface SessionFeedback {
  overallScore: number;
  communication: number;
  technical: number;
  confidence: number;
  problemSolving: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface MockSession {
  id: string;
  title: string;
  company: string;
  role: string;
  createdAt: Date;
  updatedAt?: Date;
  lastAccessedAt?: Date;
  status?: "active" | "completed" | "abandoned";
  messages: Message[]; // In-memory fallback/cache
  jd: ParsedJobDescription | null;
  isSaved?: boolean;
  feedback?: SessionFeedback;
}
