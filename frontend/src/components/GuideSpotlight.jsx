import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useClassroom } from "@/context/ClassroomContext";

const CLASS = "guide-spotlight";

const findTarget = (selector) => document.querySelector(selector);

// Waits for the target to render (after navigation), pulses it and pins a helper pill until it is tapped.
export const GuideSpotlight = () => {
  const { guide, setGuide } = useClassroom();
  const [rect, setRect] = useState(null);
  const [pillW, setPillW] = useState(0);
  const pillRef = useRef(null);
  const { pathname } = useLocation();
  const arrived = useRef(false);

  useEffect(() => {
    arrived.current = false;
  }, [guide]);

  // Clear only after the guide reached its route and the user then navigated away.
  useEffect(() => {
    if (!guide?.path) return;
    if (pathname === guide.path) arrived.current = true;
    else if (arrived.current) setGuide(null);
  }, [pathname, guide]); // eslint-disable-line react-hooks/exhaustive-deps -- re-run only on route or guide change

  useLayoutEffect(() => {
    if (pillRef.current) setPillW(pillRef.current.offsetWidth);
  }, [rect, guide]);

  useEffect(() => {
    if (!guide) return undefined;
    let el = null;
    let cancelled = false;
    let tries = 0;
    let clickedPre = false;
    let watch = null;

    const place = () => {
      if (el && document.body.contains(el)) setRect(el.getBoundingClientRect());
      else if (el) done();
    };
    const done = () => setGuide(null);

    const attach = () => {
      el.classList.add(CLASS);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.addEventListener("pointerdown", done, { capture: true, once: true });
      setTimeout(place, 450);
      window.addEventListener("scroll", place, true);
      window.addEventListener("resize", place);
      watch = setInterval(place, 500);
    };

    const poll = () => {
      if (cancelled) return;
      if (guide.pre && !clickedPre) {
        const pre = findTarget(guide.pre);
        if (pre) {
          pre.click();
          clickedPre = true;
        }
      }
      el = (!guide.pre || clickedPre) && findTarget(guide.selector);
      if (el) attach();
      else if (tries++ < 40) setTimeout(poll, 150);
      else done();
    };
    poll();

    return () => {
      cancelled = true;
      if (watch) clearInterval(watch);
      if (el) {
        el.classList.remove(CLASS);
        el.removeEventListener("pointerdown", done, { capture: true });
      }
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      setRect(null);
    };
  }, [guide]); // eslint-disable-line react-hooks/exhaustive-deps -- attach listeners once per guide step

  if (!guide || !rect) return null;
  const below = guide.placement === "below" || rect.top < 120;
  const center = rect.left + rect.width / 2;
  const left = Math.min(Math.max(12, center - pillW / 2), window.innerWidth - 12 - pillW);
  return createPortal(
    <div
      ref={pillRef}
      data-testid="guide-hint-pill"
      className="fixed z-[200] pointer-events-none"
      style={{
        top: below ? rect.bottom + 10 : rect.top - 10,
        left,
        transform: below ? "none" : "translateY(-100%)",
        visibility: pillW ? "visible" : "hidden",
      }}
    >
      <div className="guide-pill inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold rounded-full px-3 py-1.5 shadow-lg whitespace-nowrap max-w-[calc(100vw-24px)]">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span className="truncate">{guide.hint}</span>
      </div>
    </div>,
    document.body
  );
};
