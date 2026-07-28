import {
  registerAgentSkill,
  registerAgentTemplate,
} from "@/modules/ai-agents/registry/agent-registry";

const SKILLS = [
  {
    skillId: "sales",
    name: "Sales",
    description: "CRM, leads, and commercial workflows",
    department: "Sales",
    allowedTools: ["crm.list_customers", "knowledge.search"],
    allowedWorkflows: ["NewLeadCreated"],
  },
  {
    skillId: "inventory",
    name: "Inventory",
    description: "Stock monitoring and reorder workflows",
    department: "Operations",
    allowedTools: ["knowledge.search"],
    allowedWorkflows: ["StockLow"],
  },
  {
    skillId: "marketing",
    name: "Marketing",
    description: "Campaigns and lead nurture automations",
    department: "Marketing",
    allowedTools: ["knowledge.search", "knowledge.build_context"],
    allowedWorkflows: ["NewLeadCreated"],
  },
  {
    skillId: "finance",
    name: "Finance",
    description: "Invoices, revenue, and forecasting",
    department: "Finance",
    allowedTools: ["reporting.get_dashboard", "knowledge.search"],
    allowedWorkflows: ["InvoiceOverdue", "PaymentReceived"],
  },
  {
    skillId: "support",
    name: "Support",
    description: "Customer success and service workflows",
    department: "Support",
    allowedTools: ["crm.list_customers", "knowledge.search"],
    allowedWorkflows: ["CustomerCreated"],
  },
  {
    skillId: "crm",
    name: "CRM",
    description: "Customer relationship management",
    department: "Sales",
    allowedTools: ["crm.list_customers"],
    allowedWorkflows: ["CustomerCreated"],
  },
  {
    skillId: "restaurant",
    name: "Restaurant",
    description: "Menu, reservations, and kitchen operations",
    department: "Operations",
    allowedTools: ["staff.list_members", "knowledge.search"],
    allowedWorkflows: ["ReservationCreated", "OrderCompleted"],
  },
  {
    skillId: "pos",
    name: "POS",
    description: "Point of sale and transaction workflows",
    department: "Operations",
    allowedTools: ["reporting.get_dashboard"],
    allowedWorkflows: ["PosTransactionCompleted"],
  },
  {
    skillId: "reporting",
    name: "Reporting",
    description: "Analytics and business intelligence",
    department: "Executive",
    allowedTools: ["reporting.get_dashboard", "knowledge.build_context"],
    allowedWorkflows: [],
  },
  {
    skillId: "automation",
    name: "Automation",
    description: "Workflow orchestration and event handling",
    department: "Technology",
    allowedTools: ["knowledge.search"],
    allowedWorkflows: ["AutomationWorkflowCompleted"],
  },
] as const;

const TEMPLATES = [
  {
    templateId: "ceo-ai",
    name: "CEO AI",
    description: "Executive agent that delegates to department agents.",
    department: "Executive",
    role: "Chief Executive Officer",
    personality: "Strategic, concise, and outcome-focused.",
    goals: ["Align departments", "Monitor business health", "Prioritize initiatives"],
    responsibilities: ["Delegate tasks", "Review KPIs", "Approve strategic actions"],
    behaviourRules: ["Always verify BusinessContext", "Escalate finance decisions"],
    skills: ["reporting", "automation"],
    allowedTools: ["reporting.get_dashboard", "knowledge.build_context"],
    scheduleType: "DAILY" as const,
  },
  {
    templateId: "sales-ai",
    name: "Sales AI",
    description: "Handles leads, pipeline, and customer outreach.",
    department: "Sales",
    role: "Sales Manager",
    personality: "Persuasive, helpful, and data-informed.",
    goals: ["Convert leads", "Maintain pipeline hygiene"],
    responsibilities: ["Qualify leads", "Draft follow-ups"],
    behaviourRules: ["Respect CRM permissions", "Never share cross-tenant data"],
    skills: ["sales", "crm"],
    allowedTools: ["crm.list_customers", "knowledge.search"],
    scheduleType: "EVENT_DRIVEN" as const,
  },
  {
    templateId: "finance-ai",
    name: "Finance AI",
    description: "Monitors revenue, invoices, and cash flow.",
    department: "Finance",
    role: "Finance Analyst",
    personality: "Precise, cautious, and compliance-aware.",
    goals: ["Reduce overdue invoices", "Forecast revenue"],
    responsibilities: ["Review invoices", "Flag anomalies"],
    behaviourRules: ["Require finance approval for write actions"],
    skills: ["finance", "reporting"],
    allowedTools: ["reporting.get_dashboard", "knowledge.search"],
    scheduleType: "DAILY" as const,
  },
] as const;

export function registerBootstrapAgentPlugins(): void {
  for (const skill of SKILLS) {
    registerAgentSkill({
      skillId: skill.skillId,
      name: skill.name,
      description: skill.description,
      department: skill.department,
      allowedTools: [...skill.allowedTools],
      allowedWorkflows: [...skill.allowedWorkflows],
    });
  }

  for (const template of TEMPLATES) {
    registerAgentTemplate({
      templateId: template.templateId,
      name: template.name,
      description: template.description,
      department: template.department,
      role: template.role,
      personality: template.personality,
      goals: [...template.goals],
      responsibilities: [...template.responsibilities],
      behaviourRules: [...template.behaviourRules],
      skills: [...template.skills],
      allowedTools: [...template.allowedTools],
      scheduleType: template.scheduleType,
    });
  }
}

let bootstrapComplete = false;

export function ensureBootstrapAgentPlugins(): void {
  if (bootstrapComplete) {
    return;
  }

  registerBootstrapAgentPlugins();
  bootstrapComplete = true;
}

export { SKILLS as DEFAULT_AGENT_SKILLS, TEMPLATES as DEFAULT_AGENT_TEMPLATES };
