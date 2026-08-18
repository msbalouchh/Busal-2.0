import { useMemo, useState } from "react";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  Ellipsis,
  LayoutDashboard,
  MessageCircle,
  MoreHorizontal,
  Plus,
  QrCode,
  Search,
  Settings,
  Sparkles,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

type Tab = "home" | "orders" | "kitchen" | "customers" | "more";

const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "kitchen", label: "Kitchen", icon: UtensilsCrossed },
  { id: "customers", label: "Customers", icon: Users },
  { id: "more", label: "More", icon: MoreHorizontal },
];

const orderItems = [
  { id: "#1048", customer: "Table 12", detail: "4 items · Dine in", total: "£86.40", state: "Ready", tone: "success" },
  { id: "#1047", customer: "Amelia Reed", detail: "2 items · Collection", total: "£42.00", state: "Preparing", tone: "warning" },
  { id: "#1046", customer: "Table 4", detail: "3 items · Dine in", total: "£61.20", state: "New", tone: "info" },
];

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button className="icon-button" type="button" aria-label={label}>
      {children}
    </button>
  );
}

function Dashboard() {
  return (
    <>
      <section className="hero-copy">
        <p className="eyebrow">Tuesday, 12 August</p>
        <h1>Good morning, Saleh</h1>
        <p className="subcopy">Here’s how your business is performing today.</p>
      </section>

      <section className="metrics" aria-label="Today’s key metrics">
        <article className="metric-card metric-card-primary">
          <p>Today’s sales</p>
          <strong>£2,480.60</strong>
          <span className="metric-trend">↗ 12.4% vs. last Tuesday</span>
        </article>
        <article className="metric-card">
          <p>Open orders</p>
          <strong>18</strong>
          <span>6 need attention</span>
        </article>
        <article className="metric-card">
          <p>Reservations</p>
          <strong>24</strong>
          <span>Next arrival · 12:45</span>
        </article>
        <article className="metric-card">
          <p>Guest rating</p>
          <strong>4.8</strong>
          <span>From 126 recent reviews</span>
        </article>
      </section>

      <section className="section-block" aria-labelledby="quick-actions-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Operations</p>
            <h2 id="quick-actions-title">Quick actions</h2>
          </div>
          <button className="text-button" type="button">Customize</button>
        </div>
        <div className="quick-actions">
          <button className="quick-action" type="button"><Plus /><span>New order</span></button>
          <button className="quick-action" type="button"><QrCode /><span>Scan QR</span></button>
          <button className="quick-action" type="button"><UtensilsCrossed /><span>Kitchen</span></button>
          <button className="quick-action" type="button"><MessageCircle /><span>Message</span></button>
        </div>
      </section>

      <section className="section-block" aria-labelledby="orders-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live activity</p>
            <h2 id="orders-title">Orders needing attention</h2>
          </div>
          <button className="text-button" type="button">View all</button>
        </div>
        <div className="order-list">
          {orderItems.map((order) => (
            <button className="order-row" type="button" key={order.id}>
              <span className={`status-dot status-${order.tone}`} />
              <span className="order-main">
                <span className="order-title"><strong>{order.id}</strong> {order.customer}</span>
                <span className="order-detail">{order.detail}</span>
              </span>
              <span className="order-side">
                <span className={`status-pill status-${order.tone}`}>{order.state}</span>
                <strong>{order.total}</strong>
              </span>
              <ChevronRight className="row-chevron" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="ai-card" aria-label="Busal intelligence">
        <div className="ai-icon"><Sparkles /></div>
        <div>
          <p className="eyebrow">Busal Intelligence</p>
          <h2>Protect tonight’s service</h2>
          <p>Kitchen prep is trending 11 minutes behind the target. Open the kitchen queue to rebalance stations.</p>
          <button className="ai-action" type="button">Review recommendation <ChevronRight /></button>
        </div>
      </section>
    </>
  );
}

function Placeholder({ tab }: { tab: Exclude<Tab, "home"> }) {
  const content = {
    orders: ["Orders", "Keep every order moving from table to kitchen to payment.", ClipboardList],
    kitchen: ["Kitchen", "Monitor live tickets, prep time, and kitchen stations.", UtensilsCrossed],
    customers: ["Customers", "See guest history, preferences, and service notes.", Users],
    more: ["More", "Access reporting, settings, team management, and the full BUSAL OS.", Settings],
  } as const;
  const [title, description, Icon] = content[tab];

  return (
    <section className="placeholder-view">
      <div className="placeholder-icon"><Icon /></div>
      <p className="eyebrow">BUSAL mobile</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <button className="primary-button" type="button">Open {title}</button>
    </section>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const page = useMemo(() => activeTab === "home" ? <Dashboard /> : <Placeholder tab={activeTab} />, [activeTab]);

  return (
    <main className="app-shell">
      <div className="app-background" aria-hidden="true" />
      <header className="topbar">
        <button className="workspace-chip" type="button">
          <span className="workspace-mark">B</span>
          <span><strong>BUSAL</strong><small>Harbour workspace</small></span>
          <ChevronRight size={16} />
        </button>
        <div className="topbar-actions">
          <IconButton label="Search"><Search /></IconButton>
          <IconButton label="Notifications"><Bell /></IconButton>
        </div>
      </header>

      <div className="content">{page}</div>

      <nav className="tabbar" aria-label="Primary navigation">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            className={`tab-button ${activeTab === id ? "active" : ""}`}
            type="button"
            key={id}
            onClick={() => setActiveTab(id)}
            aria-current={activeTab === id ? "page" : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
