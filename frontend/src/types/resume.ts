export interface Resume {
  full_name: string;
  professional_summary: string;
  contact: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    location?: string;
    portfolio?: string;
  };
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillsSummary;
  projects?: ProjectItem[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  date_range: string;
  location: string;
  responsibilities: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  date_range: string;
  location: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  technologies?: string[];
}

export interface SkillsSummary {
  languages?: string[];
  frameworks?: string[];
  tools?: string[];
  platforms?: string[];
  soft_skills?: string[];
}

export type UpdateResumeRequest = Partial<Resume>;