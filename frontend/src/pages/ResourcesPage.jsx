import React, { useState } from "react";
import { Eye, BookMarked, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RESOURCES, RESOURCE_FILTERS } from "@/data/mockData";
import { ResourcePreviewModal } from "@/components/resources/ResourcePreviewModal";
import { AdminLeadershipHub } from "@/components/resources/AdminLeadershipHub";
import { useClassroom } from "@/context/ClassroomContext";

const ctaLabel = (tag) =>
  tag === "Script" ? "Get script" : tag === "Visual" ? "Get visual" : "Get printable";

const colorMap = {
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    accent: "bg-amber-400",
    chip: "bg-amber-100 text-amber-800",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    accent: "bg-emerald-400",
    chip: "bg-emerald-100 text-emerald-800",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-800",
    accent: "bg-indigo-400",
    chip: "bg-indigo-100 text-indigo-800",
  },
  teal: {
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-800",
    accent: "bg-teal-400",
    chip: "bg-teal-100 text-teal-800",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-800",
    accent: "bg-rose-400",
    chip: "bg-rose-100 text-rose-800",
  },
  sky: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-800",
    accent: "bg-sky-400",
    chip: "bg-sky-100 text-sky-800",
  },
};

export default function ResourcesPage() {
  const { role } = useClassroom();
  if (role === "admin") return <AdminLeadershipHub />;
  return <TeacherResources />;
}

function TeacherResources() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState("All");

  const list = RESOURCES.filter(
    (r) =>
      (filter === "All" || r.category === filter) &&
      (r.title.toLowerCase().includes(q.toLowerCase()) ||
        r.category.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="pt-6 pb-4 px-4 sm:px-8 max-w-7xl mx-auto">
      <h1
        className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900"
        style={{ fontFamily: "Outfit" }}
      >
        Teacher Resources
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        Evidence-based ACT and person-centered tools students can use, sort, and co-design with you.
      </p>

      <div className="relative mt-5 mb-4 max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          data-testid="resource-search-input"
          placeholder="Search resources..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 h-11 bg-white border-slate-200 rounded-xl"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6" data-testid="resource-filters">
        {RESOURCE_FILTERS.map((f) => (
          <button
            key={f}
            data-testid={`resource-filter-${f.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            onClick={() => setFilter(f)}
            className={`text-sm font-semibold rounded-full px-4 py-1.5 border transition-colors ${
              filter === f
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <p data-testid="resource-empty" className="text-sm text-slate-500">No resources match your search.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((r) => {
          const c = colorMap[r.color] || colorMap.teal;
          return (
            <div
              key={r.id}
              data-testid={`resource-card-${r.id}`}
              className={`relative rounded-2xl border ${c.border} ${c.bg} p-5 hover:shadow-md transition-shadow overflow-hidden`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${c.accent}`} />
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/70 border border-white flex items-center justify-center">
                  <BookMarked className={`w-5 h-5 ${c.text}`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${c.chip}`}>
                  {r.tag}
                </span>
              </div>
              <h3
                className={`mt-4 text-lg font-bold ${c.text}`}
                style={{ fontFamily: "Outfit" }}
              >
                {r.title}
              </h3>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
                {r.category}
              </p>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{r.description}</p>
              <button
                data-testid={`download-${r.id}`}
                onClick={() => setActive(r)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {ctaLabel(r.tag)}
              </button>
            </div>
          );
        })}
      </div>
      <ResourcePreviewModal resource={active} onClose={() => setActive(null)} />
    </div>
  );
}
