# Busal OS Business Rules

Version: 1.0

Status: Active

---

# Philosophy

Business rules define how Busal OS behaves.

These rules are the source of truth.

Features must follow these rules.

Never invent business logic.

Never bypass these rules.

---

# Platform Rules

Busal OS is Multi-Tenant.

Every customer owns isolated data.

Every workspace is independent.

No tenant can access another tenant.

---

# Workspace Rules

One Tenant

↓

Many Workspaces

One Workspace

↓

One Business

One Business

↓

Many Branches

Every branch operates independently while sharing workspace-level settings.

---

# User Rules

A user may belong to multiple workspaces.

Each workspace has independent permissions.

Users authenticate once.

Authorization is workspace-specific.

---

# Role Based Access Control (RBAC)

Default Roles

Owner

Administrator

Manager

Supervisor

Cashier

Chef

Waiter

Accountant

Support

Custom Roles

Unlimited.

Permissions are role-based.

Never hardcode permissions.

---

# Permission Rules

Permissions are assigned to roles.

Users inherit permissions from roles.

Permission checks must always occur on the server.

---

# Branch Rules

Every operational record belongs to a branch unless explicitly global.

Branches share:

Brand

Subscription

Workspace

Branches own:

Orders

Tables

Inventory

Staff

Customers

Reservations

---

# Customer Rules

Customers may visit multiple branches.

Customer history belongs to the workspace.

Loyalty is shared across branches.

---

# Order Rules

Every order belongs to:

Workspace

Business

Branch

Customer (optional)

Staff member

Order status must be tracked.

Payments cannot exceed order total.

Refunds require authorization.

---

# Reservation Rules

Reservations belong to branches.

Reservations may create orders.

Table conflicts are not allowed.

Double booking is prohibited.

---

# Inventory Rules

Inventory belongs to branches.

Transfers between branches must be logged.

Stock changes create audit events.

Negative inventory is configurable.

---

# Staff Rules

Staff belong to branches.

Managers cannot modify Owners.

Owners cannot be deleted while the workspace exists.

Attendance is branch-specific.

---

# Finance Rules

Financial records are immutable.

Corrections require adjustment entries.

Every payment creates an audit log.

Taxes are configurable by country.

---

# AI Rules

AI assists users.

AI never overrides human approval for critical actions.

AI actions must be logged.

AI recommendations should be explainable.

AI can automate only approved workflows.

---

# Security Rules

Every request validates:

Authentication

Workspace

Branch

Permissions

Tenant

Never trust client-side authorization.

---

# Notification Rules

Notifications may be:

Workspace-wide

Branch-specific

User-specific

Notifications must support:

Email

Push

SMS

In-app

---

# Audit Rules

Critical actions must be logged.

Examples:

Login

Permission changes

Refunds

Inventory updates

Financial actions

AI actions

Settings changes

Audit logs are immutable.

---

# Subscription Rules

One subscription per workspace.

Plans determine available modules.

Usage limits are enforced server-side.

Trials convert according to billing rules.

---

# Integration Rules

Third-party integrations must never bypass platform permissions.

API access must respect tenant isolation.

Webhook events must be signed and verified.

---

# Final Rule

Whenever a feature is implemented, verify that it complies with these business rules before considering it complete.
