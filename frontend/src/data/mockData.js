export const CLASS_SECTIONS = [
  { id: "3g-p2-math", label: "3rd Grade · Period 2 Math" },
  { id: "4g-p1-sci", label: "4th Grade · Period 1 Science" },
  { id: "5g-hr-5b", label: "5th Grade · Homeroom 5B" },
];

const chip = (id, title, action, extra = {}) => ({ id, title, action, label: `${title} (${action})`, ...extra });

export const POSITIVE_SKILLS = [
  chip("kindness", "Kindness", "Helped a peer"),
  chip("active-participation", "Active Participation", "Shared idea"),
  chip("teamwork", "Teamwork", "Shared materials"),
  chip("focused-effort", "Focused Effort", "Sustained task"),
  chip("problem-solver", "Problem Solver", "Tried strategy"),
  chip("peer-support", "Peer Support", "Encouraged other"),
  chip("self-advocacy", "Self-Advocacy", "Asked for help"),
  chip("smooth-transition", "Smooth Transition", "Ready quickly"),
];

export const SUPPORT_TAGS = [
  chip("task-initiation", "Task Initiation", "Needs start prompt", {
    suggestion: "Kneel beside them, point to step one, and say \"Let's do the first one together.\"",
  }),
  chip("off-task", "Off-Task", "Needs refocus", {
    suggestion: "Use their name with a quiet, private cue and show exactly where to pick back up.",
  }),
  chip("sensory-overload", "Sensory Overload", "Needs quiet space", {
    suggestion: "Offer a calm, low-light spot or headphones, with no questions asked and no rush to return.",
  }),
  chip("frustration", "Frustration", "Needs calm tool", {
    suggestion: "Name the feeling (\"This is tricky\"), then offer a choice of breathing card or fidget.",
  }),
  chip("transition-support", "Transition Support", "Needs warning", {
    suggestion: "Give a personal 2-minute heads-up with a visual timer before the switch.",
  }),
  chip("material-setup", "Material Setup", "Needs prep support", {
    suggestion: "Quietly hand over a ready-to-go kit so they can start with their peers.",
  }),
  chip("social-conflict", "Social Conflict", "Needs mediation", {
    suggestion: "Separate calmly, let each student share their side, then guide them to one repair step.",
  }),
];

export const INITIAL_STUDENTS = [
  {
    id: "std-1",
    name: "Maya Lin",
    grade: "3rd Grade",
    periodIds: ["3g-p2-math"],
    points: 0,
    lifetimePoints: 0,
    supportCount: 1,
    recentTag: "Great Problem Solver",
    status: "Connected",
    iep: false,
    guardianName: "Grace Lin",
    guardianEmail: "lin.family@school.edu",
    parentDigestEnabled: true,
  },
  {
    id: "std-2",
    name: "Lucas Rodriguez",
    grade: "3rd Grade",
    periodIds: ["3g-p2-math"],
    points: 0,
    lifetimePoints: 0,
    supportCount: 0,
    recentTag: "Active Peer Helper",
    status: "Thriving",
    iep: false,
    guardianName: "Marisol Rodriguez",
    guardianEmail: "rodriguez.home@school.edu",
    parentDigestEnabled: true,
  },
  {
    id: "std-3",
    name: "Aaliyah Johnson",
    grade: "3rd Grade",
    periodIds: ["3g-p2-math"],
    points: 0,
    lifetimePoints: 0,
    supportCount: 3,
    recentTag: "Needs Focus",
    status: "Needs Guidance",
    iep: true,
    guardianName: "Denise Johnson",
    guardianEmail: "johnson.guardian@school.edu",
    parentDigestEnabled: true,
  },
  {
    id: "std-4",
    name: "Ethan Chen",
    grade: "3rd Grade",
    periodIds: ["3g-p2-math"],
    points: 0,
    lifetimePoints: 0,
    supportCount: 1,
    recentTag: "Kindness Champion",
    status: "Connected",
    iep: false,
    guardianName: "Wei Chen",
    guardianEmail: "chen.family@school.edu",
    parentDigestEnabled: true,
  },
  {
    id: "std-5",
    name: "Noah Williams",
    grade: "3rd Grade",
    periodIds: ["3g-p2-math"],
    points: 0,
    lifetimePoints: 0,
    supportCount: 0,
    recentTag: "Super Reader",
    status: "Thriving",
    iep: false,
    guardianName: "Tanya Williams",
    guardianEmail: "williams.home@school.edu",
    parentDigestEnabled: true,
  },
  {
    id: "std-6",
    name: "Sophia Patel",
    grade: "3rd Grade",
    periodIds: ["3g-p2-math"],
    points: 0,
    lifetimePoints: 0,
    supportCount: 2,
    recentTag: "Self-Regulation Break",
    status: "Resetting",
    iep: true,
    guardianName: "Priya Patel",
    guardianEmail: "patel.family@school.edu",
    parentDigestEnabled: true,
  },
  {
    id: "std-7",
    name: "Jamal Carter",
    grade: "3rd Grade",
    periodIds: ["3g-p2-math"],
    points: 0,
    lifetimePoints: 0,
    supportCount: 1,
    recentTag: "Great Listener",
    status: "Connected",
    iep: false,
    guardianName: "Andre Carter",
    guardianEmail: "carter.home@school.edu",
    parentDigestEnabled: true,
  },
  {
    id: "std-8",
    name: "Isabella Nguyen",
    grade: "3rd Grade",
    periodIds: ["3g-p2-math"],
    points: 0,
    lifetimePoints: 0,
    supportCount: 0,
    recentTag: "Creative Thinker",
    status: "Thriving",
    iep: false,
    guardianName: "Linh Nguyen",
    guardianEmail: "nguyen.family@school.edu",
    parentDigestEnabled: true,
  },
];

