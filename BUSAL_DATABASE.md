# Busal OS Database Architecture

Version: 1.0

Status: Active

---

# Philosophy

The Busal database is designed for a global multi-tenant SaaS platform.

Every table, relationship, and future migration must support:

- Millions of businesses
- Millions of users
- Millions of transactions
- Complete tenant isolation
- Enterprise security
- Horizontal scalability

Never design tables for a single business.

Always design for global SaaS.

---

# Database Principles

The database must be:

- Multi-Tenant
- Relational
- Secure
- Scalable
- Auditable
- Extensible
- Normalized
- API Friendly

---

# Core Hierarchy

Platform

↓

Tenant

↓

Workspace

↓

Business

↓

Branch

↓

Department

↓

Staff

↓

Customers

↓

Business Data

---

# Core Entities

## Identity

Users

Sessions

OAuth Accounts

Email Verification

Password Reset

MFA

Devices

API Keys

Audit Logs

Notifications

---

## Tenant

Tenant

Workspace

Subscription

Plan

Usage

Billing

Invoices

Payments

Credits

---

## Business

Business

Branch

Department

Role

Permission

Staff

Attendance

Payroll

Shifts

Invitations

---

## Customers

Customer

Customer Tags

Customer Notes

Loyalty

Rewards

Wallet

Addresses

Communication History

---

## Products

Category

Product

Modifier

Variant

Inventory Item

Supplier

Purchase Orders

Stock Movement

Recipe

Ingredient

---

## Orders

Cart

Order

Order Item

Kitchen Ticket

Receipt

Refund

Discount

Tax

Payment

Transaction

Tip

---

## Reservations

Reservation

Table

Floor

Guest

Waiting List

Availability

Booking Rules

---

## CRM

Lead

Opportunity

Deal

Pipeline

Activity

Task

Follow-up

Campaign

---

## Marketing

Email Campaign

SMS Campaign

Push Campaign

Coupons

Referral

Automation

Audience

Segments

---

## Finance

Invoice

Expense

Income

Cash Register

Journal

Ledger

Taxes

Accounting

---

## AI

AI Agent

Memory

Knowledge Base

Conversation

Prompt

Workflow

Automation

Voice Session

AI Logs

AI Usage

---

## Files

Documents

Images

Media

Uploads

Storage

Exports

Imports

---

## Analytics

Events

Reports

Dashboard Metrics

KPIs

Forecasts

AI Insights

---

# Relationship Rules

One User

↓

Many Workspaces

---

One Workspace

↓

One Business

---

One Business

↓

Many Branches

---

One Branch

↓

Many Staff

---

One Branch

↓

Many Customers

---

One Branch

↓

Many Orders

---

One Order

↓

Many Order Items

---

One Customer

↓

Many Orders

---

One Reservation

↓

May Create One Order

---

Every Record

Must Belong To

Tenant

Workspace

Business

Branch

where applicable.

---

# Tenant Isolation

Every business data record must be isolated.

No tenant may access another tenant.

Every query must respect tenant boundaries.

---

# IDs

Every entity uses UUID.

Never expose internal numeric IDs.

---

# Soft Deletes

Critical entities must support:

created_at

updated_at

deleted_at

created_by

updated_by

deleted_by

---

# Audit

Every important action should be auditable.

Examples:

Login

Payments

Refunds

Role Changes

Permissions

AI Actions

Inventory

Finance

---

# Future Ready

Database must support:

Multi Currency

Multi Language

Multi Country

Multi Brand

White Label

Enterprise Organizations

Marketplace

Plugins

Public API

AI Platform

Event Streaming

Warehouse

Data Lake

---

# Migration Rules

Never modify production tables without migrations.

Never break backward compatibility.

Never duplicate entities.

Prefer extending existing architecture.

---

# Final Principle

Every database decision should support Busal OS becoming the operating system for millions of businesses worldwide.
