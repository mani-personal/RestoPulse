"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { browserDb, authHeaders } from "@/lib/supabase";
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
  AlertTriangle,
  KeyRound,
  RefreshCw,
  Clock,
  X,
  ImageIcon,
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
  | "pricing"
  | "support";

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

type InventoryItem = {
  id: string | number;
  name: string;
  category: string;
  onHand: number;
  unit: string;
  reorderLevel: number;
  cost?: number;
};

type RestaurantApproval = {
  id: string | number;
  name: string;
  city: string;
  submitted: string;
  docs: string;
  status: string;
  owner?: string;
  email?: string;
  phone?: string;
  plan?: string;
};

type EmployeeRole = "Storekeeper" | "Accountant" | "Manager" | "Staff";

type Staff = {
  id: number | string;
  name: string;
  role: EmployeeRole;
  initial: string;
  shift: string;
  payType: "Monthly" | "Weekly" | "Daily";
  monthlySalary: number;
  weeklySalary: number;
  dailyRate: number;
  email: string;
  phone: string;
  active?: boolean;
};

type Wage = {
  id: number | string;
  staffId: number | string;
  date: string;
  amount: number;
  status: "Paid" | "Unpaid";
  note: string;
};

type Expense = {
  id: number | string;
  name: string;
  category: string;
  vendor: string;
  amount: number;
  date: string;
  supplierId?: string | null;
};

type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
};

type SupplierPayment = {
  id: string;
  supplierId: string;
  amount: number;
  date: string;
  method: string;
  note: string;
};

type BillItem = {
  name: string;
  qty: number;
  unitPrice: number;
  discount: number;
};

type Bill = {
  id: string;
  issuedAt: string;
  business?: {
    name: string;
    logo_url: string | null;
    address: string;
    business_phone: string;
    gstin: string;
    receipt_footer: string;
  };
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  cgst: number;
  sgst: number;
  total: number;
  type: string;
  table: string;
  payment: string;
  status: string;
};

type Sale = {
  id: string;
  time: string;
  placedAt: string;
  amount: number;
  type: string;
  status: string;
  bill: Bill;
};

const initialDishes: Dish[] = [
  { id: 1, name: "Burrata & Heirloom Tomato", category: "Appetizers", price: 520, cost: 210, stock: true, emoji: "🍅", diet: "Vegetarian", time: 12 },
  { id: 2, name: "Grilled Salmon Bowl", category: "Mains", price: 790, cost: 330, stock: true, emoji: "🥗", diet: "Gluten-free", time: 18 },
  { id: 3, name: "Dark Chocolate Fondant", category: "Desserts", price: 390, cost: 130, stock: true, emoji: "🍫", diet: "Vegetarian", time: 14 },
  { id: 4, name: "Truffle Mushroom Risotto", category: "Mains", price: 680, cost: 240, stock: true, emoji: "🍄", diet: "Vegetarian", time: 22 },
  { id: 5, name: "Smoked Chicken Tacos", category: "Mains", price: 560, cost: 185, stock: true, emoji: "🌮", diet: "", time: 16 },
  { id: 6, name: "Citrus Mint Cooler", category: "Drinks", price: 240, cost: 65, stock: true, emoji: "🍹", diet: "Vegan", time: 5 },
  { id: 7, name: "Crispy Calamari", category: "Appetizers", price: 490, cost: 210, stock: false, emoji: "🍤", diet: "", time: 15 },
  { id: 8, name: "Margherita Flatbread", category: "Mains", price: 470, cost: 155, stock: true, emoji: "🍕", diet: "Vegetarian", time: 17 },
];

const initialPlans: Plan[] = [
  { id: 1, name: "Free trial", price: 0, period: "7 days", features: "Explore core POS, menu items, inventory, and reports.", active: true },
  { id: 2, name: "Monthly", price: 2999, period: "30 days", features: "Full access, table management, live inventory tracking, POS checkout.", active: true },
  { id: 3, name: "Yearly", price: 29999, period: "365 days", features: "Full platform access, priority support, unlimited staff accounts.", active: true },
];

const chart = [
  { day: "Mon", revenue: 38000, expense: 19000 },
  { day: "Tue", revenue: 44000, expense: 21000 },
  { day: "Wed", revenue: 40500, expense: 18000 },
  { day: "Thu", revenue: 53000, expense: 23000 },
  { day: "Fri", revenue: 64000, expense: 27000 },
  { day: "Sat", revenue: 78000, expense: 33000 },
  { day: "Sun", revenue: 69000, expense: 28000 },
];

const money = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const navTenant: { id: View; label: string; icon: typeof LayoutDashboard; allowedRoles?: string[] }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "pos", label: "POS Terminal", icon: ShoppingBag, allowedRoles: ["owner", "manager", "staff"] },
  { id: "menu", label: "Menu & dishes", icon: UtensilsCrossed, allowedRoles: ["owner", "manager"] },
  { id: "inventory", label: "Inventory", icon: Package, allowedRoles: ["owner", "manager", "storekeeper"] },
  { id: "staff", label: "Team & payroll", icon: Users, allowedRoles: ["owner", "manager", "accountant"] },
  { id: "expenses", label: "Expenses", icon: ReceiptText, allowedRoles: ["owner", "accountant", "manager"] },
  { id: "suppliers", label: "Suppliers", icon: Building2, allowedRoles: ["owner", "accountant", "storekeeper"] },
  { id: "subscription", label: "Subscription", icon: CreditCard, allowedRoles: ["owner"] },
  { id: "settings", label: "Settings", icon: Settings, allowedRoles: ["owner"] },
];

const navPlatform: { id: View; label: string; icon: typeof Building2 }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "restaurants", label: "Restaurants", icon: Building2 },
  { id: "approvals", label: "Approvals", icon: BadgeCheck },
  { id: "pricing", label: "Pricing plans", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];



