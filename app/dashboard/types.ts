import { ParsedJobDescription } from "../lib/jobDescriptionParser";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export interface MockSession {
  id: string;
  title: string;
  company: string;
  role: string;
  createdAt: Date;
  messages: Message[];
  jd: ParsedJobDescription | null;
  isSaved?: boolean;
}
