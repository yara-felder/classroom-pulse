import React from "react";

const F = { fontFamily: "Outfit" };

const Line = ({ label }) => (
  <div className="flex items-end gap-2 text-[11px] text-slate-600">
    {label && <span className="font-semibold whitespace-nowrap">{label}</span>}
    <span className="flex-1 border-b border-slate-400 h-3" />
  </div>
);

const LINE_IDS = ["l1", "l2", "l3", "l4", "l5", "l6"];

const Lines = ({ n }) => (
  <div className="space-y-3 mt-2">{LINE_IDS.slice(0, n).map((id) => <Line key={id} />)}</div>
);

const SheetTitle = ({ title, subtitle }) => (
  <div className="border-b-2 border-slate-800 pb-2 mb-4">
    <h2 className="text-2xl font-extrabold text-slate-900" style={F}>{title}</h2>
    <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    <div className="mt-2 max-w-xs"><Line label="My name" /></div>
  </div>
);

const Prompt = ({ title, tone = "border-slate-200 bg-slate-50", children }) => (
  <div className={`border rounded-xl p-3 ${tone}`}>
    <p className="text-sm font-bold text-slate-900" style={F}>{title}</p>
    {children}
  </div>
);

const VALUES = [
  ["Brave", "I try hard things"], ["Kind", "I care for others"], ["Focused", "I stick with my work"],
  ["Creative", "I make new ideas"], ["Honest", "I tell the truth"], ["Curious", "I ask questions"],
  ["Fair", "I take turns and share"], ["Helpful", "I lend a hand"], ["Patient", "I can wait and try again"],
  ["Respectful", "I listen and use kind words"], ["Funny", "I bring joy"], ["Responsible", "I do my part"],
];

