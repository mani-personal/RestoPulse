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

  // Admin & Restaurant Subscription State
  const [adminUpiId, setAdminUpiId] = useState("admin-restopulse@upi");
  const [adminUpiBusy, setAdminUpiBusy] = useState(false);
  const [subscriptionUpiId, setSubscriptionUpiId] = useState("admin-restopulse@upi");
  const [showQrModal, setShowQrModal] = useState(false);
  const [extensionMessage, setExtensionMessage] = useState("");
  const [extensionFile, setExtensionFile] = useState<File | null>(null);
  const [extensionBusy, setExtensionBusy] = useState(false);
  const [subscriptionRequests, setSubscriptionRequests] = useState<Array<any>>([]);
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

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/subscription");
        const data = await res.json();
        if (live && data.upi_id) {
          setSubscriptionUpiId(data.upi_id);
          setAdminUpiId(data.upi_id);
        }
      } catch {}

      if (isAdmin) {
        try {
          const reqRes = await fetch("/api/admin/subscriptions");
          const reqData = await reqRes.json();
          if (live && reqData.requests) {
            setSubscriptionRequests(reqData.requests);
          }
        } catch {}
      }
    })();
    return () => {
      live = false;
    };
  }, [isAdmin, tenantId]);

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

  const uploadImage = async (file: File, kind: "screenshot") => {
    if (!db) throw new Error("Database client not available");
    const path = `${tenantId || 'admin'}/${kind}/${crypto.randomUUID()}.jpg`;
    const { error } = await db.storage.from("restaurant-media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return db.storage.from("restaurant-media").getPublicUrl(path).data.publicUrl;
  };

  const saveAdminUpi = async () => {
    if (!db || !isAdmin) return;
    setAdminUpiBusy(true);
    try {
      const { error } = await db.from("settings").upsert(
        { key: "admin_upi", upi_id: adminUpiId.trim(), value: adminUpiId.trim(), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      setSubscriptionUpiId(adminUpiId.trim());
      toast.success("Admin payment UPI ID saved successfully!");
    } finally {
      setAdminUpiBusy(false);
    }
  };

  const copyUpi = async () => {
    if (!subscriptionUpiId) return;
    try {
      await navigator.clipboard.writeText(subscriptionUpiId);
      toast.success("UPI ID copied");
    } catch {
      toast.info(subscriptionUpiId);
    }
  };

  const paySubscription = () => {
    if (!subscriptionUpiId) {
      toast.error("Admin payment UPI ID is not configured");
      return;
    }
    const link = `upi://pay?pa=${encodeURIComponent(subscriptionUpiId)}&pn=RestoPulse&cu=INR`;
    window.location.href = link;
  };

  const requestExtension = async () => {
    if (!db || !tenantId) return;
    setExtensionBusy(true);
    try {
      let screenshotUrl = "";
      if (extensionFile) {
        screenshotUrl = await uploadImage(extensionFile, "screenshot");
      }

      const currentRestaurant = restaurants.find((r) => String(r.id) === String(tenantId));
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: tenantId,
          restaurant_name: tenantInfo?.name || "Restaurant",
          owner_name: currentRestaurant?.owner || "Owner",
          owner_email: currentRestaurant?.email || "owner@example.com",
          plan: "Starter",
          upi_id: subscriptionUpiId,
          screenshot_url: screenshotUrl,
          message: extensionMessage.trim() || "Payment proof submitted",
        }),
      });

      if (!response.ok) {
        toast.error("Could not send request");
        return;
      }

      toast.success("Validity extension request and payment proof sent to admin!");
      setExtensionMessage("");
      setExtensionFile(null);
    } finally {
      setExtensionBusy(false);
    }
  };

  const reviewExtensionRequest = async (requestId: string, restId: string) => {
    if (!db || !isAdmin) return;
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });
      if (!response.ok) {
        toast.error("Could not approve request");
        return;
      }

      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 30);
      const renewalStr = newDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      
      await db.from("restaurants").update({ renewal_on: renewalStr, status: "Active" }).eq("id", restId);

      setSubscriptionRequests((old) => old.filter((x) => x.id !== requestId));
      toast.success("Subscription approved and extended by 30 days!");
    } catch (err: any) {
      toast.error(err.message);
    }
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
        <div className="nav-heading">RESTAURANT</div>
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
        {isAdmin && (
          <>
            <div className="nav-heading admin-heading">PLATFORM ADMIN</div>
            <nav aria-label="Platform navigation">
              {navPlatform.map((item) => (
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
          </>
        )}
      </aside>

      <main className="content">
        {view === "dashboard" && (
          <div className="page-head">
            <h1>Overview Dashboard</h1>
            <p>Welcome to RestoPulse management portal.</p>
          </div>
        )}

        {view === "pos" && (
          <div className="page-head">
            <h1>POS Terminal</h1>
            <p>Fast checkout and order placement.</p>
          </div>
        )}

        {view === "menu" && (
          <div className="page-head">
            <h1>Menu & Dishes</h1>
            <p>Manage your restaurant offerings.</p>
          </div>
        )}

        {/* INVENTORY MANAGEMENT SECTION */}
        {view === "inventory" && (
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

            <div className="panel management-panel bg-card border rounded-xl p-6 mt-4">
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
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
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

        {view === "staff" && (
          <div className="page-head">
            <h1>Team & Payroll</h1>
          </div>
        )}

        {view === "expenses" && (
          <div className="page-head">
            <h1>Expenses Ledger</h1>
          </div>
        )}

        {view === "suppliers" && (
          <div className="page-head">
            <h1>Suppliers Directory</h1>
          </div>
        )}

        {/* SUBSCRIPTION VIEW */}
        {view === "subscription" && (
          <>
            <div className="page-head">
              <h1>Subscription & Payments</h1>
              <p>Pay via Admin UPI, view QR, and request validity extensions.</p>
            </div>
            <div className="settings-grid">
              <section className="panel settings-panel">
                <h2>Pay via Admin UPI</h2>
                <div className="setting-toggle">
                  <span>
                    <b>Active Admin UPI ID</b>
                    <small className="text-indigo-600 font-semibold">{subscriptionUpiId}</small>
                  </span>
                  <div className="flex gap-2">
                    <button className="quiet-btn" onClick={() => setShowQrModal(true)}>
                      <QrCode size={16} /> Show QR
                    </button>
                    <button className="quiet-btn" onClick={copyUpi}>
                      <Copy size={16} /> Copy
                    </button>
                  </div>
                </div>
                <button className="primary-btn mt-4" onClick={paySubscription}>
                  <ExternalLink size={16} /> Pay via UPI App
                </button>
              </section>

              <section className="panel settings-panel">
                <h2>Request Validity Extension & Upload Proof</h2>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Payment Screenshot</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setExtensionFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm"
                  />
                </label>
                <label className="block space-y-1 pt-2">
                  <span className="text-sm font-medium">Transaction Reference</span>
                  <textarea
                    value={extensionMessage}
                    onChange={(e) => setExtensionMessage(e.target.value)}
                    placeholder="UTR / Reference ID..."
                    className="w-full p-2 border rounded-md text-sm bg-transparent"
                  />
                </label>
                <button className="primary-btn mt-3" onClick={requestExtension} disabled={extensionBusy}>
                  <Upload size={16} /> Submit Proof to Admin
                </button>
              </section>
            </div>
          </>
        )}

        {view === "settings" && (
          <div className="page-head">
            <h1>Workspace Settings</h1>
          </div>
        )}

        {view === "restaurants" && (
          <>
            <div className="page-head">
              <h1>Restaurants & Subscription Approvals</h1>
            </div>
            {subscriptionRequests.length > 0 && (
              <section className="panel management-panel mb-6">
                <div className="panel-header">
                  <h2>Pending Subscription Requests ({subscriptionRequests.length})</h2>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>RESTAURANT</th>
                        <th>OWNER</th>
                        <th>PROOF</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionRequests.map((req: any) => (
                        <tr key={req.id}>
                          <td>{req.restaurant_name}</td>
                          <td>{req.owner_name}</td>
                          <td>
                            {req.screenshot_url ? (
                              <a href={req.screenshot_url} target="_blank" rel="noreferrer" className="text-indigo-600 underline text-xs">
                                View Proof
                              </a>
                            ) : "No proof"}
                          </td>
                          <td>
                            <button className="primary-btn text-xs py-1 px-3" onClick={() => reviewExtensionRequest(req.id, req.restaurant_id)}>
                              Approve Renewal
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        {view === "approvals" && (
          <div className="page-head">
            <h1>Platform Approvals</h1>
          </div>
        )}

        {view === "pricing" && (
          <>
            <div className="page-head">
              <h1>Pricing & Admin UPI Configuration</h1>
            </div>
            <section className="panel settings-panel">
              <label>
                Admin UPI ID
                <input value={adminUpiId} onChange={(e) => setAdminUpiId(e.target.value)} placeholder="merchant@upi" />
              </label>
              <button className="primary-btn mt-3" onClick={saveAdminUpi} disabled={adminUpiBusy}>
                <Save size={16} /> Save Admin UPI ID
              </button>
            </section>
          </>
        )}
      </main>

      {/* QR CODE MODAL */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Scan to Pay via UPI</DialogTitle>
            <DialogDescription>Scan this QR code using any UPI app</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border space-y-3">
            <div className="w-48 h-48 bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-2">
              <QrCode size={96} className="text-gray-800" />
              <span className="text-[11px] font-mono text-gray-600 mt-2 break-all">{subscriptionUpiId}</span>
            </div>
            <p className="text-xs font-semibold text-indigo-600">{subscriptionUpiId}</p>
          </div>
          <DialogFooter>
            <button className="primary-btn w-full" onClick={() => setShowQrModal(false)}>Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
