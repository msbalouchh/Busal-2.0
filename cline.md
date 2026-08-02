# Busal OS — Project Operating Manual

## Project Vision

Busal OS is building the world's first AI Operating System for Local Businesses.

This is NOT a CRUD application.

This is NOT another POS.

This is NOT another CRM.

This is an Enterprise SaaS Platform capable of serving millions of businesses globally.

Every decision must be scalable.

Every decision must be reusable.

Every decision must reduce future technical debt.

---

# Product Goal

Build a company capable of becoming a global SaaS platform.

Everything should feel:

• Premium
• Fast
• Intelligent
• Enterprise
• Beautiful
• Consistent

Target inspiration:

Stripe
Linear
Notion
Vercel
Apple
Shopify
HubSpot

---

# Engineering Rules

Never redesign completed modules unless explicitly instructed.

Never assume requirements.

Never invent business logic.

Never delete existing functionality unless requested.

Never break completed modules.

Never duplicate components.

Always reuse existing architecture.

Always maintain strict TypeScript.

Never use:

- any
- @ts-ignore
- hacky workarounds

---

# Development Workflow

Every milestone follows this order:

1. Understand objective
2. Inspect existing architecture
3. Build
4. Typecheck
5. Build verification
6. Responsive verification
7. Production readiness report

Never continue to another milestone until current milestone is complete.

---

# Architecture Principles

Always prefer:

Reusable Components

Shared Hooks

Shared Types

Shared Constants

Shared Utilities

Shared Layouts

Shared Design Tokens

Never create unnecessary duplication.

---

# UI Principles

Busal uses one design language.

Dark premium interface.

Glassmorphism where appropriate.

Rounded corners.

Soft gradients.

Clean typography.

Minimal animations.

Smooth transitions.

No visual clutter.

No inconsistent spacing.

Desktop first quality.

Mobile first responsiveness.

---

# Branding

Always use the official Busal branding.

Never invent a new logo.

Never replace typography.

Always maintain visual consistency.

---

# Performance

Prefer Server Components.

Minimize Client Components.

Lazy load heavy sections.

Avoid unnecessary renders.

Avoid unnecessary state.

Optimize images.

Keep Lighthouse performance high.

---

# Code Quality

Every task must finish with:

✓ Typecheck passes

✓ Build passes

✓ No lint issues introduced

✓ No hydration issues

✓ No console errors

✓ Responsive

✓ Accessible

---

# Git Rules

Never commit automatically.

Never push automatically.

Always let the project owner review first.

---

# Communication

When a task finishes, always provide:

Architecture Summary

Files Created

Files Modified

Reusable Components

Future Integration Points

Known Risks

Build Status

Typecheck Status

Git Status

---

# Long-Term Platform

Every implementation should prepare Busal for:

Authentication

Organizations

Tenants

Workspaces

Branches

RBAC

Subscriptions

Billing

AI Agents

CRM

POS

Reservations

Inventory

Kitchen

Marketing

Finance

Analytics

Marketplace

API Platform

Developer Platform

Enterprise Features

Never build something that blocks future scaling.

---

# Final Rule

Build Busal OS like it will serve millions of businesses.

Think long-term.

Protect architecture.

Protect quality.

Avoid technical debt.

Every milestone should be production-quality before moving to the next.
