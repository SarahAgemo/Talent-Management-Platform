export const READINESS_ITEMS = [
  { key: "portfolio", label: "Portfolio / Project Showcasing" },
  { key: "linkedin", label: "LinkedIn Profile" },
  { key: "github", label: "GitHub Profile" },
  { key: "job_board_profile", label: "Job Board Profile" },
  { key: "career_paths", label: "Career Paths / Interests / Opportunities" },
  { key: "cv", label: "CV" },
  { key: "mock_interview", label: "Mock Interview" },
  { key: "work_readiness", label: "Work Readiness" },
  { key: "weekly_updates", label: "Updates (Weekly Applications)" }
] as const;

export type ReadinessKey = typeof READINESS_ITEMS[number]["key"];


export const FLOWMINGO_URL = "https://flowmingo.ai/";

export const ACTIVITY_TYPES = [
  { key: "application_submitted", label: "Application submitted" },
  { key: "quality_application", label: "Quality application submitted" },
  { key: "outreach_attempt", label: "Outreach attempt" },
  { key: "interview_completed", label: "Interview completed" },
  { key: "mock_interview_completed", label: "Mock interview completed" },
  { key: "freelance_attempt", label: "Freelance / gig attempt" },
  { key: "response_received", label: "Response received" },
  { key: "interview_secured", label: "Interview secured" },
  { key: "paid_opportunity_generated", label: "Paid opportunity generated" },
  { key: "task_completed", label: "Task completed" },
  { key: "task_overdue", label: "Task overdue" },
  { key: "skill_improved", label: "Skill improved" },
  { key: "portfolio_evidence_added", label: "Portfolio evidence added" }
] as const;
