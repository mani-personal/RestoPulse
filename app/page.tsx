"use client";

import { useEffect, useState } from "react";
import { browserDb } from "@/lib/supabase";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  ReceiptText,
  Settings,
  Building2,
  BadgeCheck,
  CreditCard,
  Bell,
  Search,
  Plus,
  Moon,
  Sun,
  ChevronDown,
  ArrowUpRight,
  MoreHorizontal,
  Printer,
  Minus,
  Check,
  Trash2,
  Pencil,
  Volume2,
  VolumeX,
  LogOut,
  CalendarDays,
  Wallet,
  Menu,
  PanelRightClose,
  Package,
  Copy,
  ExternalLink,
  Send,
  Save,
  QrCode,
  Upload,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { toast, Toaster } from "sonner";

type View =
  | "dashboard"
  | "pos"
  | "menu"
  | "inventory"
  | "staff"
  | "expenses"
  | "suppliers"
  | "settings"
  | "subscription"
  | "restaurants"
  | "approvals"
  | "pricing";

type Dish = {
  id: number | string;
  imageUrl?: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: boolean;
  emoji: string;
  diet: string;
  time: number;
};

type Plan = {
  id: number;
  name: string;
  price: number;
  period: string;
  features: string;
  active: boolean;
};

type CartLine = {
  id: number | string;
  qty: number;
  discount: number;
  override?: number;
};

const initialDishes: Dish[] = [
  { id: 1, name: "Truffle Mushroom Risotto", category: "Mains", price: 680, cost: 240, stock: true, emoji: "🍄", diet: "Vegetarian", time: 22 },
  { id: 2, name: "Grilled Salmon Bowl", category: "Mains", price: 790, cost: 330, stock: true, emoji: "🥗", diet: "Gluten-free", time: 18 },
  { id: 3, name: "Burrata & Heirloom Tomato", category: "Appetizers", price: 520, cost: 210, stock: true, emoji: "🍅", diet: "Vegetarian", time: 12 },
  { id: 4, name: "Smoked Chicken Tacos", category: "Mains", price: 560, cost: 185, stock: true, emoji: "🌮", diet: "", time: 16 },
  { id: 5, name: "Citrus Mint Cooler", category: "Drinks", price: 240, cost: 65, stock: true, emoji: "🍹", diet: "Vegan", time: 5 },
  { id: 6, name: "Dark Chocolate Fondant", category: "Desserts", price: 390, cost: 130, stock: true, emoji: "🍫", diet: "Vegetarian", time: 14 },
  { id: 7, name: "Crispy Calamari", category: "Appetizers", price: 490, cost: 210, stock: false, emoji: "🍤", diet: "", time: 15 },
  { id: 8, name: "Margherita Flatbread", category: "Mains", price: 470, cost: 155, stock: true, emoji: "🍕", diet: "Vegetarian", time: 17 },
];

const initialPlans: Plan[] = [
  { id: 1, name: "Free Trial", price: 0, period: "14 days", features: "1 location · Core POS · 2 users", active: true },
  { id: 2, name: "Starter", price: 2499, period: "month", features: "1 location · Menu & POS · 5 users", active: true },
  { id: 3, name: "Growth", price: 5999, period: "month", features: "3 locations · Analytics · 20 users", active: true },
  { id: 4, name: "Enterprise", price: 14999, period: "month", features: "Unlimited locations · Priority support", active: true },
];

const initialRestaurants = [
  { id: 1, name: "The Saffron Table", owner: "Mani Raj", email: "mani@example.com", phone: "+91 98765 43210", city: "Bengaluru", plan: "Growth", status: "Active", renewal: "12 Oct 2026", initial: "ST" },
];

type InventoryRecord = {
  onHand: number | null;
  reorderLevel: number;
};

const navTenant: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "pos", label: "POS Terminal", icon: ShoppingBag },
  { id: "menu", label: "Menu & dishes", icon: UtensilsCrossed },
  { id: "inventory", label: "Inventory Management", icon: Package },
  { id: "staff", label: "Team & payroll", icon: Users },
  { id: "expenses", label: "Expenses", icon: ReceiptText },
  { id: "suppliers", label: "Suppliers", icon: Building2 },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

