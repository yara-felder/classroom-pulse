# Classroom Pulse & Behavior Support Hub — PRD

## Original problem statement
Create a modern classroom management and behavior support screen. Top bar shows school logo, class section dropdown (e.g., '3rd Grade - Period 2'), and teacher profile. Main area displays student cards with quick-action buttons: a green '+' for 'Positive Skill / Connected', an orange '!' for 'Needs Support', and a 'Quick Log' button. Top right has a toggle Simple View ↔ Detailed Behavior Mode. Bottom navigation: Home, Class Roster, Analytics, Resources.

## User choices (Feb 2026)
- Frontend UI demo with mock data (no backend persistence)
- No AI-powered insights
- Design agent chose the theme (Warm off-white + teal/emerald/amber accents)
- Basic functional Analytics + Resources pages

## Architecture
- Pure React 19 SPA, React Router 7, TailwindCSS + shadcn/ui
- In-memory state via `ClassroomContext`
- Recharts for analytics
- Sonner for toasts
- No FastAPI or MongoDB usage in v1

## Core screens implemented
- **Home**: KPI stat bar, search + filter chips, responsive grid of 8 StudentCards
- **StudentCard**: avatar, status pill, points badge, recent tag, Positive/Support/Log actions; Detailed mode reveals Recent Activity timeline
- **Dialogs**: Positive Skill picker, Needs Support with empathy suggestions + note, Quick Log with tag + parent-digest checkbox
- **Roster**: searchable, IEP badges, mailto: parent contacts
- **Analytics**: KPI tiles, weekly trend bar chart, top-5 leaderboard, per-student breakdown chart, range switch
- **Resources**: 6 curated PBIS/SEL cards with download toast

## Non-blocking observations
- Recharts prints width/height warnings on initial mount before container measures (cosmetic)

## Changelog
- 2026-02: Fixed Manage Periods → Home switcher sync. `AuthContext.updateProfile` now clones the `periods` array so consumers re-render immediately. `ManagePeriodsDialog` tracks newly-added period IDs; on Save it calls `setClassSection` to auto-activate the last new period, toasts "Now viewing: <name>", and scrolls the header switcher into view.
- 2026-02: Force-remount the header period `Select` via `key={periods.map(p => p.id).join('|')}` so newly-added periods appear immediately without any stale Radix value. Relaxed `showSwitcher` to trigger on `periods.length > 1` regardless of school type — previously elementary users could add periods but the dropdown stayed hidden. Verified end-to-end (Demo Teacher + Middle-School flows).
- 2026-10: Multi-period students, standalone IEP/504 trial logging, shared TrialPanel, 30-day demo seed, collapsible skill categories, Parent Digest tab + preview, multi-select Support Cues.
- 2026-10-20: Expanded Pre-assign Skill Goals library to 12 measurable goals per category, moved into shared `data/skillPresets.js` (used by Add + Edit Student dialogs). Chips now use a wrapping flex layout, and each category scrolls on its own (max-h-56, about 6 rows). Checked with a screenshot.
- 2026-10-20: Goal Mastery Criteria. Each Active Skill and IEP/504 goal has `mastery {percent, days}` (default 80%/5). The goal counts as Mastered once the streak of consecutive most-recent logged days at or above the percent reaches the target (`goals/mastery.js`). The editor is a popover in TrialPanel (`goals/MasteryCriteria.jsx`), and the chart shows a dashed "Mastery X%" reference line. Seeded trials for today are now included in history. Changing a target doesn't trigger the Mastered celebration. Tested in iteration_18.
- 2026-10-20: PDF reports now include the trend chart. `lib/goalReportPdf.js` captures it with html2canvas, keeping the date axis and the Mastery line, and centers it at 80% of the page width with a border, below the Summary & Target Metrics block. Below that is a Detailed Trial Log History table with one row per day: date, % independent, the student's support cues that day, and a "Parent notify queued" badge. The table continues onto new pages. The same "Download PDF Report" button (`goals/PdfReportButton.jsx`) is now on Active Skills and IEP/504 goal cards. I rendered the PDFs and checked them.
- 2026-10-20: Full Student Report. A "Full Report" button in the Student Profile header (`FullReportButton.jsx`) downloads one PDF:
  - A cover page with student info, class periods, plan, and an overview table of all goals.
  - One page section per IEP/504 goal, then one per Active Skill, each with summary, chart, and the last 14 logged days.
  - A final Behavior Log page with Parent notify badges.
  - If the Parent Digest tab is open, it switches back to Overview so the charts can be captured.
  - Shared summary helpers are in `lib/goalSummaries.js`. I rendered the PDF and checked it.
