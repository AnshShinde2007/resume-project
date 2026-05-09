import { ParsedJobDescription } from "../lib/jobDescriptionParser";

export interface UserProject {
  id: string;
  name: string;
  link: string;
  description: string;
  imageBase64?: string; // base64 encoded image
}

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
