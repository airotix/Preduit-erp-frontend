"use client";

import { Box } from "../lib/css.jsx";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const link = "font-size:14px;font-weight:500;color:var(--fg2)";

export default function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (event) => { if (event.key === "Escape") setOpen(false); };
    const desktop = window.matchMedia("(min-width: 1100px)");
    const resize = () => { if (desktop.matches) setOpen(false); };
    window.addEventListener("keydown", close);
    desktop.addEventListener("change", resize);
    return () => { window.removeEventListener("keydown", close); desktop.removeEventListener("change", resize); };
  }, []);
  return (
    <header className="pd-header" style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(14px)", background: "rgba(255,255,255,0.82)", borderBottom: "1px solid var(--border)" }}>
      <div className="pd-header-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", gap: 32 }}>
        <a href="#top" style={{ display: "flex", alignItems: "center", gap: 11, color: "inherit" }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: "linear-gradient(135deg,var(--orange-400),var(--orange-700))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-primary)" }}>
            <i className="ph-fill ph-cube-transparent" style={{ color: "#fff", fontSize: 19 }} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Preduit</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg3)" }}>Retail ERP</span>
          </span>
        </a>
        <nav className="pd-desktop-nav" aria-label="Main navigation" style={{ display: "flex", alignItems: "center", gap: 26, marginLeft: 8 }}>
          <Box as="a" href="#what" css={link}>What it is</Box>
          <Box as="a" href="#flow" css={link}>How it works</Box>
          <Box as="a" href="#modules" css={link}>Modules</Box>
          <Box as="a" href="#rollout" css={link}>Rollout</Box>
          <Box as="a" href="#faq" css={link}>FAQ</Box>
        </nav>
        <div style={{ flex: 1 }} />
        <div className="pd-header-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Box
            as="a"
            href="/login"
            css="padding:10px 16px;font-size:14px;font-weight:600;color:var(--fg1);border:1.5px solid var(--border-strong);border-radius:var(--radius-pill);background:#fff"
            hover="border-color:var(--fg3)"
          >
            Sign in
          </Box>
          <Box
            as="a"
            className="pd-header-demo"
            href="/signup"
            css="display:flex;align-items:center;gap:8px;padding:11px 20px;font-size:14px;font-weight:600;color:#fff;background:var(--primary);border:none;border-radius:var(--radius-pill);box-shadow:var(--shadow-primary);transition:transform .18s cubic-bezier(0.22,1,0.36,1),background .18s"
            hover="background:var(--primary-hover);transform:translateY(-1px);color:#fff"
          >
            Book a demo
            <i className="ph ph-arrow-up-right" style={{ fontSize: 15 }} />
          </Box>
        </div>
        <button className="pd-menu-toggle" type="button" aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open} aria-controls="pd-mobile-nav" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && <nav id="pd-mobile-nav" aria-label="Mobile navigation" className="pd-mobile-nav" onClick={() => setOpen(false)}>
        <a href="#what">What it is</a><a href="#flow">How it works</a><a href="#modules">Modules</a>
        <a href="#rollout">Rollout</a><a href="#faq">FAQ</a><a href="/signup">Book a demo</a>
      </nav>}
    </header>
  );
}
