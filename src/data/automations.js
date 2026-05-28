// ============================================================
// AUTOMATION TOOLS DATA
// ============================================================
// To add a new automation, simply add a new object to the array.
// The dashboard will automatically render the card.
//
// Required fields:
//   - id: unique number
//   - name: automation name
//   - description: what this automation does
//   - program: which program this belongs to (MBA, BBA, etc.)
//   - link: hyperlink to the automation tool
//
// Optional fields:
//   - icon: Lucide icon name (default: "Zap")
//   - enabled: true/false (default: true)
//   - status: "live" | "maintenance" | "development" | "unavailable"
//   - updatedAt: last update date string
// ============================================================

const automations = [
  {
    id: 1,
    name: "Attendance Automation",
    description: "Generate attendance reports automatically from LMS data with detailed analytics and export options.",
    program: "MBA",
    link: "https://example.com/attendance",
    icon: "Users",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-15"
  },
  {
    id: 2,
    name: "Grade Report Generator",
    description: "Pull grading data and distribute professional reports to faculty and graders via automated emails.",
    program: "MBA",
    link: "https://example.com/grade-report",
    icon: "FileSpreadsheet",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-14"
  },
  {
    id: 3,
    name: "Discussion Tracker",
    description: "Track and audit Canvas discussion forums for SLA compliance and learner query resolution.",
    program: "MBA",
    link: "https://example.com/discussion-tracker",
    icon: "MessageSquare",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-13"
  },
  {
    id: 4,
    name: "Live Session Reminder",
    description: "Automated email reminders to faculty for upcoming live sessions with timezone conversion.",
    program: "MBA",
    link: "https://example.com/session-reminder",
    icon: "Bell",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-12"
  },
  {
    id: 5,
    name: "BBA Enrollment Tracker",
    description: "Track and manage BBA program enrollment status with real-time dashboard updates.",
    program: "BBA",
    link: "https://example.com/bba-enrollment",
    icon: "GraduationCap",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-10"
  },
  {
    id: 6,
    name: "BBA Assignment Monitor",
    description: "Monitor assignment submissions and grading progress across all BBA cohorts.",
    program: "BBA",
    link: "https://example.com/bba-assignment",
    icon: "ClipboardCheck",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-09"
  },
  {
    id: 7,
    name: "Executive MBA Report",
    description: "Generate comprehensive executive MBA performance and engagement reports.",
    program: "Executive MBA",
    link: "https://example.com/emba-report",
    icon: "BarChart3",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-08"
  },
  {
    id: 8,
    name: "EMBA Session Scheduler",
    description: "Automated scheduling and notification system for Executive MBA live sessions.",
    program: "Executive MBA",
    link: "https://example.com/emba-scheduler",
    icon: "Calendar",
    enabled: false,
    status: "development",
    updatedAt: "2026-05-07"
  },
  {
    id: 9,
    name: "MBMT Data Sync",
    description: "Synchronize MBMT program data across multiple platforms and databases.",
    program: "MBMT",
    link: "https://example.com/mbmt-sync",
    icon: "RefreshCw",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-06"
  },
  {
    id: 10,
    name: "Operations Dashboard",
    description: "Centralized operations monitoring dashboard with real-time KPI tracking.",
    program: "Operations",
    link: "https://example.com/ops-dashboard",
    icon: "Activity",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-05"
  },
  {
    id: 11,
    name: "Ops Ticket Automator",
    description: "Automate ticket creation and routing for operational support requests.",
    program: "Operations",
    link: "https://example.com/ops-tickets",
    icon: "Ticket",
    enabled: false,
    status: "maintenance",
    updatedAt: "2026-05-04"
  },
  {
    id: 12,
    name: "Analytics Report Builder",
    description: "Build and schedule custom analytics reports with drag-and-drop interface.",
    program: "Analytics",
    link: "https://example.com/analytics-builder",
    icon: "PieChart",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-03"
  },
  {
    id: 13,
    name: "PGDM Attendance System",
    description: "Automated attendance tracking and compliance reporting for PGDM programs.",
    program: "PGDM",
    link: "https://example.com/pgdm-attendance",
    icon: "UserCheck",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-02"
  },
  {
    id: 14,
    name: "PGDM Feedback Collector",
    description: "Collect and analyze student feedback for PGDM courses with sentiment analysis.",
    program: "PGDM",
    link: "https://example.com/pgdm-feedback",
    icon: "MessageCircle",
    enabled: true,
    status: "live",
    updatedAt: "2026-05-01"
  },
  {
    id: 15,
    name: "Email Template Engine",
    description: "Manage and deploy standardized email templates across all programs.",
    program: "Others",
    link: "https://example.com/email-templates",
    icon: "Mail",
    enabled: true,
    status: "live",
    updatedAt: "2026-04-30"
  },
  {
    id: 16,
    name: "Data Migration Tool",
    description: "Safely migrate data between systems with validation and rollback support.",
    program: "Others",
    link: "https://example.com/data-migration",
    icon: "Database",
    enabled: false,
    status: "development",
    updatedAt: "2026-04-29"
  },
];

// All available programs for filter pills
export const programs = [
  "All Programs",
  "MBA",
  "BBA",
  "Executive MBA",
  "MBMT",
  "Operations",
  "Analytics",
  "PGDM",
  "Central",
  "Others"
];

export default automations;
