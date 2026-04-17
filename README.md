# Project Overview: AI Interviewer Platform

This project is a high-fidelity **AI-powered Mock Interview Platform** designed to help job seekers prepare for technical and behavioral interviews using state-of-the-art Generative AI.

## 🎯 Project Goal
The core objective is to provide candidates with a realistic, personalized, and challenging interview simulation. By analyzing both the candidate's **Resume** and the target **Job Description (JD)**, the platform ensures that the practice sessions are highly relevant, identifying skill gaps and providing actionable feedback to increase hiring success.

## 🚀 Key Features

### 1. **Context-Aware AI Interviewer**
- **Powered by Gemini 3 Flash**: Utilizes the latest AI models to act as a strict technical interviewer.
- **Strict Interview Logic**: Asks one question at a time, probes deep into weak answers, and increases difficulty for strong ones.
- **Dynamic Feedback**: Provides immediate feedback after each answer and a comprehensive performance summary at the end.

### 2. **Intelligent Document Processing**
- **Resume Parsing**: Automatically extracts skills, projects, education, and experience from PDF resumes using `pdfjs-dist`.
- **JD Analysis**: Parses job descriptions to identify mandatory vs. nice-to-have skills, tailoring the interview focus accordingly.

### 3. **Personalized Difficulty Scaling**
- **Level Detection**: Automatically identifies the seniority of the role (e.g., Intern, Junior, Senior, Lead) from the job title.
- **Adaptive Questioning**: Adjusts the depth of system design, architecture, and fundamental questions based on the detected level and the candidate's experience.

### 4. **Session Management & Persistence**
- **Firestore Integration**: Saves interview sessions, chat history, and user profiles to Firebase for persistent access.
- **Rename & Organize**: Allows users to rename sessions based on the company or role they are practicing for.

### 5. **Skill Categorization & Profile**
- **Automatic Categorization**: Groups skills into Frontend, Backend, Languages, Databases, Cloud & DevOps, and AI/ML categories for a clear profile overview.
- **Persistent Profiles**: Stores user data to provide a consistent experience across different interview sessions.

### 6. **Monetization & Limits**
- **Save Quotas**: Implements a "Free Tier" limit on the number of saved interview sessions.
- **Payment Modal**: Includes a sleek, modern UI for upgrading and managing subscription models.

### 7. **Modern UX/UI**
- **Glassmorphic Design**: A premium dashboard layout with vibrant accents and smooth animations.
- **Responsive Navigation**: Includes a collapsible sidebar for session history and a dedicated panel for resume/profile management.

## 🛠 Tech Stack
- **Framework**: Next.js (App Router)
- **AI**: Google Gemini (via `@google/genai`)
- **Database/Auth**: Firebase Firestore & Firebase Auth
- **PDF Processing**: PDF.js
- **Styling**: Modern CSS with Glassmorphism and TailwindCSS support (if needed)

---
*Created on: April 13, 2026*