const ValuesSortSheet = () => (
  <>
    <SheetTitle title="My Personal Values Sort" subtitle="Cut out the cards. Sort them into 'Really me', 'Sometimes me' and 'Not yet'. Then circle your top 3." />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {VALUES.map(([v, d]) => (
        <div key={v} className="border-2 border-dashed border-amber-400 rounded-xl p-3 bg-amber-50/60 text-center min-w-0">
          <p className="text-base sm:text-lg font-extrabold text-amber-900 break-words" style={F}>{v}</p>
          <p className="text-[11px] text-slate-700 mt-0.5">{d}</p>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-3 mt-5">
      {["Really me", "Sometimes me", "Not yet"].map((p) => (
        <div key={p} className="border-2 border-slate-300 rounded-xl h-24 p-2 min-w-0">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-500 break-words">{p}</p>
        </div>
      ))}
    </div>
    <div className="mt-4 space-y-3">
      <Line label="My top 3 values are" />
      <Line label="One way I can show one of them today" />
    </div>
  </>
);

const MoveCol = ({ title, sub, tone, examples }) => (
  <div className={`rounded-2xl border-2 p-3 ${tone}`}>
    <p className="text-lg font-extrabold" style={F}>{title}</p>
    <p className="text-[11px] text-slate-600">{sub}</p>
    <ul className="text-[11px] text-slate-700 list-disc pl-4 mt-2 space-y-0.5">{examples.map((e) => <li key={e}>{e}</li>)}</ul>
    <p className="text-[11px] font-semibold mt-3">My {title.toLowerCase()}:</p>
    <Lines n={3} />
  </div>
);

const ChoicePointSheet = () => (
  <>
    <SheetTitle title="The Choice Point" subtitle="When something hard shows up, I can pause and choose my next move." />
    <Prompt title="1. What is happening? (the hard moment)" tone="border-slate-300 bg-white"><Lines n={1} /></Prompt>
    <div className="my-3">
      <Prompt title="2. What thoughts and feelings showed up?" tone="border-sky-200 bg-sky-50/60"><Lines n={1} /></Prompt>
    </div>
    <div className="flex justify-center my-2">
      <span className="text-xs font-bold uppercase tracking-wider bg-slate-900 text-white rounded-full px-4 py-1.5">Pause - breathe - choose</span>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <MoveCol title="Away Moves" sub="Moves that take me away from who I want to be" tone="border-rose-300 bg-rose-50/60 text-rose-900"
        examples={["Shutting down or hiding", "Avoiding the task", "Yelling or walking off"]} />
      <MoveCol title="Toward Moves" sub="Moves that take me toward my values" tone="border-emerald-300 bg-emerald-50/60 text-emerald-900"
        examples={["Asking for help", "Trying one small step", "Taking a calm break, then returning"]} />
    </div>
    <div className="mt-3">
      <Prompt title="3. My value right now is..." tone="border-amber-200 bg-amber-50/60"><Lines n={1} /></Prompt>
    </div>
  </>
);

const HOOKS = [
  ["Notice it", "\"Hmm, a tough thought is here.\""],
  ["Name it", "\"I'm having the thought that math is too hard.\""],
  ["Thank your mind", "\"Thanks, mind. You're trying to protect me.\""],
  ["Unhook", "Picture the thought on a leaf floating down a stream."],
  ["Choose", "\"What would a brave, focused me do next?\""],
];

const ThoughtNamingSheet = () => (
  <>
    <SheetTitle title="Thought-Naming & Unhooking" subtitle="Thoughts are words and pictures in my mind. I can notice them without getting stuck." />
    <div className="space-y-2">
      {HOOKS.map(([step, say], i) => (
        <div key={step} className="flex gap-3 items-start border border-sky-200 rounded-xl p-3 bg-sky-50/50">
          <span className="w-7 h-7 shrink-0 rounded-full bg-sky-600 text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
          <div>
            <p className="text-sm font-bold text-sky-900">{step}</p>
            <p className="text-xs text-slate-700">{say}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-3 mt-4">
      <Prompt title="Hooked thought" tone="border-rose-200 bg-rose-50/60">
        <p className="text-[11px] text-slate-600 italic">"I'm bad at reading."</p>
        <Lines n={2} />
      </Prompt>
      <Prompt title="Unhooked version" tone="border-emerald-200 bg-emerald-50/60">
        <p className="text-[11px] text-slate-600 italic">"I'm having the thought that I'm bad at reading."</p>
        <Lines n={2} />
      </Prompt>
    </div>
    <div className="mt-3">
      <Prompt title="A name for my mind's favorite story" tone="border-amber-200 bg-amber-50/60">
        <p className="text-[11px] text-slate-600">Example: "The Too-Hard Story"</p>
        <Lines n={1} />
      </Prompt>
    </div>
  </>
);

const SUPPORT_BOXES = [
  ["What people like and admire about me", 2], ["What is important to me", 2],
  ["Things that help me learn best", 2], ["Things that make school hard for me", 2],
  ["How I like to be helped when I am frustrated", 2], ["What I don't want people to do", 2],
];

const SupportProfileSheet = () => (
  <>
    <SheetTitle title="My Support Profile" subtitle="A one-page profile we create together. I share, you listen, and we both sign." />
    <div className="grid grid-cols-2 gap-3">
      {SUPPORT_BOXES.map(([t, n]) => (
        <Prompt key={t} title={t} tone="border-rose-200 bg-rose-50/50"><Lines n={n} /></Prompt>
      ))}
    </div>
    <div className="mt-3">
      <Prompt title="My signal that I need a break" tone="border-sky-200 bg-sky-50/50">
        <div className="flex gap-4 text-[11px] text-slate-700 mt-2">
          {["Hand signal", "Break card", "Word or code", "Other"].map((o) => <span key={o} className="flex items-center gap-1"><span className="w-3 h-3 border border-slate-500 rounded-sm" />{o}</span>)}
        </div>
      </Prompt>
    </div>
    <div className="grid grid-cols-3 gap-4 mt-4"><Line label="Student" /><Line label="Adult" /><Line label="Date" /></div>
  </>
);

const SENSES = [
  ["5", "things I can SEE", "Look for colors, shapes, light.", "bg-sky-500"],
  ["4", "things I can FEEL", "My feet, my chair, my sleeves...", "bg-emerald-500"],
  ["3", "things I can HEAR", "Near sounds and far sounds.", "bg-amber-400"],
  ["2", "things I can SMELL", "Or 2 smells I like.", "bg-rose-500"],
  ["1", "thing I can TASTE", "Or 1 kind thing to say to myself.", "bg-indigo-500"],
  ["", "Back to now", "Take one slow breath. I'm here. I'm ready.", "bg-slate-800"],
];

const GroundingCardsSheet = () => (
  <>
    <SheetTitle title="Present-Moment Grounding Cards" subtitle="Cut out and keep on a ring. Touch each card as you go through 5-4-3-2-1." />
    <div className="grid grid-cols-2 gap-4">
      {SENSES.map(([n, t, tip, bg]) => (
        <div key={t} className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden">
          <div className={`${bg} text-white px-4 py-3 flex items-center gap-3`}>
            {n && <span className="text-4xl font-extrabold" style={F}>{n}</span>}
            <span className="text-base font-bold" style={F}>{t}</span>
          </div>
          <div className="p-3 bg-white">
            <p className="text-xs text-slate-700">{tip}</p>
            <Lines n={2} />
          </div>
        </div>
      ))}
    </div>
  </>
);

const UPSTANDER = [
  ["Include", "\"Want to sit with us?\"", "Invite someone who is alone."],
  ["Interrupt", "\"Hey, that's not cool. Let's go.\"", "Say it calmly, then walk away together."],
  ["Support", "\"Are you okay? I'm here.\"", "Check in with the person who was hurt."],
  ["Report", "\"I need to tell you about something unsafe.\"", "Tell a trusted adult. Reporting is not tattling."],
  ["Distract", "\"Can you help me with this?\"", "Change the moment to end the hurtful thing."],
  ["Stay safe", "\"I'll get help.\"", "If it feels unsafe, leave and find an adult."],
];

const UpstanderSheet = () => (
  <>
    <SheetTitle title="Upstander Power Cards" subtitle="I can be an upstander. Pick a card, say the words, and choose a safe move." />
    <div className="grid grid-cols-2 gap-4">
      {UPSTANDER.map(([t, say, how]) => (
        <div key={t} className="border-2 border-dashed border-indigo-300 rounded-xl p-3 bg-indigo-50/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Upstander move</p>
          <p className="text-lg font-extrabold text-indigo-900" style={F}>{t}</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{say}</p>
          <p className="text-[11px] text-slate-600 mt-0.5">{how}</p>
        </div>
      ))}
    </div>
    <div className="mt-4 space-y-3">
      <Line label="My trusted adults at school are" />
      <Line label="The move I feel ready to try is" />
    </div>
  </>
);

const REPAIR = [
  ["What happened? (just the facts)", 2], ["What was I thinking and feeling?", 2],
  ["Who was affected, and how?", 2], ["Which of my values did I move away from?", 1],
  ["What can I do to make it right?", 2], ["What will I try next time? (my Toward Move)", 1],
];

const RepairProfileSheet = () => (
  <>
    <SheetTitle title="Restorative Harm & Repair Profile" subtitle="Everyone makes mistakes. This is a space to understand, take responsibility, and repair." />
    <div className="space-y-2.5">
      {REPAIR.map(([t, n]) => (
        <Prompt key={t} title={t} tone="border-amber-200 bg-amber-50/50"><Lines n={n} /></Prompt>
      ))}
    </div>
    <div className="mt-3">
      <Prompt title="Help I need from an adult to repair" tone="border-sky-200 bg-sky-50/50"><Lines n={1} /></Prompt>
    </div>
    <div className="grid grid-cols-3 gap-4 mt-4"><Line label="Student" /><Line label="Adult" /><Line label="Date" /></div>
  </>
);

const RELATIONAL = [
  ["Looks like", "What do others SEE me do?"], ["Sounds like", "What words do I use?"],
  ["Feels like", "How do others feel around me?"], ["When it's hard", "What can I do instead?"],
];

const RelationalMapSheet = () => (
  <>
    <SheetTitle title="Relational Values Map" subtitle="What does being a safe and respectful peer look like for me?" />
    <div className="flex justify-center mb-3">
      <div className="rounded-full bg-white border-4 border-emerald-500 px-6 py-2 text-center">
        <span className="text-base font-extrabold text-emerald-900" style={F}>Safe &amp; Respectful Me</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {RELATIONAL.map(([t, q]) => (
        <Prompt key={t} title={t} tone="border-emerald-200 bg-emerald-50/50">
          <p className="text-[11px] text-slate-600">{q}</p>
          <Lines n={4} />
        </Prompt>
      ))}
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <Prompt title="A peer I want to include more" tone="border-slate-200 bg-white"><Lines n={1} /></Prompt>
      <Prompt title="One value I bring to my friendships" tone="border-slate-200 bg-white"><Lines n={1} /></Prompt>
    </div>
  </>
);

export const RESOURCE_SHEETS = {
  "values-sort": ValuesSortSheet,
  "choice-point": ChoicePointSheet,
  "thought-naming": ThoughtNamingSheet,
  "support-profile": SupportProfileSheet,
  "grounding-cards": GroundingCardsSheet,
  "upstander-cards": UpstanderSheet,
  "repair-profile": RepairProfileSheet,
  "relational-map": RelationalMapSheet,
};
