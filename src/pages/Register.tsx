import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

// ─── INJECTED CSS ──────────────────────────────────────────────────────────────
const REGISTER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap');

  .ont-reg-page {
    min-height: 100dvh; display: flex; align-items: center; justify-content: center;
    background: #F0EBE3; font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 32px 16px; position: relative; overflow: hidden;
  }
  .ont-reg-bg1 {
    position: absolute; top: 33%; left: 25%; width: 280px; height: 280px;
    border-radius: 50%; background: rgba(230,100,10,0.04); pointer-events: none;
  }
  .ont-reg-bg2 {
    position: absolute; bottom: 33%; right: 25%; width: 200px; height: 200px;
    border-radius: 50%; background: rgba(230,100,10,0.04); pointer-events: none;
  }

  .ont-reg-card {
    width: 100%; max-width: 500px; position: relative; z-index: 1;
    background: #FFFFFF; border: 1px solid rgba(0,0,0,0.09);
    border-radius: 28px; padding: 36px 32px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.06);
  }

  /* Logo */
  .ont-reg-logo {
    display: inline-flex; align-items: center; gap: 9px;
    text-decoration: none; margin-bottom: 6px;
  }
  .ont-reg-logo-box {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, #E6640A, #C4520A);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .ont-reg-logo-on  { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 900; font-size: 10px; color: #fff; line-height: 1; }
  .ont-reg-logo-ett { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 7.5px; color: rgba(255,255,255,0.65); line-height: 1; }
  .ont-reg-logo-name {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: 18px; color: #1A1A1A; letter-spacing: -0.3px;
  }
  .ont-reg-logo-name em { color: #E6640A; font-style: normal; }

  .ont-reg-heading {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 26px; font-weight: 800; color: #1A1A1A;
    letter-spacing: -0.5px; margin: 18px 0 6px;
  }
  .ont-reg-subheading { font-size: 13.5px; color: #9A9A9A; margin-bottom: 20px; }

  /* Role badge */
  .ont-reg-role-badge {
    display: flex; align-items: center; gap: 12px;
    background: rgba(230,100,10,0.05); border: 1px solid rgba(230,100,10,0.15);
    border-radius: 14px; padding: 12px 16px; margin-bottom: 24px;
  }
  .ont-reg-role-ico {
    width: 42px; height: 42px; border-radius: 12px;
    background: rgba(230,100,10,0.1);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ont-reg-role-title { font-size: 13px; font-weight: 700; color: #1A1A1A; }
  .ont-reg-role-sub { font-size: 11px; color: #9A9A9A; margin-top: 2px; }

  /* Field */
  .ont-reg-field { margin-bottom: 14px; }
  .ont-reg-label {
    display: block; font-size: 10px; font-weight: 800; letter-spacing: 1px;
    text-transform: uppercase; color: #9A9A9A; margin-bottom: 7px;
  }
  .ont-reg-label span { text-transform: none; font-weight: 500; color: #B0B0B0; }
  .ont-reg-input-wrap { position: relative; }
  .ont-reg-input-icon {
    position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
    color: #C0C0C0; pointer-events: none; display: flex; align-items: center;
  }
  .ont-reg-input {
    width: 100%; height: 46px;
    background: #FAFAF8; border: 1px solid rgba(0,0,0,0.1);
    border-radius: 12px; padding: 0 14px 0 40px;
    font-size: 13.5px; color: #1A1A1A; outline: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: border-color 0.15s, background 0.15s;
  }
  .ont-reg-input:focus {
    border-color: rgba(230,100,10,0.5); background: #fff;
    box-shadow: 0 0 0 3px rgba(230,100,10,0.08);
  }
  .ont-reg-input::placeholder { color: #C0C0C0; }
  .ont-reg-input-no-icon {
    padding-left: 14px;
  }
  .ont-reg-input-with-right { padding-right: 44px; }
  .ont-reg-input-right {
    position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #B0B0B0;
    display: flex; align-items: center; padding: 0;
    transition: color 0.15s;
  }
  .ont-reg-input-right:hover { color: #6A6A6A; }

  /* Textarea */
  .ont-reg-textarea {
    width: 100%; min-height: 80px; resize: vertical;
    background: #FAFAF8; border: 1px solid rgba(0,0,0,0.1);
    border-radius: 12px; padding: 12px 14px;
    font-size: 13.5px; color: #1A1A1A; outline: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: border-color 0.15s, background 0.15s;
  }
  .ont-reg-textarea:focus {
    border-color: rgba(230,100,10,0.5); background: #fff;
    box-shadow: 0 0 0 3px rgba(230,100,10,0.08);
  }
  .ont-reg-textarea::placeholder { color: #C0C0C0; }

  /* Two-column grid */
  .ont-reg-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }

  /* Phone prefix */
  .ont-reg-phone-wrap { display: flex; }
  .ont-reg-phone-prefix {
    display: flex; align-items: center; gap: 6px;
    padding: 0 12px; border-radius: 12px 0 0 12px;
    border: 1px solid rgba(0,0,0,0.1); border-right: none;
    background: #F3EDE6; color: #9A9A9A;
    font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
    flex-shrink: 0; white-space: nowrap;
  }
  .ont-reg-phone-input {
    flex: 1; height: 46px; background: #FAFAF8;
    border: 1px solid rgba(0,0,0,0.1); border-radius: 0 12px 12px 0;
    padding: 0 14px; font-size: 13.5px; color: #1A1A1A; outline: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: border-color 0.15s, background 0.15s;
  }
  .ont-reg-phone-input:focus {
    border-color: rgba(230,100,10,0.5); background: #fff;
    box-shadow: 0 0 0 3px rgba(230,100,10,0.08);
  }
  .ont-reg-phone-input::placeholder { color: #C0C0C0; }

  /* File input */
  .ont-reg-file {
    width: 100%; height: 46px;
    background: #FAFAF8; border: 1px solid rgba(0,0,0,0.1);
    border-radius: 12px; padding: 0 14px;
    font-size: 13px; color: #6A6A6A; outline: none;
    font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer;
  }
  .ont-reg-file:focus { border-color: rgba(230,100,10,0.5); box-shadow: 0 0 0 3px rgba(230,100,10,0.08); }

  /* Terms block */
  .ont-reg-terms-box {
    border-radius: 16px; border: 1px solid rgba(0,0,0,0.09);
    background: #FAFAF8; padding: 16px; margin-bottom: 20px;
  }
  .ont-reg-terms-row {
    display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;
  }
  .ont-reg-terms-checkbox {
    width: 22px; height: 22px; border-radius: 7px; flex-shrink: 0; cursor: pointer;
    background: none; border: none; padding: 0; margin-top: 1px;
    display: flex; align-items: center; justify-content: center;
    color: #E6640A;
  }
  .ont-reg-terms-text { font-size: 13px; color: #6A6A6A; line-height: 1.6; }
  .ont-reg-terms-text a {
    color: #E6640A; font-weight: 700; text-decoration: none;
  }
  .ont-reg-terms-text a:hover { text-decoration: underline; }
  .ont-reg-terms-read-btn {
    width: 100%; border: 1px solid rgba(230,100,10,0.25); border-radius: 11px;
    background: none; padding: 10px; cursor: pointer; color: #E6640A;
    font-size: 12px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: background 0.15s;
  }
  .ont-reg-terms-read-btn:hover { background: rgba(230,100,10,0.05); }
  .ont-reg-terms-signed {
    font-size: 12px; color: #16A34A; font-weight: 600;
    display: flex; align-items: center; gap: 6px;
  }

  /* Submit button */
  .ont-reg-submit {
    width: 100%; height: 50px; border: none; border-radius: 14px;
    background: #E6640A; color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14.5px; font-weight: 800; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s, transform 0.1s;
  }
  .ont-reg-submit:hover:not(:disabled) { background: #C4520A; transform: translateY(-1px); }
  .ont-reg-submit:active:not(:disabled) { transform: translateY(0); }
  .ont-reg-submit:disabled { background: #E0D8D0; color: #B0A898; cursor: not-allowed; }

  .ont-reg-footer-text {
    text-align: center; font-size: 13px; color: #9A9A9A; margin-top: 18px;
  }
  .ont-reg-footer-text a {
    color: #E6640A; font-weight: 700; text-decoration: none;
  }
  .ont-reg-footer-text a:hover { text-decoration: underline; }

  /* ── TERMS MODAL ── */
  .ont-reg-modal-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.55);
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .ont-reg-modal {
    width: 100%; max-width: 640px;
    background: #FFFFFF; border-radius: 24px;
    border: 1px solid rgba(0,0,0,0.09);
    display: flex; flex-direction: column; max-height: 92dvh;
    box-shadow: 0 24px 80px rgba(0,0,0,0.18);
  }
  .ont-reg-modal-header {
    padding: 24px 28px 18px; border-bottom: 1px solid rgba(0,0,0,0.08);
    flex-shrink: 0; text-align: center;
  }
  .ont-reg-modal-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(230,100,10,0.08); border: 1px solid rgba(230,100,10,0.2);
    color: #C4520A; font-size: 10px; font-weight: 800; letter-spacing: 0.8px;
    text-transform: uppercase; padding: 5px 12px; border-radius: 99px; margin-bottom: 12px;
  }
  .ont-reg-modal-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 22px; font-weight: 800; color: #1A1A1A;
    letter-spacing: -0.4px; margin-bottom: 4px;
  }
  .ont-reg-modal-date { font-size: 12px; color: #B0B0B0; }
  .ont-reg-modal-scroll-hint { font-size: 11px; color: #F59E0B; margin-top: 8px; }
  .ont-reg-modal-body {
    flex: 1; overflow-y: auto; padding: 24px 28px;
    font-size: 13.5px; color: #3A3A3A; line-height: 1.75;
  }
  .ont-reg-modal-body h3 {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 14px; font-weight: 800; color: #1A1A1A; margin: 20px 0 8px;
  }
  .ont-reg-modal-body p { margin-bottom: 12px; }
  .ont-reg-modal-body hr { border: none; border-top: 1px solid rgba(0,0,0,0.08); margin: 20px 0; }
  .ont-reg-modal-body strong { font-weight: 700; color: #1A1A1A; }
  .ont-reg-modal-warn {
    background: #FFFBEB; border: 1px solid rgba(245,158,11,0.3);
    border-radius: 12px; padding: 12px 16px; margin: 16px 0;
    font-size: 12.5px; color: #92400E; font-weight: 600;
    display: flex; gap: 10px; align-items: flex-start;
  }
  .ont-reg-modal-warn-icon { font-size: 16px; flex-shrink: 0; }
  .ont-reg-modal-contact {
    padding-left: 16px; border-left: 3px solid rgba(230,100,10,0.25);
    margin-top: 8px; line-height: 1.9; color: #6A6A6A;
  }
  /* Signature area */
  .ont-reg-sig-label {
    font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
    color: #9A9A9A; margin-bottom: 8px; display: block;
  }
  .ont-reg-sig-canvas-wrap {
    border: 2px dashed rgba(0,0,0,0.15); border-radius: 14px;
    background: #FAFAF8; overflow: hidden; position: relative;
  }
  .ont-reg-sig-canvas {
    width: 100%; cursor: crosshair; touch-action: none; display: block;
  }
  .ont-reg-sig-placeholder {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    pointer-events: none; font-size: 12px; color: #C0C0C0; gap: 6px;
  }
  .ont-reg-sig-baseline {
    position: absolute; bottom: 24px; left: 16px; right: 16px;
    border-bottom: 1px solid rgba(0,0,0,0.1); pointer-events: none;
  }
  .ont-reg-sig-ok { font-size: 12px; color: #16A34A; font-weight: 600; margin-top: 6px; display: flex; align-items: center; gap: 5px; }
  .ont-reg-sig-clear {
    background: none; border: none; cursor: pointer; font-size: 11.5px; color: #9A9A9A;
    font-family: 'Plus Jakarta Sans', sans-serif; display: flex; align-items: center; gap: 4px;
    transition: color 0.15s;
  }
  .ont-reg-sig-clear:hover { color: #3A3A3A; }
  .ont-reg-modal-footer {
    padding: 16px 24px; border-top: 1px solid rgba(0,0,0,0.08); flex-shrink: 0;
    display: flex; flex-direction: column; gap: 8px;
  }
  .ont-reg-modal-hint { text-align: center; font-size: 11.5px; color: #F59E0B; }
  .ont-reg-modal-accept {
    width: 100%; height: 48px; border: none; border-radius: 13px;
    background: #E6640A; color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 800;
    cursor: pointer; transition: background 0.15s, transform 0.1s;
  }
  .ont-reg-modal-accept:hover:not(:disabled) { background: #C4520A; transform: translateY(-1px); }
  .ont-reg-modal-accept:disabled { background: #E0D8D0; color: #B0A898; cursor: not-allowed; transform: none; }
  .ont-reg-modal-decline {
    width: 100%; height: 44px; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px;
    background: none; color: #9A9A9A; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .ont-reg-modal-decline:hover { background: rgba(0,0,0,0.04); color: #3A3A3A; }
  .ont-reg-modal-date-row {
    display: flex; justify-content: space-between; font-size: 12.5px; color: #9A9A9A;
    margin-top: 12px;
  }
  .ont-reg-modal-date-row strong { color: #1A1A1A; }
`;

// ─── INLINE ICONS ─────────────────────────────────────────────────────────────
const IcoCart = (p: any = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IcoUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IcoLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcoPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.23a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 6 6l1.06-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IcoPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcoEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcoEyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IcoPen = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const IcoRefresh = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoSquare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  </svg>
);
const IcoCheckSquare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

// ─── SIGNATURE CANVAS ─────────────────────────────────────────────────────────
function SignatureCanvas({ onSign, onClear, signed }: { onSign: (d: string) => void; onClear: () => void; signed: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    drawing.current = true;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#1A1A1A";
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y); ctx.stroke();
  };
  const end = () => {
    if (!drawing.current) return; drawing.current = false;
    const canvas = canvasRef.current; if (!canvas) return;
    onSign(canvas.toDataURL());
  };
  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="ont-reg-sig-label">Sign below to confirm your agreement</span>
        <button type="button" onClick={clear} className="ont-reg-sig-clear"><IcoRefresh /> Clear</button>
      </div>
      <div className="ont-reg-sig-canvas-wrap">
        <canvas
          ref={canvasRef} width={560} height={100}
          className="ont-reg-sig-canvas"
          onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={end}
        />
        {!signed && (
          <div className="ont-reg-sig-placeholder">
            <IcoPen /> Draw your signature here
          </div>
        )}
        <div className="ont-reg-sig-baseline" />
      </div>
      {signed && <div className="ont-reg-sig-ok"><IcoCheck /> Signature captured</div>}
    </div>
  );
}

// ─── TERMS MODAL ──────────────────────────────────────────────────────────────
function TermsModal({ onAccept, onDecline }: { onAccept: (sig: string) => void; onDecline: () => void }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [signature, setSignature] = useState("");
  const [signedName, setSignedName] = useState("");

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) setScrolledToBottom(true);
  };

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const canAccept = scrolledToBottom && signature && signedName.trim().length > 1;

  return (
    <div className="ont-reg-modal-backdrop">
      <div className="ont-reg-modal">

        <div className="ont-reg-modal-header">
          <div className="ont-reg-modal-badge"><IcoCart style={{ width: 12, height: 12 }} /> ONETT Marketplace</div>
          <div className="ont-reg-modal-title">Terms &amp; Conditions</div>
          <div className="ont-reg-modal-date">Effective Date: April 8, 2025 · Version 1.0</div>
          {!scrolledToBottom && <div className="ont-reg-modal-scroll-hint">↓ Please read the full document before signing</div>}
        </div>

        <div className="ont-reg-modal-body" onScroll={handleScroll}>

          <p>Welcome to Onett. These Terms and Conditions (<strong>"Terms"</strong>) constitute a legally binding agreement between you (<strong>"User"</strong>) and Onett (<strong>"Company"</strong>), governing your access to and use of our Platform. By accessing or using the Platform, you agree to be bound by these Terms in their entirety.</p>

          <hr />

          <h3>1. Eligibility</h3>
          <p>By registering, you represent that: (a) you are at least 18 years of age, or have obtained verifiable parental consent; (b) you possess full legal capacity to enter binding obligations; (c) your use does not violate applicable laws; and (d) all information you provide is accurate and complete.</p>

          <h3>2. User Accounts</h3>
          <p>You are solely responsible for: (a) maintaining confidentiality of your account credentials; (b) all activities under your account; and (c) promptly notifying us of unauthorised use. We reserve the right to suspend or terminate accounts found to be fraudulent or in violation of these Terms without prior notice.</p>

          <h3>3. Products and Services</h3>
          <p>All products and services listed are subject to availability. We reserve the right to modify, suspend, or discontinue any product or feature. Product images are for illustrative purposes only and may not exactly represent the final product.</p>

          <h3>4. Orders and Payments</h3>
          <p>All orders are subject to acceptance and availability confirmation. Prices are displayed in Ghanaian Cedis (GHS) and include applicable taxes unless stated. We reserve the right to cancel orders involving pricing errors, suspected fraud, or failed payment authorisation. A full refund will be issued on cancellation.</p>

          <h3>5. Pre-Orders</h3>
          <p>By placing a pre-order you acknowledge that: (a) partial or full advance payment may be required; (b) estimated delivery dates are projections only; (c) delays may occur due to factors beyond our control; and (d) we reserve the right to cancel unfulfillable pre-orders with a full refund.</p>

          <h3>6. Refund Policy</h3>
          <p><strong>6.1 General.</strong> All sales are considered final upon order confirmation unless expressly stated otherwise.</p>
          <p><strong>6.2 Pre-Order Refunds.</strong> For products purchased on a pre-order basis where a partial (50%) deposit has been made: refund requests must be formally submitted within seven (7) calendar days from the date of payment. Upon expiry of the seven-day period, all payments become strictly non-refundable.</p>
          <p><strong>6.3 Non-Refundable Cases.</strong> Refunds will not be issued for: expiry of the refund window; change of mind; incorrectly placed orders; digital products once accessed; or used/damaged items.</p>

          <div className="ont-reg-modal-warn">
            <span className="ont-reg-modal-warn-icon">⚠️</span>
            <span><strong>Pre-Order Refund Notice:</strong> Refund requests for partially paid pre-orders must be submitted within 7 days of payment. After this period, no refunds will be granted under any circumstances.</span>
          </div>

          <h3>7. Delivery</h3>
          <p>Delivery timelines are estimates and do not constitute guaranteed delivery dates. We shall not be liable for delays beyond our reasonable control. Risk of loss passes to you upon delivery.</p>

          <h3>8. Returns and Exchanges</h3>
          <p>Returns are accepted only for products that are defective or materially differ from their description. Contact support within 48 hours of delivery with photographic evidence. Items returned without prior authorisation will not be accepted.</p>

          <h3>9. Intellectual Property</h3>
          <p>All content on the Platform is the exclusive property of Onett or its content suppliers and is protected by applicable intellectual property laws. You are granted a limited, non-exclusive, revocable licence to access the Platform for personal, non-commercial purposes only.</p>

          <h3>10. Prohibited Conduct</h3>
          <p>You agree not to use the Platform for unlawful purposes; attempt unauthorised access; transmit harmful content; use automated tools to scrape data; impersonate others; or interfere with Platform integrity.</p>

          <h3>11. Limitation of Liability</h3>
          <p>To the fullest extent permitted by law, Onett shall not be liable for any indirect, incidental, special, or consequential damages. Our aggregate liability shall not exceed the total amount paid by you in the twelve months preceding the claim.</p>

          <h3>12. Privacy</h3>
          <p>Your use is also governed by our Privacy Policy, incorporated into these Terms by reference. By using the Platform, you consent to collection and use of your personal information as described therein.</p>

          <h3>13. Amendments</h3>
          <p>We reserve the right to revise these Terms at any time. Material changes will be posted on the Platform with a revised effective date. Continued use constitutes acceptance of revised Terms.</p>

          <h3>14. Governing Law</h3>
          <p>These Terms shall be governed by the laws of the Republic of Ghana. Any disputes shall be subject to the exclusive jurisdiction of the courts of Ghana.</p>

          <h3>15. Contact</h3>
          <p>For questions, contact us at:</p>
          <div className="ont-reg-modal-contact">
            <strong>Onett Marketplace</strong><br />
            Email: support@onett.com<br />
            Phone: +233 XX XXX XXXX<br />
            Address: Accra, Ghana
          </div>

          <hr />

          <h3>Acknowledgement &amp; Signature</h3>
          <p style={{ color: "#9A9A9A", fontSize: 12.5 }}>By signing below, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions in their entirety, including the pre-order refund policy.</p>

          {/* Printed name */}
          <div style={{ marginTop: 16 }}>
            <label className="ont-reg-sig-label">Full Name (Print)</label>
            <input
              value={signedName}
              onChange={e => setSignedName(e.target.value)}
              placeholder="Type your full name"
              className="ont-reg-input ont-reg-input-no-icon"
              style={{ marginBottom: 16 }}
            />
          </div>

          <SignatureCanvas onSign={setSignature} onClear={() => setSignature("")} signed={!!signature} />

          <div className="ont-reg-modal-date-row">
            <span>Date of Acceptance:</span>
            <strong>{today}</strong>
          </div>
        </div>

        <div className="ont-reg-modal-footer">
          {!scrolledToBottom && <div className="ont-reg-modal-hint">Please scroll to the bottom and sign before accepting</div>}
          <button className="ont-reg-modal-accept" onClick={() => onAccept(signature)} disabled={!canAccept}>
            Accept &amp; Sign Agreement
          </button>
          <button className="ont-reg-modal-decline" onClick={onDecline}>Decline</button>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER PAGE ────────────────────────────────────────────────────────────
const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: "", email: "", password: "",
    phoneNumber: "", bio: "", location: "",
  });
  const [profilePic, setProfilePic] = useState<File | null>(null);

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) { toast.error("Please accept the Terms & Conditions to continue."); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      const data = {
        fullName: form.fullName, email: form.email, password: form.password,
        phoneNumber: `+233${form.phoneNumber}`, bio: form.bio, location: form.location,
      };
      formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
      if (profilePic) formData.append("profilePic", profilePic);
      await register(formData, false);
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <style>{REGISTER_CSS}</style>

      {showTermsModal && (
        <TermsModal
          onAccept={() => { setTermsAccepted(true); setShowTermsModal(false); toast.success("Terms accepted and signed!"); }}
          onDecline={() => { setTermsAccepted(false); setShowTermsModal(false); }}
        />
      )}

      <div className="ont-reg-page">
        <div className="ont-reg-bg1" />
        <div className="ont-reg-bg2" />

        <motion.div
          style={{ width: "100%", maxWidth: 500, position: "relative", zIndex: 1 }}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="ont-reg-card">

            {/* Logo */}
            <Link to="/" className="ont-reg-logo">
              <div className="ont-reg-logo-box">
                <div className="ont-reg-logo-on">ON</div>
                <div className="ont-reg-logo-ett">ETT</div>
              </div>
              <span className="ont-reg-logo-name">ONETT<em>.</em></span>
            </Link>

            <h1 className="ont-reg-heading">Create your account</h1>
            <p className="ont-reg-subheading">Start shopping smarter with AI</p>

            {/* Role badge */}
            <div className="ont-reg-role-badge">
              <div className="ont-reg-role-ico"><IcoCart /></div>
              <div>
                <div className="ont-reg-role-title">Creating a Buyer account</div>
                <div className="ont-reg-role-sub">Browse, shop, and discover products with AI</div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Full Name */}
              <div className="ont-reg-field">
                <label className="ont-reg-label">Full Name</label>
                <div className="ont-reg-input-wrap">
                  <span className="ont-reg-input-icon"><IcoUser /></span>
                  <input value={form.fullName} onChange={e => update("fullName", e.target.value)} required placeholder="John Doe" className="ont-reg-input" />
                </div>
              </div>

              {/* Email */}
              <div className="ont-reg-field">
                <label className="ont-reg-label">Email</label>
                <div className="ont-reg-input-wrap">
                  <span className="ont-reg-input-icon"><IcoMail /></span>
                  <input type="email" value={form.email} onChange={e => update("email", e.target.value)} required placeholder="you@example.com" className="ont-reg-input" />
                </div>
              </div>

              {/* Password + Phone */}
              <div className="ont-reg-grid-2">

                <div className="ont-reg-field" style={{ marginBottom: 0 }}>
                  <label className="ont-reg-label">Password</label>
                  <div className="ont-reg-input-wrap">
                    <span className="ont-reg-input-icon"><IcoLock /></span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password} onChange={e => update("password", e.target.value)}
                      required minLength={8} placeholder="Min 8 chars"
                      className="ont-reg-input ont-reg-input-with-right"
                    />
                    <button type="button" className="ont-reg-input-right" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label="Toggle password">
                      {showPassword ? <IcoEyeOff /> : <IcoEye />}
                    </button>
                  </div>
                </div>

                <div className="ont-reg-field" style={{ marginBottom: 0 }}>
                  <label className="ont-reg-label">Phone</label>
                  <div className="ont-reg-phone-wrap">
                    <div className="ont-reg-phone-prefix"><IcoPhone />+233</div>
                    <input
                      value={form.phoneNumber}
                      onChange={e => update("phoneNumber", e.target.value.replace(/^0+/, ""))}
                      required placeholder="XX XXX XXXX"
                      className="ont-reg-phone-input"
                      maxLength={9}
                    />
                  </div>
                </div>

              </div>

              {/* Location */}
              <div className="ont-reg-field">
                <label className="ont-reg-label">Location</label>
                <div className="ont-reg-input-wrap">
                  <span className="ont-reg-input-icon"><IcoPin /></span>
                  <input value={form.location} onChange={e => update("location", e.target.value)} placeholder="Accra, Ghana" className="ont-reg-input" />
                </div>
              </div>

              {/* Bio */}
              <div className="ont-reg-field">
                <label className="ont-reg-label">Bio <span>(optional)</span></label>
                <textarea
                  value={form.bio} onChange={e => update("bio", e.target.value)}
                  placeholder="Tell us a bit about yourself"
                  className="ont-reg-textarea"
                  rows={2}
                />
              </div>

              {/* Profile Picture */}
              <div className="ont-reg-field">
                <label className="ont-reg-label">Profile Picture <span>(optional)</span></label>
                <input type="file" accept="image/*" onChange={e => setProfilePic(e.target.files?.[0] || null)} className="ont-reg-file" />
              </div>

              {/* Terms */}
              <div className="ont-reg-terms-box">
                <div className="ont-reg-terms-row">
                  <button
                    type="button"
                    className="ont-reg-terms-checkbox"
                    onClick={() => { if (!termsAccepted) { setShowTermsModal(true); } else { setTermsAccepted(false); } }}
                  >
                    {termsAccepted ? <IcoCheckSquare /> : <IcoSquare />}
                  </button>
                  <p className="ont-reg-terms-text">
                    I have read, signed, and agree to the{" "}
                    <a href="#" onClick={e => { e.preventDefault(); setShowTermsModal(true); }}>Terms &amp; Conditions</a>{" "}
                    of ONETT Marketplace, including the strict pre-order refund policy.
                  </p>
                </div>

                {!termsAccepted ? (
                  <button type="button" className="ont-reg-terms-read-btn" onClick={() => setShowTermsModal(true)}>
                    <IcoPen /> Read &amp; Sign Agreement
                  </button>
                ) : (
                  <div className="ont-reg-terms-signed">
                    <IcoCheck /> Agreement signed — {today}
                  </div>
                )}
              </div>

              <button type="submit" className="ont-reg-submit" disabled={loading || !termsAccepted}>
                {loading ? "Creating account…" : "Create Account"}
              </button>

            </form>

            <p className="ont-reg-footer-text">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>

          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Register;
