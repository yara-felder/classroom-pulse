import React, { useMemo, useState } from "react";
import { Check, Copy, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  CONVERSATION_CATEGORIES,
  CONVERSATION_DISCLAIMER,
  CONVERSATION_SCRIPTS,
} from "@/data/adminConversationScripts";
import { LEADERSHIP_GUIDES } from "@/data/adminLeadershipGuides";

const OUTFIT = { fontFamily: "Outfit" };

const PARTS = [
  { key: "validate", label: "1. Validate & Ground" },
  { key: "values", label: "2. Connect to Values" },
  { key: "action", label: "3. Committed Action" },
  { key: "avoidOrProtocol", label: "4. Avoid / Protocol" },
];

const categoryLabel = (id) => CONVERSATION_CATEGORIES.find((category) => category.id === id)?.label || id;

const copyText = async (value, success) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(success);
  } catch {
    toast.error("Couldn't copy that text");
  }
};

const Disclaimer = ({ testid }) => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" data-testid={testid}>
    <div className="flex items-start gap-2">
      <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
      <p>{CONVERSATION_DISCLAIMER}</p>
    </div>
  </div>
);

const Playbook = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const needle = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      CONVERSATION_SCRIPTS.filter((item) => {
        if (category !== "all" && item.category !== category) return false;
        if (!needle) return true;
        const haystack = [item.title, item.category, categoryLabel(item.category), ...item.keywords, item.validate, item.values, item.action, item.avoidOrProtocol]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      }),
    [category, needle]
  );

  return (
    <div data-testid="conversation-playbook">
      <Disclaimer testid="conversation-disclaimer" />
      <div className="relative mt-4 max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search keywords, such as hallway, quiz, or re-entry"
          className="pl-9 h-11 bg-white border-slate-200 rounded-xl"
          data-testid="conversation-search"
        />
      </div>
      <div className="flex gap-2 mt-4 overflow-x-auto pb-1" data-testid="conversation-filters">
        <FilterPill active={category === "all"} onClick={() => setCategory("all")} testid="conversation-filter-all">
          All ({CONVERSATION_SCRIPTS.length})
        </FilterPill>
        {CONVERSATION_CATEGORIES.map((item) => (
          <FilterPill
            key={item.id}
            active={category === item.id}
            onClick={() => setCategory(item.id)}
            testid={`conversation-filter-${item.id}`}
          >
            {item.label} ({CONVERSATION_SCRIPTS.filter((script) => script.category === item.id).length})
          </FilterPill>
        ))}
      </div>
      {visible.length === 0 && (
        <p className="text-sm text-slate-500 mt-4" data-testid="conversation-empty">
          No scenarios match that search.
        </p>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        {visible.map((item) => (
          <article key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4" data-testid={`conversation-card-${item.id}`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">{categoryLabel(item.category)}</p>
            <h3 className="text-base font-bold text-slate-900 mt-1" style={OUTFIT}>{item.title}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.keywords.map((keyword) => (
                <span key={keyword} className="text-[11px] font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                  {keyword}
                </span>
              ))}
            </div>
            <dl className="mt-3 space-y-2.5">
              {PARTS.map((part) => (
                <div key={part.key}>
                  <dt className={`text-[11px] font-bold uppercase tracking-wider ${part.key === "avoidOrProtocol" ? "text-amber-700" : "text-slate-500"}`}>
                    {part.label}
                  </dt>
                  <dd className="text-sm text-slate-700 mt-0.5 leading-relaxed">{item[part.key]}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <div className="mt-4">
        <Disclaimer testid="conversation-disclaimer-footer" />
      </div>
    </div>
  );
};

const Guides = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="leadership-guides">
    {LEADERSHIP_GUIDES.map((guide) => (
      <details key={guide.id} open className="bg-white border border-slate-200 rounded-2xl p-4 group" data-testid={`leadership-guide-${guide.id}`}>
        <summary className="cursor-pointer list-none">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900" style={OUTFIT}>{guide.title}</h3>
            <span className="text-[11px] font-semibold text-slate-400 group-open:hidden">Show</span>
            <span className="text-[11px] font-semibold text-slate-400 hidden group-open:inline">Hide</span>
          </div>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{guide.summary}</p>
        </summary>
        <ul className="mt-3 space-y-2">
          {guide.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
              <Check className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {guide.prompts.length > 0 && (
          <div className="mt-4 space-y-2">
            {guide.prompts.map((prompt) => (
              <div key={prompt.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900" style={OUTFIT}>{prompt.title}</p>
                  <button
                    type="button"
                    onClick={() => copyText(prompt.text, "Prompt copied")}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-white border border-teal-200 rounded-lg px-2 py-1 hover:border-teal-300"
                    data-testid={`copy-prompt-${prompt.id}`}
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">{prompt.text}</p>
              </div>
            ))}
          </div>
        )}
      </details>
    ))}
  </div>
);

const FilterPill = ({ active, onClick, testid, children }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testid}
    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors ${
      active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
    }`}
  >
    {children}
  </button>
);

export const AdminLeadershipHub = () => {
  const [tab, setTab] = useState("playbook");

  return (
    <div className="pt-6 pb-4 px-4 sm:px-8 max-w-7xl mx-auto" data-testid="admin-leadership-hub">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900" style={OUTFIT}>
        Administrator Leadership Hub
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        Conversation scripts and school-leadership guides for the week you can see in Behavior Analytics.
      </p>
      <div className="inline-flex flex-wrap gap-1 mt-5 p-1 rounded-xl border border-slate-200 bg-white" role="tablist" aria-label="Leadership hub">
        <TabButton active={tab === "playbook"} onClick={() => setTab("playbook")} testid="leadership-tab-playbook">
          Student Conversation Playbook
        </TabButton>
        <TabButton active={tab === "guides"} onClick={() => setTab("guides")} testid="leadership-tab-guides">
          School Leadership & MTSS Guides
        </TabButton>
      </div>
      <div className="mt-5" role="tabpanel">
        {tab === "playbook" ? <Playbook /> : <Guides />}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, testid, children }) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    data-testid={testid}
    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
    }`}
  >
    {children}
  </button>
);
