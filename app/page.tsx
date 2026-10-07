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

const initialPlans: Plan[] = [
  { id: 1, name: "Free trial", price: 0, period: "7 days", features: "Explore core POS, menu items, inventory, and reports.", active: true },
  { id: 2, name: "Monthly", price: 2999, period: "30 days", features: "Full access, table management, live inventory tracking, POS checkout.", active: true },
  { id: 3, name: "Yearly", price: 29999, period: "365 days", features: "Full platform access, priority support, unlimited staff accounts.", active: true },
];

const money = (n: number) => "₹" + Math.round(n || 0).toLocaleString("en-IN");

// Nav items mapped strictly by allowed roles
const navTenant: { id: View; label: string; icon: any; allowedRoles?: string[] }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard, allowedRoles: ["owner", "manager", "accountant", "storekeeper", "staff"] },
  { id: "pos", label: "POS Terminal", icon: ShoppingBag, allowedRoles: ["owner", "manager", "staff"] },
  { id: "menu", label: "Menu & dishes", icon: UtensilsCrossed, allowedRoles: ["owner", "manager"] },
  { id: "inventory", label: "Inventory", icon: Package, allowedRoles: ["owner", "manager", "storekeeper"] },
  { id: "staff", label: "Team & payroll", icon: Users, allowedRoles: ["owner", "manager"] },
  { id: "expenses", label: "Expenses", icon: ReceiptText, allowedRoles: ["owner", "accountant", "manager"] },
  { id: "suppliers", label: "Suppliers", icon: Building2, allowedRoles: ["owner", "accountant", "storekeeper"] },
  { id: "subscription", label: "Subscription", icon: CreditCard, allowedRoles: ["owner"] },
  { id: "support", label: "Support & Help", icon: LifeBuoy, allowedRoles: ["owner", "manager", "accountant", "storekeeper", "staff"] },
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

  // Tenant locking
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

  const [dishes, setDishes] = useState<Dish[]>([]);
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [supplierDetail, setSupplierDetail] = useState<string | null>(null);

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
  const [modal, setModal] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [dateRange, setDateRange] = useState("This week");
  const [customStartDate, setCustomStartDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [customEndDate, setCustomEndDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [liveDate, setLiveDate] = useState(new Date());

  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<any[]>([]);
  const [saleHistoryOpen, setSaleHistoryOpen] = useState(false);
  const [invForm, setInvForm] = useState({ name: "", category: "Grains", onHand: "", unit: "bags", reorderLevel: "5" });
  const [editingInvId, setEditingInvId] = useState<string | number | null>(null);
  const [stockAdjustItem, setStockAdjustItem] = useState<InventoryItem | null>(null);
  const [stockAdjustMode, setStockAdjustMode] = useState<"add" | "reduce">("reduce");
  const [stockAdjustQty, setStockAdjustQty] = useState("");
  const [stockAdjustNote, setStockAdjustNote] = useState("");

  const [adminUpiId, setAdminUpiId] = useState<string>("admin-restopulse@upi");
  const [adminUpiBusy, setAdminUpiBusy] = useState(false);
  const [subscriptionUpiId, setSubscriptionUpiId] = useState<string>("admin-restopulse@upi");

  // Support section configuration
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

  const [activeInlinePlan, setActiveInlinePlan] = useState<Plan | null>(null);
  const [inlineRefId, setInlineRefId] = useState("");
  const [inlineScreenshotFile, setInlineScreenshotFile] = useState<File | null>(null);
  const [inlineSubmitBusy, setInlineSubmitBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dishImageInputRef = useRef<HTMLInputElement>(null);
  const [dishImageUploading, setDishImageUploading] = useState(false);
  const [printPaperSize, setPrintPaperSize] = useState<"58mm" | "85mm" | "A4">("85mm");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  // Admin filter helper when clicking cards
  const [adminRestaurantFilter, setAdminRestaurantFilter] = useState<"all" | "active" | "expired">("all");

  const authedFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = await authHeaders((init.headers || {}) as Record<string, string>);
    return fetch(input, { ...init, headers });
  }, []);

  // Fetch Live Pricing Plans
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
          gst_percent: data.restaurant.gst_percent ?? prev.gst_percent,
          cgst_percent: data.restaurant.cgst_percent ?? prev.cgst_percent,
          sgst_percent: data.restaurant.sgst_percent ?? prev.sgst_percent,
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

  // Auth bootstrap
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
      // Listen directly to restaurant table updates for instant plan extension reflection
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
    fetchLivePlans();
  }, [authUser, isAdmin, authedFetch, fetchLivePlans]);

  useEffect(() => {
    fetchSupportSections();
    if (!isAdmin && tenantId) syncLiveSubscriptionStatus();
  }, [fetchSupportSections, isAdmin, tenantId, syncLiveSubscriptionStatus]);

  // Role Security Guard: check if current role has permission to see page
  const hasAccessToView = useMemo(() => {
    if (isAdmin) return true;
    const match = navTenant.find(n => n.id === view);
    if (!match?.allowedRoles) return true;
    return match.allowedRoles.includes(currentUserRole);
  }, [isAdmin, view, currentUserRole]);

  // POS Checkout calculation
  const displayedDishes = dishes.filter(
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
  };

  const qty = (id: number | string, delta: number) =>
    setCart((old) => old.map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0));

  const checkout = async () => {
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
      const res = await authedFetch("/api/sales", { method: "POST", body: JSON.stringify({ restaurant_id: tenantId, placed_at: now.toISOString(), receipt: bill }) });
      if (!res.ok) throw new Error("Could not save sale");
      const sale: Sale = { id, time, placedAt: now.toISOString(), amount: total, type: orderType, status: "Paid", bill };
      setReceipt(bill); setOrders(old => [sale, ...old]); setCart([]); setOrderDiscount(0);
      toast.success("Payment complete · " + id);
    } catch (e: any) { toast.error(e.message || "Sale could not be saved"); }
  };

  // Safe restaurant profile save
  const handleSaveRestaurantSettings = async () => {
    try {
      const restaurantId = tenantIdRef.current || tenantId;
      if (!restaurantId) { toast.error("Restaurant not resolved"); return; }
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

  const activePlanPrice = activeInlinePlan ? activeInlinePlan.price : 29999;
  const inlineUpiPayUri = `upi://pay?pa=${encodeURIComponent(subscriptionUpiId)}&pn=${encodeURIComponent("RestoPulse")}&am=${encodeURIComponent(activePlanPrice.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`${activeRestaurantName} Subscription`)}`;
  const inlineQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(inlineUpiPayUri)}`;

  const visibleNavTenant = isAdmin ? [] : navTenant.filter(i => !i.allowedRoles || i.allowedRoles.includes(currentUserRole));
  const visibleNavPlatform = isAdmin ? navPlatform : [];

  return (
    <div className="app-shell flex flex-col lg:flex-row min-h-screen bg-[#f8fafc] text-slate-800">
      <Toaster richColors position="top-right" />

      {/* MOBILE HEADER */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileNav(!mobileNav)} className="p-2 border rounded-lg"><Menu size={18} /></button>
          <b className="text-sm truncate">{activeRestaurantName || "RestoPulse"}</b>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold capitalize">{activePlanName}</span>
      </header>

      {/* RESPONSIVE SIDEBAR */}
      <aside className={`w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-40 transition-transform lg:static lg:translate-x-0 ${mobileNav ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#f59e0b] text-white flex items-center justify-center font-bold text-xs">RP</div>
            <div>
              <strong className="block text-sm font-bold text-slate-900 leading-tight">RestoPulse</strong>
              <small className="text-[10px] text-slate-400 font-semibold uppercase">GASTRONOMY POS</small>
            </div>
          </div>

          {!isAdmin && (
            <div className="p-3 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <small className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">RESTAURANT WORKSPACE</small>
              <b className="text-sm font-bold text-slate-900 block truncate mt-0.5">{activeRestaurantName || "Restaurant"}</b>
              <span className="text-xs text-slate-500 capitalize">{currentUserRole} Access</span>
            </div>
          )}

          {isAdmin && (
            <div className="p-3 rounded-2xl border border-indigo-200 bg-indigo-50/40">
              <small className="text-[10px] font-bold text-indigo-700 block tracking-wider uppercase">PLATFORM CONSOLE</small>
              <b className="text-sm font-bold text-indigo-950 block mt-0.5">Master Administrator</b>
            </div>
          )}

          <nav className="space-y-1">
            {(isAdmin ? visibleNavPlatform : visibleNavTenant).map((item) => (
              <button
                key={item.id}
                onClick={() => nav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${view === item.id ? "bg-[#f59e0b] text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 space-y-3">
          {!isAdmin && (
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">CURRENT PLAN</span>
              <b className="text-sm font-bold text-slate-900 block capitalize mt-0.5">{activePlanName}</b>
              <span className="text-[11px] text-slate-400 block mt-0.5">Expires: {activeRenewalDate}</span>
            </div>
          )}
          <button onClick={async () => { await db.auth.signOut(); localStorage.removeItem("rp-active-tenant-id"); }} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-6 hidden lg:flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <span>Workspace</span> / <strong className="text-slate-800 capitalize font-bold">{view}</strong>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 border rounded-full hover:bg-slate-50" onClick={() => setDark(!dark)}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div className="text-right">
              <b className="text-xs font-bold text-slate-900 block leading-tight">{activeRestaurantName || "Mani"}</b>
              <small className="text-[11px] text-slate-400">{loginEmail}</small>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* ACCESS DENIED FALLBACK IF EMPLOYEE ATTEMPTS TO VIEW RESTRICTED TAB */}
          {!hasAccessToView ? (
            <div className="p-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto"><Lock size={22} /></div>
              <h2 className="text-lg font-bold">Access Restricted</h2>
              <p className="text-xs text-muted-foreground">Your assigned role ({currentUserRole}) does not have permission to view this section. Please contact your restaurant owner.</p>
              <button className="primary-btn text-xs font-bold" onClick={() => nav("dashboard")}>Return to Dashboard</button>
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW DASHBOARD */}
              {view === "dashboard" && (
                <div className="space-y-6 max-w-7xl">
                  {isAdmin ? (
                    /* ADMIN PLATFORM OVERVIEW */
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          <h1 className="text-2xl font-black">Platform Executive Overview</h1>
                          <p className="text-xs text-slate-500">Live operational snapshot across all registered restaurants.</p>
                        </div>
                      </div>

                      {/* 4 Interactive KPI Cards with Navigation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div
                          className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs cursor-pointer hover:border-[#f59e0b] transition-all"
                          onClick={() => { nav("restaurants"); setAdminRestaurantFilter("all"); }}
                          title="Click to view all restaurants"
                        >
                          <span className="text-xs font-semibold text-slate-500 flex justify-between">Total Revenue <ArrowUpRight size={14}/></span>
                          <div className="text-2xl font-black text-slate-900 mt-1">
                            {money(subscriptionHistory.filter(x => x.status === "Approved").reduce((n, x) => n + Number(x.amount || 0), 0))}
                          </div>
                          <small className="text-[10px] text-emerald-600 font-bold block mt-1">Click to view all workspaces</small>
                        </div>

                        <div
                          className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs cursor-pointer hover:border-[#f59e0b] transition-all"
                          onClick={() => { nav("restaurants"); setAdminRestaurantFilter("active"); }}
                          title="Click to view active restaurants"
                        >
                          <span className="text-xs font-semibold text-slate-500 flex justify-between">Active Workspaces <ArrowUpRight size={14}/></span>
                          <div className="text-2xl font-black text-emerald-600 mt-1">
                            {restaurants.filter(r => ["Active", "Trial"].includes(r.status)).length}
                          </div>
                          <small className="text-[10px] text-slate-400 block mt-1">Click to view active accounts</small>
                        </div>

                        <div
                          className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs cursor-pointer hover:border-[#f59e0b] transition-all"
                          onClick={() => nav("approvals")}
                          title="Click to view pending requests"
                        >
                          <span className="text-xs font-semibold text-slate-500 flex justify-between">Pending Approvals <ArrowUpRight size={14}/></span>
                          <div className="text-2xl font-black text-amber-600 mt-1">
                            {subscriptionRequests.length + approvals.length}
                          </div>
                          <small className="text-[10px] text-amber-600 font-bold block mt-1">Click to review requests</small>
                        </div>

                        <div
                          className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs cursor-pointer hover:border-[#f59e0b] transition-all"
                          onClick={() => { nav("restaurants"); setAdminRestaurantFilter("expired"); }}
                          title="Click to view expired accounts"
                        >
                          <span className="text-xs font-semibold text-slate-500 flex justify-between">Expired Subscriptions <ArrowUpRight size={14}/></span>
                          <div className="text-2xl font-black text-rose-600 mt-1">
                            {restaurants.filter(r => r.renewal && new Date(r.renewal) < new Date()).length}
                          </div>
                          <small className="text-[10px] text-rose-600 font-bold block mt-1">Click to inspect renewals</small>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* RESTAURANT DASHBOARD */
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          <h1 className="text-2xl font-black">Good afternoon, {activeRestaurantName || "Owner"}</h1>
                          <p className="text-xs text-slate-500">Operational snapshot for {activeRestaurantName}.</p>
                        </div>
                        {["owner", "manager", "staff"].includes(currentUserRole) && (
                          <button onClick={() => nav("pos")} className="bg-[#f59e0b] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs">
                            <Plus size={16} /> New Order
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                          <span className="text-xs font-semibold text-slate-500">Gross sales</span>
                          <div className="text-2xl font-black text-slate-900 mt-1">{money(orders.reduce((sum, o) => sum + o.bill.subtotal, 0))}</div>
                          <small className="text-[10px] text-slate-400 block mt-1">Total registered sales</small>
                        </div>
                        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                          <span className="text-xs font-semibold text-slate-500">Net revenue</span>
                          <div className="text-2xl font-black text-slate-900 mt-1">{money(orders.filter(o => o.status === "Paid").reduce((sum, o) => sum + o.bill.total, 0))}</div>
                          <small className="text-[10px] text-slate-400 block mt-1">Paid sales</small>
                        </div>
                        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                          <span className="text-xs font-semibold text-slate-500">Operating expenses</span>
                          <div className="text-2xl font-black text-slate-900 mt-1">{money(expenses.reduce((sum, e) => sum + e.amount, 0))}</div>
                          <small className="text-[10px] text-slate-400 block mt-1">Ingredients & overheads</small>
                        </div>
                        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                          <span className="text-xs font-semibold text-slate-500">Real net profit</span>
                          <div className="text-2xl font-black text-slate-900 mt-1">{money(orders.filter(o => o.status === "Paid").reduce((sum, o) => sum + o.bill.total, 0) - expenses.reduce((sum, e) => sum + e.amount, 0))}</div>
                          <small className="text-[10px] text-slate-400 block mt-1">Net sales minus expenses</small>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
                          <h3 className="font-bold text-sm text-slate-900 mb-3">Revenue Trends</h3>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip formatter={(v) => money(Number(v))} />
                                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="#fef3c7" fillOpacity={0.6} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
                          <h3 className="font-bold text-sm text-slate-900 mb-3">Top Dishes</h3>
                          <div className="space-y-3">
                            {dishes.slice(0, 4).map((d) => (
                              <div key={d.id} className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 last:border-0">
                                <div className="flex items-center gap-2.5 truncate">
                                  <span>{d.emoji}</span>
                                  <span className="font-bold truncate">{d.name}</span>
                                </div>
                                <b className="font-mono">{money(d.price)}</b>
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
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes..." className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs bg-white" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {displayedDishes.map((d) => (
                        <button key={d.id} onClick={() => addCart(d.id)} className="p-3.5 border rounded-2xl text-left bg-white hover:border-[#f59e0b] shadow-xs">
                          <div className="text-2xl">{d.emoji}</div>
                          <b className="text-xs block truncate mt-2">{d.name}</b>
                          <span className="text-[11px] font-black text-[#f59e0b]">{money(d.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="w-full lg:w-80 p-5 border rounded-2xl bg-white space-y-4 h-fit">
                    <h3 className="font-bold text-sm">Current Order</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {cart.map((line) => {
                        const d = dishes.find(x => x.id === line.id);
                        if (!d) return null;
                        return (
                          <div key={line.id} className="flex items-center justify-between text-xs">
                            <span className="truncate">{d.name}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => qty(line.id, -1)} className="px-2 border rounded">-</button>
                              <span>{line.qty}</span>
                              <button onClick={() => qty(line.id, 1)} className="px-2 border rounded">+</button>
                              <b>{money(d.price * line.qty)}</b>
                            </div>
                          </div>
                        );
                      })}
                      {!cart.length && <div className="text-center py-6 text-slate-400 text-xs">Cart is empty</div>}
                    </div>
                    <div className="border-t pt-3 space-y-1 text-xs">
                      <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                      <div className="flex justify-between"><span>GST ({effectiveGst}%)</span><span>{money(tax)}</span></div>
                      <div className="flex justify-between font-bold text-sm border-t pt-1"><span>Total</span><span>{money(total)}</span></div>
                    </div>
                    <button onClick={checkout} disabled={!cart.length} className="w-full bg-[#f59e0b] text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-50">
                      Charge {money(total)}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. DEDICATED RESTAURANT SUPPORT & HELP PAGE (NOT A MODAL) */}
              {view === "support" && (
                <div className="space-y-6 max-w-4xl">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900">Support & Help Desk</h1>
                    <p className="text-xs text-slate-500">Need immediate assistance with operations, thermal printing, or subscription renewals? Contact our direct channels.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supportSections.filter(s => s.active !== false).map((sec: any) => (
                      <div key={sec.id} className="p-6 border rounded-2xl bg-white space-y-4 shadow-xs">
                        <div>
                          <h3 className="font-bold text-base text-slate-900">{sec.title}</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sec.description}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                          {sec.phone && (
                            <a href={`tel:${sec.phone}`} className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex flex-col items-center gap-1 hover:bg-blue-100 transition-colors">
                              <Phone size={14} /> Call
                            </a>
                          )}
                          {sec.whatsapp && (
                            <a href={`https://wa.me/${String(sec.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs flex flex-col items-center gap-1 hover:bg-emerald-100 transition-colors">
                              <MessageCircle size={14} /> WhatsApp
                            </a>
                          )}
                          {sec.email && (
                            <a href={`mailto:${sec.email}`} className="p-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs flex flex-col items-center gap-1 hover:bg-indigo-100 transition-colors">
                              <Mail size={14} /> Email
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    {!supportSections.length && (
                      <div className="p-8 border rounded-2xl bg-white text-center text-xs text-slate-400 col-span-2">
                        No support channels currently configured.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. SETTINGS VIEW (INCLUDES REVAMPED ADMIN SUPPORT STUDIO) */}
              {view === "settings" && (
                <div className="space-y-6 max-w-4xl">
                  {isAdmin ? (
                    /* ENHANCED ADMIN SETTINGS & SUPPORT DESK STUDIO */
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-2xl font-black text-slate-900">Platform Settings & Helpdesk Studio</h1>
                        <p className="text-xs text-slate-500">Configure global payment accounts and curate support contacts visible to restaurant owners.</p>
                      </div>

                      {/* Payment Settings */}
                      <div className="p-6 border rounded-2xl bg-white space-y-4 shadow-xs">
                        <h2 className="text-sm font-bold text-slate-900">Platform UPI Configuration</h2>
                        <div className="flex gap-2">
                          <input value={adminUpiId} onChange={(e) => setAdminUpiId(e.target.value)} placeholder="merchant@upi" className="w-full p-2.5 border rounded-xl text-xs font-mono bg-slate-50" />
                          <button className="bg-[#f59e0b] text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0" onClick={async () => {
                            setAdminUpiBusy(true);
                            await authedFetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ upi_id: adminUpiId }) });
                            setAdminUpiBusy(false);
                            toast.success("UPI ID updated!");
                          }} disabled={adminUpiBusy}>Save UPI</button>
                        </div>
                      </div>

                      {/* SUPPORT & HELP MANAGEMENT SECTION */}
                      <div className="p-6 border rounded-2xl bg-white space-y-6 shadow-xs">
                        <div className="flex justify-between items-center pb-3 border-b">
                          <div>
                            <h2 className="text-base font-bold text-slate-900">Support & Help Desk Management</h2>
                            <p className="text-xs text-slate-500">Add or edit contact numbers, WhatsApp, and emails rendered in the restaurant support page.</p>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">{supportSections.length} Active Channels</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <label className="block space-y-1 md:col-span-2">
                            <span className="font-semibold text-slate-700">Channel Title</span>
                            <input value={supportForm.title} onChange={(e) => setSupportForm(f => ({ ...f, title: e.target.value }))} className="w-full p-2.5 border rounded-xl" />
                          </label>
                          <label className="block space-y-1">
                            <span className="font-semibold text-slate-700">Calling Number</span>
                            <input value={supportForm.phone} onChange={(e) => setSupportForm(f => ({ ...f, phone: e.target.value }))} className="w-full p-2.5 border rounded-xl" />
                          </label>
                          <label className="block space-y-1">
                            <span className="font-semibold text-slate-700">WhatsApp Number</span>
                            <input value={supportForm.whatsapp} onChange={(e) => setSupportForm(f => ({ ...f, whatsapp: e.target.value }))} className="w-full p-2.5 border rounded-xl" />
                          </label>
                          <label className="block space-y-1 md:col-span-2">
                            <span className="font-semibold text-slate-700">Email Address</span>
                            <input value={supportForm.email} onChange={(e) => setSupportForm(f => ({ ...f, email: e.target.value }))} className="w-full p-2.5 border rounded-xl" />
                          </label>
                          <label className="block space-y-1 md:col-span-2">
                            <span className="font-semibold text-slate-700">Description</span>
                            <textarea value={supportForm.description} onChange={(e) => setSupportForm(f => ({ ...f, description: e.target.value }))} className="w-full p-2.5 border rounded-xl h-20 resize-none" />
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!supportForm.title) { toast.error("Title is required"); return; }
                              const res = await authedFetch("/api/support", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...supportForm, id: supportEditingId || undefined })
                              });
                              if (!res.ok) { toast.error("Save failed"); return; }
                              const j = await res.json();
                              setSupportSections(j.sections || []);
                              setSupportEditingId(null);
                              toast.success("Support channel saved!");
                            }}
                            className="bg-[#f59e0b] text-white px-4 py-2.5 rounded-xl text-xs font-bold"
                          >
                            {supportEditingId ? "Update Channel" : "Add Channel"}
                          </button>
                          {supportEditingId && (
                            <button onClick={() => { setSupportEditingId(null); }} className="px-4 py-2.5 border rounded-xl text-xs font-semibold">Cancel</button>
                          )}
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                          <h4 className="text-xs font-bold uppercase text-slate-400">Configured Support Desks</h4>
                          {supportSections.map((sec: any) => (
                            <div key={sec.id} className="p-3 border rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <b className="text-slate-900 block">{sec.title}</b>
                                <span className="text-slate-500">{sec.phone} · {sec.email}</span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => { setSupportEditingId(sec.id); setSupportForm(sec); }} className="p-1.5 border rounded hover:bg-slate-50"><Pencil size={12} /></button>
                                <button onClick={async () => {
                                  if (!confirm("Delete channel?")) return;
                                  const res = await authedFetch(`/api/support?id=${encodeURIComponent(sec.id)}`, { method: "DELETE" });
                                  if (res.ok) {
                                    const j = await res.json();
                                    setSupportSections(j.sections || []);
                                    toast.success("Channel deleted");
                                  }
                                }} className="p-1.5 border rounded text-rose-600 hover:bg-rose-50"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* RESTAURANT SETTINGS */
                    <div className="p-6 border rounded-2xl bg-white space-y-4 shadow-xs">
                      <h2 className="text-base font-bold">Restaurant Profile & GST</h2>
                      <div className="space-y-3 text-xs">
                        <label className="block space-y-1"><span>Restaurant Name</span><input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} className="w-full p-2.5 border rounded-xl" /></label>
                        <label className="block space-y-1"><span>Phone Number</span><input value={storeForm.phone} onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })} className="w-full p-2.5 border rounded-xl" /></label>
                        <label className="block space-y-1"><span>Address</span><input value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} className="w-full p-2.5 border rounded-xl" /></label>
                        <label className="block space-y-1"><span>GSTIN</span><input value={storeForm.gstin} onChange={(e) => setStoreForm({ ...storeForm, gstin: e.target.value })} className="w-full p-2.5 border rounded-xl" /></label>
                        <div className="grid grid-cols-3 gap-2">
                          <label className="block space-y-1"><span>GST %</span><input type="number" value={storeForm.gst_percent} onChange={(e) => setStoreForm({ ...storeForm, gst_percent: e.target.value })} className="w-full p-2.5 border rounded-xl" /></label>
                          <label className="block space-y-1"><span>CGST %</span><input type="number" value={storeForm.cgst_percent} onChange={(e) => setStoreForm({ ...storeForm, cgst_percent: e.target.value })} className="w-full p-2.5 border rounded-xl" /></label>
                          <label className="block space-y-1"><span>SGST %</span><input type="number" value={storeForm.sgst_percent} onChange={(e) => setStoreForm({ ...storeForm, sgst_percent: e.target.value })} className="w-full p-2.5 border rounded-xl" /></label>
                        </div>
                      </div>
                      <button onClick={handleSaveRestaurantSettings} className="w-full bg-[#f59e0b] text-white font-bold py-2.5 rounded-xl text-xs">Save Settings</button>
                    </div>
                  )}
                </div>
              )}

              {/* 5. RESTAURANTS DIRECTORY (ADMIN ONLY) */}
              {view === "restaurants" && isAdmin && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-black">Restaurant Workspaces</h1>
                      <p className="text-xs text-slate-500">Filter by status or inspect restaurant subscriptions.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAdminRestaurantFilter("all")} className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${adminRestaurantFilter === "all" ? "bg-slate-900 text-white" : "bg-white"}`}>All</button>
                      <button onClick={() => setAdminRestaurantFilter("active")} className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${adminRestaurantFilter === "active" ? "bg-emerald-600 text-white" : "bg-white"}`}>Active</button>
                      <button onClick={() => setAdminRestaurantFilter("expired")} className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${adminRestaurantFilter === "expired" ? "bg-rose-600 text-white" : "bg-white"}`}>Expired</button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-2xl bg-white shadow-xs overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b font-bold text-slate-400">
                          <th className="p-3">RESTAURANT</th>
                          <th className="p-3">OWNER</th>
                          <th className="p-3">PLAN</th>
                          <th className="p-3">STATUS</th>
                          <th className="p-3">EXPIRATION</th>
                          <th className="p-3 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {restaurants
                          .filter(r => {
                            if (adminRestaurantFilter === "active") return ["Active", "Trial"].includes(r.status) && (!r.renewal || new Date(r.renewal) >= new Date());
                            if (adminRestaurantFilter === "expired") return r.renewal && new Date(r.renewal) < new Date();
                            return true;
                          })
                          .map((r: any) => (
                            <tr key={r.id} className="border-b">
                              <td className="p-3 font-bold">{r.name}</td>
                              <td className="p-3">{r.owner_name || r.owner} · {r.owner_email || r.email}</td>
                              <td className="p-3"><span className="font-semibold text-indigo-600">{r.plan || "Free trial"}</span></td>
                              <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100"}`}>{r.status}</span></td>
                              <td className="p-3 font-mono">{r.renewal_on || r.renewal || "—"}</td>
                              <td className="p-3 text-right">
                                <button
                                  className="text-xs px-2.5 py-1 border rounded-lg hover:bg-slate-50 font-bold"
                                  onClick={() => { setEditing(r.id); setForm({ days: "30" }); setModal("extend"); }}
                                >
                                  Extend
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* EXTEND SUBSCRIPTION MODAL */}
      <Dialog open={modal === "extend"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Extend Restaurant Subscription</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <label className="block space-y-1">
              <span>Extension Period</span>
              <select value={form.days || "30"} onChange={(e) => setForm({ ...form, days: e.target.value })} className="w-full p-2 border rounded-xl">
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="365">365 Days (1 Year)</option>
              </select>
            </label>
          </div>
          <DialogFooter>
            <button className="quiet-btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="primary-btn font-bold" onClick={async () => {
              const res = await authedFetch("/api/admin/subscriptions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "extend", restaurant_id: editing, days_to_add: Number(form.days || 30) })
              });
              const j = await res.json();
              if (res.ok) {
                toast.success(`Subscription extended until ${j.renewal_on}`);
                setModal(null);
                authedFetch("/api/admin/restaurants").then(r => r.json()).then(d => { if (d.restaurants) setRestaurants(d.restaurants); });
              } else toast.error(j.error || "Extension failed");
            }}>Confirm Extension</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
