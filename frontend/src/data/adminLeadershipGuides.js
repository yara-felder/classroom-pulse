// Plain-language leadership playbooks for school administrators.
// Tied to Classroom Pulse analytics. Not a clinical or surveillance manual.

export const LEADERSHIP_GUIDES = [
  {
    id: "pbis-mtss",
    title: "PBIS & MTSS Tier Framework",
    summary:
      "Use school-wide positive and support counts to see whether classrooms are getting enough everyday encouragement before anyone looks at a single hard day.",
    checklist: [
      "Tier 1, universal: look for about 4 or 5 positive logs for every support log. On Behavior Analytics this is the Positive Ratio and the weekday bars for the selected Monday–Friday.",
      "Read the ratio for the whole school first, then open one classroom. A strong school week can still hide one room that needs help.",
      "Tie the teacher’s Class Goal to that same week. The goal counts real positive moments, so the celebration matches the log, not a guess.",
      "Tier 2, targeted: if a classroom’s bars dip for the selected week, schedule a short check-in. Use the mini-chart dates (11/16, 11/17, and so on) to talk about specific days.",
      "Tier 2 support is a plan with the teacher: a greeting routine, a break pass, or a daily positive goal. It is not a write-up based on a chart.",
      "Tier 3, individualized: students with IEP or 504 needs stay with the teacher and the assigned case manager. Your school view shows classroom counts, not a student’s private story.",
      "When a Tier 3 student needs a team meeting, ask the teacher and case manager for the positive-versus-support trend. You do not pull student names into a public leadership slide.",
    ],
    prompts: [],
  },
  {
    id: "coaching",
    title: "Supportive Teacher Coaching",
    summary:
      "A dip in the weekly trend is a coaching conversation, not evidence for a gotcha. Logs exist so teachers can see the week clearly and adjust.",
    checklist: [
      "Open with the week you both can see. Name the dates before you name a worry.",
      "Ask what was happening in the room on the heavy days. Believe the context the chart cannot show: a sub, a drill, a roster change.",
      "Look for missing positives as often as you look at support logs. A low ratio sometimes means the teacher was too busy to record what went well.",
      "Agree on one practice for the next week, not a new program. Check the same weekday bars seven days later.",
      "Never quote a teacher’s logs in a staff meeting, a parent forum, or an evaluation draft. Trends shared widely become surveillance.",
      "If several rooms dip in the same week, fix the school condition (schedule, coverage, a campus incident) before you coach individuals.",
    ],
    prompts: [
      {
        id: "coach-dip",
        title: "Opening a dip without blame",
        text: "I looked at your Monday–Friday bars for this week. Support logs were higher than the weeks around them. I am not treating that as a verdict. What did those days feel like in the room, and where do you want a second set of eyes?",
      },
      {
        id: "coach-goal",
        title: "Using the Class Goal as a shared target",
        text: "Your Class Goal counts real positive moments, same as the Positive Logs card. You are at [number] of [target] for this week. What is one routine that would make the next ten positives natural instead of extra work?",
      },
      {
        id: "coach-practice",
        title: "Choosing one practice for next week",
        text: "Let’s leave with one thing you will try on purpose next week, and the day I should look at the chart with you again. If the bars do not move, we will change the idea, not your effort.",
      },
      {
        id: "coach-protect",
        title: "Protecting a hard week from the rumor mill",
        text: "This week stays between us and your check-in. I will not put your classroom on a comparison list. If someone asks, the answer is that you and I already have a plan and a date to look again.",
      },
    ],
  },
  {
    id: "caseload",
    title: "IEP / 504 & Caseload Governance",
    summary:
      "Case managers should see the students they are assigned, and administrators should see school patterns without opening private notes.",
    checklist: [
      "Assign each IEP or 504 student a case manager in School access. One named person is cleaner than a shared inbox.",
      "School administrators automatically see the school roster, including student names, so they can assign case managers.",
      "Private staff notes and private log entries stay with the teacher. The roster does not include those notes.",
      "Case managers may review non-private logs for their assigned students. Staff-only notes and private entries stay with the classroom team.",
      "For an IEP or 504 meeting, review a 4-week picture: positive and support counts, top behaviors noted, the times or settings where patterns showed up (including what happened right before), the supports already tried and how the student responded, and goal progress.",
      "Write the summary in observable language. “Support logs rose the week of Nov 9, mostly during unstructured time” is useful. Motive and diagnosis are not.",
      "Bring the case manager and the teacher to the meeting. An admin chart is context. It is not the student’s plan.",
    ],
    prompts: [
      {
        id: "iep-summary",
        title: "Requesting an objective meeting summary",
        text: "For the meeting, please bring a 4-week summary of positive and support counts, top behaviors noted, the times or settings where patterns showed up (including what happened right before), the supports we've already tried and how the student responded, plus any goal progress.",
      },
    ],
  },
  {
    id: "rollout",
    title: "10-Minute Staff Rollout Playbook",
    summary:
      "Faculty can leave a short meeting knowing how to join the school, set a Class Goal, and log the day without a second training.",
    checklist: [
      "Minute 1: say why. We are keeping a weekday picture of positive moments and support so coaching is specific and students are not reduced to a referral.",
      "Minute 2: invite teachers and case managers with a school code. Ask them to join before they leave the room.",
      "Minute 3: show one classroom week, Monday through Friday, with dates under the bars. Point out that empty days are zeros, not fake sample numbers.",
      "Minute 4: set a Class Goal people can actually reach this week. A goal that needs a perfect room will be ignored by Friday.",
      "Minute 5: practice one positive log and one support log together. Name the student, the moment, and whether a caregiver should hear about it.",
      "Minute 6: agree on a two-minute routine. End of period or end of day, not “when I remember.”",
      "Minute 7: tell case managers they will only see assigned IEP or 504 students, and that private notes are not part of the admin view.",
      "Minute 8: tell teachers you will not rank rooms in public. A dip starts a conversation with you, not a slide in a faculty meeting.",
      "Minute 9: pick the first check-in date. You will open the same week range with each teacher who wants a look.",
      "Minute 10: leave the invite code, the Class Goal steps, and the name of the person who can reset a password on a half-sheet.",
    ],
    prompts: [
      {
        id: "rollout-close",
        title: "Closing the ten minutes",
        text: "Before you go: join with the code, set a Class Goal you can hit this week, and log one real moment before the bell. I will look at school totals next week, and I will talk to you directly if I have a question about your room.",
      },
    ],
  },
];