export default function Home() {
  const db = browserDb;
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // Persistent Selected Workspace Locking
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantHydrating, setTenantHydrating] = useState(true);
  const tenantIdRef = useRef<string | null>(null);
  tenantIdRef.current = tenantId;

  const [currentUserRole, setCurrentUserRole] = useState<string>("owner");

  // Dynamic Workspace Identity
  const [activePlanName, setActivePlanName] = useState<string>("Free trial");
  const [activeRenewalDate, setActiveRenewalDate] = useState<string>("—");
  const [activeRestaurantName, setActiveRestaurantName] = useState<string>("Loading workspace…");
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const [tenantInfo, setTenantInfo] = useState<{
    id?: string;
    name: string;
    logo_url: string | null;
    address: string;
    business_phone: string;
    gstin: string;
    gst_percent: number;
    cgst_percent: number;
    sgst_percent: number;
    receipt_footer: string;
  }>({
    name: "",
    logo_url: null,
    address: "",
    business_phone: "",
    gstin: "",
    gst_percent: 5,
    cgst_percent: 2.5,
    sgst_percent: 2.5,
    receipt_footer: "Thank you for dining with us!",
  });

  const [storeForm, setStoreForm] = useState({
    name: "",
    phone: "",
    address: "",
    gstin: "",
    gst_percent: "5",
    cgst_percent: "2.5",
    sgst_percent: "2.5",
    footer: "Thank you for dining with us!",
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: "sp-1", name: "Green Acres Co.", contact: "Vikram Shah", phone: "+91 98765 00001", email: "vikram@greenacres.in" },
    { id: "sp-2", name: "ProChef Supplies", contact: "Sunita Roy", phone: "+91 98765 00002", email: "sunita@prochef.in" }
  ]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([
    { id: "pay-1", supplierId: "sp-1", amount: 2500, date: "2026-09-26", method: "UPI", note: "Weekly vegetables" }
  ]);
  const [supplierDetail, setSupplierDetail] = useState<string | null>("sp-1");

  const [view, setView] = useState<View>("dashboard");
  const [profileMenu, setProfileMenu] = useState(false);
  const [accountRole, setAccountRole] = useState<"admin" | "restaurant">("restaurant");
  const [mobileNav, setMobileNav] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [dark, setDark] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);

  // Dynamic Plans state synced with server
  const [plans, setPlans] = useState<Plan[]>(initialPlans);

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<RestaurantApproval[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<Array<any>>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Array<any>>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [wages, setWages] = useState<Wage[]>([]);
  const [wageForm, setWageForm] = useState({ date: new Date().toLocaleDateString("en-CA"), amount: "", note: "" });
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [orderType, setOrderType] = useState("Dine-in");
  const [table, setTable] = useState("T01");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [payment, setPayment] = useState("UPI");
  const [sound, setSound] = useState(false);
  const [receipt, setReceipt] = useState<Bill | null>(null);
  const [orders, setOrders] = useState<Sale[]>([]);
  const [modal, setModal] = useState<"plan" | "dish" | "expense" | "restaurant" | "extend" | "employee" | "supplier" | "payment" | "inventory" | "stockAdjust" | "support" | null>(null);
  const [editing, setEditing] = useState<number | string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [dateRange, setDateRange] = useState("This week");
  const [customStartDate, setCustomStartDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [customEndDate, setCustomEndDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [liveDate, setLiveDate] = useState(new Date());
  const [weeklyPaymentForm, setWeeklyPaymentForm] = useState({ start: "", end: "" });

  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<any[]>([]);
  const [saleHistoryOpen, setSaleHistoryOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [invForm, setInvForm] = useState({ name: "", category: "Grains", onHand: "", unit: "bags", reorderLevel: "5" });
  const [editingInvId, setEditingInvId] = useState<string | number | null>(null);
  const [stockAdjustItem, setStockAdjustItem] = useState<InventoryItem | null>(null);
  const [stockAdjustMode, setStockAdjustMode] = useState<"add" | "reduce">("reduce");
  const [stockAdjustQty, setStockAdjustQty] = useState("");
  const [stockAdjustNote, setStockAdjustNote] = useState("");

  const [adminUpiId, setAdminUpiId] = useState<string>("admin-restopulse@upi");
  const [adminUpiBusy, setAdminUpiBusy] = useState(false);
  const [subscriptionUpiId, setSubscriptionUpiId] = useState<string>("admin-restopulse@upi");

  const [supportSections, setSupportSections] = useState<any[]>([]);
  const [supportEditingId, setSupportEditingId] = useState<string | null>(null);
  const [supportForm, setSupportForm] = useState({ title: "Support & Help", description: "Need help with RestoPulse? Contact our support team.", phone: "8122187039", whatsapp: "8122187039", email: "hosurwebservices@gmail.com", active: true });

  const [activeInlinePlan, setActiveInlinePlan] = useState<Plan | null>(null);
  const [inlineRefId, setInlineRefId] = useState("");
  const [inlineScreenshotFile, setInlineScreenshotFile] = useState<File | null>(null);
  const [inlineSubmitBusy, setInlineSubmitBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dish Image Upload Ref
  const dishImageInputRef = useRef<HTMLInputElement>(null);
  const [dishImageUploading, setDishImageUploading] = useState(false);

  const [printPaperSize, setPrintPaperSize] = useState<"58mm" | "85mm" | "A4">("85mm");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  const authedFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = await authHeaders((init.headers || {}) as Record<string, string>);
    return fetch(input, { ...init, headers });
  }, []);

  // Sync Live Pricing Plans from Backend
  const fetchLivePlans = useCallback(async () => {
    try {
      const res = await authedFetch("/api/admin/pricing");
      const data = await res.json();
      if (data?.plans && Array.isArray(data.plans) && data.plans.length) {
        setPlans(data.plans);
        if (!activeInlinePlan) {
          const defaultPlan = data.plans.find((p: Plan) => p.price > 0) || data.plans[0];
          setActiveInlinePlan(defaultPlan);
        }
      }
    } catch {}
  }, [activeInlinePlan]);

  const getPlanDurationDays = (planName: string) => {
    const found = plans.find((p) => p.name.toLowerCase() === planName.toLowerCase());
    if (found) {
      if (found.period.includes("7")) return 7;
      if (found.period.includes("14")) return 14;
      if (found.period.includes("365") || found.period.includes("year")) return 365;
      return 30;
    }
    if (planName.toLowerCase().includes("year")) return 365;
    return 30;
  };

  const switchWorkspace = (rest: any) => {
    if (!rest?.id) return;
    setTenantId(rest.id);
    localStorage.setItem("rp-active-tenant-id", rest.id);
    setActiveRestaurantName(rest.name);
    setActivePlanName(rest.plan || "Free trial");
    setActiveRenewalDate(rest.renewal || rest.renewal_on || "—");
    setTenantInfo((prev) => ({
      ...prev,
      id: rest.id,
      name: rest.name,
      address: rest.city ? `${rest.name}, ${rest.city}` : prev.address,
      business_phone: rest.phone || prev.business_phone,
    }));
    setStoreForm((prev) => ({
      ...prev,
      name: rest.name,
      address: rest.city ? `${rest.name}, ${rest.city}` : prev.address,
      phone: rest.phone || prev.phone,
    }));
    setWorkspaceMenuOpen(false);
  };

  // SYNC ACTIVE RESTAURANT STATUS
  const syncLiveSubscriptionStatus = useCallback(async () => {
    try {
      const currentId = tenantIdRef.current;
      const url = `/api/subscription?restaurant_id=${encodeURIComponent(currentId || "")}&user_id=${encodeURIComponent(authUser || "")}&email=${encodeURIComponent(loginEmail || "")}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.restaurant) {
        if (!tenantIdRef.current) {
          setTenantId(data.restaurant.id);
          localStorage.setItem("rp-active-tenant-id", data.restaurant.id);
          setActiveRestaurantName(data.restaurant.name);
        } else if (tenantIdRef.current === data.restaurant.id) {
          setActiveRestaurantName(data.restaurant.name);
        }

        if (!tenantIdRef.current || tenantIdRef.current === data.restaurant.id) {
          setActivePlanName(data.restaurant.plan || "Free trial");
          // Free Trial is always limited to 7 days. If an older restaurant has no
          // renewal date, derive the trial end from its creation date.
          const createdAt = data.restaurant.created_at ? new Date(data.restaurant.created_at) : null;
          const isTrial = String(data.restaurant.status || "").toLowerCase() === "trial" || String(data.restaurant.plan || "").toLowerCase().includes("free trial");
          const trialEnd = isTrial && createdAt && !Number.isNaN(createdAt.getTime())
            ? new Date(createdAt.getTime() + 7 * 86400000).toISOString().slice(0, 10)
            : null;
          setActiveRenewalDate(trialEnd || data.restaurant.renewal_on || "—");
          setTenantInfo((prev) => ({
            ...prev,
            id: data.restaurant.id,
            name: data.restaurant.name,
            address: data.restaurant.address || prev.address,
            business_phone: data.restaurant.owner_phone || prev.business_phone,
            gstin: data.restaurant.gstin || prev.gstin,
          }));
          setStoreForm((prev) => ({
            ...prev,
            name: data.restaurant.name,
            address: data.restaurant.address || prev.address,
            phone: data.restaurant.owner_phone || prev.phone,
            gstin: data.restaurant.gstin || prev.gstin,
          }));
        }
      }
      if (data?.upi_id) setSubscriptionUpiId(data.upi_id);
      if (Array.isArray(data?.history)) setSubscriptionHistory(data.history);
    } catch {}
  }, [authUser, loginEmail]);

  const fetchAllRestaurants = useCallback(async () => {
    // Restaurant users must never hydrate their workspace from the platform
    // restaurant list. That list can contain every restaurant and can race
    // with membership hydration during the first render, causing a brief
    // switch to another restaurant. Only the platform Admin needs this list.
    if (!isAdmin) return;
    try {
      const res = await authedFetch("/api/admin/restaurants");
      const json = await res.json();
      const data = Array.isArray(json?.restaurants) ? json.restaurants : [];
      if (res.ok) {
          if (!data.length) { setRestaurants([]); return; }
          const mapped = data.map((x: any) => ({
            id: x.id,
            name: x.name,
            owner: x.owner_name,
            email: x.owner_email,
            phone: x.owner_phone,
            city: x.city,
            plan: x.plan,
            status: x.status,
            renewal: x.renewal_on || "—",
            initial: (x.name || "RS").slice(0, 2).toUpperCase(),
          }));
          setRestaurants(mapped);

          const savedTenantId = localStorage.getItem("rp-active-tenant-id");
          const target = mapped.find((r: any) => r.id === savedTenantId) || mapped.find((r: any) => r.id === tenantIdRef.current) || mapped[0];

          if (!tenantIdRef.current && target) {
            setTenantId(target.id);
            setActiveRestaurantName(target.name);
            setActivePlanName(target.plan || "Free trial");
            setActiveRenewalDate(target.renewal || "—");
          } else if (tenantIdRef.current) {
            const current = mapped.find((r: any) => r.id === tenantIdRef.current);
            if (current) {
              setActivePlanName(current.plan || "Free trial");
              setActiveRenewalDate(current.renewal || "—");
            }
          }
        }
    } catch {}
  }, [authedFetch, isAdmin]);

  const fetchRealApprovals = useCallback(async () => {
    try {
      const res = await authedFetch("/api/admin/approvals");
      const json = await res.json();
      if (json?.approvals) {
        setApprovals(json.approvals);
      }
    } catch {}
  }, []);

  const fetchSubscriptionRequests = useCallback(async () => {
    try {
      const res = await authedFetch("/api/admin/subscriptions");
      const json = await res.json();
      if (json?.requests) setSubscriptionRequests(json.requests);
      if (json?.history) setSubscriptionHistory(json.history);
    } catch {
      const localReqs = localStorage.getItem("rp-local-sub-requests");
      if (localReqs) setSubscriptionRequests(JSON.parse(localReqs));
    }
  }, []);

  const fetchSupportSections = useCallback(async () => {
    try {
      const res = await authedFetch("/api/support");
      const json = await res.json();
      if (res.ok && Array.isArray(json?.sections)) setSupportSections(json.sections);
    } catch {}
  }, [authedFetch]);

  const saveSupportSection = async () => {
    if (!supportForm.title.trim()) { toast.error("Enter a support section title"); return; }
    try {
      const res = await authedFetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...supportForm, id: supportEditingId || undefined })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save support section");
      setSupportSections(json.sections || []);
      setSupportEditingId(null);
      setSupportForm({ title: "Support & Help", description: "Need help with RestoPulse? Contact our support team.", phone: "8122187039", whatsapp: "8122187039", email: "hosurwebservices@gmail.com", active: true });
      toast.success("Support section saved");
    } catch (e:any) { toast.error(e.message || "Could not save support section"); }
  };

  const deleteSupportSection = async (id:string) => {
    if (!confirm("Delete this support section?")) return;
    try {
      const res = await authedFetch(`/api/support?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not delete support section");
      setSupportSections(json.sections || []);
      if (supportEditingId === id) setSupportEditingId(null);
      toast.success("Support section deleted");
    } catch (e:any) { toast.error(e.message || "Could not delete support section"); }
  };

  const AdminSettingsPanel = () => {
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">PLATFORM SETTINGS</div>
          <h1>Admin Settings</h1>
          <p>Manage platform-level payment, account, and subscription settings.</p>
        </div>
      </div>
      <div className="settings-grid grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <section className="panel settings-panel">
          <h2>Platform payments</h2>
          <p className="text-xs text-muted-foreground mt-1">UPI ID used by restaurants for subscription payments.</p>
          <div className="settings-fields">
            <label>Admin UPI ID<input value={adminUpiId} onChange={(e) => setAdminUpiId(e.target.value)} placeholder="merchant@upi" /></label>
          </div>
          <button className="primary-btn" onClick={saveAdminUpi} disabled={adminUpiBusy}>{adminUpiBusy ? "Saving…" : "Save Admin UPI ID"}</button>
        </section>
        <section className="panel settings-panel">
          <h2>Admin account</h2>
          <p className="text-xs text-muted-foreground mt-1">Signed in as the RestoPulse platform administrator.</p>
          <div className="settings-fields">
            <label>Email<input value={loginEmail} readOnly /></label>
            <label>Role<input value="Platform Administrator" readOnly /></label>
          </div>
        </section>
        <section className="panel settings-panel md:col-span-2">
          <h2>Subscription operations</h2>
          <div className="platform-stats mt-4">
            <div><span>Active / Trial</span><strong>{restaurants.filter((r:any)=>["Active","Trial"].includes(r.status)).length}</strong></div>
            <div><span>Expired</span><strong>{restaurants.filter((r:any)=>r.renewal && new Date(r.renewal) < new Date()).length}</strong></div>
            <div><span>Pending approvals</span><strong>{subscriptionRequests.length + approvals.length}</strong></div>
            <div><span>Revenue</span><strong>{money(subscriptionHistory.filter((x:any)=>x.status === "Approved").reduce((n:number,x:any)=>n+Number(x.amount||0),0))}</strong></div>
          </div>
        </section>
        <section className="panel settings-panel md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2>Support & Help Management</h2>
              <p className="text-xs text-muted-foreground mt-1">Manage the support information displayed to restaurant users under their profile menu.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <label>Title<input value={supportForm.title} onChange={e=>setSupportForm({...supportForm,title:e.target.value})}/></label>
            <label>Email<input type="email" value={supportForm.email} onChange={e=>setSupportForm({...supportForm,email:e.target.value})}/></label>
            <label>Call mobile number<input value={supportForm.phone} onChange={e=>setSupportForm({...supportForm,phone:e.target.value})}/></label>
            <label>WhatsApp mobile number<input value={supportForm.whatsapp} onChange={e=>setSupportForm({...supportForm,whatsapp:e.target.value})}/></label>
            <label className="md:col-span-2">Description<textarea value={supportForm.description} onChange={e=>setSupportForm({...supportForm,description:e.target.value})} className="w-full min-h-20 border rounded-lg p-2 bg-background text-xs"/></label>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="primary-btn" onClick={saveSupportSection}>{supportEditingId ? "Update support section" : "Add support section"}</button>
            {supportEditingId && <button className="quiet-btn" onClick={()=>{setSupportEditingId(null);setSupportForm({ title: "Support & Help", description: "Need help with RestoPulse? Contact our support team.", phone: "8122187039", whatsapp: "8122187039", email: "hosurwebservices@gmail.com", active: true });}}>Cancel edit</button>}
          </div>
          <div className="mt-5 space-y-2">
            {supportSections.map((section:any)=><div key={section.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-xl p-3">
              <div><b>{section.title}</b><p className="text-xs text-muted-foreground">{section.phone} · {section.email}</p></div>
              <div className="flex gap-2"><button className="quiet-btn text-xs" onClick={()=>{setSupportEditingId(section.id);setSupportForm({...section,phone:section.phone||"",whatsapp:section.whatsapp||"",email:section.email||"",description:section.description||""});}}>Edit</button><button className="quiet-btn text-xs text-red-600" onClick={()=>deleteSupportSection(section.id)}>Delete</button></div>
            </div>)}
            {!supportSections.length && <div className="text-xs text-muted-foreground py-2">No support sections configured.</div>}
          </div>
        </section>
      </div>
    </div>
  );
  };

  useEffect(() => {
  if (!db) {
      setAuthLoading(false);
      return;
    }
    let live = true;
    db.auth.getSession().then(({ data }: { data: { session: any } }) => {
      if (live) {
        setAuthUser(data.session?.user.id || null);
        setLoginEmail(data.session?.user?.email || "");
        setAuthLoading(false);
      }
    });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event: string, session: any) => {
      setAuthUser(session?.user.id || null);
      setLoginEmail(session?.user?.email || "");
      setAuthLoading(false);
    });
    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, [db]);

  // Reset workspace state whenever the authenticated user changes. This prevents
  // a previous user's tenant/localStorage value from being rendered while the
  // new user's membership is still being resolved.
  useEffect(() => {
    if (!authUser) {
      setTenantId(null);
      setTenantHydrating(false);
      setActiveRestaurantName("Loading workspace…");
      return;
    }
    setTenantHydrating(true);
    setTenantId(null);
    setActiveRestaurantName("Loading workspace…");
    setActivePlanName("Free trial");
    setActiveRenewalDate("—");
    setTenantInfo((prev) => ({ ...prev, id: undefined, name: "" }));
  }, [authUser]);

  useEffect(() => {
    if (!db || !authUser) return;
    let live = true;
    (async () => {
      try {
        const [a, m] = await Promise.all([
          db.from("platform_admins").select("user_id").eq("user_id", authUser).maybeSingle(),
          db.from("memberships").select("restaurant_id,role").eq("user_id", authUser).limit(1).maybeSingle(),
        ]);
        if (!live) return;
        const platform = !!a?.data;
        setIsAdmin(platform);
        setAccountRole(platform ? "admin" : "restaurant");
        if (m?.data?.role) {
          setCurrentUserRole(m.data.role.toLowerCase());
        }
        // Restaurant users must always derive the active workspace from their
        // authenticated membership. Do not trust a previously saved workspace
        // id here: localStorage may belong to a different restaurant/user and
        // can race with this hydration on first load.
        if (!platform) {
          const membershipRestaurantId = m?.data?.restaurant_id || null;
          // The authenticated membership is the source of truth for a
          // restaurant user's workspace. A stale localStorage id must never
          // override it during startup.
          setTenantId(membershipRestaurantId);
          if (membershipRestaurantId) {
            localStorage.setItem("rp-active-tenant-id", membershipRestaurantId);
          } else {
            localStorage.removeItem("rp-active-tenant-id");
          }
          setTenantHydrating(false);
        } else {
          // Admins do not have a restaurant workspace to hydrate.
          setTenantHydrating(false);
        }
      } catch (e) {
        console.error("Auth hydration error", e);
      }
    })();
    return () => {
      live = false;
    };
  }, [db, authUser]);

  useEffect(() => {
    if (!authUser) return;
    const loadUpi = async () => {
      try {
        if (isAdmin) {
          const res = await authedFetch("/api/admin/settings");
          const data = await res.json();
          if (res.ok && data?.value) { setAdminUpiId(data.value); setSubscriptionUpiId(data.value); }
        } else if (tenantId) {
          const res = await authedFetch(`/api/subscription?restaurant_id=${encodeURIComponent(tenantId)}`);
          const data = await res.json();
          if (res.ok && data?.upi_id) setSubscriptionUpiId(data.upi_id);
        }
      } catch {}
    };
    loadUpi();
  }, [authUser, tenantId, isAdmin, authedFetch]);

  // Keep the dashboard date/time synchronized with the device clock.
  useEffect(() => {
    const syncClock = () => setLiveDate(new Date());
    syncClock();
    const timer = window.setInterval(syncClock, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Initial hydration + Supabase Realtime. Polling is intentionally avoided so
  // multiple tabs/devices do not generate duplicate API/database traffic.
  useEffect(() => {
    if (!authUser) return;
    fetchSupportSections();
    // Platform data is loaded only for Admin. Restaurant users must not load
    // the platform restaurant list during startup because it can overwrite the
    // authenticated membership workspace before hydration finishes.
    if (isAdmin) {
      fetchSubscriptionRequests();
      fetchRealApprovals();
      fetchAllRestaurants();
      fetchLivePlans();
    }
    if (!isAdmin && tenantId) {
      syncLiveSubscriptionStatus();
    }
  }, [authUser, isAdmin, tenantId, fetchSubscriptionRequests, fetchRealApprovals, fetchAllRestaurants, syncLiveSubscriptionStatus, fetchLivePlans, fetchSupportSections]);

  const loadRestaurantData = useCallback(async (id: string) => {
    if (!id || isAdmin) return;
    setIsDataLoading(true);
    try {
      const [salesRes, inventoryRes, menuRes, expensesRes, supplierRes, paymentRes, staffRes, wagesRes] = await Promise.all([
        authedFetch(`/api/sales?restaurant_id=${encodeURIComponent(id)}`),
        authedFetch(`/api/inventory?restaurant_id=${encodeURIComponent(id)}`),
        db.from("menu_items").select("*").eq("restaurant_id", id).order("created_at", { ascending: false }),
        db.from("expenses").select("*").eq("restaurant_id", id).order("incurred_on", { ascending: false }),
        db.from("suppliers").select("*").eq("restaurant_id", id).order("name"),
        db.from("supplier_payments").select("*").eq("restaurant_id", id).order("paid_on", { ascending: false }),
        db.from("employees").select("*").eq("restaurant_id", id).order("name"),
        db.from("daily_wages").select("*").eq("restaurant_id", id).order("wage_date", { ascending: false }),
      ]);
      const salesJson = await salesRes.json().catch(() => ({sales: []}));
      const inventoryJson = await inventoryRes.json().catch(() => ({items: [], transactions: []}));
      if (salesRes.ok) setOrders((salesJson.sales || []).map((s:any) => ({
        id:s.bill_no || s.id, time:new Date(s.placed_at).toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"}),
        placedAt:s.placed_at, amount:Number(s.amount)||0, type:s.order_type, status:s.status, bill:s.receipt
      })));
      if (inventoryRes.ok) {
        setInventoryList((inventoryJson.items || []).map((x:any)=>({id:x.id,name:x.name,category:x.category,onHand:Number(x.on_hand),unit:x.unit,reorderLevel:Number(x.reorder_level),cost:Number(x.cost||0)})));
        setInventoryTransactions(inventoryJson.transactions || []);
      }
      if (!menuRes.error) setDishes((menuRes.data || []).map((x:any)=>({id:x.id,name:x.name,category:x.category,price:Number(x.price),cost:Number(x.cost),stock:x.available,emoji:x.emoji,diet:x.diet,time:x.prep_minutes,imageUrl:x.image_url})));
      if (!expensesRes.error) setExpenses((expensesRes.data || []).map((x:any)=>({id:x.id,name:x.name,category:x.category,vendor:x.vendor,amount:Number(x.amount),date:x.incurred_on,supplierId:x.supplier_id})));
      if (!supplierRes.error) setSuppliers((supplierRes.data || []).map((x:any)=>({id:x.id,name:x.name,contact:x.contact_name,phone:x.phone,email:x.email})));
      if (!paymentRes.error) setSupplierPayments((paymentRes.data || []).map((x:any)=>({id:x.id,supplierId:x.supplier_id,amount:Number(x.amount),date:x.paid_on,method:x.method,note:x.note})));
      if (!staffRes.error) setStaff((staffRes.data || []).map((x:any)=>({id:x.id,name:x.name,role:x.role,initial:x.name.slice(0,2).toUpperCase(),shift:x.shift,payType:x.pay_type||"Daily",monthlySalary:Number(x.monthly_salary||0),weeklySalary:Number(x.weekly_salary||0),dailyRate:Number(x.daily_rate||0),email:x.email,phone:x.phone,active:x.active})));
      if (!wagesRes.error) setWages((wagesRes.data || []).map((x:any)=>({id:x.id,staffId:x.employee_id,date:x.wage_date,amount:Number(x.amount),status:x.status,note:x.note})));
    } catch (e) {
      console.error("Restaurant data load failed", e);
      toast.error("Some restaurant data could not be loaded.");
    } finally { setIsDataLoading(false); }
  }, [authedFetch, db, isAdmin]);

  useEffect(() => {
    if (tenantId && !isAdmin) loadRestaurantData(tenantId);
  }, [tenantId, isAdmin, loadRestaurantData]);

  useEffect(() => {
    if (!authUser || !db) return;
    const channels:any[] = [];
    const refreshRestaurant = () => { if (tenantIdRef.current && !isAdmin) loadRestaurantData(tenantIdRef.current); syncLiveSubscriptionStatus(); };
    if (tenantId && !isAdmin) {
      const filter = `restaurant_id=eq.${tenantId}`;
      ["sales","inventory_items","inventory_transactions","expenses","employees","daily_wages","suppliers","supplier_payments"].forEach((table) => {
        channels.push(db.channel(`rp-${table}-${tenantId}-${Math.random()}`)
          .on("postgres_changes",{event:"*",schema:"public",table,filter},refreshRestaurant).subscribe());
      });
      channels.push(db.channel(`rp-sub-${tenantId}-${Math.random()}`)
        .on("postgres_changes",{event:"*",schema:"public",table:"subscription_requests",filter},refreshRestaurant).subscribe());
    }
    if (isAdmin) {
      channels.push(db.channel(`rp-admin-restaurants-${Math.random()}`)
        .on("postgres_changes",{event:"*",schema:"public",table:"restaurants"},()=>{fetchAllRestaurants();fetchRealApprovals();syncLiveSubscriptionStatus();}).subscribe());
      channels.push(db.channel(`rp-admin-subscriptions-${Math.random()}`)
        .on("postgres_changes",{event:"*",schema:"public",table:"subscription_requests"},()=>{fetchSubscriptionRequests();syncLiveSubscriptionStatus();}).subscribe());
      channels.push(db.channel(`rp-admin-settings-${Math.random()}`)
        .on("postgres_changes",{event:"*",schema:"public",table:"settings"},()=>{fetchLivePlans();}).subscribe());
    }
    return () => { channels.forEach(ch => db.removeChannel(ch)); };
  }, [authUser, tenantId, isAdmin, db, loadRestaurantData, syncLiveSubscriptionStatus, fetchAllRestaurants, fetchRealApprovals, fetchSubscriptionRequests, fetchLivePlans]);

  const saveInventoryToStorage = (updated: InventoryItem[]) => setInventoryList(updated);
  const saveDishesToStorage = (updated: Dish[]) => setDishes(updated);

  const handleAddOrEditInventory = async () => {
    if (!tenantId) return;
    if (!invForm.name.trim()) { toast.error("Please enter an item name"); return; }
    const qty = Number(invForm.onHand), reorder = Number(invForm.reorderLevel);
    if (!Number.isFinite(qty) || qty < 0) { toast.error("Enter a valid quantity on hand"); return; }
    try {
      const res = await authedFetch("/api/inventory", {
        method: "POST",
        body: JSON.stringify({
          restaurant_id: tenantId,
          id: editingInvId || undefined,
          name: invForm.name.trim(),
          category: invForm.category,
          on_hand: qty,
          unit: invForm.unit,
          reorder_level: Number.isFinite(reorder) ? reorder : 5,
          transaction_type: editingInvId ? "Adjustment" : "Opening balance",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save inventory item");
      await loadRestaurantData(tenantId);
      setModal(null); setEditingInvId(null);
      setInvForm({ name: "", category: "Grains", onHand: "", unit: "bags", reorderLevel: "5" });
      toast.success(editingInvId ? "Inventory item updated successfully!" : "Inventory item added successfully!");
    } catch (e:any) { toast.error(e.message || "Could not save inventory item"); }
  };

  const handleDeleteInventory = async (id: string | number) => {
    if (!tenantId || !confirm("Are you sure you want to delete this inventory item?")) return;
    try {
      const res = await authedFetch("/api/inventory", { method: "DELETE", body: JSON.stringify({ restaurant_id: tenantId, id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not delete inventory item");
      await loadRestaurantData(tenantId);
      toast.success("Inventory item deleted");
    } catch (e:any) { toast.error(e.message || "Could not delete inventory item"); }
  };

  const adjustInventory = async (item: InventoryItem, delta: number, type: string, note = "") => {
    if (!tenantId || item.onHand + delta < 0) { toast.error("Stock cannot go below zero"); return false; }
    try {
      const res=await authedFetch("/api/inventory",{method:"POST",body:JSON.stringify({
        restaurant_id:tenantId,id:item.id,name:item.name,category:item.category,on_hand:item.onHand+delta,unit:item.unit,
        reorder_level:item.reorderLevel,transaction_type:type,note
      })});
      const json=await res.json(); if(!res.ok)throw new Error(json.error||"Could not update stock");
      await loadRestaurantData(tenantId); toast.success(`${type}: ${item.name}`);
      return true;
    }catch(e:any){toast.error(e.message||"Could not update stock"); return false;}
  };

  const openStockAdjustment = (item: InventoryItem, mode: "add" | "reduce") => {
    if (mode === "reduce" && item.onHand <= 0) {
      toast.error(`${item.name} is already out of stock`);
      return;
    }
    setStockAdjustItem(item);
    setStockAdjustMode(mode);
    setStockAdjustQty("");
    setStockAdjustNote("");
    setModal("stockAdjust");
  };

  const openStockReduction = (item: InventoryItem) => openStockAdjustment(item, "reduce");

  const openStockAddition = (item: InventoryItem) => openStockAdjustment(item, "add");

  const submitStockAdjustment = async () => {
    if (!stockAdjustItem) return;
    const qty = Number(stockAdjustQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Enter a quantity greater than 0");
      return;
    }
    if (stockAdjustMode === "reduce" && qty > stockAdjustItem.onHand) {
      toast.error(`You can reduce a maximum of ${stockAdjustItem.onHand} ${stockAdjustItem.unit}`);
      return;
    }
    const delta = stockAdjustMode === "add" ? qty : -qty;
    const type = stockAdjustMode === "add" ? "Stock addition" : "Stock reduction";
    const defaultNote = stockAdjustMode === "add"
      ? `Manual stock addition of ${qty} ${stockAdjustItem.unit}`
      : `Manual stock reduction of ${qty} ${stockAdjustItem.unit}`;
    const ok = await adjustInventory(stockAdjustItem, delta, type, stockAdjustNote.trim() || defaultNote);
    if (ok) {
      setModal(null);
      setStockAdjustItem(null);
      setStockAdjustQty("");
      setStockAdjustNote("");
    }
  };


  const openInventoryModal = (item?: InventoryItem) => {
    if (item) {
      setEditingInvId(item.id);
      setInvForm({
        name: item.name,
        category: item.category,
        onHand: String(item.onHand),
        unit: item.unit,
        reorderLevel: String(item.reorderLevel),
      });
    } else {
      setEditingInvId(null);
      setInvForm({ name: "", category: "Grains", onHand: "", unit: "bags", reorderLevel: "5" });
    }
    setModal("inventory");
  };

  // Image upload handler for Dishes
  const handleDishImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB");
      return;
    }

    setDishImageUploading(true);
    try {
      let uploadedUrl = "";
      if (db) {
        const filePath = `${tenantId}/dishes/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const { error: uploadErr } = await db.storage
          .from("restaurant-media")
          .upload(filePath, file, { contentType: file.type, upsert: true });

        if (!uploadErr) {
          const { data: pubData } = db.storage.from("restaurant-media").getPublicUrl(filePath);
          uploadedUrl = pubData.publicUrl;
        }
      }

      if (!uploadedUrl) {
        // Fallback to base64 encoding if storage bucket is not configured
        uploadedUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      setForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      toast.success("Dish image uploaded successfully!");
    } catch {
      toast.error("Failed to process image file");
    } finally {
      setDishImageUploading(false);
    }
  };

  useEffect(() => {
    setDark(localStorage.getItem("rp-theme") === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("rp-theme", dark ? "dark" : "light");
  }, [dark]);

  const displayed = dishes.filter(
    (d) => (category === "All items" || d.category === category) && d.name.toLowerCase().includes(query.toLowerCase())
  );

  const subtotal = cart.reduce((sum, l) => {
    const d = dishes.find((x) => x.id === l.id);
    return sum + (l.override ?? d?.price ?? 0) * l.qty;
  }, 0);
  const lineDiscount = cart.reduce((sum, l) => sum + l.discount * l.qty, 0);
  const totalDiscount = Math.min(subtotal, lineDiscount + orderDiscount);
  
  const effectiveGst = tenantInfo.gst_percent || 5;
  const tax = Math.round((subtotal - totalDiscount) * (effectiveGst / 100));
  const cgstAmount = Math.round(tax / 2);
  const sgstAmount = tax - cgstAmount;
  const total = subtotal - totalDiscount + tax;

  const addCart = (id: number | string) => {
    setCart((old) => {
      const found = old.find((l) => l.id === id);
      return found ? old.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)) : [...old, { id, qty: 1, discount: 0 }];
    });
    if (sound) {
      try {
        const ctx = new AudioContext();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 650;
        g.gain.value = 0.025;
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.06);
      } catch {}
    }
  };

  const qty = (id: number | string, delta: number) =>
    setCart((old) => old.map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0));

  const open = (which: typeof modal, id?: number | string) => {
    setModal(which);
    setEditing(id ?? null);
    if (which === "plan") {
      if (id) {
        const p = plans.find((x) => x.id === id);
        if (p) {
          setForm({
            name: p.name,
            price: String(p.price),
            period: p.period,
            features: p.features || "",
          });
        }
      } else {
        setForm({
          name: "",
          price: "",
          period: "30 days",
          features: "",
        });
      }
    } else if (which === "supplier" && id !== undefined) {
      const sp = suppliers.find((x) => x.id === id)!;
      setForm({ name: sp.name, contact: sp.contact, phone: sp.phone, email: sp.email });
    } else if (which === "employee" && id !== undefined) {
      const member = staff.find((x) => x.id === id)!;
      setForm({
        name: member.name,
        role: member.role,
        shift: member.shift,
        payType: member.payType || "Monthly",
        monthlySalary: String(member.monthlySalary || 0),
        weeklySalary: String(member.weeklySalary || 0),
        dailyRate: String(member.dailyRate || 0),
        email: member.email,
        phone: member.phone,
        active: member.active !== false ? "true" : "false",
      });
    } else if (which === "dish") {
      if (id) {
        const d = dishes.find((x) => x.id === id)!;
        setForm({
          name: d.name,
          category: d.category,
          price: String(d.price),
          cost: String(d.cost),
          emoji: d.emoji || "🍽",
          imageUrl: d.imageUrl || "",
          diet: d.diet || "",
          time: String(d.time || 15),
        });
      } else {
        setForm({
          name: "",
          category: "Mains",
          price: "",
          cost: "",
          emoji: "🍽",
          imageUrl: "",
          diet: "",
          time: "15",
        });
      }
    } else setForm({});
  };

  // Dish deletion handler
  const handleDeleteDish = async (dishId: number | string) => {
    if (!tenantId || !confirm("Are you sure you want to delete this dish from the menu?")) return;
    const { error } = await db.from("menu_items").delete().eq("restaurant_id", tenantId).eq("id", dishId);
    if (error) { toast.error(error.message); return; }
    setDishes((old) => old.filter((d) => d.id !== dishId));
    toast.success("Dish deleted successfully!");
  };

  // ADMIN PLAN EDITING & CREATION (SAVES DIRECTLY TO DATABASE)
  const save = async () => {
    if (modal === "restaurant") {
      if (!form.name?.trim() || !form.owner?.trim() || !form.email?.trim() || !form.phone?.trim()) {
        toast.error("Restaurant, owner, email and phone are required"); return;
      }
      try {
        const method=editing!==null?"PATCH":"POST";
        const body:any={id:editing||undefined,name:form.name.trim(),owner:form.owner.trim(),email:form.email.trim(),phone:form.phone.trim(),city:form.city||""};
        if(method==="POST") body.password=form.password||"";
        else { body.owner_name=form.owner.trim(); body.owner_email=form.email.trim(); body.owner_phone=form.phone.trim(); body.address=form.address||""; body.plan=form.plan||"Free Trial"; body.status=form.status||"Active"; body.renewal_on=form.renewal||null; }
        const res=await authedFetch("/api/admin/restaurants",{method,body:JSON.stringify(body)});
        const json=await res.json(); if(!res.ok)throw new Error(json.error||"Could not save restaurant");
        setModal(null); setEditing(null); await fetchAllRestaurants();
        if (method === "POST" && json.temporary_password) {
          toast.success(`Restaurant created. Temporary password: ${json.temporary_password}`, { duration: 10000 });
        } else {
          toast.success(editing!==null ? "Restaurant updated" : "Restaurant created");
        }
      } catch(e:any){toast.error(e.message||"Could not save restaurant");}
      return;
    }
    if (modal === "extend") {
      if (!editing) { toast.error("Select a restaurant first"); return; }
      const days = Number(form.days || 30);
      if (!Number.isFinite(days) || days <= 0) { toast.error("Enter a valid extension period"); return; }
      try {
        const res = await authedFetch("/api/admin/subscriptions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "extend", restaurant_id: String(editing), days_to_add: days })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not extend subscription");
        setModal(null); setEditing(null);
        await fetchAllRestaurants();
        toast.success(`Subscription extended until ${json.renewal_on || "the new renewal date"}.`);
      } catch (e:any) { toast.error(e.message || "Could not extend subscription"); }
      return;
    }
    if (modal === "plan") {
      if (!form.name?.trim() || !Number.isFinite(Number(form.price))) {
        toast.error("Enter a valid plan name and price");
        return;
      }
      const p: Plan = {
        id: editing !== null ? Number(editing) : Date.now(),
        name: form.name.trim(),
        price: Number(form.price),
        period: form.period || "30 days",
        features: form.features || "",
        active: true,
      };

      const updatedPlans = editing ? plans.map((x) => (x.id === editing ? p : x)) : [...plans, p];
      setPlans(updatedPlans);

      try {
        await authedFetch("/api/admin/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plans: updatedPlans }),
        });
        toast.success(editing ? "Plan updated successfully!" : "Plan created successfully!");
      } catch {
        toast.error("Failed to save pricing changes to server.");
      }
    }
    if (modal === "dish") {
      if (!tenantId || !form.name?.trim() || Number(form.price) <= 0) {
        toast.error("Enter a dish name and valid price"); return;
      }
      const payload = {
        restaurant_id: tenantId, name: form.name.trim(), category: form.category || "Mains",
        price: Number(form.price), cost: Number(form.cost) || 0, available: editing ? (dishes.find(x=>x.id===editing)?.stock ?? true) : true,
        emoji: form.emoji || "🍽", image_url: form.imageUrl?.trim() || null, diet: form.diet || "", prep_minutes: Number(form.time) || 15
      };
      const result = editing
        ? await db.from("menu_items").update(payload).eq("restaurant_id", tenantId).eq("id", editing).select().single()
        : await db.from("menu_items").insert(payload).select().single();
      if (result.error) { toast.error(result.error.message); return; }
      const x:any=result.data;
      const d: Dish={id:x.id,name:x.name,category:x.category,price:Number(x.price),cost:Number(x.cost),stock:x.available,emoji:x.emoji,diet:x.diet,time:x.prep_minutes,imageUrl:x.image_url};
      setDishes(old=>editing?old.map(v=>v.id===editing?d:v):[d,...old]);
      toast.success(editing ? "Dish updated successfully!" : "Dish added successfully!");
    }
    if (modal === "expense") {
      if (!form.name?.trim() || Number(form.amount) <= 0) {
        toast.error("Enter a description and amount");
        return;
      }
      const supplier = suppliers.find((x) => x.id === form.supplierId);
      const newExp: Expense = {
        id: Date.now(),
        name: form.name,
        category: form.category || "Inventory",
        vendor: supplier?.name || form.vendor || "—",
        amount: Number(form.amount),
        date: form.date || new Date().toISOString().slice(0, 10),
        supplierId: supplier?.id || null,
      };
      if (!tenantId) return;
      const { data, error } = await db.from("expenses").insert({
        restaurant_id: tenantId, supplier_id: supplier?.id || null, name: newExp.name,
        category: newExp.category, vendor: newExp.vendor, amount: newExp.amount, incurred_on: newExp.date
      }).select().single();
      if (error) { toast.error(error.message); return; }
      setExpenses((old) => [{...newExp,id:data.id}, ...old]);
      toast.success("Expense recorded");
    }
    if (modal === "supplier") {
      const name = form.name?.trim();
      if (!name) {
        toast.error("Enter a supplier name");
        return;
      }
      const newSup: Supplier = {
        id: editing ? String(editing) : "sp-" + Date.now(),
        name,
        contact: form.contact || "",
        phone: form.phone || "",
        email: form.email || "",
      };
      if (!tenantId) return;
      const payload={restaurant_id:tenantId,name:newSup.name,contact_name:newSup.contact,phone:newSup.phone,email:newSup.email};
      const result=editing ? await db.from("suppliers").update(payload).eq("restaurant_id",tenantId).eq("id",String(editing)).select().single()
        : await db.from("suppliers").insert(payload).select().single();
      if(result.error){toast.error(result.error.message);return;}
      const mapped={...newSup,id:result.data.id};
      setSuppliers(old=>editing?old.map(x=>x.id===editing?mapped:x):[mapped,...old]);
      setSupplierDetail(mapped.id); toast.success(editing ? "Supplier updated" : "Supplier added");
    }
    if (modal === "payment") {
      if (!form.supplierId || Number(form.amount) <= 0) {
        toast.error("Select a supplier and enter a positive amount");
        return;
      }
      const newPay: SupplierPayment = {
        id: "pay-" + Date.now(),
        supplierId: form.supplierId,
        amount: Number(form.amount),
        date: form.date || new Date().toISOString().slice(0, 10),
        method: form.method || "Cash",
        note: form.note || "",
      };
      if (!tenantId) return;
      const {data,error}=await db.from("supplier_payments").insert({
        restaurant_id:tenantId,supplier_id:newPay.supplierId,amount:newPay.amount,paid_on:newPay.date,method:newPay.method,note:newPay.note
      }).select().single();
      if(error){toast.error(error.message);return;}
      setSupplierPayments(old=>[{...newPay,id:data.id},...old]); toast.success("Payment recorded");
    }

    if (modal === "employee") {
      if (!form.name?.trim()) {
        toast.error("Enter employee name");
        return;
      }
      const payType = (form.payType as "Monthly" | "Weekly" | "Daily") || "Monthly";
      const monthlySalary = Number(form.monthlySalary) || 0;
      const weeklySalary = Number(form.weeklySalary) || 0;
      const dailyRate = Number(form.dailyRate) || (payType === "Monthly" ? Math.round(monthlySalary / 30) : payType === "Weekly" ? Math.round(weeklySalary / 7) : 0);

      const person: Staff = {
        id: editing ?? Date.now(),
        name: form.name.trim(),
        role: (form.role as EmployeeRole) || "Staff",
        initial: form.name.trim().split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase(),
        shift: form.shift || "09:00 – 18:00",
        payType,
        monthlySalary,
        weeklySalary,
        dailyRate,
        email: form.email || "staff@restopulse.demo",
        phone: form.phone || "",
        active: form.active !== "false",
      };
      if (!tenantId) return;
      const payload={restaurant_id:tenantId,name:person.name,role:person.role,shift:person.shift,daily_rate:person.dailyRate,pay_type:person.payType,monthly_salary:person.monthlySalary,weekly_salary:person.weeklySalary,email:person.email,phone:person.phone,active:person.active!==false};
      const result=editing !== null ? await db.from("employees").update(payload).eq("restaurant_id",tenantId).eq("id",String(editing)).select().single()
        : await db.from("employees").insert(payload).select().single();
      if(result.error){toast.error(result.error.message);return;}
      const mapped={...person,id:result.data.id}; setStaff(old=>editing!==null?old.map(x=>x.id===editing?mapped:x):[mapped,...old]);
      toast.success(editing !== null ? "Employee updated" : "Employee added");
    }
    setModal(null);
  };

  // ADMIN PLAN DELETION HANDLER
  const handleDeletePlan = async (planId: number) => {
    const target = plans.find(p=>p.id===planId);
    if (target && restaurants.some((r:any)=>String(r.plan).toLowerCase()===target.name.toLowerCase())) {
      toast.error("This plan is assigned to one or more restaurants. Deactivate or migrate them before removing it.");
      return;
    }
    if (!confirm("Are you sure you want to remove this pricing plan?")) return;
    const filtered = plans.filter((p) => p.id !== planId);
    setPlans(filtered);
    try {
      await authedFetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: filtered }),
      });
      toast.success("Pricing plan deleted successfully");
    } catch {
      toast.error("Failed to update pricing on server.");
    }
  };

  const checkout = async () => {
    if (subscriptionExpired) { toast.error("Your trial/subscription has ended. Please renew to continue using the app."); nav("subscription"); return; }
    if (!cart.length || !tenantId) { toast.error("Add dishes to the order first"); return; }
    const now = new Date();
    const id = "RP-" + now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14) + "-" + crypto.randomUUID().slice(0, 4).toUpperCase();
    const time = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    const bill: Bill = {
      id, issuedAt: now.toLocaleString("en-IN"), business: tenantInfo,
      items: cart.map((l) => ({ name: dishes.find((d) => d.id === l.id)?.name || "Menu item", qty: l.qty, unitPrice: l.override ?? dishes.find((d) => d.id === l.id)?.price ?? 0, discount: l.discount })),
      subtotal, discount: totalDiscount, tax, cgst: cgstAmount, sgst: sgstAmount, total,
      type: orderType, table: orderType === "Dine-in" ? table : "", payment, status: "Paid",
    };
    try {
      const res=await authedFetch("/api/sales",{method:"POST",body:JSON.stringify({restaurant_id:tenantId,placed_at:now.toISOString(),receipt:bill})});
      const json=await res.json(); if(!res.ok)throw new Error(json.error||"Could not save sale");
      const sale:Sale={id, time, placedAt:now.toISOString(), amount:total, type:orderType, status:"Paid", bill};
      setReceipt(bill); setOrders(old=>[sale,...old]); setCart([]); setOrderDiscount(0);
      toast.success("Payment complete · " + id);
    } catch(e:any) { toast.error(e.message||"Sale could not be saved"); }
  };

  const openStaff = (person: Staff) => {
    const today = new Date();
    const monday = new Date(today); monday.setHours(0,0,0,0); monday.setDate(today.getDate() - ((today.getDay()+6)%7));
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
    setSelectedStaff(person);
    setWeeklyPaymentForm({ start: monday.toLocaleDateString("en-CA"), end: sunday.toLocaleDateString("en-CA") });
    setWageForm({
      date: new Date().toLocaleDateString("en-CA"),
      amount: String(person.dailyRate || Math.round((person.monthlySalary || 0) / 30)),
      note: ""
    });
  };

  const saveAdminUpi = async () => {
    setAdminUpiBusy(true);
    const trimmed = adminUpiId.trim();
    localStorage.setItem("rp-admin-upi", trimmed);
    setSubscriptionUpiId(trimmed);
    try {
      await authedFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upi_id: trimmed }),
      });
    } catch {}
    toast.success("Admin payment UPI ID saved successfully!");
    setAdminUpiBusy(false);
  };

  // RESTAURANT SUBMITS PAYMENT PROOF
  const handleInlineSubmitReference = async () => {
    if (!activeInlinePlan) return;
    if (!inlineRefId.trim()) {
      toast.error("Please enter the UPI transaction reference");
      return;
    }
    setInlineSubmitBusy(true);
    try {
      let screenshotUrl = "";
      if (inlineScreenshotFile) {
        try {
          if (db) {
            const path = `${tenantId}/subscriptions/${Date.now()}-${inlineScreenshotFile.name.replace(/\s+/g, "_")}`;
            const { error: uploadErr } = await db.storage
              .from("restaurant-media")
              .upload(path, inlineScreenshotFile, { contentType: inlineScreenshotFile.type, upsert: true });

            if (!uploadErr) {
              const { data: pubData } = db.storage.from("restaurant-media").getPublicUrl(path);
              screenshotUrl = pubData.publicUrl;
            }
          }
        } catch {
          screenshotUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(inlineScreenshotFile);
          });
        }
      }

      const planName = activeInlinePlan.name;

      const payload = {
        restaurant_id: tenantIdRef.current,
        restaurant_name: activeRestaurantName,
        owner_name: activeRestaurantName,
        owner_email: loginEmail || "owner@example.com",
        plan: planName,
        amount: Number(activeInlinePlan.price) || 0,
        upi_id: subscriptionUpiId,
        screenshot_url: screenshotUrl,
        reference_id: inlineRefId.trim(),
        message: `UPI Ref: ${inlineRefId.trim()} | Plan: ${planName}`,
        status: "Pending",
        requested_at: new Date().toISOString(),
      };

      const res = await authedFetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const failed = await res.clone().json().catch(()=>({error:"Failed to submit payment reference"}));
        throw new Error(failed.error || "Failed to submit payment reference");
      }

      toast.success("Payment reference submitted for Admin approval!");
      setInlineRefId("");
      setInlineScreenshotFile(null);
      fetchSubscriptionRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payment reference");
    } finally {
      setInlineSubmitBusy(false);
    }
  };

  // ADMIN ACTION: APPROVE OR REJECT
  const handleReviewSubscriptionAction = async (
    requestId: string,
    reqRest: any,
    action: "approve" | "reject"
  ) => {
    try {
      const planName = reqRest?.plan || "Yearly";
      const daysToAdd = getPlanDurationDays(planName);

      const res = await authedFetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          restaurant_id: reqRest?.restaurant_id,
          restaurant_name: reqRest?.restaurant_name,
          owner_email: reqRest?.owner_email,
          plan_name: planName,
          days_to_add: daysToAdd,
          action: action,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData?.error || "Failed to process subscription request");

      if (action === "approve") {
        const renewalDate = resData?.renewal_on || "—";
        setActivePlanName(planName);
        setActiveRenewalDate(renewalDate);

        toast.success(`Subscription approved! Plan updated to ${planName} with validity extended to ${renewalDate}.`);
      } else {
        toast.info("Subscription payment request was rejected.");
      }

      setSubscriptionRequests((old) => old.filter((x) => x.id !== requestId));
      fetchAllRestaurants();
      syncLiveSubscriptionStatus();
    } catch (err: any) {
      toast.error(err.message || "Failed to process request");
    }
  };

  const handleReviewRestaurantApproval = async (approvalId: string | number, action: "approve" | "reject", requestedPlan?: string) => {
    try {
      const planName = requestedPlan || "Free trial";
      const daysToAdd = getPlanDurationDays(planName);

      const response = await authedFetch("/api/admin/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: approvalId, action }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to update restaurant approval");

      setApprovals((old) => old.filter((x) => x.id !== approvalId));
      toast.success(
        action === "approve"
          ? `Restaurant approved! ${planName} active with +${daysToAdd} days.`
          : "Restaurant registration rejected"
      );
      fetchRealApprovals();
      fetchAllRestaurants();
      syncLiveSubscriptionStatus();
    } catch (err: any) {
      toast.error(err.message || "Failed to update restaurant status");
    }
  };

  // PERSIST RESTAURANT SETTINGS SAFELY TO DATABASE
  const handleSaveRestaurantSettings = async () => {
    try {
      // Always resolve the active restaurant from the authenticated workspace first.
      // This prevents the settings request from reaching the API without a restaurant id
      // during the initial tenant hydration/render cycle.
      const restaurantId = tenantIdRef.current || tenantId || tenantInfo.id || localStorage.getItem("rp-active-tenant-id") || "";
      if (!restaurantId) {
        toast.error("Restaurant could not be identified. Please refresh and try again.");
        return;
      }
      const payload = {
        id: restaurantId,
        name: storeForm.name.trim() || activeRestaurantName,
        phone: storeForm.phone.trim(),
        address: storeForm.address.trim(),
        gstin: storeForm.gstin.trim(),
        gst_percent: Number(storeForm.gst_percent) || 5,
        cgst_percent: Number(storeForm.cgst_percent) || 2.5,
        sgst_percent: Number(storeForm.sgst_percent) || 2.5,
      };

      const res = await authedFetch("/api/restaurant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.error || "Failed to save restaurant settings");
        return;
      }

      setActiveRestaurantName(payload.name);
      setTenantInfo((prev) => ({
        ...prev,
        name: payload.name,
        address: payload.address,
        business_phone: payload.phone,
        gstin: payload.gstin,
        gst_percent: payload.gst_percent,
        cgst_percent: payload.cgst_percent,
        sgst_percent: payload.sgst_percent,
      }));

      toast.success("Restaurant details saved successfully!");
      syncLiveSubscriptionStatus();
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPwdBusy(true);
    try {
      if (db) {
        const { error } = await db.auth.updateUser({ password: newPassword });
        if (error) {
          toast.error(error.message);
          return;
        }
      }
      toast.success("Password reset successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setPwdBusy(false);
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoginBusy(true);
    const { error } = await db.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoginBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in successfully!");
    }
  };

  const handleSignOut = async () => {
    if (db) await db.auth.signOut();
    localStorage.removeItem("rp-active-tenant-id");
    setTenantId(null);
    setAuthUser(null);
  };

  const nav = (v: View) => {
    setView(v);
    setMobileNav(false);
    setProfileMenu(false);
  };

  if (!db)
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>RestoPulse configuration needed</h1>
          <p>Add the Supabase URL and publishable key in Vercel environment variables, then redeploy.</p>
        </div>
      </div>
    );

  if (authLoading) return <div className="auth-page">Loading RestoPulse…</div>;

  if (!authUser)
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={login}>
          <div className="brand-symbol">✳</div>
          <h1>Welcome to RestoPulse</h1>
          <p>Sign in to your restaurant or platform account.</p>
          <label>
            Email
            <input type="email" autoComplete="username" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
          </label>
          <button className="primary-btn" disabled={loginBusy}>
            {loginBusy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Toaster richColors />
      </div>
    );

  if (tenantHydrating)
    return <div className="auth-page">Loading workspace…</div>;

  const openUpiApp = (provider: "gpay" | "phonepe" | "upi") => {
    const params = `pa=${encodeURIComponent(subscriptionUpiId)}&pn=${encodeURIComponent("RestoPulse")}&am=${encodeURIComponent(activePlanPrice.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`${activeRestaurantName} ${activeInlinePlan?.name || "Subscription"}`)}`;
    const urls = {
      gpay: `tez://upi/pay?${params}`,
      phonepe: `phonepe://pay?${params}`,
      upi: `upi://pay?${params}`,
    };
    const fallback = `upi://pay?${params}`;
    try {
      window.location.href = urls[provider];
      window.setTimeout(() => {
        if (document.visibilityState === "visible" && provider !== "upi") window.location.href = fallback;
      }, 900);
    } catch {
      window.location.href = fallback;
    }
  };

  const activePlanPrice = activeInlinePlan ? activeInlinePlan.price : 29999;
  const inlineUpiPayUri = `upi://pay?pa=${encodeURIComponent(subscriptionUpiId)}&pn=${encodeURIComponent("RestoPulse")}&am=${encodeURIComponent(activePlanPrice.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`${activeRestaurantName} ${activeInlinePlan?.name || 'Subscription'}`)}`;
  const inlineQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(inlineUpiPayUri)}`;

  // Navigation Filter: Restaurant login NEVER sees the admin Pricing plans link
  const nowForMetrics = liveDate;
  const activeRenewalTime = activeRenewalDate && activeRenewalDate !== "—" ? new Date(`${activeRenewalDate}T23:59:59`).getTime() : NaN;
  const subscriptionExpired = !isAdmin && Number.isFinite(activeRenewalTime) && activeRenewalTime < nowForMetrics.getTime();
  const dayStart = new Date(nowForMetrics); dayStart.setHours(0,0,0,0);
  const weekStart = new Date(dayStart); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay()+6)%7));
  const monthStart = new Date(nowForMetrics.getFullYear(), nowForMetrics.getMonth(), 1);
  const yesterdayStart = new Date(dayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const selectedStart = (() => {
    if (dateRange === "Today") return new Date(dayStart);
    if (dateRange === "Yesterday") return new Date(yesterdayStart);
    if (dateRange === "This month") return new Date(monthStart);
    if (dateRange === "Custom") {
      const d = new Date(`${customStartDate}T00:00:00`);
      return Number.isNaN(d.getTime()) ? new Date(weekStart) : d;
    }
    return new Date(weekStart);
  })();
  const selectedEnd = (() => {
    if (dateRange === "Yesterday") return new Date(dayStart);
    if (dateRange === "Custom") {
      const d = new Date(`${customEndDate}T23:59:59.999`);
      return Number.isNaN(d.getTime()) ? new Date(dayStart.getTime() + 86400000) : d;
    }
    return new Date(dayStart.getTime() + 86400000);
  })();
  const paidOrders = orders.filter(o => o.status === "Paid");
  const inSelectedRange = (value: string | number | Date) => {
    const d = new Date(value);
    return !Number.isNaN(d.getTime()) && d >= selectedStart && d < selectedEnd;
  };
  const selectedOrders = paidOrders.filter(o => inSelectedRange(o.placedAt));
  const selectedExpenses = expenses.filter(e => inSelectedRange(`${e.date}T12:00:00`));
  const selectedWages = wages.filter(w => w.status === "Paid" && inSelectedRange(`${w.date}T12:00:00`));
  const netSales = selectedOrders.reduce((n,o)=>n+(Number(o.bill?.subtotal)||0)-(Number(o.bill?.discount)||0),0);
  const totalExpenses = selectedExpenses.reduce((n,x)=>n+Number(x.amount||0),0);
  const paidWages = selectedWages.reduce((n,x)=>n+Number(x.amount||0),0);
  const salesBetween = (from:Date, to?:Date) => paidOrders.filter(o => { const d = new Date(o.placedAt); return d >= from && (!to || d < to); }).reduce((n,o)=>n+(Number(o.bill?.subtotal)||0)-(Number(o.bill?.discount)||0),0);
  const todaySales=salesBetween(dayStart, new Date(dayStart.getTime()+86400000));
  const weeklySales=salesBetween(weekStart, new Date(dayStart.getTime()+86400000));
  const monthlySales=salesBetween(monthStart, new Date(dayStart.getTime()+86400000));
  const lowStockCount=inventoryList.filter(x=>x.onHand>0&&x.onHand<=x.reorderLevel).length;
  const outOfStockCount=inventoryList.filter(x=>x.onHand===0).length;
  const restaurantNotifications = !isAdmin ? [
    ...(outOfStockCount > 0 ? [{ key: "out", title: `${outOfStockCount} item(s) out of stock`, detail: "Review inventory and restock immediately." }] : []),
    ...(lowStockCount > 0 ? [{ key: "low", title: `${lowStockCount} item(s) low in stock`, detail: "Inventory has reached the reorder level." }] : []),
    ...(wages.filter(w => w.status === "Unpaid").length > 0 ? [{ key: "wage", title: `${wages.filter(w => w.status === "Unpaid").length} unpaid wage record(s)`, detail: "Review employee payments." }] : []),
    ...(activeRenewalDate && activeRenewalDate !== "—" && new Date(activeRenewalDate).getTime() - nowForMetrics.getTime() <= 7 * 86400000 && new Date(activeRenewalDate).getTime() >= nowForMetrics.getTime() ? [{ key: "sub", title: "Subscription renewal is due soon", detail: `Renewal date: ${new Date(activeRenewalDate).toLocaleDateString("en-IN")}` }] : []),
  ] : [];
  const chartStart = new Date(selectedStart);
  const chartDays = Math.max(1, Math.min(31, Math.ceil((selectedEnd.getTime() - chartStart.getTime()) / 86400000)));
  const dynamicChart=Array.from({length:chartDays},(_,idx)=>{
    const d=new Date(chartStart); d.setDate(chartStart.getDate()+idx);
    const next=new Date(d); next.setDate(d.getDate()+1);
    return {
      day:chartDays <= 7 ? d.toLocaleDateString("en-IN",{weekday:"short"}) : d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}),
      revenue:paidOrders.filter(o=>{const x=new Date(o.placedAt);return x>=d&&x<next;}).reduce((n,o)=>n+Number(o.bill?.subtotal||0)-Number(o.bill?.discount||0),0),
      expense:expenses.filter(e=>{const x=new Date(`${e.date}T12:00:00`);return x>=d&&x<next;}).reduce((n,e)=>n+Number(e.amount||0),0)
    };
  });

  const adminChart=Array.from({length:7},(_,idx)=>{
    const d=new Date(dayStart); d.setDate(dayStart.getDate()-6+idx);
    const next=new Date(d); next.setDate(d.getDate()+1);
    return {day:d.toLocaleDateString("en-IN",{weekday:"short"}),revenue:subscriptionHistory.filter(x=>x.status==="Approved").filter(x=>{const t=new Date(x.reviewed_at||x.requested_at);return t>=d&&t<next;}).reduce((n,x)=>n+Number(x.amount||0),0),expense:0};
  });
  const subscriptionRevenue = subscriptionHistory.filter(x => x.status === "Approved").reduce((n,x)=>{
    const amount=Number(x.amount||0); const fallback=plans.find(p=>p.name.toLowerCase()===String(x.plan||"").toLowerCase())?.price||0;
    return n+(amount||fallback);
  },0);
  const activeSubscriptionCount = restaurants.filter((r:any)=>["Active","Trial"].includes(r.status) && r.renewal && new Date(r.renewal)>=nowForMetrics).length;
  const expiredSubscriptionCount = restaurants.filter((r:any)=>r.renewal && new Date(r.renewal)<nowForMetrics).length;

  const normalizedRole = (currentUserRole || "").toLowerCase();
  const isOwnerOrAdmin = normalizedRole === "owner" || normalizedRole === "admin" || !normalizedRole;
  
  const visibleNavTenant = isAdmin
    ? []
    : navTenant.filter((item) => {
        if (isOwnerOrAdmin) return true;
        return !item.allowedRoles || item.allowedRoles.includes(normalizedRole);
      });

  return (
    <div className="app-shell">
      <Toaster richColors position="top-right" />

      {/* PRINT LAYOUT: adapts to 58mm, 85mm thermal and A4 */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${printPaperSize === "A4" ? "A4" : printPaperSize === "58mm" ? "58mm auto" : "85mm auto"};
            margin: ${printPaperSize === "A4" ? "10mm" : "0"};
          }
          html, body {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * { visibility: hidden !important; }
          #printable-receipt-card, #printable-receipt-card * {
            visibility: visible !important;
          }
          #printable-receipt-card {
            position: static !important;
            display: block !important;
            left: auto !important;
            top: auto !important;
            margin: 0 !important;
            transform: none !important;
            float: none !important;
            box-sizing: border-box !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
            font-family: ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace !important;
          }
          #printable-receipt-card.format-58mm { width: 58mm !important; max-width: 58mm !important; padding: 2mm !important; font-size: 9px !important; }
          #printable-receipt-card.format-85mm { width: 85mm !important; max-width: 85mm !important; padding: 3mm !important; font-size: 10px !important; }
          #printable-receipt-card.format-A4 { width: 190mm !important; max-width: 190mm !important; padding: 8mm !important; font-size: 12px !important; }
          #printable-receipt-card table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
          #printable-receipt-card th, #printable-receipt-card td { overflow-wrap: anywhere !important; word-break: break-word !important; }
          #printable-receipt-card.format-58mm .receipt-line { grid-template-columns: minmax(0,1fr) 20px 48px !important; }
          #printable-receipt-card.format-85mm .receipt-line { grid-template-columns: minmax(0,1fr) 28px 62px !important; }
          #printable-receipt-card.format-A4 .receipt-line { grid-template-columns: minmax(0,1fr) 50px 100px !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <aside className={"sidebar " + (mobileNav ? "show" : "")}>
        <div className="brand">
          <div className="brand-symbol">
            <svg viewBox="0 0 42 42" fill="none" aria-hidden="true">
              <path
                d="M5 25h7l4-8 5 13 4-7h12M10 32h24M21 10v3M8 25c1-8 6-12 13-12 7 0 12 4 13 12"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <strong>RestoPulse</strong>
            <small>THE PULSE OF MODERN GASTRONOMY</small>
          </div>
        </div>

        {/* WORKSPACE SELECTOR */}
        {!isAdmin && <><div className="workspace-label">
          WORKSPACE <ChevronDown size={14} />
        </div>
        <div
          className="store-selector relative cursor-pointer"
          onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
        >
          <span className="store-avatar">
            {activeRestaurantName ? activeRestaurantName.slice(0, 2).toUpperCase() : "RS"}
          </span>
          <div className="truncate">
            <b className="truncate block">{activeRestaurantName || "Select Workspace"}</b>
            <small>{accountRole === "admin" ? "Platform console" : "Restaurant"}</small>
          </div>
          <ChevronDown size={15} />

          {workspaceMenuOpen && restaurants.length > 0 && (
            <div
              className="absolute left-0 top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-2 z-50 shadow-2xl max-h-60 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] text-gray-400 font-bold px-2 py-1 uppercase">Switch Workspace</div>
              {restaurants.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => switchWorkspace(r)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex justify-between items-center ${
                    tenantId === r.id ? "bg-amber-500 text-white" : "hover:bg-slate-800 text-gray-200"
                  }`}
                >
                  <span className="truncate">{r.name}</span>
                  <span className="text-[10px] opacity-75">{r.plan || "Free trial"}</span>
                </button>
              ))}
            </div>
          )}
        </div></>}

        {isAdmin && <div className="platform-workspace-label">
          <span className="store-avatar"><Building2 size={16}/></span>
          <div><b className="block">Platform Admin</b><small>RestoPulse console</small></div>
        </div>}

        {/* RESTAURANT NAVIGATION — hidden for platform admins */}
        {!isAdmin && <><div className="nav-heading">RESTAURANT</div>
        <nav aria-label="Restaurant navigation">
          {visibleNavTenant.map((item) => (
            <button
              key={item.id}
              className={"nav-link " + (view === item.id ? "active" : "")}
              onClick={() => nav(item.id)}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === "pos" && <span className="nav-key">⌘2</span>}
            </button>
          ))}
        </nav></>}

        {/* PLATFORM ADMIN NAVIGATION (SHOWN ONLY IF LOGGED IN AS ADMIN) */}
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
                  {item.id === "approvals" && (approvals.length + subscriptionRequests.length) > 0 && (
                    <span className="nav-count">{approvals.length + subscriptionRequests.length}</span>
                  )}
                </button>
              ))}
            </nav>
          </>
        )}

        {/* DYNAMIC ACTIVE PLAN CARD — restaurant accounts only */}
        <div className="sidebar-bottom">
          {!isAdmin && <div className="trial-note">
            <span className="trial-icon">✦</span>
            <b>Active Plan</b>
            <p className="font-semibold text-white capitalize">{activePlanName || "Free trial"}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Expires: {activeRenewalDate || "—"}</p>
            <button onClick={() => nav(isAdmin ? "pricing" : "subscription")}>
              Manage plan <ArrowUpRight size={14} />
            </button>
          </div>}
          <button
            className="profile profile-trigger"
            onClick={() => setProfileMenu(!profileMenu)}
            aria-label="Open profile menu"
          >
            <span className="profile-avatar">{activeRestaurantName ? activeRestaurantName.slice(0, 2).toUpperCase() : "MR"}</span>
            <div>
              <b>{authUser?.slice(0, 8) || "Account"}</b>
              <small>{accountRole === "admin" ? "Platform Administrator" : "Restaurant Owner"}</small>
            </div>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <div className="top-left">
            <button
              className="icon-btn mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumbs">
              Workspace <span>/</span> <strong>{[...navTenant, ...navPlatform].find((x) => x.id === view)?.label}</strong>
            </div>
          </div>
          <div className="top-actions">
            <span className="today-label" title={liveDate.toLocaleString("en-IN")}>
              <CalendarDays size={16} /> {liveDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="top-divider" />
            <button
              className="theme-switch"
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setDark(!dark)}
              title="Toggle light and dark theme"
            >
              <Sun size={17} />
              <Moon size={17} />
              <span className={"theme-knob " + (dark ? "night" : "")}>
                <Sun size={15} className="sun-knob" />
                <Moon size={15} className="moon-knob" />
              </span>
            </button>
            <button
              className="icon-btn notification-button"
              aria-label="Notifications"
              aria-expanded={notifications}
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              <span className="notification-dot" />
            </button>
            <button
              className="profile-avatar top-avatar profile-top-button"
              aria-label="Open profile menu"
              aria-expanded={profileMenu}
              onClick={() => {
                setProfileMenu(!profileMenu);
                setNotifications(false);
              }}
            >
              {activeRestaurantName ? activeRestaurantName.slice(0, 2).toUpperCase() : "MR"}
            </button>
          </div>

          {profileMenu && (
            <div className="profile-popover">
              <div className="profile-popover-head">
                <b>{authUser?.slice(0, 8) || "Account"}</b>
                <small>{accountRole === "admin" ? "Platform Administrator" : "Restaurant Owner"}</small>
              </div>
              <button onClick={() => nav("settings")}>
                <Settings size={17} /> Account & settings
              </button>
              {isAdmin ? (
                <button onClick={() => nav("settings")}>
                  <Users size={17} /> Admin managements
                </button>
              ) : (
                <>
                  <button onClick={() => nav("staff")}>
                    <Users size={17} /> Manage employees
                  </button>
                  <button onClick={() => { setProfileMenu(false); setModal("support"); }}>
                    <Send size={17} /> Support & Help
                  </button>
                </>
              )}
              <button onClick={handleSignOut} className="text-red-600 hover:text-red-700">
                <LogOut size={17} /> Sign out
              </button>
            </div>
          )}

          {notifications && (
            <div className="notification-popover">
              <div className="popover-title">
                <b>Notifications</b>
                <span>{isAdmin ? approvals.length + subscriptionRequests.length : restaurantNotifications.length} new</span>
              </div>
              {isAdmin ? (
                (approvals.length + subscriptionRequests.length) > 0 ? (
                  <button onClick={() => nav("approvals")}>
                    <span className="notif-icon amber">◎</span>
                    <span>
                      <b>{approvals.length + subscriptionRequests.length} pending items</b>
                      <small>Review applications & proofs</small>
                    </span>
                  </button>
                ) : <div className="p-3 text-xs text-muted-foreground">No new platform notifications.</div>
              ) : (
                restaurantNotifications.length ? restaurantNotifications.map((n) => (
                  <button key={n.key} onClick={() => { setNotifications(false); nav(n.key === "wage" ? "staff" : n.key === "sub" ? "subscription" : "inventory"); }}>
                    <span className="notif-icon amber">◎</span>
                    <span><b>{n.title}</b><small>{n.detail}</small></span>
                  </button>
                )) : <div className="p-3 text-xs text-muted-foreground">No new notifications for this restaurant.</div>
              )}
            </div>
          )}
        </header>

        <main className={"content " + (view === "pos" ? "pos-content" : "")}>
          {subscriptionExpired && (
            <div className="subscription-expired-banner" role="alert">
              <strong>Trial/subscription ended — operations are disabled.</strong>
              <span>Your restaurant data is retained, but you cannot perform app operations until the subscription is renewed.</span>
              <button type="button" onClick={() => nav("subscription")}>Renew subscription</button>
            </div>
          )}
          {subscriptionExpired && view !== "subscription" && (
            <div className="subscription-lock-overlay">
              <div className="subscription-lock-card">
                <div className="subscription-lock-icon">!</div>
                <h2>Trial / subscription ended</h2>
                <p><strong>After the trial or subscription ends, you won't be able to do any operations in the app.</strong></p>
                <button type="button" className="primary-btn" onClick={() => nav("subscription")}>View subscription & renew</button>
              </div>
            </div>
          )}
          {/* 1. OVERVIEW DASHBOARD */}
          {view === "dashboard" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">OVERVIEW</div>
                  <h1>{isAdmin ? "Platform Overview" : `Good afternoon, ${activeRestaurantName || "Owner"}`}</h1>
                  <p>{isAdmin ? "Subscription, restaurant, and approval activity across RestoPulse." : `Here’s what’s happening at ${activeRestaurantName || "your restaurant"}.`}</p>
                  <p className="text-xs text-muted-foreground mt-1">Live date: {liveDate.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
                </div>
                <div className="head-actions">
                  {isAdmin ? (
                    <button className="quiet-btn flex items-center gap-1.5" onClick={() => { fetchAllRestaurants(); fetchSubscriptionRequests(); fetchRealApprovals(); fetchLivePlans(); }}>
                      <RefreshCw size={14} /> Refresh
                    </button>
                  ) : <>
                    <select aria-label="Date range" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                      <option>Today</option><option>Yesterday</option><option>This week</option><option>This month</option><option>Custom</option>
                    </select>
                    {dateRange === "Custom" && (
                      <div className="custom-date-range" aria-label="Custom sales date range">
                        <label><span>From</span><input type="date" value={customStartDate} max={customEndDate || undefined} onChange={(e) => setCustomStartDate(e.target.value)} /></label>
                        <label><span>To</span><input type="date" value={customEndDate} min={customStartDate || undefined} onChange={(e) => setCustomEndDate(e.target.value)} /></label>
                      </div>
                    )}
                    <button className="primary-btn" onClick={() => nav("pos")}><Plus size={18} /> New order</button>
                  </>}
                </div>
              </div>
              <div className="kpi-grid">
                {(isAdmin ? [
                  { label: "Net subscription revenue", value: money(subscriptionRevenue), icon: CreditCard, tone: "teal", note: "approved subscription payments" },
                  { label: "Subscribed restaurants", value: String(activeSubscriptionCount), icon: Building2, tone: "amber", note: "active/trial with renewal" },
                  { label: "Active subscriptions", value: String(restaurants.filter((r:any)=>r.status==="Active").length), icon: BadgeCheck, tone: "green", note: "currently active" },
                  { label: "Expired subscriptions", value: String(expiredSubscriptionCount), icon: Clock, tone: "violet", note: "renewal date passed" },
                  { label: "Pending payments", value: String(subscriptionRequests.length), icon: ReceiptText, tone: "amber", note: "awaiting review" },
                  { label: "Plans", value: String(plans.filter(p=>p.active).length), icon: CreditCard, tone: "teal", note: "active pricing plans" },
                  { label: "Subscription history", value: String(subscriptionHistory.length), icon: CalendarDays, tone: "violet", note: "payment requests" },
                  { label: "Upcoming renewals", value: String(restaurants.filter((r:any)=>r.renewal && new Date(r.renewal)>=nowForMetrics && new Date(r.renewal)<=new Date(nowForMetrics.getTime()+30*86400000)).length), icon: Bell, tone: "green", note: "next 30 days" },
                ] : [
                  { label: "Net sales", value: money(netSales), icon: ArrowUpRight, tone: "teal", note: `${dateRange.toLowerCase()} · paid sales, excluding tax` },
                  { label: "Total orders", value: String(selectedOrders.length), icon: ShoppingBag, tone: "amber", note: `${dateRange.toLowerCase()} · completed paid orders` },
                  { label: "Operating expenses", value: money(totalExpenses + paidWages), icon: ReceiptText, tone: "violet", note: `${dateRange.toLowerCase()} · expenses + paid wages` },
                  { label: "Net profit", value: money(netSales - totalExpenses - paidWages), icon: ArrowUpRight, tone: "green", note: `${dateRange.toLowerCase()} · net sales − operating costs` },
                  { label: "Today’s sales", value: money(todaySales), icon: Wallet, tone: "amber", note: "today" },
                  { label: "Weekly sales", value: money(weeklySales), icon: Wallet, tone: "teal", note: "Monday–today" },
                  { label: "Monthly sales", value: money(monthlySales), icon: Wallet, tone: "violet", note: "current month" },
                  { label: "Low stock", value: String(lowStockCount + outOfStockCount), icon: Package, tone: outOfStockCount ? "amber" : "green", note: `${lowStockCount} low · ${outOfStockCount} out` },
                ]).map((k) => (
                  <div className="kpi-card" key={k.label}>
                    <div className="kpi-top">
                      <span>{k.label}</span>
                      <span className={"kpi-icon " + k.tone}><k.icon size={19} /></span>
                    </div>
                    <strong>{k.value}</strong>
                    <div className="kpi-foot"><span>{k.note}</span></div>
                  </div>
                ))}
              </div>

              {/* Weekly Trend Chart and Top Dishes */}
              <div className="analytics-grid">
                <section className="panel chart-panel">
                  <div className="panel-header">
                    <div>
                      <h2>{isAdmin ? "Subscription revenue" : "Revenue & expenses"}</h2>
                      <p>{isAdmin ? "Approved subscription payments · last 7 days" : `${dateRange} sales and expenses`}</p>
                    </div>
                  </div>
                  <div className="chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={isAdmin ? adminChart : dynamicChart} margin={{ top: 15, right: 8, left: -17, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} dy={12} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12 }} />
                        <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.2} fill="#f59e0b" />
                        <Area type="monotone" dataKey="expense" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section className="panel top-dishes">
                  <div className="panel-header">
                    <div><h2>{isAdmin ? "Recent subscription payments" : "Top performing dishes"}</h2></div>
                  </div>
                  {isAdmin ? subscriptionHistory.filter(x=>x.status==="Approved").slice(0,5).map((x:any)=>(
                    <div className="leader-row" key={x.id}>
                      <span className="leader-rank">₹</span>
                      <span className="dish-thumb overflow-hidden flex items-center justify-center"><CreditCard size={18}/></span>
                      <div className="leader-info"><b>{x.restaurant_name}</b><small>{x.plan} · {x.reviewed_at ? new Date(x.reviewed_at).toLocaleDateString("en-IN") : "Approved"}</small></div>
                      <strong>{money(Number(x.amount)||(plans.find(p=>p.name.toLowerCase()===String(x.plan||"").toLowerCase())?.price||0))}</strong>
                    </div>
                  )) : dishes.slice(0, 4).map((d, i) => (
                    <div className="leader-row" key={d.id}>
                      <span className="leader-rank">0{i + 1}</span>
                      <span className="dish-thumb overflow-hidden flex items-center justify-center">{d.imageUrl ? <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover rounded-lg" /> : d.emoji}</span>
                      <div className="leader-info"><b>{d.name}</b><small>Menu item</small></div>
                      <strong>{money(d.price)}</strong>
                    </div>
                  ))}
                  {isAdmin && !subscriptionHistory.length && <div className="py-8 text-center text-xs text-muted-foreground">No subscription payments recorded yet.</div>}
                </section>
              </div>
            </>
          )}

          {/* 2. POS TERMINAL */}
          {view === "pos" && (
            <>
              <div className="page-head pos-head">
                <div>
                  <div className="eyebrow">FAST CHECKOUT</div>
                  <h1>Point of sale</h1>
                </div>
                <div className="head-actions">
                  <button className="quiet-btn" onClick={() => setSound(!sound)}>
                    {sound ? <Volume2 size={17} /> : <VolumeX size={17} />} Sound {sound ? "on" : "off"}
                  </button>
                  <button className="quiet-btn flex items-center gap-1.5" onClick={() => setSaleHistoryOpen(true)}>
                    <ReceiptText size={17} /> Sale history
                  </button>
                </div>
              </div>
              <div className="pos-layout">
                <section className="pos-catalog">
                  <div className="catalog-toolbar">
                    <label className="search-field">
                      <Search size={18} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search dishes..."
                      />
                    </label>
                  </div>
                  <div className="dish-grid">
                    {displayed.map((d) => (
                      <button
                        className={"dish-tile " + (!d.stock ? "sold-out" : "")}
                        key={d.id}
                        onClick={() => d.stock && addCart(d.id)}
                        disabled={!d.stock}
                      >
                        <span className="dish-photo overflow-hidden flex items-center justify-center">
                          {d.imageUrl ? (
                            <img src={d.imageUrl} alt={d.name} className="dish-image-full" />
                          ) : (
                            <span>{d.emoji}</span>
                          )}
                        </span>
                        <span className="dish-body">
                          <span className="dish-name">{d.name}</span>
                          <span className="dish-price">{money(d.price)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <aside className="order-panel flex flex-col justify-between p-4 bg-card border rounded-2xl shadow-sm">
                  <div>
                    <div className="order-head flex justify-between items-center mb-4 pb-2 border-b">
                      <h2 className="text-base font-bold">Current order</h2>
                      <span className="order-count text-xs px-2.5 py-1 rounded-full bg-secondary font-semibold">
                        {cart.reduce((a, x) => a + x.qty, 0)} items
                      </span>
                    </div>

                    <div className="cart-items space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {cart.map((l) => {
                        const d = dishes.find((x) => x.id === l.id)!;
                        return (
                          <div
                            key={l.id}
                            className="p-3 rounded-2xl border bg-background/80 hover:bg-background transition-all space-y-2 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-muted text-lg">
                                  {d.imageUrl ? (
                                    <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover" />
                                  ) : (
                                    d.emoji
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs leading-snug truncate text-foreground">
                                    {d.name}
                                  </h4>
                                  <span className="text-[11px] text-muted-foreground block">
                                    {money(l.override ?? d.price)} each
                                  </span>
                                </div>
                              </div>
                              <span className="font-extrabold text-xs text-foreground flex-shrink-0">
                                {money(((l.override ?? d.price) - l.discount) * l.qty)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-border/40">
                              <div className="text-[10px] text-muted-foreground">
                                {l.discount > 0 ? (
                                  <span className="text-emerald-500 font-semibold">
                                    Disc: -{money(l.discount * l.qty)}
                                  </span>
                                ) : (
                                  <span>Quantity</span>
                                )}
                              </div>
                              <div className="cart-controls flex items-center border rounded-lg bg-secondary/40 overflow-hidden">
                                <button
                                  className="px-2.5 py-1 hover:bg-secondary rounded-l transition-colors"
                                  onClick={() => qty(l.id, -1)}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="px-2.5 text-xs font-bold font-mono min-w-[20px] text-center">
                                  {l.qty}
                                </span>
                                <button
                                  className="px-2.5 py-1 hover:bg-secondary rounded-r transition-colors"
                                  onClick={() => qty(l.id, 1)}
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {!cart.length && (
                        <div className="text-center py-12 text-muted-foreground text-xs">
                          Your order is empty. Tap dishes to add.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="cart-footer mt-4 pt-3 border-t space-y-3">
                    <div className="print-format no-print">
                      <span>Receipt format</span>
                      <div className="print-format-options">
                        {(["58mm","85mm","A4"] as const).map((sz) => (
                          <button type="button" key={sz} onClick={() => setPrintPaperSize(sz)} className={printPaperSize === sz ? "selected" : ""}>{sz}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-medium text-muted-foreground">Total due</span>
                      <strong className="text-lg font-extrabold">{money(total)}</strong>
                    </div>

                    <button
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!cart.length}
                      onClick={checkout}
                    >
                      <CreditCard size={18} /> Charge {money(total)}
                    </button>
                  </div>
                </aside>
              </div>
            </>
          )}

          {/* 3. MENU & DISHES (WITH IMAGE PREVIEWS, EDIT, AND DELETE) */}
          {view === "menu" && (
            <>
              <div className="page-head flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="eyebrow">CATALOG</div>
                  <h1>Menu & dishes</h1>
                  <p className="text-xs text-muted-foreground">Manage recipes, dish images, pricing, and stock status.</p>
                </div>
                <button className="primary-btn flex items-center gap-1.5" onClick={() => open("dish")}>
                  <Plus size={17} /> Add dish
                </button>
              </div>

              <div className="panel management-panel mt-4">
                <div className="table-scroll overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3">PHOTO</th>
                        <th className="p-3">DISH NAME</th>
                        <th className="p-3">CATEGORY</th>
                        <th className="p-3">PRICE</th>
                        <th className="p-3">AVAILABILITY</th>
                        <th className="p-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dishes.map((d) => (
                        <tr key={d.id} className="border-b hover:bg-muted/40 transition-colors">
                          <td className="p-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center border text-base">
                              {d.imageUrl ? (
                                <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{d.emoji}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <b className="text-sm text-foreground block">{d.name}</b>
                            <span className="text-[11px] text-muted-foreground">{d.diet || "Standard"} · {d.time || 15} mins</span>
                          </td>
                          <td className="p-3 font-semibold text-muted-foreground">{d.category}</td>
                          <td className="p-3 font-bold text-sm text-foreground">{money(d.price)}</td>
                          <td className="p-3">
                            <Switch
                              checked={d.stock}
                              onCheckedChange={(v) => {
                                const updated = dishes.map((x) => (x.id === d.id ? { ...x, stock: v } : x));
                                saveDishesToStorage(updated);
                              }}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                className="p-2 border rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => open("dish", d.id)}
                                title="Edit Dish"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className="p-2 border rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                onClick={() => handleDeleteDish(d.id)}
                                title="Delete Dish"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!dishes.length && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-muted-foreground">
                            No dishes added yet. Click &quot;Add dish&quot; to build your menu.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 4. INVENTORY MANAGEMENT */}
          {view === "inventory" && (
            <>
              <div className="page-head flex justify-between items-center">
                <div>
                  <div className="eyebrow">WAREHOUSE & STOCK</div>
                  <h1>Inventory Manager</h1>
                </div>
                <button className="primary-btn flex items-center gap-2" onClick={() => openInventoryModal()}>
                  <Plus size={17} /> Add Stock Item
                </button>
              </div>
              <div className="kpi-grid mt-4">
                {[
                  ["Total items", inventoryList.length, "catalogued stock"],
                  ["Available stock", inventoryList.reduce((n,x)=>n+Number(x.onHand||0),0), "units on hand"],
                  ["Stock value", money(inventoryList.reduce((n,x)=>n+Number(x.onHand||0)*Number(x.cost||0),0)), "based on recorded cost"],
                  ["Low stock", inventoryList.filter(x=>x.onHand>0&&x.onHand<=x.reorderLevel).length, "reorder attention"],
                  ["Out of stock", inventoryList.filter(x=>x.onHand===0).length, "needs replenishment"],
                ].map(([label,value,note])=><div className="kpi-card" key={String(label)}><div className="kpi-top"><span>{label}</span><span className="kpi-icon teal"><Package size={19}/></span></div><strong>{String(value)}</strong><div className="kpi-foot"><span>{note}</span></div></div>)}
              </div>
              <div className="panel management-panel bg-card border rounded-xl p-6 mt-4">
                <div className="table-scroll overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-sm text-muted-foreground">
                        <th className="p-3">ITEM NAME</th>
                        <th className="p-3">ON HAND</th>
                        <th className="p-3">REORDER LEVEL</th>
                        <th className="p-3">STATUS ALERT</th>
                        <th className="p-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryList.map((item) => {
                        const isOut = item.onHand === 0;
                        const isLow = item.onHand > 0 && item.onHand <= item.reorderLevel;
                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-semibold">{item.name}</td>
                            <td className="p-3 font-mono font-bold">{item.onHand} {item.unit}</td>
                            <td className="p-3 font-mono text-muted-foreground">{item.reorderLevel} {item.unit}</td>
                            <td className="p-3">
                              {isOut ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Out of Stock 🚨</span>
                              ) : isLow ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Low Stock ⚠️</span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">In Stock</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="inventory-actions" aria-label={`Actions for ${item.name}`}>
                                <button className="inventory-action add" title="Add stock" aria-label={`Add stock to ${item.name}`} onClick={() => openStockAddition(item)}><Plus size={14} strokeWidth={2.5} /></button>
                                <button className="inventory-action reduce" title="Reduce stock" aria-label={`Reduce stock from ${item.name}`} onClick={() => openStockReduction(item)}><Minus size={14} strokeWidth={2.5} /></button>
                                <button className="inventory-action edit" title="Edit item" aria-label={`Edit ${item.name}`} onClick={() => openInventoryModal(item)}><Pencil size={14} /></button>
                                <button className="inventory-action delete" title="Delete item" aria-label={`Delete ${item.name}`} onClick={() => handleDeleteInventory(item.id)}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {!inventoryList.length && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                            No inventory items found. Add items to track stock.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="panel management-panel inventory-history-panel bg-card border rounded-xl p-6 mt-4">
                <div className="panel-header border-b pb-3 mb-3"><h2 className="text-base font-bold">Inventory history</h2><span className="text-xs text-muted-foreground">Latest stock movements</span></div>
                <div className="table-scroll inventory-history-table-wrap">
                  <table className="inventory-history-table">
                    <thead><tr><th>DATE & TIME</th><th>ITEM</th><th>TRANSACTION</th><th className="text-right">CHANGE</th><th className="text-right">STOCK</th></tr></thead>
                    <tbody>
                      {inventoryTransactions.map((tx:any)=>{
                        const change=Number(tx.change_quantity||0);
                        return <tr key={tx.id}>
                          <td className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"numeric", minute:"2-digit" })}</td>
                          <td className="strong">{inventoryList.find(i=>i.id===tx.inventory_item_id)?.name||"Inventory item"}</td>
                          <td><span className={`history-type-badge ${change>=0?"in":"out"}`}>{tx.transaction_type}</span></td>
                          <td className={`text-right font-bold ${change>=0?"text-emerald-600":"text-red-600"}`}>{change>=0?"+":""}{tx.change_quantity}</td>
                          <td className="text-right text-xs font-semibold">{tx.previous_quantity} → {tx.new_quantity}</td>
                        </tr>
                      })}
                      {!inventoryTransactions.length&&<tr><td colSpan={5} className="text-center py-8 text-xs text-muted-foreground">No inventory movements recorded yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 5. TEAM & PAYROLL */}
          {view === "staff" && (
            <>
              <div className="page-head flex justify-between items-center">
                <div>
                  <div className="eyebrow text-amber-500 font-bold uppercase tracking-wider text-[11px]">YOUR PEOPLE</div>
                  <h1 className="text-2xl font-black">Team & payroll</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Designations, role access, and compensation (Monthly, Weekly & Daily).</p>
                </div>
                <button
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  onClick={() => open("employee")}
                >
                  <Plus size={15} /> Add employee
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {staff.map((s) => (
                  <div
                    key={s.name}
                    className="p-5 rounded-2xl border bg-card/60 hover:bg-card border-border/70 hover:border-indigo-500/80 transition-all cursor-pointer shadow-sm relative group flex flex-col justify-between"
                    onClick={() => openStaff(s)}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-900 shadow-inner">
                          {s.initial}
                        </span>
                        <div
                          className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors"
                            onClick={() => open("employee", s.id)}
                            title="Edit Employee"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            onClick={async () => { if (!tenantId || !confirm("Delete this employee?")) return; const {error}=await db.from("employees").delete().eq("restaurant_id",tenantId).eq("id",s.id); if(error){toast.error(error.message);return;} setStaff(old=>old.filter(x=>x.id!==s.id)); }}
                            title="Delete Employee"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="font-bold text-sm text-foreground leading-tight">{s.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`designation-badge designation-${s.role.toLowerCase()}`}>
                            {s.role}
                          </span>
                          <span className="text-[10px] text-muted-foreground">· {s.payType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/50 text-[11px] space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Shift</span>
                        <b className="font-mono text-foreground font-semibold">{s.shift}</b>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {s.payType === "Monthly" ? "Monthly Salary" : s.payType === "Weekly" ? "Weekly Salary" : "Daily Rate"}
                        </span>
                        <b className="font-mono text-foreground font-semibold">
                          {s.payType === "Monthly" ? money(s.monthlySalary) : s.payType === "Weekly" ? `${money(s.weeklySalary)} / week` : `${money(s.dailyRate)} / day`}
                        </b>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 6. EXPENSES */}
          {view === "expenses" && (
            <>
              <div className="page-head flex justify-between items-center">
                <div>
                  <div className="eyebrow">FINANCE</div>
                  <h1>Expenses</h1>
                </div>
                <button className="primary-btn" onClick={() => open("expense")}><Plus size={17} /> Log expense</button>
              </div>

              <div className="panel management-panel mt-6">
                <div className="table-scroll">
                  <table className="enhanced-data-table">
                    <thead>
                      <tr><th>DATE</th><th>DESCRIPTION</th><th>CATEGORY</th><th>VENDOR</th><th className="text-right">AMOUNT</th></tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id}>
                          <td className="text-xs text-muted-foreground">{new Date(`${e.date}T12:00:00`).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}</td>
                          <td className="strong">{e.name}</td>
                          <td><span className="data-badge">{e.category}</span></td>
                          <td>{e.vendor || "—"}</td>
                          <td className="strong text-right">{money(e.amount)}</td>
                        </tr>
                      ))}
                      {!expenses.length && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-muted-foreground text-xs">
                            No expenses logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 7. SUPPLIERS */}
          {view === "suppliers" && (
            <>
              <div className="page-head flex justify-between items-center">
                <div>
                  <div className="eyebrow">ACCOUNTS</div>
                  <h1>Suppliers</h1>
                </div>
                <div className="flex gap-2">
                  <button className="quiet-btn flex items-center gap-1.5" onClick={() => open("payment")}>
                    <Wallet size={15} /> Record payment
                  </button>
                  <button className="primary-btn flex items-center gap-1.5" onClick={() => open("supplier")}>
                    <Plus size={15} /> Add supplier
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="panel p-4 border rounded-xl bg-card space-y-2">
                  <h2 className="text-sm font-bold mb-3">Supplier Directory</h2>
                  {suppliers.map((sp) => (
                    <div
                      key={sp.id}
                      onClick={() => setSupplierDetail(sp.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                        supplierDetail === sp.id ? "border-indigo-500 bg-indigo-50/10" : "hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <b className="text-xs block">{sp.name}</b>
                        <small className="text-[11px] text-muted-foreground">{sp.phone || sp.contact}</small>
                      </div>
                      <ChevronDown size={14} className="text-muted-foreground -rotate-90" />
                    </div>
                  ))}
                  {!suppliers.length && <div className="text-xs text-muted-foreground py-4">No suppliers added yet.</div>}
                </div>

                <div className="panel p-4 border rounded-xl bg-card md:col-span-2">
                  {(() => {
                    const selected = suppliers.find(sp => sp.id === supplierDetail);
                    const supplierExpenses = selected ? expenses.filter(e => e.supplierId === selected.id) : [];
                    const supplierPaymentsForHistory = selected ? supplierPayments.filter(p => p.supplierId === selected.id) : [];
                    const transactions = [
                      ...supplierExpenses.map(e => ({ id: `expense-${e.id}`, date: e.date, type: "Purchase / Expense", description: e.name, amount: Number(e.amount || 0), method: e.vendor || "—" })),
                      ...supplierPaymentsForHistory.map(p => ({ id: `payment-${p.id}`, date: p.date, type: "Payment", description: p.note || "Supplier payment", amount: Number(p.amount || 0), method: p.method || "—" })),
                    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    const purchases = supplierExpenses.reduce((n,e)=>n+Number(e.amount||0),0);
                    const payments = supplierPaymentsForHistory.reduce((n,p)=>n+Number(p.amount||0),0);
                    return selected ? (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div><h2 className="text-sm font-bold">{selected.name}</h2><p className="text-[11px] text-muted-foreground">{selected.contact || ""} {selected.phone ? `· ${selected.phone}` : ""}</p></div>
                          <div className="text-right text-[11px]"><div>Purchases <b>{money(purchases)}</b></div><div>Payments <b>{money(payments)}</b></div><div>Balance <b>{money(purchases-payments)}</b></div></div>
                        </div>
                        <div className="font-bold text-xs mb-2">Transaction History</div>
                        <div className="table-scroll">
                          <table className="enhanced-data-table"><thead><tr><th>DATE</th><th>TYPE</th><th>DESCRIPTION</th><th>METHOD / VENDOR</th><th className="text-right">AMOUNT</th></tr></thead>
                          <tbody>{transactions.map(t => <tr key={t.id}><td>{new Date(t.date).toLocaleDateString("en-IN")}</td><td><span className={`data-badge ${t.type === "Payment" ? "payment" : "purchase"}`}>{t.type}</span></td><td>{t.description}</td><td>{t.method}</td><td className="text-right font-semibold">{money(t.amount)}</td></tr>)}
                          {!transactions.length && <tr><td colSpan={5} className="text-center py-8 text-xs text-muted-foreground">No transactions recorded for this supplier yet.</td></tr>}</tbody></table>
                        </div>
                      </>
                    ) : <div className="py-10 text-center text-xs text-muted-foreground">Select a supplier to view transaction history.</div>;
                  })()}
                </div>
              </div>
            </>
          )}

          {/* 8. RESTAURANT SUBSCRIPTION (READ-ONLY FOR RESTAURANT: CANNOT EDIT/DELETE PLANS) */}
          {view === "subscription" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">PLANS & BILLING</div>
                  <h1>Subscription</h1>
                  <p>Choose an active platform plan, scan the UPI QR code below, and submit the transaction reference.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  ["Current plan", activePlanName || "Free trial"],
                  ["Status", tenantInfo.id ? (activeRenewalDate && activeRenewalDate !== "—" && new Date(activeRenewalDate) < new Date() ? "Expired" : "Active") : "—"],
                  ["Renewal date", activeRenewalDate || "—"],
                  ["Payment history", String(subscriptionHistory.filter(x=>x.restaurant_id===tenantId).length)],
                ].map(([label,value])=><div className="kpi-card" key={String(label)}><div className="kpi-top"><span>{label}</span><span className="kpi-icon teal"><CreditCard size={18}/></span></div><strong className="text-lg">{String(value)}</strong><div className="kpi-foot"><span>Restaurant subscription</span></div></div>)}
              </div>
              <div className="panel p-4 mb-6">
                <div className="panel-header"><div><h2>Subscription history</h2><p>Payment and approval requests for this restaurant</p></div></div>
                <div className="space-y-2">
                  {subscriptionHistory.filter(x=>x.restaurant_id===tenantId).slice(0,6).map((x:any)=><div key={x.id} className="flex justify-between items-center border-b py-2 text-xs"><span><b>{x.plan}</b><span className="text-muted-foreground ml-2">{new Date(x.requested_at).toLocaleDateString("en-IN")}</span></span><span className="font-semibold">{x.status} · {money(Number(x.amount)||0)}</span></div>)}
                  {!subscriptionHistory.filter(x=>x.restaurant_id===tenantId).length&&<div className="text-xs text-muted-foreground py-3">No subscription requests yet.</div>}
                </div>
              </div>

              {/* Grid of Plans Synced Live from Admin Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {plans.map((p) => {
                  const normalizedCurrent = (activePlanName || "").toLowerCase().trim();
                  const isCurrentActive =
                    normalizedCurrent === p.name.toLowerCase().trim() ||
                    (normalizedCurrent.includes("year") && p.name.toLowerCase().includes("year")) ||
                    (normalizedCurrent.includes("month") && p.name.toLowerCase().includes("month"));

                  const isSelected = activeInlinePlan?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className={"panel rounded-2xl p-6 border flex flex-col justify-between " + (isSelected ? "ring-2 ring-emerald-500" : isCurrentActive ? "ring-1 ring-sky-400" : "")}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-foreground">{p.name}</span>
                          {isCurrentActive && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800 shadow-sm animate-pulse">
                              Active Tier
                            </span>
                          )}
                        </div>
                        <div className="text-3xl font-extrabold text-foreground mt-4 mb-2">
                          {p.price === 0 ? "₹0" : money(p.price)}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium mb-3">{p.period}</div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-6">{p.features}</p>
                      </div>

                      {p.price > 0 ? (
                        <button
                          onClick={() => setActiveInlinePlan(p)}
                          className="primary-btn w-full text-xs"
                        >
                          Choose {p.name.toLowerCase()}
                        </button>
                      ) : (
                        <div className="text-center py-2 text-xs font-semibold text-gray-400">
                          {isCurrentActive ? "Active trial tier" : "Trial Tier"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DYNAMIC PAYMENT BOX */}
              {activeInlinePlan && activeInlinePlan.price > 0 && (
                <div
                  className="panel max-w-md mx-auto rounded-2xl p-6 border text-center shadow-lg my-8"
                >
                  <div className="text-sm font-bold text-foreground mb-4">
                    Pay {money(activeInlinePlan.price)}
                  </div>

                  <div className="bg-white p-3 rounded-2xl inline-block mx-auto mb-4 border border-gray-200">
                    <img
                      src={inlineQrImageUrl}
                      alt="UPI Payment QR Code"
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button type="button" onClick={() => openUpiApp("gpay")} className="upi-app-btn gpay-btn">Google Pay</button>
                    <button type="button" onClick={() => openUpiApp("phonepe")} className="upi-app-btn phonepe-btn">PhonePe</button>
                    <button type="button" onClick={() => openUpiApp("upi")} className="upi-app-btn upi-btn">Other UPI</button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3">On mobile, choose your installed UPI app. If the app is not installed, use Other UPI or scan the QR code.</p>

                  <div className="mb-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => setInlineScreenshotFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-200 border border-gray-600 bg-gray-800/80 hover:bg-gray-700/80"
                    >
                      {inlineScreenshotFile ? `✓ ${inlineScreenshotFile.name.slice(0, 24)}` : "Upload payment screenshot"}
                    </button>
                  </div>

                  <div className="text-left mb-4">
                    <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                      <span className="text-red-500 mr-1">*</span>UPI transaction reference
                    </label>
                    <input
                      type="text"
                      required
                      value={inlineRefId}
                      onChange={(e) => setInlineRefId(e.target.value)}
                      placeholder="Enter 12-digit UPI / UTR reference ID"
                      className="w-full p-2.5 rounded-xl text-xs text-white border border-gray-700 bg-gray-900/90 focus:outline-none focus:border-green-500"
                    />
                  </div>

                  <button
                    onClick={handleInlineSubmitReference}
                    disabled={inlineSubmitBusy}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-gray-200 border border-gray-600 bg-gray-800/90 hover:bg-gray-700"
                  >
                    {inlineSubmitBusy ? "Submitting..." : "Submit payment reference"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* 9. SETTINGS WITH SAFE DATABASE PERSISTENCE */}
          {view === "settings" && (
            <>
              {isAdmin ? (
                <AdminSettingsPanel />
              ) : <>
              <div className="page-head">
                <div className="eyebrow">PREFERENCES</div>
                <h1>Settings & Tax Details</h1>
                <p>Configure restaurant identity, GST tax slabs, and account security.</p>
              </div>

              <div className="settings-grid grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <section className="panel p-6 border rounded-2xl bg-card space-y-4">
                  <h2 className="text-base font-bold">Restaurant & GST Details</h2>
                  <div className="space-y-3">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Restaurant Name</span>
                      <input
                        value={storeForm.name}
                        onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                        placeholder="e.g. Mani"
                        className="w-full p-2 border rounded-lg text-xs bg-background"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Phone Number</span>
                      <input
                        value={storeForm.phone}
                        onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full p-2 border rounded-lg text-xs bg-background"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Address</span>
                      <input
                        value={storeForm.address}
                        onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                        placeholder="Street, City, State"
                        className="w-full p-2 border rounded-lg text-xs bg-background"
                      />
                    </label>

                    <div className="pt-2 border-t space-y-2">
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">GSTIN (GST Number)</span>
                        <input
                          value={storeForm.gstin}
                          onChange={(e) => setStoreForm({ ...storeForm, gstin: e.target.value })}
                          placeholder="29AAAAA0000A1Z5"
                          className="w-full p-2 border rounded-lg text-xs font-mono bg-background"
                        />
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">GST Total %</span>
                          <input
                            type="number"
                            value={storeForm.gst_percent}
                            onChange={(e) => setStoreForm({ ...storeForm, gst_percent: e.target.value })}
                            className="w-full p-2 border rounded-lg text-xs bg-background"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">CGST %</span>
                          <input
                            type="number"
                            value={storeForm.cgst_percent}
                            onChange={(e) => setStoreForm({ ...storeForm, cgst_percent: e.target.value })}
                            className="w-full p-2 border rounded-lg text-xs bg-background"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">SGST %</span>
                          <input
                            type="number"
                            value={storeForm.sgst_percent}
                            onChange={(e) => setStoreForm({ ...storeForm, sgst_percent: e.target.value })}
                            className="w-full p-2 border rounded-lg text-xs bg-background"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    className="primary-btn w-full mt-2"
                    onClick={handleSaveRestaurantSettings}
                  >
                    Save Details to Database
                  </button>
                </section>

                <section className="panel p-6 border rounded-2xl bg-card space-y-4">
                  <h2 className="text-base font-bold">Password & Security</h2>
                  <p className="text-xs text-muted-foreground">Reset the account login password.</p>
                  <form onSubmit={handleResetPassword} className="space-y-3">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">New Password</span>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2 border rounded-lg text-xs bg-background"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Confirm New Password</span>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2 border rounded-lg text-xs bg-background"
                      />
                    </label>
                    <button type="submit" className="primary-btn w-full flex items-center justify-center gap-2" disabled={pwdBusy}>
                      <KeyRound size={16} /> {pwdBusy ? "Resetting…" : "Reset Password"}
                    </button>
                  </form>
                </section>
              </div>
              </>}
            </>
          )}

          {/* 10. ADMIN: RESTAURANT DIRECTORY */}
          {view === "restaurants" && (
            <>
              <div className="page-head flex justify-between items-center">
                <div>
                  <div className="eyebrow">PLATFORM CONTROL</div>
                  <h1>Restaurant Directory</h1>
                  <p>Registered restaurants on RestoPulse and their active plans.</p>
                </div>
                <button className="primary-btn flex items-center gap-1.5" onClick={() => { setEditing(null); setForm({name:"",owner:"",email:"",phone:"",city:"",password:""}); setModal("restaurant"); }}>
                  <Plus size={16}/> Add restaurant
                </button>
              </div>

              <div className="panel management-panel mt-6">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>RESTAURANT</th>
                        <th>OWNER</th>
                        <th>PLAN</th>
                        <th>STATUS</th>
                        <th>RENEWAL</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurants.map((r: any) => (
                        <tr key={r.id}>
                          <td><b>{r.name}</b></td>
                          <td>{r.owner}</td>
                          <td><span className="font-semibold text-indigo-500 capitalize">{r.plan}</span></td>
                          <td>
                            <span className={"status " + (r.status === "Active" ? "paid" : "trial")}>
                              {r.status}
                            </span>
                          </td>
                          <td className="font-mono text-sm">{r.renewal}</td>
                          <td><div className="flex gap-1.5">
                            <button className="quiet-btn text-xs" title="Edit restaurant" onClick={() => { setEditing(r.id); setForm({name:r.name,owner:r.owner,email:r.email,phone:r.phone,city:r.city||"",plan:r.plan||"Free Trial",status:r.status||"Active",renewal:r.renewal||""}); setModal("restaurant"); }}><Pencil size={13}/></button>
                            <button className="quiet-btn text-xs" title="Extend subscription" onClick={() => { setEditing(r.id); setForm({days:"30"}); setModal("extend"); }}><Clock size={13}/></button>
                            <button className="quiet-btn text-xs text-red-600" title="Deactivate restaurant" onClick={async()=>{if(!confirm("Deactivate this restaurant?"))return;const res=await authedFetch("/api/admin/restaurants",{method:"DELETE",body:JSON.stringify({id:r.id})});const j=await res.json();if(!res.ok){toast.error(j.error||"Failed");return;}fetchAllRestaurants();toast.success("Restaurant deactivated");}}><Trash2 size={13}/></button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 11. ADMIN: APPROVALS */}
          {view === "approvals" && (
            <>
              <div className="page-head flex justify-between items-center">
                <div>
                  <div className="eyebrow">PLATFORM PIPELINE</div>
                  <h1>Pending Approvals</h1>
                  <p>Review restaurant onboarding applications and incoming subscription payment proofs.</p>
                </div>
                <button className="quiet-btn flex items-center gap-1.5" onClick={() => { fetchRealApprovals(); fetchSubscriptionRequests(); fetchAllRestaurants(); toast.success("Refreshed queues"); }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {/* SUBSCRIPTION PROOFS QUEUE */}
              <section className="panel management-panel mb-8 mt-4">
                <div className="panel-header border-b pb-3 mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    Subscription Renewal Approvals <span className="count-pill">{subscriptionRequests.length}</span>
                  </h2>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>RESTAURANT</th>
                        <th>OWNER</th>
                        <th>PLAN</th>
                        <th>PAYMENT PROOF</th>
                        <th>TRANSACTION NOTE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionRequests.map((req: any) => (
                        <tr key={req.id}>
                          <td className="strong">{req.restaurant_name}</td>
                          <td>
                            <div className="owner-cell">
                              <b>{req.owner_name}</b>
                              <small>{req.owner_email}</small>
                            </div>
                          </td>
                          <td>
                            <span className="status paid font-bold">{req.plan}</span>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              +{getPlanDurationDays(req.plan)} days
                            </span>
                          </td>
                          <td>
                            {req.screenshot_url ? (
                              <a
                                href={req.screenshot_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 underline text-xs font-semibold inline-flex items-center gap-1"
                              >
                                View Proof <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">No screenshot</span>
                            )}
                          </td>
                          <td className="text-sm max-w-xs truncate">{req.message || "—"}</td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <button
                                className="primary-btn text-xs py-1.5 px-3"
                                onClick={() => handleReviewSubscriptionAction(req.id, req, "approve")}
                              >
                                Approve
                              </button>
                              <button
                                className="quiet-btn text-xs py-1.5 px-3 text-red-600 hover:bg-red-50"
                                onClick={() => handleReviewSubscriptionAction(req.id, req, "reject")}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!subscriptionRequests.length && (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                            No pending subscription payment proofs right now.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ONBOARDING REGISTRATIONS */}
              <section className="panel management-panel">
                <div className="panel-header border-b pb-3 mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    Restaurant Onboarding Applications <span className="count-pill">{approvals.length}</span>
                  </h2>
                </div>
                <div className="approval-grid">
                  {approvals.map((a) => (
                    <div className="approval-card" key={a.id}>
                      <div className="approval-top flex justify-between items-center">
                        <span className="approval-avatar">{a.name.slice(0, 2).toUpperCase()}</span>
                        <span className="status trial">Pending Review</span>
                      </div>
                      <h2 className="text-lg font-bold mt-2">{a.name}</h2>
                      <p className="text-xs text-muted-foreground">{a.city} · Submitted {a.submitted}</p>
                      <div className="approval-actions mt-4 flex gap-2">
                        <button className="primary-btn" onClick={() => handleReviewRestaurantApproval(a.id, "approve", a.plan)}>
                          Approve & Activate
                        </button>
                        <button className="quiet-btn text-red-600" onClick={() => handleReviewRestaurantApproval(a.id, "reject")}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {!approvals.length && (
                    <div className="panel empty-state">No pending restaurant onboarding applications.</div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* 12. ADMIN: PRICING PLANS (WITH VISIBLE ADD, EDIT, DELETE CONTROLS) */}
          {view === "pricing" && (
            <>
              <div className="page-head flex justify-between items-center">
                <div>
                  <div className="eyebrow">PLATFORM CONTROLS</div>
                  <h1>Pricing Plans & Configuration</h1>
                  <p>Add, edit, or delete the plans offered to all restaurants across RestoPulse.</p>
                </div>
                <button
                  className="primary-btn flex items-center gap-1.5 font-bold"
                  onClick={() => open("plan")}
                >
                  <Plus size={16} /> Add New Plan
                </button>
              </div>

              <section className="panel settings-panel mb-6 mt-4">
                <h2>Restaurant payment UPI ID</h2>
                <div className="settings-fields mt-3">
                  <label>Admin UPI ID<input value={adminUpiId} onChange={(e) => setAdminUpiId(e.target.value)} placeholder="merchant@upi" /></label>
                </div>
                <button className="primary-btn mt-3" onClick={saveAdminUpi} disabled={adminUpiBusy}>Save Admin UPI ID</button>
              </section>

              {/* Editable Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((p) => (
                  <div key={p.id} className="p-5 border rounded-2xl bg-card space-y-3 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-base">{p.name}</h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-secondary">
                          {p.period}
                        </span>
                      </div>
                      <div className="text-2xl font-black mt-2">
                        {money(p.price)} <small className="text-xs font-normal text-muted-foreground">/{p.period}</small>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{p.features}</p>
                    </div>

                    {/* Admin Actions: Edit & Delete */}
                    <div className="pt-3 border-t flex justify-end gap-2">
                      <button
                        className="quiet-btn text-xs py-1.5 px-3 flex items-center gap-1 font-semibold hover:border-amber-500"
                        onClick={() => open("plan", p.id)}
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        className="quiet-btn text-xs py-1.5 px-3 text-red-600 hover:bg-red-50 flex items-center gap-1 font-semibold"
                        onClick={() => handleDeletePlan(p.id)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {mobileNav && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}

      <Dialog open={modal === "extend"} onOpenChange={(v)=>!v&&setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Extend Subscription</DialogTitle><DialogDescription>Extend the selected restaurant's current subscription without changing its plan.</DialogDescription></DialogHeader>
          <div className="modal-fields">
            <label>Extension period<select value={form.days||"30"} onChange={e=>setForm({...form,days:e.target.value})}>
              <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="180">180 days</option><option value="365">365 days</option>
            </select></label>
          </div>
          <DialogFooter><button className="quiet-btn" onClick={()=>setModal(null)}>Cancel</button><button className="primary-btn" onClick={save}>Extend subscription</button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "support"} onOpenChange={(v)=>!v&&setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Support & Help</DialogTitle><DialogDescription>Contact RestoPulse support using the options below.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            {(supportSections.filter((x:any)=>x.active !== false)).map((section:any)=><div key={section.id} className="border rounded-xl p-4 space-y-2">
              <h3 className="font-bold">{section.title}</h3>
              <p className="text-xs text-muted-foreground">{section.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {section.phone && <a className="primary-btn text-center" href={`tel:${String(section.phone).replace(/\s+/g,"")}`}>Call</a>}
                {section.whatsapp && <a className="primary-btn text-center" href={`https://wa.me/${String(section.whatsapp).replace(/\D/g,"")}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                {section.email && <a className="quiet-btn text-center" href={`mailto:${section.email}`}>Email</a>}
              </div>
            </div>)}
            {!supportSections.length && <div className="text-sm text-muted-foreground">Support contact information is not configured yet.</div>}
          </div>
          <DialogFooter><button className="quiet-btn" onClick={()=>setModal(null)}>Close</button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DEDICATED MODAL FOR ADDING / EDITING PRICING PLANS */}
      <Dialog open={modal === "restaurant"} onOpenChange={(v)=>!v&&setModal(null)}>
        <DialogContent className="modal-content">
          <DialogHeader><DialogTitle>{editing ? "Edit Restaurant" : "Add Restaurant"}</DialogTitle><DialogDescription>Manage the platform restaurant account without changing the existing console style.</DialogDescription></DialogHeader>
          <div className="modal-fields">
            <label>Restaurant name<input value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})}/></label>
            <label>Owner name<input value={form.owner||""} onChange={e=>setForm({...form,owner:e.target.value})}/></label>
            <label>Owner email<input type="email" disabled={editing!==null} value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/></label>
            <label>Owner phone<input value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
            <label>City<input value={form.city||""} onChange={e=>setForm({...form,city:e.target.value})}/></label>
            {!editing && <label>Temporary password<input type="password" minLength={12} placeholder="Minimum 12 characters" value={form.password||""} onChange={e=>setForm({...form,password:e.target.value})}/></label>}
            {editing && <><label>Plan<select value={form.plan||"Free Trial"} onChange={e=>setForm({...form,plan:e.target.value})}>{plans.map(x=><option key={x.id}>{x.name}</option>)}</select></label><label>Status<select value={form.status||"Active"} onChange={e=>setForm({...form,status:e.target.value})}><option>Trial</option><option>Active</option><option>Paused</option></select></label><label>Renewal date<input type="date" value={form.renewal==="—"?"":form.renewal||""} onChange={e=>setForm({...form,renewal:e.target.value})}/></label></>}
          </div>
          <DialogFooter><button className="quiet-btn" onClick={()=>setModal(null)}>Cancel</button><button className="primary-btn" onClick={save}>{editing?"Save changes":"Create restaurant"}</button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "plan"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Pricing Plan" : "Add New Pricing Plan"}</DialogTitle>
            <DialogDescription>
              Changes made here will immediately update the options in the restaurant console.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <label className="block space-y-1">
              <span className="font-semibold text-muted-foreground">Plan Name</span>
              <input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Starter, Monthly, Quarterly, Yearly"
                className="w-full p-2 border rounded-lg bg-background text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold text-muted-foreground">Price (₹)</span>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="2999"
                className="w-full p-2 border rounded-lg bg-background text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold text-muted-foreground">Duration / Period Label</span>
              <input
                value={form.period || ""}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                placeholder="e.g. 7 days, 30 days, 365 days"
                className="w-full p-2 border rounded-lg bg-background text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold text-muted-foreground">Features Description</span>
              <textarea
                value={form.features || ""}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                placeholder="Core POS, table management, live inventory tracking..."
                className="w-full p-2 border rounded-lg bg-background h-24 text-sm"
              />
            </label>
          </div>
          <DialogFooter>
            <button className="quiet-btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="primary-btn" onClick={save}>Save Plan</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DEDICATED DISH MODAL (WITH IMAGE UPLOAD, EDIT, AND DELETE) */}
      <Dialog open={modal === "dish"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Dish" : "Add New Dish"}</DialogTitle>
            <DialogDescription>
              Upload dish photos, customize categories, pricing, and ingredients.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="font-semibold text-muted-foreground block">Dish Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border bg-muted flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Dish preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2 text-muted-foreground">
                      <ImageIcon className="mx-auto mb-1 text-muted-foreground" size={20} />
                      <span className="text-[10px] block">No image</span>
                    </div>
                  )}
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <input
                    type="file"
                    ref={dishImageInputRef}
                    accept="image/*"
                    onChange={handleDishImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={dishImageUploading}
                    onClick={() => dishImageInputRef.current?.click()}
                    className="w-full py-2 px-3 border border-dashed rounded-xl flex items-center justify-center gap-2 hover:bg-muted font-medium text-xs transition-colors"
                  >
                    <Upload size={14} />
                    {dishImageUploading ? "Processing..." : form.imageUrl ? "Change photo" : "Upload dish image"}
                  </button>
                  <input
                    type="text"
                    value={form.imageUrl || ""}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="Or paste image URL"
                    className="w-full p-2 border rounded-lg bg-background text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="col-span-2 block space-y-1">
                <span className="font-semibold text-muted-foreground">Dish Name</span>
                <input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Paneer Butter Masala"
                  className="w-full p-2 border rounded-lg bg-background text-xs font-semibold"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Emoji Icon</span>
                <input
                  value={form.emoji || "🍽"}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  placeholder="🍛"
                  className="w-full p-2 border rounded-lg bg-background text-center text-sm"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Category</span>
                <select
                  value={form.category || "Mains"}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-background text-xs"
                >
                  <option value="Appetizers">Appetizers</option>
                  <option value="Mains">Mains</option>
                  <option value="Breads">Breads</option>
                  <option value="Rice & Biryani">Rice & Biryani</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Drinks">Drinks</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Dietary Tag</span>
                <select
                  value={form.diet || ""}
                  onChange={(e) => setForm({ ...form, diet: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-background text-xs"
                >
                  <option value="">Standard</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Gluten-free">Gluten-free</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Price (₹)</span>
                <input
                  type="number"
                  value={form.price || ""}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="350"
                  className="w-full p-2 border rounded-lg bg-background font-mono text-xs"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Cost (₹)</span>
                <input
                  type="number"
                  value={form.cost || ""}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="120"
                  className="w-full p-2 border rounded-lg bg-background font-mono text-xs"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Prep Time (mins)</span>
                <input
                  type="number"
                  value={form.time || "15"}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="15"
                  className="w-full p-2 border rounded-lg bg-background font-mono text-xs"
                />
              </label>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
            {editing ? (
              <button
                type="button"
                className="quiet-btn text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                onClick={() => {
                  handleDeleteDish(editing);
                  setModal(null);
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button className="quiet-btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="primary-btn font-bold" onClick={save}>
                {editing ? "Save Changes" : "Create Dish"}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INVENTORY ADD / EDIT MODAL */}
      <Dialog open={modal === "inventory"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingInvId !== null ? "Edit Stock Item" : "Add New Stock Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Item Name</span>
              <input type="text" value={invForm.name} onChange={(e) => setInvForm({ ...invForm, name: e.target.value })} className="w-full p-2 border rounded-md text-sm bg-transparent" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Quantity On Hand</span>
                <input type="number" min="0" value={invForm.onHand} onChange={(e) => setInvForm({ ...invForm, onHand: e.target.value })} className="w-full p-2 border rounded-md text-sm bg-transparent" />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Unit</span>
                <input type="text" value={invForm.unit} onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })} className="w-full p-2 border rounded-md text-sm bg-transparent" />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Reorder Threshold</span>
              <input type="number" min="0" value={invForm.reorderLevel} onChange={(e) => setInvForm({ ...invForm, reorderLevel: e.target.value })} className="w-full p-2 border rounded-md text-sm bg-transparent" />
            </label>
          </div>
          <DialogFooter>
            <button className="quiet-btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="primary-btn" onClick={handleAddOrEditInventory}>Save Item</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CUSTOM STOCK REDUCTION MODAL */}
      <Dialog open={modal === "stockAdjust"} onOpenChange={(v) => {
        if (!v) {
          setModal(null);
          setStockAdjustItem(null);
          setStockAdjustMode("reduce");
          setStockAdjustQty("");
          setStockAdjustNote("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{stockAdjustMode === "add" ? "Add Stock" : "Reduce Stock"}</DialogTitle>
            <DialogDescription>Enter the exact quantity and an optional reason for this stock movement.</DialogDescription>
          </DialogHeader>
          {stockAdjustItem && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="text-sm font-semibold">{stockAdjustItem.name}</div>
                <div className="text-xs text-muted-foreground mt-1">Current stock: <b>{stockAdjustItem.onHand} {stockAdjustItem.unit}</b></div>
              </div>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Quantity {stockAdjustMode === "add" ? "to add" : "to reduce"}</span>
                <input
                  type="number"
                  min="0.01"
                  max={stockAdjustMode === "reduce" ? stockAdjustItem.onHand : undefined}
                  step="any"
                  autoFocus
                  value={stockAdjustQty}
                  onChange={(e) => setStockAdjustQty(e.target.value)}
                  placeholder={`e.g. 2 or 0.5 ${stockAdjustItem.unit}`}
                  className="w-full p-2.5 border rounded-md text-sm bg-transparent"
                />
                {stockAdjustMode === "reduce" ? (
                  <span className="text-xs text-muted-foreground">Maximum: {stockAdjustItem.onHand} {stockAdjustItem.unit}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">No fixed maximum</span>
                )}
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Reason <span className="text-muted-foreground font-normal">(optional)</span></span>
                <input
                  type="text"
                  value={stockAdjustNote}
                  onChange={(e) => setStockAdjustNote(e.target.value)}
                  placeholder="e.g. wastage, damaged, expired, manual correction"
                  className="w-full p-2.5 border rounded-md text-sm bg-transparent"
                />
              </label>
              {stockAdjustQty && Number(stockAdjustQty) > 0 && Number(stockAdjustQty) <= stockAdjustItem.onHand && (
                <div className="rounded-lg border p-3 text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">{stockAdjustMode === "add" ? "New stock" : "Remaining stock"}</span>
                  <b>{(stockAdjustItem.onHand + (stockAdjustMode === "add" ? Number(stockAdjustQty) : -Number(stockAdjustQty))).toLocaleString(undefined, { maximumFractionDigits: 3 })} {stockAdjustItem.unit}</b>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button className="quiet-btn" onClick={() => { setModal(null); setStockAdjustItem(null); }}>Cancel</button>
            <button className="primary-btn" onClick={submitStockAdjustment}>{stockAdjustMode === "add" ? "Add Stock" : "Reduce Stock"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EMPLOYEE ADD / EDIT MODAL */}
      <Dialog open={modal === "employee"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            <DialogDescription>Assign designation, access permissions, and salary structure.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <label className="block space-y-1">
              <span className="font-semibold text-muted-foreground">Full Name</span>
              <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ramesh Kumar" className="w-full p-2 border rounded-lg bg-background" />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-muted-foreground">Designation & Access Role</span>
              <select
                value={form.role || "Staff"}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full p-2 border rounded-lg bg-background font-medium"
              >
                <option value="Manager">Manager (Operational access: POS, Menu, Inventory, Staff)</option>
                <option value="Accountant">Accountant (Financial access: Expenses, Suppliers, Payroll)</option>
                <option value="Storekeeper">Storekeeper (Warehouse access: Inventory, Suppliers)</option>
                <option value="Staff">Staff (POS cashier terminal access only)</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Pay Type</span>
                <select
                  value={form.payType || "Monthly"}
                  onChange={(e) => setForm({ ...form, payType: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-background"
                >
                  <option value="Monthly">Monthly Salary</option>
                  <option value="Weekly">Weekly Salary</option>
                  <option value="Daily">Daily Wage</option>
                </select>
              </label>

              {form.payType === "Daily" ? (
                <label className="block space-y-1">
                  <span className="font-semibold text-muted-foreground">Daily Rate (₹)</span>
                  <input type="number" value={form.dailyRate || ""} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} placeholder="800" className="w-full p-2 border rounded-lg bg-background" />
                </label>
              ) : form.payType === "Weekly" ? (
                <label className="block space-y-1">
                  <span className="font-semibold text-muted-foreground">Weekly Salary (₹)</span>
                  <input type="number" value={form.weeklySalary || ""} onChange={(e) => setForm({ ...form, weeklySalary: e.target.value })} placeholder="5600" className="w-full p-2 border rounded-lg bg-background" />
                </label>
              ) : (
                <label className="block space-y-1">
                  <span className="font-semibold text-muted-foreground">Monthly Salary (₹)</span>
                  <input type="number" value={form.monthlySalary || ""} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} placeholder="25000" className="w-full p-2 border rounded-lg bg-background" />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Shift</span>
                <input value={form.shift || ""} onChange={(e) => setForm({ ...form, shift: e.target.value })} placeholder="09:00 – 18:00" className="w-full p-2 border rounded-lg bg-background" />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Phone</span>
                <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 00000" className="w-full p-2 border rounded-lg bg-background" />
              </label>
            </div>
          </div>
          <DialogFooter>
            <button className="quiet-btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="primary-btn" onClick={save}>Save Employee</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GLOBAL ENTITY MODAL (SUPPLIER, EXPENSE, PAYMENT) */}
      <Dialog open={modal === "supplier" || modal === "expense" || modal === "payment"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="modal-content">
          <DialogHeader>
            <DialogTitle>
              {modal === "supplier" ? (editing ? "Edit Supplier" : "Add Supplier")
                : modal === "expense" ? "Log Expense"
                : "Record Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="modal-fields">
            {modal === "expense" && (
              <>
                <label>Description<input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label>
                  Category
                  <select value={form.category || "Inventory"} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="Inventory">Inventory</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Rent">Rent</option>
                    <option value="Staff welfare">Staff welfare</option>
                  </select>
                </label>
                <label>
                  Linked Supplier (optional)
                  <select value={form.supplierId || ""} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                    <option value="">None</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label>Amount (₹)<input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
              </>
            )}
            {modal === "supplier" && (
              <>
                <label>Supplier name<input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label>Contact person<input value={form.contact || ""} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></label>
                <label>Phone<input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>Status<select value={form.active || "true"} onChange={(e)=>setForm({...form,active:e.target.value})}><option value="true">Active</option><option value="false">Inactive</option></select></label>
              </>
            )}
            {modal === "payment" && (
              <>
                <label>
                  Supplier
                  <select value={form.supplierId || ""} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                    <option value="">Select</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label>Amount (₹)<input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
              </>
            )}
          </div>
          <DialogFooter>
            <button className="quiet-btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="primary-btn" onClick={save}>Save changes</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EMPLOYEE DETAILS SHEET */}
      <Sheet open={!!selectedStaff} onOpenChange={(v) => !v && setSelectedStaff(null)}>
        <SheetContent className="profile-sheet">
          <SheetHeader>
            <SheetTitle>Employee & Wage Record</SheetTitle>
          </SheetHeader>
          {selectedStaff && (
            <div className="space-y-4 py-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                <span className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold flex items-center justify-center">
                  {selectedStaff.initial}
                </span>
                <div>
                  <h3 className="text-sm font-bold">{selectedStaff.name}</h3>
                  <p className="text-muted-foreground">{selectedStaff.role} · {selectedStaff.phone}</p>
                  <p className="text-indigo-600 font-semibold mt-0.5">
                    {selectedStaff.payType === "Monthly"
                      ? `Monthly: ${money(selectedStaff.monthlySalary)}`
                      : selectedStaff.payType === "Weekly"
                        ? `Weekly: ${money(selectedStaff.weeklySalary)}`
                        : `Daily: ${money(selectedStaff.dailyRate)}`}
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-3 border rounded-xl">
                <div className="font-bold">Record Day's Wage / Daily Attendance</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span>Date</span>
                    <input
                      type="date"
                      value={wageForm.date}
                      onChange={(e) => setWageForm({ ...wageForm, date: e.target.value })}
                      className="w-full p-1.5 border rounded"
                    />
                  </label>
                  <label className="space-y-1">
                    <span>Amount (₹)</span>
                    <input
                      type="number"
                      value={wageForm.amount}
                      onChange={(e) => setWageForm({ ...wageForm, amount: e.target.value })}
                      className="w-full p-1.5 border rounded"
                    />
                  </label>
                </div>
                <button
                  className="primary-btn w-full mt-2"
                  onClick={async () => {
                    if (!tenantId || !wageForm.amount) return;
                    const {data,error}=await db.from("daily_wages").insert({
                      restaurant_id:tenantId, employee_id:selectedStaff.id, wage_date:wageForm.date,
                      amount:Number(wageForm.amount), status:"Unpaid", note:"Wage"
                    }).select().single();
                    if(error){toast.error(error.message);return;}
                    setWages(old=>[{id:data.id,staffId:data.employee_id,date:data.wage_date,amount:Number(data.amount),status:data.status,note:data.note},...old]);
                    toast.success("Wage logged");
                  }}
                >
                  Save Wage Entry
                </button>
              </div>

              <div className="space-y-2 p-3 border rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <div><div className="font-bold">Weekly Payment</div><div className="text-[10px] text-muted-foreground">Pay all unpaid wage entries for a selected week.</div></div>
                  <Wallet size={16} className="text-indigo-600" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1"><span>Week start</span><input type="date" value={weeklyPaymentForm.start} onChange={e=>setWeeklyPaymentForm(v=>({...v,start:e.target.value}))} className="w-full p-1.5 border rounded" /></label>
                  <label className="space-y-1"><span>Week end</span><input type="date" value={weeklyPaymentForm.end} onChange={e=>setWeeklyPaymentForm(v=>({...v,end:e.target.value}))} className="w-full p-1.5 border rounded" /></label>
                </div>
                {(() => {
                  const start = weeklyPaymentForm.start ? new Date(`${weeklyPaymentForm.start}T00:00:00`) : null;
                  const end = weeklyPaymentForm.end ? new Date(`${weeklyPaymentForm.end}T23:59:59`) : null;
                  const weekRows = start && end ? wages.filter(w => w.staffId === selectedStaff.id && w.status === "Unpaid" && new Date(`${w.date}T12:00:00`) >= start && new Date(`${w.date}T12:00:00`) <= end) : [];
                  const weeklySalary = Number(selectedStaff.weeklySalary || 0);
                  const isWeeklySalary = selectedStaff.payType === "Weekly";
                  const total = weekRows.reduce((n,w)=>n+Number(w.amount||0),0);
                  const payable = isWeeklySalary && weeklySalary > 0 && !weekRows.length ? weeklySalary : total;
                  return <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2"><span>{isWeeklySalary ? `Weekly salary · ${money(weeklySalary)}` : `${weekRows.length} unpaid record(s) · ${money(total)}`}</span><span className="font-bold text-foreground">Payable: {money(payable)}</span></div>
                    <button className="primary-btn w-full" disabled={!tenantId || !end || !payable} onClick={async()=>{
                      if(!tenantId || !payable || !weeklyPaymentForm.end) return;
                      if(isWeeklySalary && !weekRows.length){
                        const {data,error}=await db.from("daily_wages").insert({restaurant_id:tenantId,employee_id:selectedStaff.id,wage_date:weeklyPaymentForm.end,amount:weeklySalary,status:"Paid",note:"Weekly salary"}).select().single();
                        if(error){toast.error(error.message);return;}
                        setWages(old=>[{id:data.id,staffId:data.employee_id,date:data.wage_date,amount:Number(data.amount),status:data.status,note:data.note},...old]);
                        toast.success(`Weekly salary paid · ${money(weeklySalary)}`);
                      } else {
                        const ids=weekRows.map(w=>w.id);
                        const {error}=await db.from("daily_wages").update({status:"Paid",note:"Weekly payment"}).eq("restaurant_id",tenantId).in("id",ids);
                        if(error){toast.error(error.message);return;}
                        setWages(old=>old.map(w=>ids.includes(w.id)?{...w,status:"Paid",note:"Weekly payment"}:w));
                        toast.success(`Weekly payment recorded · ${money(total)}`);
                      }
                    }}>{isWeeklySalary ? "Pay Weekly Salary" : weekRows.length ? "Pay Week" : "No unpaid wages"}</button>
                  </div>;
                })()}
              </div>

              <div className="space-y-2">
                <div className="font-bold">Wage History</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {wages.filter(w => w.staffId === selectedStaff.id).map(w => (
                    <div key={w.id} className="p-2 border rounded-lg flex justify-between items-center">
                      <div>
                        <div>{w.date}</div>
                        <small className="text-muted-foreground">{w.note || "Daily wage"}</small>
                      </div>
                      <div className="flex items-center gap-2">
                        <b>{money(w.amount)}</b>
                        <button
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${w.status === "Paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                          onClick={async () => {
                            if(!tenantId)return;
                            const next=w.status==="Paid"?"Unpaid":"Paid";
                            const {error}=await db.from("daily_wages").update({status:next}).eq("restaurant_id",tenantId).eq("id",w.id);
                            if(error){toast.error(error.message);return;}
                            setWages(old=>old.map(item=>item.id===w.id?{...item,status:next}:item));
                          }}
                        >
                          {w.status}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={saleHistoryOpen} onOpenChange={setSaleHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sale History</DialogTitle>
            <DialogDescription>Completed sales for the currently signed-in restaurant.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left p-2">Receipt</th><th className="text-left p-2">Date & time</th><th className="text-left p-2">Items</th><th className="text-left p-2">Payment</th><th className="text-right p-2">Total</th><th /></tr></thead>
              <tbody>
                {orders.map((sale)=>(
                  <tr key={sale.id} className="border-b">
                    <td className="p-2 font-mono">{sale.bill.id}</td>
                    <td className="p-2">{sale.bill.issuedAt}</td>
                    <td className="p-2">{sale.bill.items.reduce((n,x)=>n+x.qty,0)} item(s)</td>
                    <td className="p-2">{sale.bill.payment}</td>
                    <td className="p-2 text-right font-bold">{money(sale.bill.total)}</td>
                    <td className="p-2 text-right"><button className="quiet-btn text-xs" onClick={()=>setReceipt(sale.bill)}>View receipt</button></td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No completed sales yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* PRINTABLE THERMAL RECEIPT DIALOG */}
      <Dialog open={!!receipt} onOpenChange={(v) => !v && setReceipt(null)}>
        <DialogContent className="max-w-md p-6 bg-slate-900 border border-slate-800 text-white">
          <DialogHeader className="no-print">
            <DialogTitle className="text-base font-bold">Bill Details & Receipt</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select paper format and print receipt
            </DialogDescription>
          </DialogHeader>

          {/* Paper Size Format Selector (58mm, 80mm, A4) */}
          <div className="no-print flex items-center justify-between p-2.5 mb-2 rounded-xl bg-slate-800 border border-slate-700 text-xs">
            <span className="font-semibold text-gray-300">Format:</span>
            <div className="flex gap-1.5">
              {(["58mm", "85mm", "A4"] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setPrintPaperSize(sz)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    printPaperSize === sz
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {receipt && (
            <div
              id="printable-receipt-card"
              className={`receipt-paper format-${printPaperSize} p-5 bg-white text-black rounded-xl font-mono text-[11px] leading-relaxed border shadow-lg overflow-hidden`}
            >
              {/* Receipt Header */}
              <div className="text-center space-y-0.5">
                <div className="text-sm font-extrabold uppercase tracking-wide">
                  {receipt.business?.name || activeRestaurantName}
                </div>
                <div className="text-[10px] text-gray-600 leading-tight">
                  {receipt.business?.address}
                </div>
                {receipt.business?.business_phone && (
                  <div className="text-[10px] text-gray-600">
                    Ph: {receipt.business.business_phone}
                  </div>
                )}
                {receipt.business?.gstin && (
                  <div className="text-[10px] font-bold text-gray-800">
                    GSTIN: {receipt.business.gstin}
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-gray-400 my-2" />

              <div className="flex justify-between text-[11px] font-bold">
                <span>Bill: {receipt.id}</span>
                <span>{receipt.type} {receipt.table ? `(${receipt.table})` : ''}</span>
              </div>
              <div className="text-[10px] text-gray-500">{receipt.issuedAt}</div>

              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Monochromatic table with percentage widths */}
              <table className="w-full text-[10px] font-mono border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-dashed border-gray-400 text-gray-700 font-bold">
                    <th className="py-1 text-left w-[50%]">ITEM</th>
                    <th className="py-1 text-center w-[15%]">QTY</th>
                    <th className="py-1 text-right w-[17%]">PRICE</th>
                    <th className="py-1 text-right w-[18%]">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-dotted border-gray-200">
                      <td className="py-1 pr-1 truncate text-left">{item.name}</td>
                      <td className="py-1 text-center">{item.qty}</td>
                      <td className="py-1 text-right">{money(item.unitPrice)}</td>
                      <td className="py-1 text-right font-semibold">
                        {money(item.qty * (item.unitPrice - item.discount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Financial Breakdown & GST Slabs */}
              <div className="space-y-0.5 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{money(receipt.subtotal)}</span>
                </div>
                {receipt.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span>−{money(receipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 text-[10px]">
                  <span>CGST ({tenantInfo.cgst_percent}%):</span>
                  <span>{money(receipt.cgst)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-[10px]">
                  <span>SGST ({tenantInfo.sgst_percent}%):</span>
                  <span>{money(receipt.sgst)}</span>
                </div>
                <div className="border-b border-solid border-gray-900 my-1" />
                <div className="flex justify-between text-xs font-black pt-0.5">
                  <span>TOTAL DUE</span>
                  <span>{money(receipt.total)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-gray-500 pt-0.5">
                  <span>Payment Mode</span>
                  <span>{receipt.payment}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center text-[9px] text-gray-500 pt-2 border-t border-dashed border-gray-300">
                {receipt.business?.receipt_footer || "Thank you for dining with us! Visit again."}
              </div>
            </div>
          )}

          <DialogFooter className="no-print mt-4 flex gap-2">
            <button className="quiet-btn" onClick={() => setReceipt(null)}>
              Close
            </button>
            <button
              className="primary-btn flex items-center gap-1.5"
              onClick={() => {
                window.print();
              }}
            >
              <Printer size={16} /> Print Receipt ({printPaperSize})
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