- 2026-10-21: Parent Digest configuration, all frontend and with email sending MOCKED:
  - Guardian fields (guardianName, guardianEmail, parentDigestEnabled) in the Add and Edit Student dialogs (`GuardianFields.jsx`). `parentEmail` was renamed to `guardianEmail`.
  - "App Settings" dialog in the teacher menu with a Parent Digest tab: day, time, Automatic Send vs Require Teacher Approval, custom greeting and sign-off. Settings are saved in localStorage `cp_digest_settings`.
  - New /digest page ("Digest" is the 5th bottom-nav item): this week's notifyParent entries grouped by student for the current period, with Email Preview and Send Now / Approve & Send.
  - Sends are recorded in `cp_digest_sends`.
  - In automatic mode, opening the app (or changing the schedule) marks entries queued before the last scheduled time as auto-sent.
  - Tested in iteration_19. I fixed the issues it found: Send Now was enabled with nothing queued, the Roster email link was clickable with no email, and the Sent badge didn't say "Auto-sent".
- 2026-10-21: Quick-log chips refreshed.
  - Positive Skills now has 8 options and Support Needs has 7. Each is a flat card with a title and an action line (shared `ActionChip.jsx`). Domain badges were removed.
  - Entries are logged as "Title (action)".
  - The custom skill form now takes a name and an optional action line, with no category picker.
  - Each support cue has a new person-centered suggestion.
  - Multi-select and the parent digest checkbox are unchanged. Checked with screenshots.
