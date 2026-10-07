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
  | "support"
  | "admins";

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
  { id: "support", label: "Support & Help Management", icon: Send },
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
  const [readNotificationKeys, setReadNotificationKeys] = useState<string[]>([]);
  const notificationStorageKey = `rp-read-notifications:${authUser || "anonymous"}:${tenantId || "platform"}`;
  const [dark, setDark] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);

  // Dynamic Plans state synced with server
  const [plans, setPlans] = useState<Plan[]>(initialPlans);

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
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
  const [modal, setModal] = useState<"plan" | "dish" | "expense" | "restaurant" | "extend" | "employee" | "supplier" | "payment" | "inventory" | "stockAdjust" | "support" | "admin" | null>(null);
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
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", permissions: { restaurants:true, approvals:true, pricing:true, settings:true, support:true, admins:false } });
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
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
  }, [activeInlinePlan, authedFetch]);

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

  const resetTenantScopedState = () => {
    setOrders([]);
    setDishes([]);
    setExpenses([]);
    setSuppliers([]);
    setSupplierPayments([]);
    setStaff([]);
    setWages([]);
    setInventoryList([]);
    setInventoryTransactions([]);
    setReceipt(null);
    setCart([]);
    setSelectedStaff(null);
    setSupplierDetail(null);
    setTenantInfo((prev) => ({ ...prev, id: undefined, name: "", address: "", business_phone: "", gstin: "" }));
    setSubscriptionHistory([]);
    setActivePlanName("Loading…");
    setActiveRenewalDate("—");
  };

  const switchWorkspace = (rest: any) => {
    if (!rest?.id || rest.id === tenantIdRef.current) { setWorkspaceMenuOpen(false); return; }
    resetTenantScopedState();
    setTenantId(rest.id);
    tenantIdRef.current = rest.id;
    localStorage.setItem("rp-active-tenant-id", rest.id);
    setActiveRestaurantName(rest.name || "Loading workspace…");
    setActivePlanName(rest.plan || "Free trial");
    setActiveRenewalDate(rest.renewal || rest.renewal_on || "—");
    setCurrentUserRole(String(rest.role || "OWNER").toLowerCase());
    setTenantInfo((prev) => ({
      ...prev,
      id: rest.id,
      name: rest.name || "",
      address: rest.city ? `${rest.name}, ${rest.city}` : "",
      business_phone: rest.phone || "",
    }));
    setWorkspaceMenuOpen(false);
    setView("dashboard");
    setMobileNav(false);
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

  const fetchAdmins = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await authedFetch("/api/admin/admins");
      const json = await res.json();
      if (res.ok && Array.isArray(json?.admins)) setAdmins(json.admins);
      else if (!res.ok) throw new Error(json?.error || "Could not load admins");
    } catch (e:any) { toast.error(e.message || "Could not load admins"); }
  }, [authedFetch, isAdmin]);

  const fetchRealApprovals = useCallback(async () => {
    try {
      const res = await authedFetch("/api/admin/approvals");
      const json = await res.json();
      if (json?.approvals) {
        setApprovals(json.approvals);
      }
    } catch {}
  }, [authedFetch]);

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
  }, [authedFetch]);

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
        const a = await db.from("platform_admins").select("user_id").eq("user_id", authUser).maybeSingle();
        if (!live) return;
        const platform = !!a?.data;
        setIsAdmin(platform);
        setAccountRole(platform ? "admin" : "restaurant");
        if (!platform) {
          const wsRes = await authedFetch("/api/workspaces");
          const wsJson = await wsRes.json().catch(() => ({}));
          const workspaces = wsRes.ok && Array.isArray(wsJson?.workspaces) ? wsJson.workspaces : [];
          setRestaurants(workspaces);
          const savedTenantId = localStorage.getItem("rp-active-tenant-id");
          const target = workspaces.find((r:any) => r.id === savedTenantId) || workspaces[0];
          if (target) {
            setTenantId(target.id);
            tenantIdRef.current = target.id;
            localStorage.setItem("rp-active-tenant-id", target.id);
            setActiveRestaurantName(target.name || "Restaurant");
            setActivePlanName(target.plan || "Free trial");
            setActiveRenewalDate(target.renewal || "—");
            setCurrentUserRole(String(target.role || "OWNER").toLowerCase());
          } else {
            setTenantId(null);
            tenantIdRef.current = null;
            localStorage.removeItem("rp-active-tenant-id");
          }
          setTenantHydrating(false);
        } else {
          setTenantHydrating(false);
        }
      } catch (e) {
        console.error("Auth hydration error", e);
      }
    })();
    return () => {
      live = false;
    };
  }, [db, authUser, authedFetch]);

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

  useEffect(() => {
    const syncClock = () => setLiveDate(new Date());
    syncClock();
    const timer = window.setInterval(syncClock, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authUser) return;
    fetchSupportSections();
    if (isAdmin) {
      fetchSubscriptionRequests();
      fetchRealApprovals();
      fetchAllRestaurants();
      fetchAdmins();
      fetchLivePlans();
    }
    if (!isAdmin && tenantId) {
      syncLiveSubscriptionStatus();
    }
  }, [authUser, isAdmin, tenantId, fetchSubscriptionRequests, fetchRealApprovals, fetchAllRestaurants, fetchAdmins, syncLiveSubscriptionStatus, fetchLivePlans, fetchSupportSections]);

  const loadRestaurantData = useCallback(async (id: string) => {
    if (!id || isAdmin) return;
    setOrders([]); setDishes([]); setExpenses([]); setSuppliers([]); setSupplierPayments([]);
    setStaff([]); setWages([]); setInventoryList([]); setInventoryTransactions([]);
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
      if (!staffRes.error) setStaff((staffRes.data || []).map((x:any)=>({id:x.id,name:x.name,role:
