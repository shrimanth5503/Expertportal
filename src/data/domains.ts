export interface DomainOption {
  id: string;
  name: string;
  description: string;
  suggestedSkills: string[];
}

export const DOMAIN_OPTIONS: DomainOption[] = [
  {
    id: 'fullstack',
    name: 'Full-Stack Development',
    description: 'End-to-end web applications, APIs, UI and database architecture',
    suggestedSkills: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Tailwind CSS', 'REST APIs', 'Next.js'],
  },
  {
    id: 'frontend',
    name: 'Frontend Engineering',
    description: 'Modern reactive web interfaces, performance, and accessibility',
    suggestedSkills: ['React', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'CSS3 / HTML5', 'Next.js', 'Redux', 'Web Vitals'],
  },
  {
    id: 'backend',
    name: 'Backend & Systems',
    description: 'Scalable services, databases, caching, microservices, and distributed architecture',
    suggestedSkills: ['Node.js', 'Python', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'GraphQL', 'gRPC'],
  },
  {
    id: 'aiml',
    name: 'AI & Machine Learning',
    description: 'LLMs, generative AI, model fine-tuning, embeddings, and MLOps',
    suggestedSkills: ['Python', 'PyTorch', 'TensorFlow', 'Gemini API', 'LangChain', 'OpenAI API', 'Hugging Face', 'Vector DBs'],
  },
  {
    id: 'cloud_devops',
    name: 'Cloud & DevOps',
    description: 'Infrastructure as code, CI/CD pipelines, Kubernetes, and cloud platforms',
    suggestedSkills: ['AWS', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Linux', 'CI/CD'],
  },
  {
    id: 'data_engineering',
    name: 'Data Engineering & Analytics',
    description: 'ETL pipelines, data warehousing, big data processing, and visualization',
    suggestedSkills: ['Python', 'SQL', 'Apache Spark', 'Snowflake', 'BigQuery', 'dbt', 'Kafka', 'Pandas'],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity & InfoSec',
    description: 'Threat modeling, application security, penetration testing, and compliance',
    suggestedSkills: ['AppSec', 'Cryptography', 'OWASP', 'Penetration Testing', 'SIEM', 'Network Security', 'IAM'],
  },
  {
    id: 'mobile',
    name: 'Mobile App Development',
    description: 'Cross-platform and native mobile solutions for iOS and Android',
    suggestedSkills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Mobile UI'],
  },
  {
    id: 'product_design',
    name: 'UI/UX & Product Design',
    description: 'User experience research, wireframing, high-fidelity prototyping, and design systems',
    suggestedSkills: ['Figma', 'UI Design', 'UX Research', 'Design Systems', 'Prototyping', 'User Testing'],
  },
];

export function getSeniorityLevel(years: number): { label: string; color: string; badge: string } {
  if (years < 1) {
    return { label: 'Entry Level / Trainee', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', badge: '🌱 Entry Level' };
  }
  if (years <= 2) {
    return { label: 'Junior Engineer', color: 'text-blue-700 bg-blue-50 border-blue-200', badge: '🚀 Junior' };
  }
  if (years <= 5) {
    return { label: 'Mid-Level Professional', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', badge: '⚡ Mid-Level' };
  }
  if (years <= 8) {
    return { label: 'Senior Specialist', color: 'text-amber-700 bg-amber-50 border-amber-200', badge: '🏆 Senior' };
  }
  if (years <= 12) {
    return { label: 'Lead / Staff Specialist', color: 'text-purple-700 bg-purple-50 border-purple-200', badge: '👑 Lead / Staff' };
  }
  return { label: 'Principal / Architect', color: 'text-rose-700 bg-rose-50 border-rose-200', badge: '🌟 Principal / Architect' };
}