- 2026-10-21: The Weekday Performance charts (Analytics weekly bar chart, student analytics line chart, and the history PDF it captures) now label the X-axis with the current week's Mon–Fri dates as "M/d" (`lib/weekDates.js`). Real logs are counted on the day they happened. Bottom margin is 24, with legend paddingTop added. Verified with screenshots and by rendering the PDF.
- 2026-10-21: Point reset cycles and class goal.
- 2026-10-21: Analytics status columns are now Thriving & Growing / Building Momentum / Focus & Strategy Needed, with the user's subtitles and matching 64px headers.
- 2026-10-21: Onboarding wizard (/onboarding, `components/onboarding/*`). New sign-ups go Setup Profile → wizard. It has 4 steps:
- 2026-10-21: Getting Started checklist card on Home (`GettingStartedCard.jsx`) with 5 steps.
  - Picker-first "Do it" actions for positive, support, IEP trial and digest preview. The goal step highlights the Class Goal bar, and visiting Analytics also completes it.
  - Steps complete when the real action happens anywhere in the app (markChecklist in the context's addPositive/addSupport/logIepTrial and DigestPreviewDialog).
  - Progress is saved per user in localStorage `cp_checklist_<email>`. The card is collapsible and closable, and hides itself once all 5 are done.
- 2026-10-22: The checklist uses guided navigation instead of auto-opening windows. "Show me" sends you to the feature's route; `GuideSpotlight.jsx` then glows the target (`.guide-spotlight`) and shows a bobbing helper pill (kept inside the viewport). The highlight stays until the target is tapped, and clears on route change or when the target leaves the screen.
  - Targets: first Positive / Support button on Home; first trial slot of the first IEP student (their profile opens automatically); the first Email Preview on /digest; the Class Goal bar on /analytics (pill shown below it).
  - Tested in iteration_25, 26 and 27; the final run passed 100%.
- 2026-10-22: Fixed the checklist not showing. The card now appears even when a period has no students, and the profile menu has "Getting started checklist" (menu-show-checklist) to reopen it after it's closed or completed (progress is kept unless all 5 were done). If there are no students, Show me on Positive/Support shows an "Add a student first" toast. Tested in iteration_28 (100%).
- 2026-10-22: RBAC + District Privacy. These rules are enforced in the interface only; there is no backend.
  - `lib/rbac.js` defines Teacher (full access), School Administrator (read-only) and Case Manager (IEP/504 caseload; can log trials and edit goals). The role is picked in Setup Profile (Access Level) or via the "View as (demo)" switcher in the profile menu (`cp_view_as`).
  - Logging, editing, settings, digest and reset controls are gated with `can()`.
  - Admin visibility is set in the Privacy tab of App Settings (`cp_privacy_settings`): Aggregate Only hides names, Full Roster Access is read-only.
  - The Private reflection toggle is in the Positive, Support and Quick Log windows (`notePrivate`). Private notes are stripped from the digest and from other roles, and appear in the Full Report only with the "Include reflection notes" checkbox.
  - A FERPA footer (`lib/ferpa.js` stampFerpa) is on every PDF page, and the notice is in the digest email.
  - Non-teacher sign-ups skip onboarding.
  - Tested in iteration_29 and iteration_30 (100%).



  - Tested in iteration_24 (100%). Added a hint in the IEP picker's empty state.

  1. Class name, which renames the current period, plus point reset cadence.
  2. Roster: quick paste or CSV import (`lib/rosterImport.js`, header detection), with a preview.
  3. Skill presets: the first 2 of each category are pre-checked and get assigned to every imported student.
  4. Digest defaults (Fri 3 PM, Require Approval) plus class goal mode.
  - Skip step, Skip setup, Back, and "Run setup wizard" in the profile menu are all available. The demo teacher skips it.
  - New students get a `createdAt`, and mock history is suppressed through their creation day.
  - The auto class goal uses a starter baseline of 10 per student per week when there's no history.
  - Tested in iteration_23. I fixed its two issues (mock points on new students; mobile footer overflow) and verified the fixes with a screenshot.

  - Thriving: at least 80% positive ratio this cycle (sumRange) and every goal stable or mastered. "Stable" means not Needs Support, and the last 5 days average at least the previous 5 days minus 5.
  - Focus: 3 or more real support logs in the last 48 hours, or an IEP/504 goal in Needs Support.
  - Building: everyone else.
  - The student analytics sheet now uses the same mock source (studentDay), so its numbers match the groups.
  - Each student's mock support frequency now varies, so the demo shows a mix of groups.
  - Tested in iteration_21 and iteration_22 (100%).

  - App Settings has a new Point System tab: reset cadence (weekly default / monthly / manual) and a Class Goal Target, either auto-calculated from a 1–4 week baseline with a Soft/Standard/Challenge adjustment and an explanation of the math, or a custom number.
  - Analytics shows an Active Cycle badge and a Reset Points Now button with a confirmation.
  - Resets clear only `points`. `lifetimePoints`, logs and charts are kept, and `lastResetAt` is stored in localStorage `cp_point_settings`. Balances also reset automatically when a new cycle begins (checked when the app opens and every minute).
  - A Class Goal progress banner appears on Home and Analytics.
  - The Top 5 list was replaced by a Recent Celebrations growth feed (deduped, mixed by milestone type). The ranked list was replaced by a Roster Progress Distribution grouped On Track / In Progress / Needs Support Strategy, based on lifetime points vs support flags.
  - The Student Profile shows Active and Lifetime points.
  - The unused This Week/Month/Period buttons were removed.
  - Class history is deterministic MOCK data (`lib/pointCycle.js`).
  - Tested in iteration_20. I fixed its issues: groups were shifting after a reset, the feed repeated itself, and the range buttons did nothing.




## Backlog
- P2: Real email delivery (Resend + backend) for Parent Digest
- P2: Backend persistence (FastAPI/MongoDB) for students, logs, goals

## Backlog / P1
- Persistence layer (FastAPI + MongoDB)
- Real teacher auth (Emergent Google Auth)
- AI behavior insights (Claude via Emergent LLM key)
- Real printable PDF generation for resource cards
- Parent digest email pipeline (Resend)
- Student profile deep-dive page with timeline

## P2
- Undo last log
- Bulk-award positive to multiple students
- Class comparison analytics

## 2026-10-22 — Resource Preview & Print
- Resources cards open ResourcePreviewModal (Get printable / Get script / Get visual) with letter-size previews for all 6 resources (components/resources/ResourceSheets.jsx).
- Print Resource (window.print) + Save as PDF (html2canvas + jsPDF, letter, 0.5in margins).
- @media print in index.css hides app UI, overlay and modal controls while modal open (body.printing-resource); sheet sized to 7.5in.
- Tested: iteration_31 (90%); close-X stacking and mobile PBIS table overflow fixed afterwards and screenshot-verified.

## 2026-10-22 — ACT & Person-Centered Resources
- Replaced all 6 old resources with 8 ACT / person-centered tools: Values Sort, Choice Point, Thought-Naming & Unhooking, My Support Profile, 5-4-3-2-1 Grounding Cards, Upstander Power Cards, Restorative Harm & Repair Profile, Relational Values Map.
- Category filters: All, Values & Goals, ACT & Mindfulness, Self-Advocacy, Co-Designed Plans (combine with search).
- Each tool has a child-friendly printable sheet with student prompts; PDF export now JPEG (smaller files).
- Tested: iteration_32 (95%); Values Sort mobile overflow + PDF size fixed afterwards and screenshot-verified.

## 2026-10-22 — Parent Digest Copy Refresh
- New warm default intro, empathetic empty-state copy for Celebrations / Mastered / Support notes, "Parent Connection" home block before sign-off, removed numeric (n) counts from section headers (DigestPreviewDialog.jsx). Custom header from Digest Settings still overrides the intro.


## 2026-10-22 — Editable Parent Digest
- DigestPreviewDialog: Teacher Personal Note + editable intro, Celebrations, Mastered, Support, Parent Connection textareas; Reset to Original Draft, Save Edits, Send/Approve.
- Drafts persisted per student in localStorage `cp_digest_drafts` (context: digestDrafts, saveDigestDraft, clearDigestDraft); cleared on send.
- Internal-only "Edited by Teacher" badge in modal header + Digest Queue cards. Sent entries store clean compiled `html` (lib/digestDraft.js compileDigestHtml) with no badges/markers; empty personal note omitted.
- Tested: iteration_33 (100%).

## 2026-10-22 — Weekly Digest Accumulation & Strict Filtering
- Digest built from Mon–Fri current week only (lib/digest.js weekBounds) and strictly `includeInDigest === true` (legacy notifyParent migrated). Logs now persist in localStorage `cp_logs`.
- Drafts store per-field overrides (mergeDraft/diffOverrides) and autosave, so unedited sections keep updating with new logs.
- Preview modal lists all week entries with Include checkboxes (instant update). Student Parent Digest tab shows all week entries with switches + "Sent digest history" archive with View email (clean html).
- Scheduled auto-send compiles html with teacher draft, archives, clears drafts (deduped by id for StrictMode).
- Tested: iteration_34 (40/41); auto-send duplicate fixed afterwards.


## 2026-10-23 — Resource Preview Close Controls
- ResourcePreviewModal: explicit Close button (resource-close-btn, X icon; label hidden on mobile) next to Save as PDF / Print; default corner X hidden. Esc and backdrop click call onClose. Screenshot-verified desktop + 390px.


## 2026-10-23 — Code Review Targeted Fixes
- DOMPurify sanitizes archived digest HTML (ParentDigestTab). ClassroomContext value is a plain object (removed incomplete-deps useMemo → no stale closures); AuthContext value memoized on user.
- Stable keys (SetupProfile progress, ResourceSheets lines, digest footer). Extracted inline props (HomePage TONES/fonts, Analytics chart constants). Remaining eslint-disable lines now carry reasons. Build compiles with 0 warnings.
- Skipped by user choice: large file splits; localStorage encryption / httpOnly cookies (frontend-only demo, no backend).
- Tested: iteration_35 (100%, incl. XSS injection check).




