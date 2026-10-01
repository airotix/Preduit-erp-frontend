"use client";

import { useCallback, useEffect, useState } from "react";
import { STAGES } from "./data/stages.js";
import { useCycle, useReveal } from "./hooks/index.js";

import "./styles/tokens.css";
import "./styles/global.css";

import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Marquee from "./components/Marquee.jsx";
import WhatItIs from "./components/WhatItIs.jsx";
import FlowSection from "./components/FlowSection.jsx";
import ProductTour from "./components/ProductTour.jsx";
import Roles from "./components/Roles.jsx";
import UnderTheHood from "./components/UnderTheHood.jsx";
import Stats from "./components/Stats.jsx";
import Rollout from "./components/Rollout.jsx";
import Faq from "./components/Faq.jsx";
import Trust from "./components/Trust.jsx";
import CtaBand from "./components/CtaBand.jsx";
import Footer from "./components/Footer.jsx";

const PHOSPHOR = [
  "https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css",
  "https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css",
];

/**
 * Preduit marketing site (embedded in the ERP at `/`).
 *
 * The hero window and the "How it works" section share one `stage` index so the
 * order the visitor watches in the hero is the same record they step through
 * below. Auto-advance stops the moment the visitor drives it themselves.
 */
export default function App({ autoplay = true }) {
  const [manual, setManual] = useState(false);
  const [stage, setStage] = useCycle(STAGES.length, 4400, autoplay && !manual);

  const pickStage = useCallback((i) => { setManual(true); setStage(i); }, [setStage]);

  useReveal();

  // Phosphor icon sheets — only while the landing is mounted.
  useEffect(() => {
    const links = PHOSPHOR.map((href) => {
      let el = document.querySelector(`link[data-pd-phosphor][href="${href}"]`);
      if (el) return null;
      el = document.createElement("link");
      el.rel = "stylesheet";
      el.href = href;
      el.setAttribute("data-pd-phosphor", "1");
      document.head.appendChild(el);
      return el;
    }).filter(Boolean);
    return () => { links.forEach((el) => el.remove()); };
  }, []);

  return (
    <div
      id="top"
      className="pd-landing"
      style={{ fontFamily: "var(--font-sans)", color: "var(--fg1)", background: "var(--bg)", overflowX: "hidden", minHeight: "100vh" }}
    >
      <Header />
      <Hero stage={STAGES[stage]} />
      <Marquee />
      <WhatItIs />
      <FlowSection stage={stage} setStage={pickStage} />
      <ProductTour autoplay={autoplay} />
      <Roles />
      <UnderTheHood />
      <Stats />
      <Rollout />
      <Faq />
      <Trust />
      <CtaBand />
      <Footer />
    </div>
  );
}
