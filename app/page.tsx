"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  Package,
  ExternalLink,
  Save,
  Upload,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  Clock,
  X,
  ImageIcon,
  Phone,
  Mail,
  MessageCircle,
  LifeBuoy,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  DollarSign,
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

export type View =
  | "dashboard"
  | "pos"
  | "sales_history"
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
  | "admins"
  | "support";

export type Dish = {
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

export type Plan = {
  id: number;
  name: string;
  price: number;
  period: string;
  features: string;
  active: boolean;
};

export type CartLine = {
  id: number | string;
  qty: number;
  discount: number;
  override?: number;
};

export type InventoryItem = {
  id: string | number;
  name: string;
  category: string;
  onHand: number;
  unit: string;
  reorderLevel: number;
  cost?: number;
};

export type Staff = {
  id: number | string;
  name: string;
  role: "Manager" | "Accountant" | "Storekeeper" | "Staff";
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

export type Wage = {
  id: number | string;
  staffId: number | string;
  date: string;
  amount: number;
  status: "Paid" | "Unpaid";
  note: string;
};

export type Expense = {
  id: number | string;
  name: string;
  category: string;
  vendor: string;
  amount: number;
  date: string;
  supplierId?: string | null;
};

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
};

export type SupplierPayment = {
  id: string;
  supplierId: string;
  amount: number;
  date: string;
  method: string;
  note: string;
};

export type BillItem = {
  name: string;
  qty: number;
  unitPrice: number;
  discount: number;
};

export type Bill = {
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
  cgst_percent?: number;
  sgst_percent?: number;
  gst_percent?: number;
  total: number;
  type: string;
  table: string;
  payment: string;
  status: string;
};

export type Sale = {
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
  { id: 2, name: "Monthly", price: 499, period: "30 days", features: "Full access, table management, live inventory tracking, POS checkout.", active: true },
  { id: 3, name: "Yearly", price: 4999, period: "365 days", features: "Full platform access, priority support, unlimited staff accounts.", active: true },
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

const moneyDec = (n: number | string | undefined | null) => {
  const num = typeof n === "number" ? n : Number(n) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const money = (n: number | string | undefined | null) => {
  const num = typeof n === "number" ? n : Number(n) || 0;
  return "₹" + Math.round(num).toLocaleString("en-IN");
};

// Nav items: Support & Help is removed from sidebar and kept inside the Profile menu
const navTenant: { id: View; label: string; icon: any; allowedRoles?: string[] }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard, allowedRoles: ["owner", "manager", "accountant", "storekeeper", "staff"] },
  { id: "pos", label: "POS Terminal", icon: ShoppingBag, allowedRoles: ["owner", "manager", "staff"] },
  { id: "menu", label: "Menu & dishes", icon: UtensilsCrossed, allowedRoles: ["owner", "manager"] },
  { id: "inventory", label: "Inventory", icon: Package, allowedRoles: ["owner", "manager", "storekeeper"] },
  { id: "staff", label: "Team & payroll", icon: Users, allowedRoles: ["owner", "manager"] },
  { id: "expenses", label: "Expenses", icon: ReceiptText, allowedRoles: ["owner", "accountant", "manager"] },
  { id: "suppliers", label: "Suppliers", icon: Building2, allowedRoles: ["owner", "accountant", "storekeeper"] },
  { id: "subscription", label: "Subscription", icon: CreditCard, allowedRoles: ["owner"] },
  { id: "settings", label: "Settings", icon: Settings, allowedRoles: ["owner"] },
];

const navPlatform: { id: View; label: string; icon: any }[] = [
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

  // Tenant scoping & state
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantHydrating, setTenantHydrating] = useState(true);
  const tenantIdRef = useRef<string | null>(null);
  tenantIdRef.current = tenantId;

  const [isAdmin, setIsAdmin] = useState(false);
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

  const [view, setView] = useState<View>("dashboard");
  const [profileMenu, setProfileMenu] = useState(false);
  const [accountRole, setAccountRole] = useState<"admin" | "restaurant">("restaurant");
  const [mobileNav, setMobileNav] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [readNotificationKeys, setReadNotificationKeys] = useState<string[]>([]);
  const [dark, setDark] = useState(false);

  // Core Data Collections
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<any[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [wages, setWages] = useState<Wage[]>([]);
  const [wageForm, setWageForm] = useState({ date: new Date().toLocaleDateString("en-CA"), amount: "", note: "" });
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [weeklyPaymentForm, setWeeklyPaymentForm] = useState({ start: "", end: "" });

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: "sp-1", name: "Green Acres Co.", contact: "Vikram Shah", phone: "+91 98765 00001", email: "vikram@greenacres.in" },
    { id: "sp-2", name: "ProChef Supplies", contact: "Sunita Roy", phone: "+91 98765 00002", email: "sunita@prochef.in" },
  ]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [supplierDetail, setSupplierDetail] = useState<string | null>("sp-1");

  // POS State
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

  // Sale History Filters
  const [saleSearch, setSaleSearch] = useState("");
  const [salePaymentFilter, setSalePaymentFilter] = useState("All");

  // Modal and Form States
  const [modal, setModal] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [dateRange, setDateRange] = useState("This week");
  const [customStartDate, setCustomStartDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [customEndDate, setCustomEndDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [liveDate, setLiveDate] = useState(new Date());

  // Inventory Management
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<any[]>([]);
  const [invForm, setInvForm] = useState({ name: "", category: "Grains", onHand: "", unit: "bags", reorderLevel: "5" });
  const [editingInvId, setEditingInvId] = useState<string | number | null>(null);
  const [stockAdjustItem, setStockAdjustItem] = useState<InventoryItem | null>(null);
  const [stockAdjustMode, setStockAdjustMode] = useState<"add" | "reduce">("reduce");
  const [stockAdjustQty, setStockAdjustQty] = useState("");
  const [stockAdjustNote, setStockAdjustNote] = useState("");

  // UPI & Subscriptions
  const [adminUpiId, setAdminUpiId] = useState<string>("admin-restopulse@upi");
  const [adminUpiBusy, setAdminUpiBusy] = useState(false);
  const [subscriptionUpiId, setSubscriptionUpiId] = useState<string>("admin-restopulse@upi");
  const [activeInlinePlan, setActiveInlinePlan] = useState<Plan | null>(null);
  const [inlineRefId, setInlineRefId] = useState("");
  const [inlineScreenshotFile, setInlineScreenshotFile] = useState<File | null>(null);
  const [inlineSubmitBusy, setInlineSubmitBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support Desk configuration
  const [supportSections, setSupportSections] = useState<any[]>([]);
  const [supportEditingId, setSupportEditingId] = useState<string | null>(null);
  const [supportForm, setSupportForm] = useState({
    title: "Customer Support & Desk",
    description: "Reach out to our 24/7 technical and operations assistance team for any billing or restaurant terminal inquiries.",
    phone: "8122187039",
    whatsapp: "8122187039",
    email: "hosurwebservices@gmail.com",
    active: true,
  });

  const [adminModalForm, setAdminModalForm] = useState({ name: "", email: "", password: "", permissions: { restaurants: true, approvals: true, pricing: true, settings: true, admins: false } });
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);

  const dishImageInputRef = useRef<HTMLInputElement>(null);
  const [dishImageUploading, setDishImageUploading] = useState(false);
  const [printPaperSize, setPrintPaperSize] = useState<"58mm" | "85mm" | "A4">("85mm");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [adminRestaurantFilter, setAdminRestaurantFilter] = useState<"all" | "active" | "expired">("all");

  const authedFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = await authHeaders((init.headers || {}) as Record<string, string>);
    return fetch(input, { ...init, headers });
  }, []);

  // Fetch Live Pricing Plans (Available to both Restaurant & Admin users)
  const fetchLivePlans = useCallback(async () => {
    try {
      const res = await authedFetch("/api/admin/pricing");
      const data = await res.json();
      if (data?.plans && Array.isArray(data.plans) && data.plans.length > 0) {
        setPlans(data.plans);
        if (!activeInlinePlan) {
          const defaultPlan = data.plans.find((p: Plan) => p.price > 0) || data.plans[0];
          setActiveInlinePlan(defaultPlan);
        }
      }
    } catch {}
  }, [activeInlinePlan, authedFetch]);

  // Load Support Sections
  const fetchSupportSections = useCallback(async () => {
    try {
      const res = await authedFetch("/api/support");
      const json = await res.json();
      if (res.ok && Array.isArray(json?.sections)) setSupportSections(json.sections);
    } catch {}
  }, [authedFetch]);

  // Sync Live Subscription & Restaurant Identity
  const syncLiveSubscriptionStatus = useCallback(async () => {
    try {
      const currentId = tenantIdRef.current;
      const url = `/api/subscription?restaurant_id=${encodeURIComponent(currentId || "")}&user_id=${encodeURIComponent(authUser || "")}&email=${encodeURIComponent(loginEmail || "")}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.plans && Array.isArray(data.plans) && data.plans.length > 0) {
        setPlans(data.plans);
      }
      if (data?.restaurant) {
        if (!tenantIdRef.current) setTenantId(data.restaurant.id);
        setActiveRestaurantName(data.restaurant.name);
        setActivePlanName(data.restaurant.plan || "Free trial");
        setActiveRenewalDate(data.restaurant.renewal_on || "—");
        setTenantInfo((prev) => ({
          ...prev,
          id: data.restaurant.id,
          name: data.restaurant.name,
          address: data.restaurant.address || prev.address,
          business_phone: data.restaurant.owner_phone || prev.business_phone,
          gstin: data.restaurant.gstin || prev.gstin,
          gst_percent: Number(data.restaurant.gst_percent) || prev.gst_percent,
          cgst_percent: Number(data.restaurant.cgst_percent) || prev.cgst_percent,
          sgst_percent: Number(data.restaurant.sgst_percent) || prev.sgst_percent,
        }));
        setStoreForm((prev) => ({
          ...prev,
          name: data.restaurant.name,
          address: data.restaurant.address || prev.address,
          phone: data.restaurant.owner_phone || prev.phone,
          gstin: data.restaurant.gstin || prev.gstin,
          gst_percent: String(data.restaurant.gst_percent ?? 5),
          cgst_percent: String(data.restaurant.cgst_percent ?? 2.5),
          sgst_percent: String(data.restaurant.sgst_percent ?? 2.5),
        }));
      }
      if (data?.upi_id) setSubscriptionUpiId(data.upi_id);
      if (Array.isArray(data?.history)) setSubscriptionHistory(data.history);
    } catch {}
  }, [authUser, loginEmail]);

  // Fast scoped restaurant data loader
  const loadRestaurantData = useCallback(async (id: string) => {
    if (!id || isAdmin) return;
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
      const salesJson = await salesRes.json().catch(() => ({ sales: [] }));
      const inventoryJson = await inventoryRes.json().catch(() => ({ items: [], transactions: [] }));
      if (salesRes.ok) setOrders((salesJson.sales || []).map((s: any) => ({
        id: s.bill_no || s.id, time: new Date(s.placed_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
        placedAt: s.placed_at, amount: Number(s.amount) || 0, type: s.order_type, status: s.status, bill: s.receipt
      })));
      if (inventoryRes.ok) {
        setInventoryList((inventoryJson.items || []).map((x: any) => ({ id: x.id, name: x.name, category: x.category, onHand: Number(x.on_hand), unit: x.unit, reorderLevel: Number(x.reorder_level), cost: Number(x.cost || 0) })));
        setInventoryTransactions(inventoryJson.transactions || []);
      }
      if (!menuRes.error) setDishes((menuRes.data || []).map((x: any) => ({ id: x.id, name: x.name, category: x.category, price: Number(x.price), cost: Number(x.cost), stock: x.available, emoji: x.emoji, diet: x.diet, time: x.prep_minutes, imageUrl: x.image_url })));
      if (!expensesRes.error) setExpenses((expensesRes.data || []).map((x: any) => ({ id: x.id, name: x.name, category: x.category, vendor: x.vendor, amount: Number(x.amount), date: x.incurred_on, supplierId: x.supplier_id })));
      if (!supplierRes.error) setSuppliers((supplierRes.data || []).map((x: any) => ({ id: x.id, name: x.name, contact: x.contact_name, phone: x.phone, email: x.email })));
      if (!paymentRes.error) setSupplierPayments((paymentRes.data || []).map((x: any) => ({ id: x.id, supplierId: x.supplier_id, amount: Number(x.amount), date: x.paid_on, method: x.method, note: x.note })));
      if (!staffRes.error) setStaff((staffRes.data || []).map((x: any) => ({ id: x.id, name: x.name, role: x.role, initial: x.name.slice(0, 2).toUpperCase(), shift: x.shift, payType: x.pay_type || "Daily", monthlySalary: Number(x.monthly_salary || 0), weeklySalary: Number(x.weekly_salary || 0), dailyRate: Number(x.daily_rate || 0), email: x.email, phone: x.phone, active: x.active })));
      if (!wagesRes.error) setWages((wagesRes.data || []).map((x: any) => ({ id: x.id, staffId: x.employee_id, date: x.wage_date, amount: Number(x.amount), status: x.status, note: x.note })));
    } catch (e) {
      console.error("Data fetch error", e);
    }
  }, [authedFetch, db, isAdmin]);

  // Auth initialization
  useEffect(() => {
    if (!db) { setAuthLoading(false); return; }
    db.auth.getSession().then(({ data }: any) => {
      setAuthUser(data.session?.user.id || null);
      setLoginEmail(data.session?.user?.email || "");
      setAuthLoading(false);
    });
    const { data: { subscription } } = db.auth.onAuthStateChange((_e: string, session: any) => {
      setAuthUser(session?.user?.id || null);
      setLoginEmail(session?.user?.email || "");
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [db]);

  // Workspaces & Roles resolution
  useEffect(() => {
    if (!db || !authUser) return;
    (async () => {
      try {
        const { data: adminRecord } = await db.from("platform_admins").select("user_id").eq("user_id", authUser).maybeSingle();
        const isPlatform = !!adminRecord;
        setIsAdmin(isPlatform);
        setAccountRole(isPlatform ? "admin" : "restaurant");

        if (!isPlatform) {
          const wsRes = await authedFetch("/api/workspaces");
          const wsJson = await wsRes.json().catch(() => ({}));
          const workspaces = Array.isArray(wsJson?.workspaces) ? wsJson.workspaces : [];
          setRestaurants(workspaces);
          const savedId = localStorage.getItem("rp-active-tenant-id");
          const target = workspaces.find((r: any) => r.id === savedId) || workspaces[0];
          if (target) {
            setTenantId(target.id);
            tenantIdRef.current = target.id;
            localStorage.setItem("rp-active-tenant-id", target.id);
            setActiveRestaurantName(target.name || "Restaurant");
            setActivePlanName(target.plan || "Free trial");
            setActiveRenewalDate(target.renewal || "—");
            setCurrentUserRole(String(target.role || "owner").toLowerCase());
          }
          setTenantHydrating(false);
        } else {
          setTenantHydrating(false);
        }
      } catch (e) {
        console.error("Workspace resolution error", e);
        setTenantHydrating(false);
      }
    })();
  }, [db, authUser, authedFetch]);

  useEffect(() => {
    if (tenantId && !isAdmin) loadRestaurantData(tenantId);
  }, [tenantId, isAdmin, loadRestaurantData]);

  // Realtime subscription setup
  useEffect(() => {
    if (!authUser || !db) return;
    const channels: any[] = [];
    const refreshData = () => {
      if (tenantIdRef.current && !isAdmin) loadRestaurantData(tenantIdRef.current);
      syncLiveSubscriptionStatus();
    };

    if (tenantId && !isAdmin) {
      const filter = `restaurant_id=eq.${tenantId}`;
      ["sales", "inventory_items", "inventory_transactions", "expenses", "employees", "daily_wages", "suppliers", "supplier_payments"].forEach((table) => {
        channels.push(db.channel(`rp-${table}-${tenantId}`).on("postgres_changes", { event: "*", schema: "public", table, filter }, refreshData).subscribe());
      });
      channels.push(db.channel(`rp-rest-${tenantId}`).on("postgres_changes", { event: "*", schema: "public", table: "restaurants", filter: `id=eq.${tenantId}` }, refreshData).subscribe());
      channels.push(db.channel(`rp-sub-${tenantId}`).on("postgres_changes", { event: "*", schema: "public", table: "subscription_requests", filter }, refreshData).subscribe());
    }

    if (isAdmin) {
      channels.push(db.channel("rp-admin-all-rests").on("postgres_changes", { event: "*", schema: "public", table: "restaurants" }, () => {
        authedFetch("/api/admin/restaurants").then(r => r.json()).then(j => { if (Array.isArray(j?.restaurants)) setRestaurants(j.restaurants); });
      }).subscribe());
    }

    return () => { channels.forEach((ch) => db.removeChannel(ch)); };
  }, [authUser, tenantId, isAdmin, db, loadRestaurantData, syncLiveSubscriptionStatus, authedFetch]);

  // Load Live Pricing Plans & Support Sections
  useEffect(() => {
    if (!authUser) return;
    fetchLivePlans();
    fetchSupportSections();
    if (!isAdmin && tenantId) syncLiveSubscriptionStatus();
  }, [authUser, isAdmin, tenantId, fetchLivePlans, fetchSupportSections, syncLiveSubscriptionStatus]);

  // Load Admin Data ONLY if isAdmin
  useEffect(() => {
    if (!authUser || !isAdmin) return;
    authedFetch("/api/admin/restaurants").then(r => r.json()).then(j => { if (Array.isArray(j?.restaurants)) setRestaurants(j.restaurants); });
    authedFetch("/api/admin/approvals").then(r => r.json()).then(j => { if (j?.approvals) setApprovals(j.approvals); });
    authedFetch("/api/admin/subscriptions").then(r => r.json()).then(j => {
      if (j?.requests) setSubscriptionRequests(j.requests);
      if (j?.history) setSubscriptionHistory(j.history);
    });
    authedFetch("/api/admin/admins").then(r => r.json()).then(j => { if (Array.isArray(j?.admins)) setAdmins(j.admins); });
  }, [authUser, isAdmin, authedFetch]);

  // Role Security Guard
  const hasAccessToView = useMemo(() => {
    if (isAdmin) return true;
    const match = navTenant.find(n => n.id === view);
    if (!match?.allowedRoles) return true;
    return match.allowedRoles.includes(currentUserRole);
  }, [isAdmin, view, currentUserRole]);

  // POS Calculations
  const displayedDishes = dishes.filter(
    (d) => (category === "All items" || d.category === category) && d.name.toLowerCase().includes(query.toLowerCase())
  );
  const subtotal = cart.reduce((sum, l) => {
    const d = dishes.find((x) => x.id === l.id);
    return sum + (l.override ?? d?.price ?? 0) * l.qty;
  }, 0);
  const lineDiscount = cart.reduce((sum, l) => sum + l.discount * l.qty, 0);
  const totalDiscount = Math.min(subtotal, lineDiscount + orderDiscount);

  // Exact CGST & SGST percentage calculation without rounding issues
  const effectiveGst = Number(tenantInfo.gst_percent) || 5;
  const cgstRate = Number(tenantInfo.cgst_percent) > 0 && Number(tenantInfo.cgst_percent) < effectiveGst
    ? Number(tenantInfo.cgst_percent)
    : Number((effectiveGst / 2).toFixed(2));
  const sgstRate = Number(tenantInfo.sgst_percent) > 0 && Number(tenantInfo.sgst_percent) < effectiveGst
    ? Number(tenantInfo.sgst_percent)
    : Number((effectiveGst - cgstRate).toFixed(2));

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const cgstAmount = Number(((taxableAmount * cgstRate) / 100).toFixed(2));
  const sgstAmount = Number(((taxableAmount * sgstRate) / 100).toFixed(2));
  const totalTax = Number((cgstAmount + sgstAmount).toFixed(2));
  const grandTotal = Number((taxableAmount + totalTax).toFixed(2));

  const addCart = (id: number | string) => {
    setCart((old) => {
      const found = old.find((l) => l.id === id);
      return found ? old.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)) : [...old, { id, qty: 1, discount: 0 }];
    });
  };

  const qty = (id: number | string, delta: number) =>
    setCart((old) => old.map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0));

  const checkout = async () => {
    if (!cart.length || !tenantId) { toast.error("Add dishes to the order first"); return; }
    const now = new Date();
    const id = "RP-" + now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14) + "-" + crypto.randomUUID().slice(0, 4).toUpperCase();
    const time = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

    const bill: Bill = {
      id,
      issuedAt: now.toLocaleString("en-IN"),
      business: tenantInfo,
      items: cart.map((l) => ({
        name: dishes.find((d) => d.id === l.id)?.name || "Menu item",
        qty: l.qty,
        unitPrice: l.override ?? dishes.find((d) => d.id === l.id)?.price ?? 0,
        discount: l.discount,
      })),
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(totalDiscount.toFixed(2)),
      tax: totalTax,
      cgst: cgstAmount,
      sgst: sgstAmount,
      cgst_percent: cgstRate,
      sgst_percent: sgstRate,
      gst_percent: effectiveGst,
      total: grandTotal,
      type: orderType,
      table: orderType === "Dine-in" ? table : "",
      payment,
      status: "Paid",
    };

    try {
      const res = await authedFetch("/api/sales", {
        method: "POST",
        body: JSON.stringify({ restaurant_id: tenantId, placed_at: now.toISOString(), receipt: bill }),
      });
      if (!res.ok) throw new Error("Could not save sale");
      const sale: Sale = { id, time, placedAt: now.toISOString(), amount: grandTotal, type: orderType, status: "Paid", bill };
      setReceipt(bill);
      setOrders((old) => [sale, ...old]);
      setCart([]);
      setOrderDiscount(0);
      toast.success("Payment complete · " + id);
    } catch (e: any) {
      toast.error(e.message || "Sale could not be saved");
    }
  };

  const handleSaveRestaurantSettings = async () => {
    try {
      const restaurantId = tenantIdRef.current || tenantId;
      if (!restaurantId) { toast.error("Restaurant not resolved"); return; }
      const gstVal = Number(storeForm.gst_percent) || 5;
      const cgstVal = Number(storeForm.cgst_percent) > 0 ? Number(storeForm.cgst_percent) : gstVal / 2;
      const sgstVal = Number(storeForm.sgst_percent) > 0 ? Number(storeForm.sgst_percent) : gstVal - cgstVal;

      const payload = {
        id: restaurantId,
        name: storeForm.name.trim() || activeRestaurantName,
        phone: storeForm.phone.trim(),
        address: storeForm.address.trim(),
        gstin: storeForm.gstin.trim(),
        gst_percent: gstVal,
        cgst_percent: cgstVal,
        sgst_percent: sgstVal,
      };

      const res = await authedFetch("/api/restaurant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Save failed");

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

      toast.success("Restaurant settings & GST updated!");
      syncLiveSubscriptionStatus();
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  const nav = (v: View) => {
    setView(v);
    setMobileNav(false);
    setProfileMenu(false);
  };

  if (authLoading || tenantHydrating) {
    return <div className="auth-page flex items-center justify-center min-h-screen text-sm">Loading RestoPulse workspace…</div>;
  }

  if (!authUser) {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={async (e) => {
          e.preventDefault();
          setLoginBusy(true);
          const { error } = await db.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
          setLoginBusy(false);
          if (error) toast.error(error.message);
          else toast.success("Signed in successfully!");
        }}>
          <div className="brand-symbol">✳</div>
          <h1>Welcome to RestoPulse</h1>
          <p>Sign in to your restaurant or platform account.</p>
          <label>Email<input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} /></label>
          <label>Password<input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} /></label>
          <button className="primary-btn" disabled={loginBusy}>{loginBusy ? "Signing in…" : "Sign in"}</button>
        </form>
        <Toaster richColors />
      </div>
    );
  }

  const activePlanPrice = activeInlinePlan ? activeInlinePlan.price : 4999;
  const inlineUpiPayUri = `upi://pay?pa=${encodeURIComponent(subscriptionUpiId)}&pn=${encodeURIComponent("RestoPulse")}&am=${encodeURIComponent(activePlanPrice.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`${activeRestaurantName} Subscription`)}`;
  const inlineQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(inlineUpiPayUri)}`;

  const visibleNavTenant = isAdmin ? [] : navTenant.filter(i => !i.allowedRoles || i.allowedRoles.includes(currentUserRole));
  const visibleNavPlatform = isAdmin ? navPlatform : [];

  const filteredSales = orders.filter((s) => {
    const matchQuery = !saleSearch.trim() ||
      s.id.toLowerCase().includes(saleSearch.toLowerCase()) ||
      (s.bill?.table && s.bill.table.toLowerCase().includes(saleSearch.toLowerCase())) ||
      (s.bill?.payment && s.bill.payment.toLowerCase().includes(saleSearch.toLowerCase()));
    const matchPayment = salePaymentFilter === "All" || s.bill?.payment === salePaymentFilter;
    return matchQuery && matchPayment;
  });

  return (
    <div className="app-shell flex flex-col lg:flex-row min-h-screen bg-[#0b1329] text-slate-100">
      <Toaster richColors position="top-right" />

      {/* PRINT RECEIPT FORMAT */}
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
            margin: 0 !important;
            box-sizing: border-box !important;
            background: #fff !important;
            color: #000 !important;
            font-family: ui-monospace, SFMono-Regular, Consolas, "Courier New", monospace !important;
          }
          #printable-receipt-card.format-58mm { width: 58mm !important; max-width: 58mm !important; padding: 2mm !important; font-size: 9px !important; }
          #printable-receipt-card.format-85mm { width: 85mm !important; max-width: 85mm !important; padding: 3mm !important; font-size: 10px !important; }
          #printable-receipt-card.format-A4 { width: 190mm !important; max-width: 190mm !important; padding: 8mm !important; font-size: 12px !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* MOBILE TOPBAR */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-[#0f172a]">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileNav(!mobileNav)} className="p-2 border border-slate-700 rounded-lg"><Menu size={18} /></button>
          <b className="text-sm truncate text-white">{activeRestaurantName || "RestoPulse"}</b>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold capitalize">{activePlanName}</span>
      </header>

      {/* SIDEBAR */}
      <aside className={`w-64 border-r border-slate-800 bg-[#0f172a] flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-40 transition-transform lg:static lg:translate-x-0 ${mobileNav ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#f59e0b] text-white flex items-center justify-center font-bold text-xs">RP</div>
            <div>
              <strong className="block text-sm font-bold text-white leading-tight">RestoPulse</strong>
              <small className="text-[10px] text-slate-400 font-semibold uppercase">GASTRONOMY POS</small>
            </div>
          </div>

          {!isAdmin && (
            <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs">
              <small className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">RESTAURANT WORKSPACE</small>
              <b className="text-sm font-bold text-white block truncate mt-0.5">{activeRestaurantName || "Restaurant"}</b>
              <span className="text-xs text-slate-400 capitalize">{currentUserRole} Access</span>
            </div>
          )}

          {isAdmin && (
            <div className="p-3 rounded-2xl border border-indigo-900/50 bg-indigo-950/30">
              <small className="text-[10px] font-bold text-indigo-400 block tracking-wider uppercase">PLATFORM CONSOLE</small>
              <b className="text-sm font-bold text-white block mt-0.5">Master Administrator</b>
            </div>
          )}

          <nav className="space-y-1">
            {(isAdmin ? visibleNavPlatform : visibleNavTenant).map((item) => (
              <button
                key={item.id}
                onClick={() => nav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${view === item.id ? "bg-[#f59e0b] text-slate-950 shadow-xs" : "text-slate-300 hover:bg-slate-800/60 hover:text-white"}`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 space-y-3">
          {!isAdmin && (
            <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">CURRENT PLAN</span>
              <b className="text-sm font-bold text-white block capitalize mt-0.5">{activePlanName}</b>
              <span className="text-[11px] text-slate-400 block mt-0.5">Expires: {activeRenewalDate}</span>
            </div>
          )}
          <button onClick={() => setProfileMenu(!profileMenu)} className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-2 truncate">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                {activeRestaurantName ? activeRestaurantName.slice(0, 2).toUpperCase() : "MA"}
              </span>
              <span className="truncate">{activeRestaurantName || "Profile"}</span>
            </span>
            <MoreHorizontal size={14} className="text-slate-400" />
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070d1e]">
        <header className="h-16 border-b border-slate-800/80 bg-[#0b1329] px-6 hidden lg:flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <span>Workspace</span> / <strong className="text-white capitalize font-bold">{view.replace("_", " ")}</strong>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <b className="text-xs font-bold text-white block leading-tight">{activeRestaurantName || "Mani"}</b>
              <small className="text-[11px] text-slate-400">{loginEmail}</small>
            </div>
            <button
              onClick={() => setProfileMenu(!profileMenu)}
              className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-white font-bold flex items-center justify-center text-xs hover:border-amber-500 transition-colors"
            >
              {activeRestaurantName ? activeRestaurantName.slice(0, 2).toUpperCase() : "MA"}
            </button>
          </div>
        </header>

        {/* PROFILE MENU POPOVER (INCLUDES DIRECT ACCESS TO SUPPORT & HELP) */}
        {profileMenu && (
          <div className="fixed top-16 right-6 w-64 border border-slate-800 bg-slate-900 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
            <div className="p-3 border-b border-slate-800 mb-1">
              <b className="text-white block font-bold text-sm truncate">{activeRestaurantName}</b>
              <span className="text-[11px] text-slate-400 capitalize">{isAdmin ? "Platform Admin" : `${currentUserRole} access`}</span>
            </div>
            <button onClick={() => nav("settings")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-800 text-slate-200">
              <Settings size={15} /> Account Settings
            </button>
            {!isAdmin && (
              <button onClick={() => nav("support")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-800 text-slate-200 font-semibold text-amber-400">
                <LifeBuoy size={15} /> Support & Help Desk
              </button>
            )}
            <button onClick={async () => { await db.auth.signOut(); localStorage.removeItem("rp-active-tenant-id"); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-rose-950/40 text-rose-400 font-bold border-t border-slate-800 mt-1 pt-2">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {!hasAccessToView ? (
            <div className="p-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto"><Lock size={22} /></div>
              <h2 className="text-lg font-bold text-white">Access Restricted</h2>
              <p className="text-xs text-slate-400">Your assigned role ({currentUserRole}) does not have permission to view this section.</p>
              <button className="primary-btn text-xs font-bold" onClick={() => nav("dashboard")}>Return to Dashboard</button>
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW DASHBOARD */}
              {view === "dashboard" && (
                <div className="space-y-6 max-w-7xl">
                  {isAdmin ? (
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          <h1 className="text-2xl font-black text-white">Platform Executive Overview</h1>
                          <p className="text-xs text-slate-400">Live operational snapshot across all registered restaurants.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div onClick={() => { nav("restaurants"); setAdminRestaurantFilter("all"); }} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs cursor-pointer hover:border-amber-500 transition-all">
                          <span className="text-xs font-semibold text-slate-400 flex justify-between">Total Revenue <ArrowUpRight size={14}/></span>
                          <div className="text-2xl font-black text-white mt-1">{money(subscriptionHistory.filter(x => x.status === "Approved").reduce((n, x) => n + Number(x.amount || 0), 0))}</div>
                          <small className="text-[10px] text-emerald-400 font-bold block mt-1">Click to view all workspaces</small>
                        </div>
                        <div onClick={() => { nav("restaurants"); setAdminRestaurantFilter("active"); }} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs cursor-pointer hover:border-amber-500 transition-all">
                          <span className="text-xs font-semibold text-slate-400 flex justify-between">Active Workspaces <ArrowUpRight size={14}/></span>
                          <div className="text-2xl font-black text-emerald-400 mt-1">{restaurants.filter(r => ["Active", "Trial"].includes(r.status)).length}</div>
                          <small className="text-[10px] text-slate-400 block mt-1">Click to view active accounts</small>
                        </div>
                        <div onClick={() => nav("approvals")} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs cursor-pointer hover:border-amber-500 transition-all">
                          <span className="text-xs font-semibold text-slate-400 flex justify-between">Pending Approvals <ArrowUpRight size={14}/></span>
                          <div className="text-2xl font-black text-amber-400 mt-1">{subscriptionRequests.length + approvals.length}</div>
                          <small className="text-[10px] text-amber-400 font-bold block mt-1">Click to review requests</small>
                        </div>
                        <div onClick={() => { nav("restaurants"); setAdminRestaurantFilter("expired"); }} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs cursor-pointer hover:border-amber-500 transition-all">
                          <span className="text-xs font-semibold text-slate-400 flex justify-between">Expired Subscriptions <ArrowUpRight size={14}/></span>
                          <div className="text-2xl font-black text-rose-400 mt-1">{restaurants.filter(r => r.renewal && new Date(r.renewal) < new Date()).length}</div>
                          <small className="text-[10px] text-rose-400 font-bold block mt-1">Click to inspect renewals</small>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          <h1 className="text-2xl font-black text-white">Good afternoon, {activeRestaurantName || "Owner"}</h1>
                          <p className="text-xs text-slate-400">Operational snapshot for {activeRestaurantName}.</p>
                        </div>
                        {["owner", "manager", "staff"].includes(currentUserRole) && (
                          <button onClick={() => nav("pos")} className="bg-[#f59e0b] hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs">
                            <Plus size={16} /> New Order
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs">
                          <span className="text-xs font-semibold text-slate-400">Gross sales</span>
                          <div className="text-2xl font-black text-white mt-1">{moneyDec(orders.reduce((sum, o) => sum + (o.bill?.subtotal || 0), 0))}</div>
                          <small className="text-[10px] text-slate-500 block mt-1">Total registered sales</small>
                        </div>
                        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs">
                          <span className="text-xs font-semibold text-slate-400">Net revenue</span>
                          <div className="text-2xl font-black text-white mt-1">{moneyDec(orders.filter(o => o.status === "Paid").reduce((sum, o) => sum + (o.bill?.total || 0), 0))}</div>
                          <small className="text-[10px] text-slate-500 block mt-1">Paid sales</small>
                        </div>
                        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs">
                          <span className="text-xs font-semibold text-slate-400">Operating expenses</span>
                          <div className="text-2xl font-black text-white mt-1">{moneyDec(expenses.reduce((sum, e) => sum + e.amount, 0))}</div>
                          <small className="text-[10px] text-slate-500 block mt-1">Ingredients & overheads</small>
                        </div>
                        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs">
                          <span className="text-xs font-semibold text-slate-400">Real net profit</span>
                          <div className="text-2xl font-black text-white mt-1">{moneyDec(orders.filter(o => o.status === "Paid").reduce((sum, o) => sum + (o.bill?.total || 0), 0) - expenses.reduce((sum, e) => sum + e.amount, 0))}</div>
                          <small className="text-[10px] text-slate-500 block mt-1">Net sales minus expenses</small>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs">
                          <h3 className="font-bold text-sm text-white mb-3">Revenue Trends</h3>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip formatter={(v) => moneyDec(Number(v))} contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} />
                                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="#f59e0b" fillOpacity={0.15} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xs">
                          <h3 className="font-bold text-sm text-white mb-3">Top Dishes</h3>
                          <div className="space-y-3">
                            {dishes.slice(0, 4).map((d) => (
                              <div key={d.id} className="flex items-center justify-between text-xs pb-3 border-b border-slate-800 last:border-0">
                                <div className="flex items-center gap-2.5 truncate">
                                  <span>{d.emoji}</span>
                                  <span className="font-bold truncate text-slate-200">{d.name}</span>
                                </div>
                                <b className="font-mono text-white">{moneyDec(d.price)}</b>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 2. POS TERMINAL */}
              {view === "pos" && (
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes..." className="w-full pl-9 pr-3 py-2 border border-slate-800 rounded-xl text-xs bg-slate-900 text-white placeholder-slate-500" />
                      </div>
                      <button onClick={() => nav("sales_history")} className="quiet-btn text-xs font-bold flex items-center gap-1.5 shrink-0 px-3 py-2 border border-slate-800 rounded-xl hover:bg-slate-800">
                        <ReceiptText size={15} /> Sale History
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {displayedDishes.map((d) => (
                        <button key={d.id} onClick={() => addCart(d.id)} className="p-3.5 border border-slate-800 rounded-2xl text-left bg-slate-900/60 hover:border-amber-500 transition-all shadow-xs">
                          <div className="text-2xl">{d.emoji}</div>
                          <b className="text-xs block truncate mt-2 text-white">{d.name}</b>
                          <span className="text-[11px] font-black text-[#f59e0b] font-mono">{moneyDec(d.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Calculation Panel with Exact Decimals */}
                  <div className="w-full lg:w-80 p-5 border border-slate-800 rounded-2xl bg-slate-900 space-y-4 h-fit">
                    <h3 className="font-bold text-sm text-white">Current Order</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {cart.map((line) => {
                        const d = dishes.find(x => x.id === line.id);
                        if (!d) return null;
                        return (
                          <div key={line.id} className="flex items-center justify-between text-xs text-slate-200 border-b border-slate-800 pb-2">
                            <span className="truncate pr-1">{d.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => qty(line.id, -1)} className="px-1.5 py-0.5 border border-slate-700 rounded hover:bg-slate-800">-</button>
                              <span className="font-mono font-bold">{line.qty}</span>
                              <button onClick={() => qty(line.id, 1)} className="px-1.5 py-0.5 border border-slate-700 rounded hover:bg-slate-800">+</button>
                              <b className="font-mono">{moneyDec(d.price * line.qty)}</b>
                            </div>
                          </div>
                        );
                      })}
                      {!cart.length && <div className="text-center py-6 text-slate-500 text-xs">Cart is empty</div>}
                    </div>

                    <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{moneyDec(subtotal)}</span></div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>CGST ({cgstRate}%):</span>
                        <span className="font-mono">{moneyDec(cgstAmount)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>SGST ({sgstRate}%):</span>
                        <span className="font-mono">{moneyDec(sgstAmount)}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm border-t border-slate-800 pt-1 text-white">
                        <span>Total Due</span>
                        <span className="font-mono text-amber-400">{moneyDec(grandTotal)}</span>
                      </div>
                    </div>

                    <button onClick={checkout} disabled={!cart.length} className="w-full bg-[#f59e0b] hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-xs disabled:opacity-50 transition-all shadow-md">
                      Charge {moneyDec(grandTotal)}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. DEDICATED SALE HISTORY PAGE */}
              {view === "sales_history" && (
                <div className="space-y-6 max-w-7xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="eyebrow text-amber-500 font-bold uppercase text-[10px]">TRANSACTION LOGS</div>
                      <h1 className="text-2xl font-black text-white">Sale History</h1>
                      <p className="text-xs text-slate-400">All registered sales, settled payment channels, and receipt archives for {activeRestaurantName}.</p>
                    </div>
                    <button onClick={() => nav("pos")} className="primary-btn flex items-center gap-1.5 text-xs font-bold py-2.5 px-4 rounded-xl">
                      <ArrowLeft size={15} /> Back to POS
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
                      <span className="text-xs text-slate-400">Total Sales</span>
                      <div className="text-xl font-black text-white mt-1">{orders.length}</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
                      <span className="text-xs text-slate-400">Total Settled</span>
                      <div className="text-xl font-black text-emerald-400 mt-1">
                        {moneyDec(orders.reduce((sum, s) => sum + (s.bill?.total || 0), 0))}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
                      <span className="text-xs text-slate-400">UPI Payments</span>
                      <div className="text-xl font-black text-amber-400 mt-1">
                        {moneyDec(orders.filter(s => s.bill?.payment === "UPI").reduce((sum, s) => sum + (s.bill?.total || 0), 0))}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
                      <span className="text-xs text-slate-400">Cash Payments</span>
                      <div className="text-xl font-black text-blue-400 mt-1">
                        {moneyDec(orders.filter(s => s.bill?.payment === "Cash").reduce((sum, s) => sum + (s.bill?.total || 0), 0))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                      <input
                        value={saleSearch}
                        onChange={(e) => setSaleSearch(e.target.value)}
                        placeholder="Search by Bill No, Table, or details..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-800 rounded-xl text-xs bg-slate-900 text-white placeholder-slate-500"
                      />
                    </div>
                    <div className="flex gap-1.5 w-full sm:w-auto">
                      {["All", "UPI", "Cash", "Card"].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setSalePaymentFilter(mode)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                            salePaymentFilter === mode
                              ? "bg-amber-500 border-amber-500 text-slate-950"
                              : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border border-slate-800 rounded-2xl bg-slate-900 shadow-xs overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold">
                          <th className="p-3">BILL ID</th>
                          <th className="p-3">DATE & TIME</th>
                          <th className="p-3">ITEMS</th>
                          <th className="p-3">ORDER TYPE</th>
                          <th className="p-3">PAYMENT</th>
                          <th className="p-3 text-right">TOTAL</th>
                          <th className="p-3 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((sale) => (
                          <tr key={sale.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-400">{sale.bill?.id || sale.id}</td>
                            <td className="p-3 text-slate-300">{sale.bill?.issuedAt || sale.placedAt}</td>
                            <td className="p-3 text-slate-300">{sale.bill?.items?.reduce((n, x) => n + x.qty, 0) || 0} item(s)</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">
                                {sale.bill?.type || sale.type} {sale.bill?.table ? `(${sale.bill.table})` : ""}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md font-bold ${sale.bill?.payment === "UPI" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                                {sale.bill?.payment || "UPI"}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-white text-sm">
                              {moneyDec(sale.bill?.total || sale.amount)}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setReceipt(sale.bill)}
                                className="px-3 py-1 border border-slate-700 hover:border-amber-500 rounded-lg text-slate-300 hover:text-white transition-colors font-bold"
                              >
                                View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!filteredSales.length && (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-slate-500">
                              No sales transactions found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. MENU & DISHES */}
              {view === "menu" && (
                <div className="space-y-6 max-w-7xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-black text-white">Menu & Dishes</h1>
                      <p className="text-xs text-slate-400">Configure dish images, pricing, recipes, and real-time stock availability.</p>
                    </div>
                    <button
                      onClick={() => {
                        setForm({ name: "", category: "Mains", price: "", cost: "", emoji: "🍽", imageUrl: "", diet: "", time: "15" });
                        setEditing(null);
                        setModal("dish");
                      }}
                      className="primary-btn text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus size={16} /> Add Dish
                    </button>
                  </div>

                  <div className="p-4 border border-slate-800 rounded-2xl bg-slate-900 shadow-xs overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold">
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
                          <tr key={d.id} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                            <td className="p-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800 text-base">
                                {d.imageUrl ? <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover" /> : d.emoji}
                              </div>
                            </td>
                            <td className="p-3">
                              <b className="text-white text-sm block">{d.name}</b>
                              <span className="text-[11px] text-slate-400">{d.diet || "Standard"} · {d.time || 15} mins</span>
                            </td>
                            <td className="p-3 text-slate-300">{d.category}</td>
                            <td className="p-3 font-mono font-bold text-amber-400 text-sm">{moneyDec(d.price)}</td>
                            <td className="p-3">
                              <Switch
                                checked={d.stock}
                                onCheckedChange={async (v) => {
                                  const updated = dishes.map(x => x.id === d.id ? { ...x, stock: v } : x);
                                  setDishes(updated);
                                  await db.from("menu_items").update({ available: v }).eq("restaurant_id", tenantId).eq("id", d.id);
                                }}
                              />
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  className="p-1.5 border border-slate-700 hover:border-amber-500 rounded-lg text-slate-300 hover:text-white"
                                  onClick={() => {
                                    setForm({
                                      name: d.name,
                                      category: d.category,
                                      price: String(d.price),
                                      cost: String(d.cost),
                                      emoji: d.emoji,
                                      imageUrl: d.imageUrl || "",
                                      diet: d.diet || "",
                                      time: String(d.time || 15),
                                    });
                                    setEditing(d.id);
                                    setModal("dish");
                                  }}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  className="p-1.5 border border-slate-700 hover:border-rose-500 rounded-lg text-rose-400"
                                  onClick={async () => {
                                    if (!confirm(`Delete ${d.name}?`)) return;
                                    await db.from("menu_items").delete().eq("restaurant_id", tenantId).eq("id", d.id);
                                    setDishes(dishes.filter(x => x.id !== d.id));
                                    toast.success("Dish deleted");
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. INVENTORY MANAGEMENT */}
              {view === "inventory" && (
                <div className="space-y-6 max-w-7xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-black text-white">Warehouse & Inventory</h1>
                      <p className="text-xs text-slate-400">Track stock counts, receive new goods, and record wastage or kitchen usage.</p>
                    </div>
                    <button
                      onClick={() => {
                        setInvForm({ name: "", category: "Grains", onHand: "", unit: "bags", reorderLevel: "5" });
                        setEditingInvId(null);
                        setModal("inventory");
                      }}
                      className="primary-btn text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus size={16} /> Add Stock Item
                    </button>
                  </div>

                  {/* Stock Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900">
                      <span className="text-xs text-slate-400">Total Items</span>
                      <div className="text-2xl font-black text-white mt-1">{inventoryList.length}</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900">
                      <span className="text-xs text-slate-400">Units on Hand</span>
                      <div className="text-2xl font-black text-emerald-400 mt-1">{inventoryList.reduce((acc, i) => acc + Number(i.onHand || 0), 0)}</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900">
                      <span className="text-xs text-slate-400">Low Stock Items</span>
                      <div className="text-2xl font-black text-amber-400 mt-1">{inventoryList.filter(i => i.onHand > 0 && i.onHand <= i.reorderLevel).length}</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900">
                      <span className="text-xs text-slate-400">Out of Stock</span>
                      <div className="text-2xl font-black text-rose-400 mt-1">{inventoryList.filter(i => i.onHand === 0).length}</div>
                    </div>
                  </div>

                  {/* Stock Table */}
                  <div className="p-4 border border-slate-800 rounded-2xl bg-slate-900 shadow-xs overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold">
                          <th className="p-3">ITEM NAME</th>
                          <th className="p-3">CATEGORY</th>
                          <th className="p-3">ON HAND</th>
                          <th className="p-3">REORDER POINT</th>
                          <th className="p-3">STATUS</th>
                          <th className="p-3 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryList.map((item) => {
                          const isOut = item.onHand === 0;
                          const isLow = item.onHand > 0 && item.onHand <= item.reorderLevel;
                          return (
                            <tr key={item.id} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-white">{item.name}</td>
                              <td className="p-3 text-slate-300">{item.category}</td>
                              <td className="p-3 font-mono font-bold text-slate-200 text-sm">{item.onHand} {item.unit}</td>
                              <td className="p-3 font-mono text-slate-400">{item.reorderLevel} {item.unit}</td>
                              <td className="p-3">
                                {isOut ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400">Out of Stock</span>
                                ) : isLow ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">Low Stock</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">In Stock</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => { setStockAdjustItem(item); setStockAdjustMode("add"); setStockAdjustQty(""); setStockAdjustNote(""); setModal("stockAdjust"); }}
                                    className="p-1.5 border border-slate-700 hover:border-emerald-500 rounded-lg text-emerald-400"
                                    title="Add Stock"
                                  >
                                    <Plus size={13} />
                                  </button>
                                  <button
                                    onClick={() => { setStockAdjustItem(item); setStockAdjustMode("reduce"); setStockAdjustQty(""); setStockAdjustNote(""); setModal("stockAdjust"); }}
                                    className="p-1.5 border border-slate-700 hover:border-amber-500 rounded-lg text-amber-400"
                                    title="Take/Reduce Stock"
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingInvId(item.id);
                                      setInvForm({ name: item.name, category: item.category, onHand: String(item.onHand), unit: item.unit, reorderLevel: String(item.reorderLevel) });
                                      setModal("inventory");
                                    }}
                                    className="p-1.5 border border-slate-700 hover:border-blue-500 rounded-lg text-slate-300"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Delete ${item.name}?`)) return;
                                      await db.from("inventory_items").delete().eq("restaurant_id", tenantId).eq("id", item.id);
                                      setInventoryList(inventoryList.filter(x => x.id !== item.id));
                                      toast.success("Item removed");
                                    }}
                                    className="p-1.5 border border-slate-700 hover:border-rose-500 rounded-lg text-rose-400"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Stock Transactions Log */}
                  <div className="p-4 border border-slate-800 rounded-2xl bg-slate-900 shadow-xs">
                    <h3 className="font-bold text-sm text-white mb-3">Inventory Movement History</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-bold">
                            <th className="p-2.5">TIMESTAMP</th>
                            <th className="p-2.5">ITEM</th>
                            <th className="p-2.5">TYPE</th>
                            <th className="p-2.5">CHANGE</th>
                            <th className="p-2.5">REASON / NOTE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryTransactions.slice(0, 10).map((tx: any) => (
                            <tr key={tx.id} className="border-b border-slate-800/60">
                              <td className="p-2.5 text-slate-400">{new Date(tx.created_at).toLocaleString("en-IN")}</td>
                              <td className="p-2.5 font-bold text-white">{inventoryList.find(i => i.id === tx.inventory_item_id)?.name || "Item"}</td>
                              <td className="p-2.5">{tx.transaction_type}</td>
                              <td className={`p-2.5 font-mono font-bold ${Number(tx.change_quantity) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {Number(tx.change_quantity) >= 0 ? `+${tx.change_quantity}` : tx.change_quantity}
                              </td>
                              <td className="p-2.5 text-slate-400">{tx.note || "—"}</td>
                            </tr>
                          ))}
                          {!inventoryTransactions.length && (
                            <tr><td colSpan={5} className="text-center py-6 text-slate-500">No stock movements recorded yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. TEAM & PAYROLL */}
              {view === "staff" && (
                <div className="space-y-6 max-w-7xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-black text-white">Team & Payroll</h1>
                      <p className="text-xs text-slate-400">Employee roles, shifts, wages, and weekly settlement recording.</p>
                    </div>
                    <button
                      onClick={() => {
                        setForm({ name: "", role: "Staff", shift: "09:00 – 18:00", payType: "Daily", monthlySalary: "0", weeklySalary: "0", dailyRate: "800", email: "", phone: "", active: "true" });
                        setEditing(null);
                        setModal("employee");
                      }}
                      className="primary-btn text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus size={16} /> Add Employee
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {staff.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => { setSelectedStaff(s); setWeeklyPaymentForm({ start: "", end: "" }); }}
                        className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-amber-500 cursor-pointer transition-all space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <span className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm">
                            {s.initial}
                          </span>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`Delete ${s.name}?`)) return;
                              await db.from("employees").delete().eq("restaurant_id", tenantId).eq("id", s.id);
                              setStaff(staff.filter(x => x.id !== s.id));
                              toast.success("Employee removed");
                            }}
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div>
                          <b className="text-base text-white block">{s.name}</b>
                          <span className="text-xs text-amber-400 font-semibold">{s.role}</span>
                        </div>
                        <div className="border-t border-slate-800 pt-3 text-xs space-y-1 text-slate-300">
                          <div className="flex justify-between"><span>Shift</span><b>{s.shift}</b></div>
                          <div className="flex justify-between">
                            <span>Compensation</span>
                            <b>{s.payType === "Daily" ? `${money(s.dailyRate)}/day` : s.payType === "Weekly" ? `${money(s.weeklySalary)}/wk` : `${money(s.monthlySalary)}/mo`}</b>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. EXPENSES */}
              {view === "expenses" && (
                <div className="space-y-6 max-w-7xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-black text-white">Expenses Ledger</h1>
                      <p className="text-xs text-slate-400">Track operating overheads, raw materials, supplier bills, and utility payments.</p>
                    </div>
                    <button
                      onClick={() => {
                        setForm({ name: "", category: "Inventory", vendor: "", amount: "", date: new Date().toISOString().slice(0, 10), supplierId: "" });
                        setModal("expense");
                      }}
                      className="primary-btn text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus size={16} /> Log Expense
                    </button>
                  </div>

                  <div className="p-4 border border-slate-800 rounded-2xl bg-slate-900 shadow-xs overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold">
                          <th className="p-3">DATE</th>
                          <th className="p-3">DESCRIPTION</th>
                          <th className="p-3">CATEGORY</th>
                          <th className="p-3">VENDOR</th>
                          <th className="p-3 text-right">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr key={e.id} className="border-b border-slate-800/60">
                            <td className="p-3 font-mono text-slate-400">{e.date}</td>
                            <td className="p-3 font-bold text-white">{e.name}</td>
                            <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">{e.category}</span></td>
                            <td className="p-3 text-slate-300">{e.vendor}</td>
                            <td className="p-3 text-right font-mono font-bold text-white text-sm">{moneyDec(e.amount)}</td>
                          </tr>
                        ))}
                        {!expenses.length && <tr><td colSpan={5} className="text-center py-8 text-slate-500">No expenses recorded yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 8. SUPPLIERS */}
              {view === "suppliers" && (
                <div className="space-y-6 max-w-7xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-black text-white">Suppliers & Vendors</h1>
                      <p className="text-xs text-slate-400">Supplier contact directory, transaction statements, and outstanding ledger reconciliation.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setForm({ supplierId: "", amount: "", date: new Date().toISOString().slice(0, 10), method: "UPI", note: "" }); setModal("payment"); }} className="quiet-btn text-xs font-bold py-2.5 px-4 border border-slate-800 rounded-xl">
                        <Wallet size={15} /> Record Payment
                      </button>
                      <button onClick={() => { setForm({ name: "", contact: "", phone: "", email: "" }); setModal("supplier"); }} className="primary-btn text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5">
                        <Plus size={16} /> Add Supplier
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 border border-slate-800 rounded-2xl bg-slate-900 space-y-2">
                      <h3 className="font-bold text-sm text-white mb-2">Vendors Directory</h3>
                      {suppliers.map((sp) => (
                        <div
                          key={sp.id}
                          onClick={() => setSupplierDetail(sp.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            supplierDetail === sp.id ? "border-amber-500 bg-amber-500/10 text-white" : "border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          <b className="block text-sm">{sp.name}</b>
                          <span className="text-xs text-slate-400">{sp.phone || sp.contact}</span>
                        </div>
                      ))}
                    </div>

                    <div className="md:col-span-2 p-5 border border-slate-800 rounded-2xl bg-slate-900 space-y-4">
                      {supplierDetail ? (
                        <>
                          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                            <div>
                              <h2 className="text-base font-bold text-white">{suppliers.find(s => s.id === supplierDetail)?.name}</h2>
                              <p className="text-xs text-slate-400">Contact: {suppliers.find(s => s.id === supplierDetail)?.phone || "—"}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-400 block">Total Payments Settled</span>
                              <b className="text-emerald-400 text-sm font-mono">{moneyDec(supplierPayments.filter(p => p.supplierId === supplierDetail).reduce((a, b) => a + Number(b.amount || 0), 0))}</b>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                                  <th className="p-2.5">DATE</th>
                                  <th className="p-2.5">METHOD</th>
                                  <th className="p-2.5">NOTE</th>
                                  <th className="p-2.5 text-right">AMOUNT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {supplierPayments.filter(p => p.supplierId === supplierDetail).map((pay) => (
                                  <tr key={pay.id} className="border-b border-slate-800/60">
                                    <td className="p-2.5 text-slate-400">{pay.date}</td>
                                    <td className="p-2.5">{pay.method}</td>
                                    <td className="p-2.5 text-slate-300">{pay.note || "—"}</td>
                                    <td className="p-2.5 text-right font-mono font-bold text-white">{moneyDec(pay.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 text-slate-500 text-xs">Select a vendor to inspect their ledger.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 9. SUBSCRIPTION (Live 499 & 4999 Prices) */}
              {view === "subscription" && (
                <div className="space-y-6 max-w-7xl">
                  <div>
                    <div className="eyebrow text-amber-500 font-bold uppercase text-[10px]">PLANS & BILLING</div>
                    <h1 className="text-2xl font-black text-white">Subscription</h1>
                    <p className="text-xs text-slate-400">Choose an active platform plan, scan the UPI QR code below, and submit the transaction reference.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900">
                      <span className="text-xs text-slate-400">Current plan</span>
                      <div className="text-xl font-black text-white mt-1 capitalize">{activePlanName}</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900">
                      <span className="text-xs text-slate-400">Status</span>
                      <div className="text-xl font-black text-emerald-400 mt-1">Active</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900">
                      <span className="text-xs text-slate-400">Renewal date</span>
                      <div className="text-xl font-black text-white mt-1">{activeRenewalDate}</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900">
                      <span className="text-xs text-slate-400">Payment history</span>
                      <div className="text-xl font-black text-white mt-1">{subscriptionHistory.length}</div>
                    </div>
                  </div>

                  {/* Pricing Cards Showing Live 499 and 4999 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((p) => {
                      const isCurrent = (activePlanName || "").toLowerCase().includes(p.name.toLowerCase());
                      const isSelected = activeInlinePlan?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                            isSelected ? "border-amber-500 bg-slate-900 shadow-xl" : "border-slate-800 bg-slate-900/60"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center">
                              <h3 className="font-bold text-base text-white">{p.name}</h3>
                              {isCurrent && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  Active Tier
                                </span>
                              )}
                            </div>
                            <div className="text-3xl font-black text-white mt-3 font-mono">
                              {p.price === 0 ? "₹0" : money(p.price)}
                            </div>
                            <small className="text-slate-400 font-medium block mt-0.5">{p.period}</small>
                            <p className="text-xs text-slate-400 mt-3 leading-relaxed">{p.features}</p>
                          </div>

                          {p.price > 0 ? (
                            <button
                              onClick={() => setActiveInlinePlan(p)}
                              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
                                isSelected ? "bg-[#f59e0b] text-slate-950 shadow-md" : "border border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                              }`}
                            >
                              Choose {p.name.toLowerCase()}
                            </button>
                          ) : (
                            <div className="text-center py-2 text-xs font-semibold text-slate-500">
                              {isCurrent ? "Active trial tier" : "Trial Tier"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Verification Box */}
                  {activeInlinePlan && activeInlinePlan.price > 0 && (
                    <div className="max-w-md mx-auto rounded-2xl p-6 border border-slate-800 bg-slate-900 text-center shadow-xl space-y-4">
                      <div className="text-sm font-bold text-white">Pay {money(activeInlinePlan.price)}</div>
                      <div className="bg-white p-3 rounded-2xl inline-block mx-auto border border-gray-200">
                        <img src={inlineQrImageUrl} alt="UPI QR Code" className="w-52 h-52 object-contain rounded-lg" />
                      </div>
                      <div className="text-left space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">UPI Transaction Reference (UTR) *</label>
                        <input
                          type="text"
                          required
                          value={inlineRefId}
                          onChange={(e) => setInlineRefId(e.target.value)}
                          placeholder="Enter 12-digit UPI / UTR reference ID"
                          className="w-full p-2.5 rounded-xl text-xs text-white border border-slate-700 bg-slate-950 focus:border-amber-500 font-mono"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          if (!inlineRefId.trim()) { toast.error("Please enter the UPI reference ID"); return; }
                          setInlineSubmitBusy(true);
                          try {
                            const res = await authedFetch("/api/subscription", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                restaurant_id: tenantId,
                                restaurant_name: activeRestaurantName,
                                owner_name: activeRestaurantName,
                                owner_email: loginEmail,
                                plan: activeInlinePlan.name,
                                amount: activeInlinePlan.price,
                                upi_id: subscriptionUpiId,
                                reference_id: inlineRefId.trim(),
                                message: `UPI Ref: ${inlineRefId.trim()}`,
                              }),
                            });
                            if (!res.ok) throw new Error("Submission failed");
                            toast.success("Payment reference submitted for Admin verification!");
                            setInlineRefId("");
                          } catch {
                            toast.error("Failed to submit reference");
                          } finally {
                            setInlineSubmitBusy(false);
                          }
                        }}
                        disabled={inlineSubmitBusy}
                        className="w-full bg-[#f59e0b] hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all shadow-md"
                      >
                        {inlineSubmitBusy ? "Submitting…" : "Submit Payment Reference"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 10. ENHANCED SUPPORT & HELP PAGE (ACCESSED VIA PROFILE MENU) */}
              {view === "support" && (
                <div className="space-y-6 max-w-5xl">
                  <div>
                    <div className="eyebrow text-amber-500 font-bold uppercase text-[10px]">HELP & SUPPORT DESK</div>
                    <h1 className="text-2xl font-black text-white">Support & Operations Care</h1>
                    <p className="text-xs text-slate-400">Direct technical, hardware thermal printing, and subscription care for {activeRestaurantName}.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center"><Phone size={20} /></div>
                        <h3 className="font-bold text-base text-white">Phone Support</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">Direct hotline for live POS assistance, network errors, or billing.</p>
                      </div>
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="font-mono text-sm font-bold text-blue-400">{supportSections[0]?.phone || "8122187039"}</div>
                        <a href={`tel:${supportSections[0]?.phone || "8122187039"}`} className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-all">
                          <Phone size={14} /> Call Support Now
                        </a>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><MessageCircle size={20} /></div>
                        <h3 className="font-bold text-base text-white">WhatsApp Chat</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">Chat with support engineers, send screenshots, or query updates.</p>
                      </div>
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="font-mono text-sm font-bold text-emerald-400">{supportSections[0]?.whatsapp || "8122187039"}</div>
                        <a href={`https://wa.me/${String(supportSections[0]?.whatsapp || "8122187039").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all">
                          <MessageCircle size={14} /> Chat on WhatsApp
                        </a>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><Mail size={20} /></div>
                        <h3 className="font-bold text-base text-white">Email Helpdesk</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">Detailed account escalations, custom invoicing, and data exports.</p>
                      </div>
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="font-mono text-xs font-bold text-indigo-300 truncate">{supportSections[0]?.email || "hosurwebservices@gmail.com"}</div>
                        <a href={`mailto:${supportSections[0]?.email || "hosurwebservices@gmail.com"}`} className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 transition-all">
                          <Mail size={14} /> Send Email
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. SETTINGS */}
              {view === "settings" && (
                <div className="space-y-6 max-w-xl">
                  <div>
                    <h1 className="text-2xl font-black text-white">Restaurant Profile & GST</h1>
                    <p className="text-xs text-slate-400">Configure restaurant identity, GST tax slabs, and security credentials.</p>
                  </div>

                  <div className="p-6 border border-slate-800 rounded-2xl bg-slate-900 space-y-4">
                    <div className="space-y-3 text-xs">
                      <label className="block space-y-1">
                        <span className="text-slate-300 font-semibold">Restaurant Name</span>
                        <input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} className="w-full p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white" />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-slate-300 font-semibold">Phone Number</span>
                        <input value={storeForm.phone} onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })} className="w-full p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white font-mono" />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-slate-300 font-semibold">Address</span>
                        <input value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} className="w-full p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white" />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-slate-300 font-semibold">GSTIN</span>
                        <input value={storeForm.gstin} onChange={(e) => setStoreForm({ ...storeForm, gstin: e.target.value })} className="w-full p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white font-mono" />
                      </label>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                        <label className="block space-y-1">
                          <span className="text-slate-300 font-semibold">GST Total %</span>
                          <input
                            type="number"
                            value={storeForm.gst_percent}
                            onChange={(e) => {
                              const val = e.target.value;
                              const half = (Number(val) / 2).toString();
                              setStoreForm({ ...storeForm, gst_percent: val, cgst_percent: half, sgst_percent: half });
                            }}
                            className="w-full p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white font-mono"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-slate-300 font-semibold">CGST %</span>
                          <input type="number" step="any" value={storeForm.cgst_percent} onChange={(e) => setStoreForm({ ...storeForm, cgst_percent: e.target.value })} className="w-full p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white font-mono" />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-slate-300 font-semibold">SGST %</span>
                          <input type="number" step="any" value={storeForm.sgst_percent} onChange={(e) => setStoreForm({ ...storeForm, sgst_percent: e.target.value })} className="w-full p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white font-mono" />
                        </label>
                      </div>
                    </div>
                    <button onClick={handleSaveRestaurantSettings} className="w-full bg-[#f59e0b] hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all shadow-md">
                      Save Settings & Taxes
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* DISH ADD / EDIT MODAL */}
      <Dialog open={modal === "dish"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-md bg-slate-900 border border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white font-bold">{editing ? "Edit Dish" : "Add New Dish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <label className="block space-y-1">
              <span className="text-slate-400">Dish Name</span>
              <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grilled Chicken" className="w-full p-2 border border-slate-700 bg-slate-950 rounded-lg text-white" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-slate-400">Category</span>
                <select value={form.category || "Mains"} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full p-2 border border-slate-700 bg-slate-950 rounded-lg text-white">
                  <option value="Appetizers">Appetizers</option>
                  <option value="Mains">Mains</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Drinks">Drinks</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-slate-400">Emoji Icon</span>
                <input value={form.emoji || "🍽"} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="w-full p-2 border border-slate-700 bg-slate-950 rounded-lg text-white text-center" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-slate-400">Price (₹)</span>
                <input type="number" step="any" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full p-2 border border-slate-700 bg-slate-950 rounded-lg text-white font-mono" />
              </label>
              <label className="block space-y-1">
                <span className="text-slate-400">Cost (₹)</span>
                <input type="number" step="any" value={form.cost || ""} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full p-2 border border-slate-700 bg-slate-950 rounded-lg text-white font-mono" />
              </label>
            </div>
          </div>
          <DialogFooter>
            <button className="quiet-btn text-xs" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="primary-btn text-xs font-bold"
              onClick={async () => {
                if (!form.name || !form.price) { toast.error("Enter dish name and price"); return; }
                const payload = {
                  restaurant_id: tenantId,
                  name: form.name.trim(),
                  category: form.category || "Mains",
                  price: Number(form.price),
                  cost: Number(form.cost) || 0,
                  emoji: form.emoji || "🍽",
                  image_url: form.imageUrl || null,
                  available: true,
                };
                if (editing) {
                  await db.from("menu_items").update(payload).eq("id", editing);
                } else {
                  await db.from("menu_items").insert(payload);
                }
                loadRestaurantData(tenantId!);
                setModal(null);
                toast.success(editing ? "Dish updated" : "Dish added");
              }}
            >
              Save Dish
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRINT RECEIPT MODAL (PRECISE DECIMAL VALUES FOR CGST & SGST) */}
      <Dialog open={!!receipt} onOpenChange={(v) => !v && setReceipt(null)}>
        <DialogContent className="max-w-md p-6 bg-slate-900 border border-slate-800 text-white">
          <DialogHeader className="no-print">
            <DialogTitle className="text-base font-bold text-white">Bill Details & Receipt</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Select paper format and print receipt
            </DialogDescription>
          </DialogHeader>

          <div className="no-print flex items-center justify-between p-2.5 mb-2 rounded-xl bg-slate-800 border border-slate-700 text-xs">
            <span className="font-semibold text-slate-300">Format:</span>
            <div className="flex gap-1.5">
              {(["58mm", "85mm", "A4"] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setPrintPaperSize(sz)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    printPaperSize === sz ? "bg-amber-500 text-slate-950 shadow-sm" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
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
              className={`format-${printPaperSize} p-5 bg-white text-black rounded-xl font-mono text-[11px] leading-relaxed border shadow-lg overflow-hidden`}
            >
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
                <span>{receipt.type} {receipt.table ? `(${receipt.table})` : ""}</span>
              </div>
              <div className="text-[10px] text-gray-500">{receipt.issuedAt}</div>

              <div className="border-b border-dashed border-gray-400 my-2" />

              <table className="w-full text-[10px] font-mono border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-dashed border-gray-400 text-gray-700 font-bold">
                    <th className="py-1 text-left w-[46%]">ITEM</th>
                    <th className="py-1 text-center w-[16%]">QTY</th>
                    <th className="py-1 text-right w-[19%]">PRICE</th>
                    <th className="py-1 text-right w-[19%]">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-dotted border-gray-200">
                      <td className="py-1 pr-1 truncate text-left">{item.name}</td>
                      <td className="py-1 text-center">{item.qty}</td>
                      <td className="py-1 text-right">{moneyDec(item.unitPrice)}</td>
                      <td className="py-1 text-right font-semibold">
                        {moneyDec(item.qty * (item.unitPrice - item.discount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-b border-dashed border-gray-400 my-2" />

              <div className="space-y-0.5 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold">{moneyDec(receipt.subtotal)}</span>
                </div>
                {receipt.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span>−{moneyDec(receipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>CGST ({receipt.cgst_percent ?? cgstRate}%):</span>
                  <span>{moneyDec(receipt.cgst)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>SGST ({receipt.sgst_percent ?? sgstRate}%):</span>
                  <span>{moneyDec(receipt.sgst)}</span>
                </div>
                <div className="border-b border-solid border-gray-900 my-1" />
                <div className="flex justify-between text-xs font-black pt-0.5">
                  <span>TOTAL DUE</span>
                  <span>{moneyDec(receipt.total)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-gray-500 pt-0.5">
                  <span>Payment Mode</span>
                  <span>{receipt.payment}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-gray-500 pt-2 border-t border-dashed border-gray-300">
                {receipt.business?.receipt_footer || "Thank you for dining with us! Visit again."}
              </div>
            </div>
          )}

          <DialogFooter className="no-print mt-4 flex gap-2">
            <button className="quiet-btn text-xs" onClick={() => setReceipt(null)}>
              Close
            </button>
            <button className="primary-btn text-xs font-bold flex items-center gap-1.5" onClick={() => window.print()}>
              <Printer size={16} /> Print Receipt ({printPaperSize})
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