export const RESOURCES = [
  {
    id: "values-sort",
    title: "My Personal Values Sort",
    category: "Values & Goals",
    description: "Visual card deck where students sort and choose the values that matter most to them - Brave, Kind, Focused, Creative and more.",
    color: "amber",
    tag: "Printable",
  },
  {
    id: "choice-point",
    title: "The Choice Point Visual Sheet",
    category: "ACT & Mindfulness",
    description: "ACT tool to notice 'Away Moves' (shutting down, avoiding) and choose 'Toward Moves' that match personal values.",
    color: "teal",
    tag: "Visual",
  },
  {
    id: "thought-naming",
    title: "Thought-Naming & Unhooking Guide",
    category: "ACT & Mindfulness",
    description: "Helps kids notice and name tough thoughts - 'I'm having the thought that math is too hard' - without getting stuck in them.",
    color: "sky",
    tag: "Visual",
  },
  {
    id: "support-profile",
    title: "Co-Designed 'My Support Profile'",
    category: "Co-Designed Plans",
    description: "Person-centered one-pager students fill in with you: strengths, triggers and 'how I like to be helped when I'm frustrated'.",
    color: "rose",
    tag: "Printable",
  },
  {
    id: "grounding-cards",
    title: "Present-Moment Grounding Cards",
    category: "ACT & Mindfulness",
    description: "Tactile 5-4-3-2-1 sensory cards for self-regulation and body awareness.",
    color: "emerald",
    tag: "Printable",
  },
  {
    id: "upstander-cards",
    title: "Upstander Power Cards",
    category: "Self-Advocacy",
    description: "Visual scripts showing students how to include peers and safely report bullying.",
    color: "indigo",
    tag: "Script",
  },
  {
    id: "repair-profile",
    title: "Restorative Harm & Repair Profile",
    category: "Co-Designed Plans",
    description: "Person-centered reflection for students involved in conflict to take accountability and repair relationships in line with their values.",
    color: "amber",
    tag: "Printable",
  },
  {
    id: "relational-map",
    title: "Relational Values Map",
    category: "Values & Goals",
    description: "Student worksheet exploring 'What does being a safe and respectful peer look like?'",
    color: "emerald",
    tag: "Printable",
  },
];

export const RESOURCE_FILTERS = ["All", "Values & Goals", "ACT & Mindfulness", "Self-Advocacy", "Co-Designed Plans"];

// Helper: return an ISO date string offset by N days from today
const dateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// Default replacement skills tracked per student
export const INITIAL_SKILLS = [
  {
    slug: "request-a-break",
    name: "Request a Break",
    progress: 75,
    baseline: 30,
    targetPercent: 100,
    targetDate: dateOffset(30),
    lastPrompt: "Independent",
    trials: [null, null, null, null, null],
    trend: [60, 63, 65, 68, 70, 72, 75],
  },
  {
    slug: "task-initiation",
    name: "Task Initiation",
    progress: 55,
    baseline: 20,
    targetPercent: 80,
    targetDate: dateOffset(45),
    lastPrompt: "Prompted",
    trials: ["independent", "prompted", "prompted", null, null],
    trend: [40, 43, 45, 48, 50, 53, 55],
  },
  {
    slug: "peer-sharing",
    name: "Peer Sharing",
    progress: 40,
    baseline: 15,
    targetPercent: 90,
    targetDate: dateOffset(60),
    lastPrompt: "Prompted",
    trials: [null, null, null, null, null],
    trend: [25, 28, 30, 32, 35, 38, 40],
  },
];

// 7-day trend for analytics
export const WEEKLY_TREND = [
  { day: "Mon", positive: 24, support: 6 },
  { day: "Tue", positive: 31, support: 4 },
  { day: "Wed", positive: 28, support: 8 },
  { day: "Thu", positive: 36, support: 5 },
  { day: "Fri", positive: 42, support: 3 },
  { day: "Sat", positive: 0, support: 0 },
  { day: "Sun", positive: 0, support: 0 },
];
