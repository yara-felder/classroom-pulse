// Values-based school-leadership scripts. They support an administrator's
// conversation. They do not replace mental health care or district safety protocols.

export const CONVERSATION_DISCLAIMER =
  "These scripts support values-based school leadership. They do not replace clinical mental health care, and they do not replace your district's safety or threat-assessment protocols.";

export const CONVERSATION_CATEGORIES = [
  { id: "disrespect", label: "Disrespect & Profanity" },
  { id: "conflict", label: "Peer Conflict & Bullying" },
  { id: "escalation", label: "Emotional Escalation & Shutdown" },
  { id: "avoidance", label: "Academic Avoidance & Dishonesty" },
  { id: "safety", label: "Safety & High-Alert Situations" },
  { id: "reentry", label: "Restorative Re-Entry" },
];

const script = (id, category, title, keywords, validate, values, action, avoidOrProtocol) => ({
  id,
  category,
  title,
  keywords,
  validate,
  values,
  action,
  avoidOrProtocol,
});

const SAFETY_PROTOCOL =
  "Do not handle this through conversation alone. Follow your mandatory school safety and threat-assessment protocols immediately, including counselor notification and guardian notification. Stay with the student until the trained team takes over, and record only what that protocol asks you to record.";

export const CONVERSATION_SCRIPTS = [
  script(
    "disrespect-01",
    "disrespect",
    "Swearing at a teacher in the hallway",
    ["swear", "hallway", "teacher", "profanity", "public"],
    "Lower your voice and step slightly aside. \"I heard the words you used toward Ms. Alvarez. I am not going to match that volume. We can talk right here for one minute.\"",
    "\"In this school adults and students speak so people can stay in the work. Respect is one of the ways we keep the hallway usable for everyone.\"",
    "\"You will tell Ms. Alvarez, with me there, what you were upset about and the words you will use instead next time. Then you return to class.\"",
    "Avoid a public lecture or a sarcasm contest. Name the words, the repair, and the next class period. Do not debate whether the swear 'counted.'"
  ),
  script(
    "disrespect-02",
    "disrespect",
    "\"You can't make me\" after a clear direction",
    ["refusal", "direction", "power struggle", "office"],
    "\"You are upset, and the direction still stands. I am not going to argue about who is in charge.\"",
    "\"Students here get to disagree and still take part in the day. Following a direction is how you stay in class with your people.\"",
    "\"Choose one: walk back and start the task, or sit in the office for ten minutes and then start it. Tell me which one you are taking.\"",
    "Avoid stacking consequences while the student is still deciding. One choice, one follow-through. Do not threaten things you will not do."
  ),
  script(
    "disrespect-03",
    "disrespect",
    "Mocking a staff member in front of peers",
    ["mocking", "peers", "audience", "staff", "laughing"],
    "\"The impression stopped. I am not going to let the class become an audience for that.\" Address the student, not the laughers, first.",
    "\"Being funny matters to you. Using a staff member as the joke costs the trust this class needs.\"",
    "\"You will apologize in person before the next period, and you will tell me one way you can be funny that does not target an adult.\"",
    "Avoid humiliating the student in front of the same audience. Move the repair out of the crowd."
  ),
  script(
    "disrespect-04",
    "disrespect",
    "Profanity in a message shown around class",
    ["text", "message", "phone", "screenshot", "class"],
    "\"I have seen the message. We are not going to pass it around again. Hand me the device for this conversation.\"",
    "\"What you write about people follows them. Kind and direct are both available. Cruel is not how we handle frustration here.\"",
    "\"You will delete or stop sharing the message, tell me who already saw it, and write a one-sentence replacement you could have sent.\"",
    "Avoid reading the profanity aloud to the group. If the message includes a threat or a plan to hurt someone, switch to the safety protocol instead of this conversation."
  ),
  script(
    "disrespect-05",
    "disrespect",
    "Cursing and slamming a door after a consequence",
    ["door", "consequence", "detention", "angry", "office"],
    "Give a short pause if the student is only loud, not unsafe. \"The door stays open. You can be mad and still stay in the room with me.\"",
    "\"You care about being treated fairly. I can hear that. Fair here includes hearing the consequence and leaving the room usable for the next person.\"",
    "\"When your voice is at a talking level, you will restate the consequence in your own words and choose when you will complete it today.\"",
    "Avoid chasing the student down the hall or adding a new consequence for the feeling. Address the slam and the words after they are steady enough to hear you."
  ),
  script(
    "disrespect-06",
    "disrespect",
    "Talking over an adult in the office",
    ["interrupting", "office", "talking over", "volume"],
    "\"I will listen. I need the same in return. I am going to finish one sentence, then it is your turn.\"",
    "\"Being heard matters. So does letting the other person finish. That is how problems actually get solved in this office.\"",
    "\"Tell me the one thing you most want me to understand. Then I will tell you the one decision I am making.\"",
    "Avoid talking louder to win the turn. If the student cannot share the floor after two prompts, pause the meeting and return in twenty minutes."
  ),
  script(
    "disrespect-07",
    "disrespect",
    "Name-calling directed at a substitute",
    ["substitute", "guest teacher", "names", "cover"],
    "\"Mr. Bennett is the teacher in that room today. The names I heard are not how we treat a guest or a colleague.\"",
    "\"This class has a reputation for taking care of people who are new to the room. That is a value worth keeping.\"",
    "\"You will walk back with me, use Mr. Bennett's name, and restart the task he assigned. I will check in before the period ends.\"",
    "Avoid apologizing for the substitute's directions. Repair the respect, and let the assigned work stand."
  ),
  script(
    "disrespect-08",
    "disrespect",
    "A rude comment about a teacher on a school device",
    ["chromebook", "comment", "online", "school device", "post"],
    "\"This was sent on a school device, so I am addressing it now. You are not in trouble for having an opinion. You are here because of how it was said.\"",
    "\"Honest feedback can make a class better. Public insults make it harder for anyone to teach or learn.\"",
    "\"You will take the comment down, and you will tell the teacher one specific concern in a respectful sentence if you still have one.\"",
    "Avoid searching the student's personal accounts. Stay with the school device and the comment that reached the classroom."
  ),
  script(
    "disrespect-09",
    "disrespect",
    "A nickname meant to embarrass a classmate",
    ["nickname", "embarrass", "name", "teasing"],
    "\"We use the name a person asks us to use. I heard a nickname that was meant to get a laugh at their expense.\"",
    "\"Belonging matters in this building. People get to be here without a joke attached to their name.\"",
    "\"You will use their actual name for the rest of the day, and you will check with them, with me nearby, that the nickname stops.\"",
    "Avoid forcing a long public apology if the classmate wants space. Ask the classmate what repair they want. If the nickname targets identity or keeps happening, treat it as bullying and document the pattern."
  ),
  script(
    "disrespect-10",
    "disrespect",
    "Eye-rolling and \"whatever\" through a whole meeting",
    ["whatever", "shutdown", "meeting", "dismissive", "parent"],
    "\"I can see you would rather be anywhere else. You can feel that way and still stay in the conversation for five minutes.\"",
    "\"People take you more seriously when your words and your tone match. You have something to say. I want the version I can act on.\"",
    "\"Give me one sentence about what you want to be different tomorrow. We will write it down and share it with your teacher.\"",
    "Avoid calling the student disrespectful as the whole meeting. Name the tone once, then move to the request."
  ),
  script(
    "conflict-01",
    "conflict",
    "Argument over roles in a group project",
    ["group", "project", "roles", "argument", "class"],
    "Separate them from the audience. \"You both want this project to be fair. I am going to hear each of you for one minute without the other interrupting.\"",
    "\"Doing good work and being a reliable teammate both matter. The grade is shared, so the plan has to be something you can both live with.\"",
    "\"Write who does which part before the end of lunch. If you cannot agree, the teacher assigns the parts and they stand.\"",
    "Avoid deciding who is the 'good' partner from the louder story. If one student is being shut out of every group, look at the pattern, not just today."
  ),
  script(
    "conflict-02",
    "conflict",
    "A student is left out at lunch every day",
    ["lunch", "exclusion", "left out", "table", "friends"],
    "Meet the student privately first. \"Thank you for telling me. Being left out hurts, and you should not have to sit alone to get through lunch.\"",
    "\"This school works when people have a place to belong. You deserve a table where you are welcome.\"",
    "\"For the next week you will have a planned seat with two classmates who agreed to include you, and I will walk through lunch on those days.\"",
    "Avoid a public call-out of the whole table. Speak to the students who are organizing the exclusion, name the behavior, and set a clear stop. Document repeated exclusion as bullying."
  ),
  script(
    "conflict-03",
    "conflict",
    "A rumor moving through a group chat",
    ["rumor", "group chat", "gossip", "reputation"],
    "\"A story about you is being passed around. I am not going to repeat the details in the office for an audience. I want it to stop.\"",
    "\"People's names and private lives are not content. Protecting someone's dignity is part of how we treat each other.\"",
    "\"You will stop forwarding it, tell me who is still sharing it, and send one correction if something false already went out.\"",
    "Avoid making the targeted student recount the rumor to every person involved. If the rumor is sexual or threatening, follow your safety and guardian-notification protocol."
  ),
  script(
    "conflict-04",
    "conflict",
    "A shove at recess with two different stories",
    ["shove", "recess", "two stories", "playground"],
    "See any injury first. \"I am going to hear both of you. Hands stay down while we talk.\"",
    "\"Recess is for playing hard and still sending everyone back inside safe. Winning an argument is not worth someone getting hurt.\"",
    "\"Each of you will say what your body will do instead if this starts again, and you will spend the next recess in separate areas.\"",
    "Avoid a joint meeting if either student is afraid. If the shove was one-sided, repeated, or someone was injured, document it and notify families under your bullying and safety rules."
  ),
  script(
    "conflict-05",
    "conflict",
    "Mean comments in the locker area",
    ["locker", "comments", "bystander", "hallway"],
    "\"Someone told me the comments near the lockers have been steady. I believe that pattern, and it stops today.\"",
    "\"People should be able to get their things and get to class without being ranked or mocked. That is a basic part of respect here.\"",
    "\"You will use names kindly in that hallway. A staff member will stand there at passing time this week, and I will check with the student who was targeted.\"",
    "Avoid revealing the bystander's name. Thank them privately. Keep the follow-up on the behavior, not on who 'snitched.'"
  ),
  script(
    "conflict-06",
    "conflict",
    "Fallout after a sports tryout",
    ["tryout", "team", "sports", "jealous", "bench"],
    "\"Making or missing the team brought up a lot. The comments afterward crossed into targeting a teammate.\"",
    "\"Competing hard and staying loyal to the people in the program can both be true. Tearing someone down is not part of representing the school.\"",
    "\"You will speak to the teammate with the coach and me, and you will sit out the next contest if the comments continue.\"",
    "Avoid overruling the coach's roster. Address the conduct. Let the coach keep the playing decision."
  ),
  script(
    "conflict-07",
    "conflict",
    "An older student taking a younger student's things",
    ["older", "younger", "taking things", "belongings"],
    "Return the item if you can do that calmly. \"Taking someone's things to get a reaction is not a joke once they are scared.\"",
    "\"Younger students count on older students to make this building feel safe. That is a leadership role, not a free pass.\"",
    "\"You will give the item back, walk them to class, and check in with me tomorrow so I know it did not happen again.\"",
    "Avoid treating a size or age difference as harmless teasing. If items are being taken repeatedly, notify both families and document the pattern."
  ),
  script(
    "conflict-08",
    "conflict",
    "A social media post made off campus that landed in class",
    ["social media", "off campus", "post", "class disruption"],
    "\"I am not policing your evening. I am addressing the fact that this post walked into class and students cannot focus.\"",
    "\"What you publish can protect people or hurt them. At school we repair harm that shows up in the building.\"",
    "\"You will stop discussing the post in class, and you will meet with the student who was named if they want that meeting.\"",
    "Avoid demanding passwords or punishing lawful off-campus speech that never reached school. If the post threatens harm, switch to the safety protocol."
  ),
  script(
    "conflict-09",
    "conflict",
    "A friend group icing one student out",
    ["friend group", "silent treatment", "exclusion", "clique"],
    "\"The silent treatment is still a behavior. You do not have to be close friends. You do have to stop organizing other people against one student.\"",
    "\"Loyalty to your friends does not require pushing someone out of class, lunch, or a group chat. Kindness can be ordinary.\"",
    "\"For two weeks you will not message about them as a group, and each of you will work with them once in class without commentary.\"",
    "Avoid forcing a friendship. Require an end to the exclusion. Check back with the student who was iced out, privately."
  ),
  script(
    "conflict-10",
    "conflict",
    "Name-calling that has happened more than once",
    ["repeated", "name-calling", "pattern", "bullying"],
    "\"This is the second time this name has been used. Once can be a bad moment. A repeat is a pattern, and I am treating it that way.\"",
    "\"Every student gets to walk through this school without a label. Respect is not optional because you are annoyed.\"",
    "\"The name stops today. You will write what you will say instead, and your family will hear about the pattern from me.\"",
    "Avoid a warning that sounds like the first time. Name the repetition, notify families according to your bullying procedure, and set a check-in date."
  ),
  script(
    "escalation-01",
    "escalation",
    "Crying in the office and unable to speak",
    ["crying", "quiet", "office", "overwhelmed"],
    "Offer water and a seat facing away from the door window. \"You do not have to talk yet. I am going to sit here. Nod when you want me to ask a short question.\"",
    "\"You matter in this building even on a day when words are hard. We can go slowly and still take care of what you need.\"",
    "\"When you are ready, tell me if you need a few more minutes, a call home, or help telling your teacher why you left.\"",
    "Avoid rapid questions or sending them back while they still cannot speak. If they mention hurting themselves or not being safe at home, move to the safety protocol."
  ),
  script(
    "escalation-02",
    "escalation",
    "Head down and no response after a referral",
    ["head down", "silent", "referral", "won't talk"],
    "\"I can see you are done talking. I will not fill the silence with a speech. I will ask one yes-or-no question in a minute.\"",
    "\"Staying in school on a hard day is already something. I want the next step to be one you can actually do.\"",
    "\"Tap the desk for 'I need a break' or look up for 'I can talk.' Then we pick a return time to class.\"",
    "Avoid interpreting silence as defiance and adding consequences for not answering. Give a dignified way to respond."
  ),
  script(
    "escalation-03",
    "escalation",
    "Pacing and a raised voice after a failed test",
    ["test", "pacing", "failed", "grade", "voice"],
    "Clear extra people out. \"The grade landed hard. Walk with me to the end of the hall, or sit. Your choice. The yelling at the doorway stops.\"",
    "\"You care about doing well. That care is a strength. We can look at the test without tearing up the rest of the day.\"",
    "\"After you are at a talking voice, you will tell the teacher one part you want to retry and when you will do it.\"",
    "Avoid debating the grade in the hallway. Save the academic plan for when their body has settled."
  ),
  script(
    "escalation-04",
    "escalation",
    "Sitting in the hallway and refusing to go back in",
    ["hallway", "won't enter", "class", "doorway"],
    "Sit or crouch to their level, not over them. \"You left. You are safe here for a few minutes. I will not drag you in.\"",
    "\"Getting back to the work you signed up for is worth doing, even if the last ten minutes were rough.\"",
    "\"In five minutes you walk in with me, take your seat, and start the first problem only. I will tell the teacher that is the plan.\"",
    "Avoid an audience of passing classes. If they say the room does not feel safe because of another student, separate the students before the return."
  ),
  script(
    "escalation-05",
    "escalation",
    "\"I don't care\" after a friend conflict",
    ["i don't care", "friends", "shutdown", "shrug"],
    "\"'I don't care' usually means this got too big. I believe you are hurt even if those are the words you have.\"",
    "\"Friendship matters to you. We do not have to solve the friendship today. We do have to get you through the next class.\"",
    "\"Pick a person you can sit near this period who is not part of the fight, and a time today when we check in for two minutes.\"",
    "Avoid insisting they admit they care. Offer the next small step and leave the friendship repair for later."
  ),
  script(
    "escalation-06",
    "escalation",
    "Overwhelmed by a sudden schedule change",
    ["schedule", "assembly", "change", "routine", "unexpected"],
    "\"The assembly changed your day, and that threw you. We can make the next hour predictable again.\"",
    "\"You work hard when you know what is coming. We can honor that and still be at school for a different kind of day.\"",
    "\"Here is the rest of today on a card: where you go, who you sit with, and when it ends. You keep the card.\"",
    "Avoid surprising them with another change. Tell the teacher the plan so the student is not quizzed about it at the door."
  ),
  script(
    "escalation-07",
    "escalation",
    "Breathing fast and asking to go home",
    ["go home", "breathing", "panic", "nurse", "call"],
    "\"You want out of here. Let's slow your breathing with me for thirty seconds before we decide. In through the nose, out through the mouth.\"",
    "\"Getting through a hard hour is a brave thing. Going home is not the only way to be taken seriously.\"",
    "\"We will call home if you still need that after you have had water and ten quiet minutes. If you stay, you start in the counselor's waiting area, not straight back to the crowd.\"",
    "Avoid promising they can leave before you know they are safe. If they mention self-harm, do not send them home as the plan. Use the safety protocol."
  ),
  script(
    "escalation-08",
    "escalation",
    "Refusing to enter after a hard morning at home",
    ["morning", "won't come in", "arrival", "car line"],
    "Meet them where they stopped. \"Rough start. You do not have to tell me the details to come inside. The office is the first stop, not the classroom.\"",
    "\"Showing up still counts. We can protect your morning and get you to the smallest next step.\"",
    "\"Ten minutes in the office, then first period with a pass that says you were with me. No one asks you to explain.\"",
    "Avoid questioning them in the parking lot. If they disclose harm at home, follow your mandated reporting and guardian-notification rules rather than this re-entry plan."
  ),
  script(
    "escalation-09",
    "escalation",
    "Tore up work and then went quiet",
    ["tore up", "paper", "quiet", "frustration", "assignment"],
    "Leave the pieces for a moment. \"The work hit a wall. You are still welcome in the room. We will not make a scene out of the paper.\"",
    "\"You want to get things right. Ripping it up told me it felt impossible, not that you have nothing to offer.\"",
    "\"You will tape one page back together or start a half-page version. Tell me which one. I will tell the teacher the goal is completion, not perfection.\"",
    "Avoid a consequence for the feeling that outruns the harm. If they destroyed another student's work, include repair to that student."
  ),
  script(
    "escalation-10",
    "escalation",
    "Asking to sit somewhere quiet before they \"lose it\"",
    ["break", "quiet", "lose it", "asked for help", "pass"],
    "\"Thank you for saying it early. That was the right move. The quiet seat is available.\"",
    "\"Asking for help before a blow-up is exactly the kind of responsibility we want. We will back that choice.\"",
    "\"You get fifteen minutes in the agreed spot, then you return with one problem started. I will let the teacher know you used the plan.\"",
    "Avoid treating the request as avoidance. Honor it, time it, and return them. If they ask every period, meet with the teacher about a standing plan rather than sending them away informally."
  ),
  script(
    "avoidance-01",
    "avoidance",
    "Answers copied during a quiz",
    ["cheating", "quiz", "copied", "answers", "test"],
    "Speak privately. \"I saw the answers move from their paper to yours. I am going to assume you wanted a grade you could be proud of, and this is not that.\"",
    "\"Honesty is how your grade means something, including to you. We can retake the learning. We cannot pretend this quiz was yours.\"",
    "\"The quiz is void. You will complete an alternate version with the teacher after school, and you will tell them what felt too hard to do alone.\"",
    "Avoid a public accusation. Do not make the other student the villain if they did not offer the answers. Follow your academic honesty steps with families."
  ),
  script(
    "avoidance-02",
    "avoidance",
    "A pattern of missing work and changing stories",
    ["missing work", "homework", "excuse", "pattern"],
    "\"I have heard a few different reasons this week. I am less interested in the last story and more interested in the missing work.\"",
    "\"You are capable of the work in this class. Turning it in is how you stay in good standing with yourself and your teacher.\"",
    "\"List the three missing pieces. Circle the one you will finish before tomorrow. The teacher will check that one only, first.\"",
    "Avoid a lecture about responsibility in the abstract. Shrink the pile until a start is possible."
  ),
  script(
    "avoidance-03",
    "avoidance",
    "Work the student says they turned in",
    ["turned it in", "lost work", "inbox", "gradebook"],
    "\"Your teacher does not have it. That is frustrating if you did the work. We will look in the obvious places together before we decide it is gone.\"",
    "\"Following through includes being able to show the work. That protects you as much as it helps the teacher.\"",
    "\"Check your bag, the online folder, and email. If it is not there, you redo the short version tonight and send it to both of us.\"",
    "Avoid calling the student a liar on a first mismatch. If the claim keeps happening, name the pattern and require work to be submitted in a shared place."
  ),
  script(
    "avoidance-04",
    "avoidance",
    "Joking their way out of reading aloud",
    ["reading aloud", "joke", "avoid", "literacy", "embarrassment"],
    "\"The joke got you out of the paragraph. I am not going to make you read in front of everyone to prove a point.\"",
    "\"Learning to read hard text matters for the future you want. We can practice that without an audience.\"",
    "\"You will read the same paragraph to me or the teacher, quietly, before the end of the day. Then the class version can be optional.\"",
    "Avoid forcing a public read that confirms the fear. Also avoid letting the joke erase the practice entirely."
  ),
  script(
    "avoidance-05",
    "avoidance",
    "A phone out to look up answers",
    ["phone", "look up", "answers", "device"],
    "\"Phone on the desk, face down. Looking up the answer skipped the thinking the assignment was for.\"",
    "\"You want to get it right. The value in this class is the thinking, not a perfect score from a search.\"",
    "\"The phone stays in the office pocket until the end of the period. You finish the item in your own words before you leave.\"",
    "Avoid scrolling the phone for unrelated content. Take only what the academic task requires, and follow your device policy."
  ),
  script(
    "avoidance-06",
    "avoidance",
    "\"This class is stupid\" and the work never starts",
    ["this class is stupid", "won't start", "refusal", "bored"],
    "\"You do not like this assignment. You can think it is pointless and still start problem one. I will not argue about whether the class is stupid.\"",
    "\"Finishing hard things is how you keep choices open later, including the ones that are not this worksheet.\"",
    "\"Set a timer for eight minutes. Do the first three items. Then tell the teacher which part actually felt pointless so they can hear it.\"",
    "Avoid a debate about the merit of the subject. Get a start, then carry the real feedback back to the teacher."
  ),
  script(
    "avoidance-07",
    "avoidance",
    "A forged caregiver signature",
    ["forged", "signature", "permission", "form"],
    "\"This signature does not match. I am going to treat this as you wanting the form to be done, and also as something we have to correct.\"",
    "\"Honesty with your family and with the school is how permission actually works. A form only counts if the right person signed it.\"",
    "\"We will call your caregiver together, explain the form, and have them sign a new copy. The trip or privilege waits until that happens.\"",
    "Avoid covering for the student to spare them the call. The caregiver needs to know. Keep the tone corrective, not shaming."
  ),
  script(
    "avoidance-08",
    "avoidance",
    "Hiding a low score from caregivers",
    ["hiding", "grade", "report", "family", "low score"],
    "\"You did not want them to see the score. That makes sense if you were worried about their reaction. The score is still real.\"",
    "\"Being honest at home lets people help you. Hiding it adds stress on top of the grade.\"",
    "\"You will tell them today with me on the call or in the meeting, and you will bring one plan for raising the grade. I will stay for the hard part.\"",
    "Avoid surprising a family with a pile of past failures if you promised the student a supported conversation. Do what you said you would do."
  ),
  script(
    "avoidance-09",
    "avoidance",
    "Skipped class and said they were in the library",
    ["skipped", "library", "whereabouts", "cutting"],
    "\"You were not in class, and the library log does not show you. I need the plain version of where you were.\"",
    "\"People trust you more when your story matches what happened. Trust is what lets you have freedom on this campus.\"",
    "\"You will make up the missed task after school and check in at the classroom door for the next three days before the bell.\"",
    "Avoid a trap question if you already know where they were. Say what you know. If they left campus, follow your attendance and safety procedure."
  ),
  script(
    "avoidance-10",
    "avoidance",
    "Work that does not look like their own",
    ["plagiarism", "not their work", "essay", "copied"],
    "\"This writing does not sound like the writer I have heard in class. I am not accusing you in front of anyone. I want to understand what happened.\"",
    "\"Your real voice is worth more than a perfect paragraph someone else wrote. Teachers can help the real voice. They cannot grade a voice that is not yours.\"",
    "\"You will rewrite the middle paragraph here with me, in your own words. The teacher will grade that version and note the original as not accepted.\"",
    "Avoid running the paper through a public shaming. Follow the academic honesty steps. Offer a chance to show what they actually know."
  ),
  script(
    "safety-01",
    "safety",
    "A student says they want to hurt themselves",
    ["self-harm", "suicide", "hurt myself", "don't want to be here"],
    "Stay with them. \"Thank you for telling me. You are not in trouble for saying this. I am staying with you, and I am getting the people who keep students safe.\"",
    "Skip a values lesson. If they can hear one sentence: \"You matter here, and we get help right now.\"",
    "Call the counselor or crisis lead immediately. Do not send the student back to class or leave them alone. Clear extra students from the room.",
    SAFETY_PROTOCOL
  ),
  script(
    "safety-02",
    "safety",
    "A threat to beat up a specific classmate after school",
    ["threat", "after school", "beat up", "fight", "target"],
    "\"I am taking that sentence seriously. You will stay with me. The other student will not be left to find out at the bell.\"",
    "Do not pivot into a character lesson yet. \"Hurting them is not an option. The next step is the safety plan, not a debate.\"",
    "Name the targeted student to the team. Hold the student who made the threat. Arrange a safe dismissal for the other student and notify both families.",
    SAFETY_PROTOCOL
  ),
  script(
    "safety-03",
    "safety",
    "A comment about a weapon or something dangerous in a bag",
    ["weapon", "bag", "knife", "gun", "dangerous"],
    "Stop the search yourself if you are not the person your protocol names. \"We are not opening bags as a group. You are staying here with me while I call for help.\"",
    "Do not use this moment for a values conversation. Safety staff lead from here.",
    "Call the threat-assessment lead and follow the search procedure your district already trained. Move other students away calmly.",
    SAFETY_PROTOCOL
  ),
  script(
    "safety-04",
    "safety",
    "Shoving that does not stop when an adult asks",
    ["shove", "won't stop", "physical", "aggression", "help"],
    "Send a student or radio for another adult. Use only the words and space your training allows. \"Hands off. Step back. More help is coming.\"",
    "There is no values talk while hands are still on another student.",
    "Separate them only in the way you have been trained. Get medical attention if anyone is hurt. Hand both students to the team that handles physical incidents.",
    SAFETY_PROTOCOL
  ),
  script(
    "safety-05",
    "safety",
    "\"I don't want to go home\" because they are scared",
    ["don't want to go home", "scared", "home", "dismissal", "caregiver"],
    "\"Thank you for telling me before dismissal. You will not be put in a car while we are still figuring out how to keep you safe.\"",
    "\"You deserve to be safe after school as well as during it. The adults who are supposed to protect you need to be in this conversation.\"",
    "Keep the student with a counselor or administrator. Follow mandated reporting and your guardian-notification rules. Do not interview them alone for details beyond what the protocol asks.",
    SAFETY_PROTOCOL
  ),
  script(
    "safety-06",
    "safety",
    "A verbal threat toward a staff member",
    ["threat", "staff", "teacher", "going to get you"],
    "\"That is a threat, and I am treating it as one. The staff member will not be left to manage this alone.\"",
    "Do not ask the staff member to conference it away in the moment.",
    "Move the student to a supervised office. Notify the threatened staff member's supervisor and the threat-assessment team. Arrange coverage so the adult is not alone with the student.",
    SAFETY_PROTOCOL
  ),
  script(
    "safety-07",
    "safety",
    "Talk of a plan to harm the school",
    ["school threat", "plan", "shoot", "bomb", "harm the school"],
    "\"I hear a plan to hurt people at school. This conversation stops being private right now. You are staying with me.\"",
    "Do not explore the plan, ask for details out of curiosity, or promise confidentiality.",
    "Notify the threat-assessment lead and law-enforcement contact your policy names. Account for the student. Follow lockdown or hold directions if the team gives them.",
    SAFETY_PROTOCOL
  ),
  script(
    "safety-08",
    "safety",
    "A fight already in progress",
    ["fight", "physical", "crowd", "break up"],
    "Clear the crowd with a loud, simple direction. Call for help before you move in. \"Back up. Office is on the way.\"",
    "No lesson lands while a fight is happening. The value in the moment is that everyone leaves without a worse injury.",
    "Follow your trained steps for stopping a fight. Send injured students to the nurse. Hold both students separately for the safety team.",
    SAFETY_PROTOCOL
  ),
  script(
    "safety-09",
    "safety",
    "A student reports that a peer talked about suicide",
    ["peer", "suicide", "report", "friend said"],
    "\"You did the right thing by telling an adult. I am going to find them now. You can stay with a counselor if you are shaken.\"",
    "Thank them for protecting a classmate. Do not ask them to go check on the peer themselves.",
    "Locate the student who was named and stay with them. Start the same self-harm response you would if you had heard it directly. Tell the reporting student only that adults are helping.",
    SAFETY_PROTOCOL
  ),
  script(
    "safety-10",
    "safety",
    "A student is missing after leaving campus upset",
    ["missing", "left campus", "elopement", "whereabouts", "upset"],
    "\"We do not have eyes on them. The search starts now. I need last location, clothing, and who they were with.\"",
    "Do not spend the first minutes on why they were upset. Location comes first.",
    "Start your missing-student procedure: search team, call the guardian, notify the safety lead, and follow the timeline for law enforcement. Hold classmates who have information in the office.",
    SAFETY_PROTOCOL
  ),
  script(
    "reentry-01",
    "reentry",
    "First morning back after a suspension for a fight",
    ["suspension", "fight", "return", "morning", "re-entry"],
    "Meet them before first period, not at the classroom door in front of peers. \"You are back. The fight is not the whole story of today.\"",
    "\"Coming back is a chance to be the teammate and student you said you wanted to be in the re-entry meeting.\"",
    "\"You will check in with me at the start and end of the day. You and the other student have separate passing routes this week.\"",
    "Avoid a welcome that skips the plan, and avoid a lecture that relives the fight. Confirm the family knows the return conditions."
  ),
  script(
    "reentry-02",
    "reentry",
    "Back the day after a classroom outburst",
    ["outburst", "next day", "return to class", "teacher"],
    "\"Yesterday was loud. Today is a new start with a short plan, not a replay.\"",
    "\"You told us you care about staying in class. This plan is how we help you do that.\"",
    "\"Walk in with the teacher, apologize in one sentence, and use the break pass if you feel the volume rising. I will ask the teacher how the hour went.\"",
    "Avoid making the student retell the outburst to the class. A brief repair to the teacher is enough."
  ),
  script(
    "reentry-03",
    "reentry",
    "Re-entry meeting after disrespect toward a teacher",
    ["repair", "teacher", "meeting", "apology", "disrespect"],
    "Set the order before anyone speaks. \"Student starts with what happened and what they want to be different. Teacher responds with the impact. I keep it to ten minutes.\"",
    "\"Respect is how this classroom keeps working. Both of you deserve a room where that is normal again.\"",
    "\"Agree on the first class period back, where the student sits, and the sentence they will use if they disagree with a direction.\"",
    "Avoid letting the meeting become a second discipline hearing. The consequence already happened. This meeting is the return."
  ),
  script(
    "reentry-04",
    "reentry",
    "Returning from in-school suspension",
    ["in-school", "ISS", "return", "schedule"],
    "\"You finished the day in ISS. Your schedule is yours again, starting with second period so arrival is quiet.\"",
    "\"You said you wanted your regular day back. Showing up on time and starting the work is how you keep it.\"",
    "\"Carry this pass. Check in with your third-period teacher that you have the missing work list. See me at dismissal.\"",
    "Avoid a victory lap or a cold shoulder. Make the return ordinary and supervised."
  ),
  script(
    "reentry-05",
    "reentry",
    "A repair conversation with the peer who was hurt",
    ["repair", "peer", "apology", "harm", "restorative"],
    "Ask the harmed student first, privately, whether they want a conversation. \"You do not have to sit in a room with them. There are other ways to repair.\"",
    "\"If we meet, the point is responsibility and a safer week, not forcing you two to be friends.\"",
    "\"The student who caused the harm names what they did, asks what would help, and agrees to one concrete change. I write it down.\"",
    "Avoid a joint meeting when the harmed student is afraid or when the incident is still under a safety plan. Repair never outranks safety."
  ),
  script(
    "reentry-06",
    "reentry",
    "Back after time away that included behavior at home",
    ["absence", "family", "return", "private"],
    "\"I know the days away were heavy. You do not owe the class an explanation. We only need a plan for today.\"",
    "\"Being here is enough of a start. We can protect your privacy and still help you catch up.\"",
    "\"Pick the one class to re-enter first. I will give the other teachers a pass that says 'excused, catching up,' with no story attached.\"",
    "Avoid sharing family details with staff who do not need them. If the time away included a safety concern, confirm the counselor has already cleared the return."
  ),
  script(
    "reentry-07",
    "reentry",
    "Rejoining class after being removed for one period",
    ["removed", "same day", "return", "period"],
    "\"You can go back this period. We will enter during work time, not during the lecture, so it is quiet.\"",
    "\"Finishing the hour with your class is the goal. One calm return counts.\"",
    "\"You sit in the agreed seat, start the worksheet, and save any disagreement for me after class.\"",
    "Avoid a doorway negotiation with an audience. If the teacher needs a longer break from the student, honor that and find a supervised workspace instead."
  ),
  script(
    "reentry-08",
    "reentry",
    "Planning the week back from a short placement",
    ["placement", "transition", "first week", "check-in"],
    "\"The placement is over. This week has more support than a normal week, on purpose, and then we fade it.\"",
    "\"You told the placement staff what kind of student you want to be. We will use that sentence as the check-in question.\"",
    "\"Daily check-in person, a card for breaks, and a Friday review with you and your caregiver. Put the three on the calendar before you leave my office.\"",
    "Avoid dropping all support on day one or keeping a full escort forever. Name what fades and when."
  ),
  script(
    "reentry-09",
    "reentry",
    "Welcome back after a bullying consequence",
    ["bullying", "consequence", "return", "targeted student"],
    "\"You are allowed to return. The student you targeted is allowed to feel safe. Both of those are the plan.\"",
    "\"Leadership in this building means the people around you are safer because you are here, not more careful.\"",
    "\"Review the no-contact spots, the words that are finished, and who you tell if you are tempted to send a message. I will also check with the other student separately.\"",
    "Avoid a joint welcome. Do not ask the targeted student to reassure the student who harmed them."
  ),
  script(
    "reentry-10",
    "reentry",
    "Naming a check-in person for the first week back",
    ["check-in", "adult", "first week", "anchor"],
    "\"Pick an adult you will actually talk to. If the first name is uncomfortable, we choose another. The point is a real check-in, not a name on a form.\"",
    "\"Having one steady person is how students get through a bumpy return. You do not have to retell the story to every teacher.\"",
    "\"You will see that adult at the start of day one and day three. They will ask only: How are you arriving, and what do you need today?\"",
    "Avoid assigning an adult the student does not trust. Tell that adult the question to ask so the check-in stays short and predictable."
  ),
];