const navPlatform: { id: View; label: string; icon: typeof Building2 }[] = [
  { id: "restaurants", label: "Restaurants", icon: Building2 },
  { id: "approvals", label: "Approvals", icon: BadgeCheck },
  { id: "pricing", label: "Pricing plans", icon: CreditCard },
];

export default function Home() {
  const db = browserDb;
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [profileMenu, setProfileMenu] = useState(false);
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [orderType, setOrderType] = useState("Dine-in");
  const [table, setTable] = useState("T04");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [payment, setPayment] = useState("UPI");
  const [cash, setCash] = useState("");
  const [sound, setSound] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState("This week");
  
  // Inventory State
  const [inventory, setInventory] = useState<Record<string, InventoryRecord>>({});

  useEffect(() => {
    if (!db) {
      setAuthLoading(false);
      return;
    }
    let live = true;
    db.auth.getSession().then(({ data }: { data: { session: any } }) => {
      if (live) {
        setAuthUser(data.session?.user.id || null);
        setAuthLoading(false);
      }
    });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event: string, session: any) => {
      setAuthUser(session?.user.id || null);
      setAuthLoading(false);
    });
    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, [db]);

  useEffect(() => {
    if (!db || !authUser) {
      setTenantId(null);
      return;
    }
    let live = true;
    (async () => {
      const [a, m, r] = await Promise.all([
        db.from("platform_admins").select("user_id").eq("user_id", authUser).maybeSingle(),
        db.from("memberships").select("restaurant_id,role").eq("user_id", authUser).limit(1).maybeSingle(),
        db.from("restaurants").select("*").order("created_at", { ascending: false }),
      ]);
      if (!live) return;
      const platform = !!a.data;
      setIsAdmin(platform);
      setRestaurants(
        (r.data || []).map((x: any) => ({
          id: x.id,
          name: x.name,
          owner: x.owner_name,
          email: x.owner_email,
          phone: x.owner_phone,
          city: x.city,
          plan: x.plan,
          status: x.status,
          renewal: x.renewal_on || "—",
          initial: x.name.slice(0, 2).toUpperCase(),
        }))
      );
      setTenantId(m.data?.restaurant_id || null);
      setView(platform ? "restaurants" : "dashboard");
    })();
    return () => {
      live = false;
    };
  }, [db, authUser]);

  // Load Inventory for Restaurant
  useEffect(() => {
    if (!tenantId) {
      setInventory({});
      return;
    }
    try {
      const raw = localStorage.getItem(`rp-inventory:${tenantId}`);
      setInventory(raw ? JSON.parse(raw) : {});
    } catch {
      setInventory({});
    }
  }, [tenantId]);

  const inventoryValue = (id: number | string) => inventory[String(id)] || { onHand: null, reorderLevel: 5 };
  const saveInventoryRecord = (id: number | string, next: InventoryRecord) => {
    const all = { ...inventory, [String(id)]: next };
    setInventory(all);
    if (tenantId) localStorage.setItem(`rp-inventory:${tenantId}`, JSON.stringify(all));
  };

  const nav = (v: View) => {
    setView(v);
    setMobileNav(false);
    setNotifications(false);
    setProfileMenu(false);
  };

  if (!db) return <div className="auth-page"><div className="auth-card"><h1>Configuration needed</h1></div></div>;
  if (authLoading) return <div className="auth-page">Loading RestoPulse…</div>;

  if (!authUser)
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={async (e) => {
          e.preventDefault();
          if (!db) return;
          setLoginBusy(true);
          const { error } = await db.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
          setLoginBusy(false);
          if (error) toast.error(error.message);
        }}>
          <h1>Welcome to RestoPulse</h1>
          <label>Email<input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} /></label>
          <label>Password<input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} /></label>
          <button className="primary-btn" disabled={loginBusy}>{loginBusy ? "Signing in…" : "Sign in"}</button>
        </form>
        <Toaster richColors />
      </div>
    );

  return (
    <div className="app-shell">
      <Toaster richColors position="top-right" />
      <aside className={"sidebar " + (mobileNav ? "show" : "")}>
        <div className="brand">
          <strong>RestoPulse</strong>
        </div>
        <nav aria-label="Restaurant navigation">
          {navTenant.map((item) => (
            <button
              key={item.id}
              className={"nav-link " + (view === item.id ? "active" : "")}
              onClick={() => nav(item.id)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        {view === "dashboard" && (
          <div className="page-head">
            <h1>Restaurant Dashboard</h1>
            <p>Welcome back! Select Inventory Management to check or update stocks.</p>
          </div>
        )}

        {/* INVENTORY MANAGEMENT SECTION */}
        {view === "inventory" && tenantId && (
          <>
            <div className="page-head flex justify-between items-center">
              <div>
                <div className="eyebrow">STOCK CONTROL & WAREHOUSE</div>
                <h1>Inventory Management</h1>
                <p>Manage on-hand quantities, monitor stock thresholds, and track reorder levels for your kitchen items.</p>
              </div>
              <button
                className="quiet-btn flex items-center gap-2"
                onClick={() => {
                  try {
                    localStorage.setItem(`rp-inventory:${tenantId}`, JSON.stringify(inventory));
                    toast.success("Inventory stock levels saved successfully!");
                  } catch {
                    toast.error("Could not save inventory changes");
                  }
                }}
              >
                <Save size={16} /> Save Changes
              </button>
            </div>

            <div className="platform-stats grid grid-cols-4 gap-4 my-6">
              <div className="p-4 bg-card rounded-lg border">
                <strong>{dishes.length}</strong>
                <span>Total Catalog Items</span>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <strong>{dishes.filter((x) => x.stock).length}</strong>
                <span>Available for Sale</span>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <strong>{Object.values(inventory).filter(x => x.onHand !== null && x.onHand <= x.reorderLevel).length}</strong>
                <span>Low Stock Alerts</span>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <strong>{Object.values(inventory).reduce((sum, x) => sum + (x.onHand ?? 0), 0)}</strong>
                <span>Total Units Tracked</span>
              </div>
            </div>

            <div className="panel management-panel bg-card border rounded-xl p-6">
              <div className="panel-header mb-4">
                <h2>Stock Levels & Reorder Thresholds</h2>
                <p className="text-sm text-muted-foreground">Adjust quantities below to instantly update stock availability across your restaurant console.</p>
              </div>
              <div className="table-scroll overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-sm text-muted-foreground">
                      <th className="p-3">ITEM NAME</th>
                      <th className="p-3">CATEGORY</th>
                      <th className="p-3">UNITS ON HAND</th>
                      <th className="p-3">REORDER LEVEL</th>
                      <th className="p-3">STOCK STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dishes.map((d) => {
                      const record = inventoryValue(d.id);
                      const status =
                        record.onHand === null
                          ? "Not tracked"
                          : record.onHand === 0
                          ? "Out of stock"
                          : record.onHand <= record.reorderLevel
                          ? "Low stock"
                          : "In stock";
                      return (
                        <tr key={d.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium flex items-center gap-2">
                            <span>{d.emoji}</span> {d.name}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{d.category}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={record.onHand ?? ""}
                              placeholder="Qty"
                              onChange={(e) =>
                                saveInventoryRecord(d.id, {
                                  ...record,
                                  onHand: e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value))),
                                })
                              }
                              className="w-24 p-1.5 border rounded bg-background text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={record.reorderLevel}
                              onChange={(e) =>
                                saveInventoryRecord(d.id, {
                                  ...record,
                                  reorderLevel: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                                })
                              }
                              className="w-24 p-1.5 border rounded bg-background text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                status === "In stock"
                                  ? "bg-green-100 text-green-800"
                                  : status === "Low stock"
                                  ? "bg-amber-100 text-amber-800"
                                  : status === "Out of stock"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
