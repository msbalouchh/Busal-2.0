"use client";

import { Bot, Check, Cloud, Shield } from "lucide-react";

import { BusalLogo } from "@/components/brand/busal-logo";
import {
  AUTH_HEADLINE,
  AUTH_SUPPORTING_COPY,
  AUTH_TRUST_INDICATORS,
} from "@/modules/auth/constants/auth-copy";

const TRUST_ICONS = [Shield, Bot, Cloud, Check] as const;

export function AuthVisualPanel() {
  return (
    <aside className="auth-visual" aria-hidden="true">
      <div className="auth-visual__mesh" />
      <div className="auth-visual__orb auth-visual__orb--a" />
      <div className="auth-visual__orb auth-visual__orb--b" />

      <div className="auth-visual__content">
        <BusalLogo height={48} priority />
        <h1 className="auth-visual__headline">{AUTH_HEADLINE}</h1>
        <p className="auth-visual__copy">{AUTH_SUPPORTING_COPY}</p>

        <div className="auth-visual__preview">
          <div className="auth-visual__preview-head">
            <p className="auth-visual__preview-title">Operations Command</p>
            <span className="auth-visual__preview-badge">Live</span>
          </div>
          <div className="auth-visual__preview-row">
            <span className="auth-visual__preview-dot" />
            AI Manager briefing ready
          </div>
          <div className="auth-visual__preview-row">
            <span className="auth-visual__preview-dot" />
            Multi-location dashboard synced
          </div>
          <div className="auth-visual__preview-row">
            <span className="auth-visual__preview-dot" />
            12 agents orchestrating workflows
          </div>
        </div>
      </div>

      <ul className="auth-visual__trust">
        {AUTH_TRUST_INDICATORS.map((label, index) => {
          const Icon = TRUST_ICONS[index] ?? Check;
          return (
            <li key={label} className="auth-visual__trust-item">
              <Icon className="auth-visual__trust-icon h-4 w-4" aria-hidden="true" />
              {label}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
