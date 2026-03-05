export const AMBIGUOUS_SKILLS = new Set([
  "R", "C", "Go", "Rust", "Dart", "Lua", "Perl", "SQL", "HTML", "CSS", "REST",
]);

export const TECH_SKILLS = [
  // Languages
  "JavaScript","TypeScript","Python","Java","C++","C#","C","Go","Rust","Swift",
  "Kotlin","Ruby","PHP","Scala","R","MATLAB","Dart","Lua","Perl","Bash","Shell",
  // Frontend
  "React","Next.js","Vue","Vue.js","Angular","Svelte","HTML","HTML5","CSS","CSS3",
  "Sass","SCSS","Tailwind","TailwindCSS","Bootstrap","jQuery","Redux","Zustand",
  "Vite","Webpack","Babel",
  // Backend
  "Node.js","Express","FastAPI","Django","Flask","Spring","Spring Boot","Laravel",
  "Rails","NestJS","Hono","Bun","Deno",
  // Databases
  "MongoDB","PostgreSQL","MySQL","SQLite","Redis","Firebase","Supabase","DynamoDB",
  "Cassandra","Prisma","Mongoose","SQL","NoSQL",
  // Cloud & DevOps
  "AWS","GCP","Azure","Docker","Kubernetes","CI/CD","GitHub Actions","Vercel",
  "Netlify","Heroku","Linux","Nginx","Apache","Terraform","Ansible",
  // AI/ML
  "TensorFlow","PyTorch","Keras","scikit-learn","Pandas","NumPy","OpenCV",
  "Hugging Face","LangChain","OpenAI","LLM","NLP","Machine Learning",
  "Deep Learning","Computer Vision",
  // Mobile
  "React Native","Flutter","Android","iOS","Expo",
  // Tools & Others
  "Git","GitHub","GitLab","Bitbucket","Figma","Jira","Postman","GraphQL",
  "REST","REST API","gRPC","WebSockets","OAuth","JWT","Stripe","Twilio",
  // Testing
  "Jest","Vitest","Cypress","Playwright","Selenium","JUnit","pytest",
];

export const SKILL_ALIASES: Record<string, string> = {
  "reactjs": "React",
  "react.js": "React",
  "vuejs": "Vue.js",
  "vue js": "Vue.js",
  "angularjs": "Angular",
  "nodejs": "Node.js",
  "node js": "Node.js",
  "node": "Node.js",
  "nextjs": "Next.js",
  "next js": "Next.js",
  "expressjs": "Express",
  "express js": "Express",
  "mongo": "MongoDB",
  "mongo db": "MongoDB",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "typescript": "TypeScript",
  "javascript": "JavaScript",
  "js": "JavaScript",
  "ts": "TypeScript",
  "py": "Python",
  "tf": "TensorFlow",
  "sklearn": "scikit-learn",
  "scikit learn": "scikit-learn",
  "tailwind css": "TailwindCSS",
  "tailwind": "TailwindCSS",
  "k8s": "Kubernetes",
  "gha": "GitHub Actions",
  "gh actions": "GitHub Actions",
  "react-native": "React Native",
};

export const JOB_TITLE_WORDS = new Set([
  "junior","senior","lead","principal","staff","intern","associate",
  "developer","engineer","designer","manager","analyst","architect",
  "consultant","specialist","director","officer","head","vp",
  "full-stack","fullstack","frontend","backend","software","web",
  "mobile","data","devops","cloud","security","qa","ml","ai",
]);

export const DEGREE_KEYWORDS = [
  "Bachelor of Engineering", "Bachelor of Technology", "Bachelor of Science",
  "Bachelor of Arts", "Bachelor of Commerce", "Bachelor of Computer",
  "B\\.E\\.", "B\\.Tech", "B\\.Sc", "B\\.A\\.", "B\\.Com",
  "Master of Engineering", "Master of Technology", "Master of Science",
  "Master of Business", "M\\.E\\.", "M\\.Tech", "M\\.Sc", "M\\.B\\.A", "MBA",
  "Doctor of Philosophy", "Ph\\.D", "PhD",
  "High School", "Senior Secondary", "Diploma",
];

export const BULLET_VERBS = /^(built|developed|created|designed|implemented|integrated|led|managed|built|added|improved|deployed|tested|wrote|used|built|worked|contributed|optimised|optimized|reduced|increased|automated|set|configured|migrated)/i;
