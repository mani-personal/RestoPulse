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
  Eye,
  EyeOff,
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
  | "support"
  | "restaurants"
  | "approvals"
  | "pricing"
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
  userId?: string;
  active?: boolean;
  permissions?: Record<string, boolean>;
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

// Support & Help is a dedicated restaurant page.
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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showRestaurantPassword, setShowRestaurantPassword] = useState(false);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);

  // Persistent Selected Workspace Locking
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantHydrating, setTenantHydrating] = useState(true);
  const [roleHydrated, setRoleHydrated] = useState(false);
  const authGenerationRef = useRef(0);
  const tenantIdRef = useRef<string | null>(null);
  const realtimeRefreshTimerRef = useRef<number | null>(null);
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
  type UiLanguage = "en" | "ta" | "kn";
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("en");
  const languageStorageKey = `rp-language:${tenantId || "platform"}`;
  const translations: Record<UiLanguage, Record<string, string>> = {
    en: {},
    ta: {"Overview":"கண்ணோட்டம்","POS Terminal":"விற்பனை முனையம்","Menu & dishes":"மெனு மற்றும் உணவுகள்","Inventory":"சரக்கு இருப்பு","Team & payroll":"குழு மற்றும் ஊதியம்","Expenses":"செலவுகள்","Suppliers":"சப்ளையர்கள்","Subscription":"சந்தா","Settings":"அமைப்புகள்","Support & Help":"ஆதரவு மற்றும் உதவி","RESTAURANT":"உணவகம்","WORKSPACE":"பணியிடம்","Switch Workspace":"பணியிடத்தை மாற்று","Select Workspace":"பணியிடத்தைத் தேர்ந்தெடுக்கவும்","Restaurant":"உணவகம்","Platform console":"நிர்வாகத் தளம்","Search":"தேடல்","Save":"சேமி","Cancel":"ரத்து செய்","Add Employee":"பணியாளரைச் சேர்","Employees":"பணியாளர்கள்","Date":"தேதி","Category":"வகை","Language":"மொழி"},
    kn: {"Overview":"ಕಣ್ಣೋಟ","POS Terminal":"ಮಾರಾಟ ಕೇಂದ್ರ","Menu & dishes":"ಮೆನು ಮತ್ತು ಖಾದ್ಯಗಳು","Inventory":"ದಾಸ್ತಾನು","Team & payroll":"ತಂಡ ಮತ್ತು ವೇತನ","Expenses":"ವೆಚ್ಚಗಳು","Suppliers":"ಪೂರೈಕೆದಾರರು","Subscription":"ಚಂದಾದಾರಿಕೆ","Settings":"ಸೆಟ್ಟಿಂಗ್‌ಗಳು","Support & Help":"ಬೆಂಬಲ ಮತ್ತು ಸಹಾಯ","RESTAURANT":"ರೆಸ್ಟೋರೆಂಟ್","WORKSPACE":"ಕಾರ್ಯಸ್ಥಳ","Switch Workspace":"ಕಾರ್ಯಸ್ಥಳ ಬದಲಿಸಿ","Select Workspace":"ಕಾರ್ಯಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ","Restaurant":"ರೆಸ್ಟೋರೆಂಟ್","Platform console":"ನಿರ್ವಹಣಾ ಕನ್ಸೋಲ್","Search":"ಹುಡುಕಿ","Save":"ಉಳಿಸಿ","Cancel":"ರದ್ದುಮಾಡಿ","Add Employee":"ಉದ್ಯೋಗಿಯನ್ನು ಸೇರಿಸಿ","Employees":"ಉದ್ಯೋಗಿಗಳು","Date":"ದಿನಾಂಕ","Category":"ವರ್ಗ","Language":"ಭಾಷೆ"}
  };
  const tr = (label: string) => translations[uiLanguage][label] || label;
  const [profileMenu, setProfileMenu] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(languageStorageKey) as UiLanguage | null;
      setUiLanguage(saved === "ta" || saved === "kn" ? saved : "en");
    } catch { setUiLanguage("en"); }
  }, [languageStorageKey]);
  const changeUiLanguage = (value: string) => {
    const next = (value === "ta" || value === "kn" ? value : "en") as UiLanguage;
    setUiLanguage(next);
    try { window.localStorage.setItem(languageStorageKey, next); } catch {}
  };
  const [accountRole, setAccountRole] = useState<"admin" | "restaurant">("restaurant");
  const [currentUserPermissions, setCurrentUserPermissions] = useState<Record<string, boolean>>({});
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
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("All categories");
  const [expenseStartDate, setExpenseStartDate] = useState("");
  const [expenseEndDate, setExpenseEndDate] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierActivityFilter, setSupplierActivityFilter] = useState("All suppliers");
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
  const defaultAdminPermissions = { restaurants: true, approvals: true, pricing: true, settings: true, support: true, admins: false };
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", permissions: defaultAdminPermissions });
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [supportEditingId, setSupportEditingId] = useState<string | null>(null);
  const [supportForm, setSupportForm] = useState({
    title: "Customer Support & Desk",
    description: "Reach out to our 24/7 technical and operations assistance team for any billing or restaurant terminal inquiries.",
    phone: "8122187039",
    whatsapp: "8122187039",
    email: "hosurwebservices@gmail.com",
    active: true,
  });

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
    return fetch(input, { ...init, headers, cache: "no-store" });
  }, []);

  // Sync Live Pricing Plans from Backend
  const fetchLivePlans = useCallback(async () => {
    if (!roleHydrated) return;
    try {
      // Always bypass browser caches so restaurant accounts see the latest Admin pricing.
      const res = await authedFetch("/api/admin/pricing", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data?.plans && Array.isArray(data.plans) && data.plans.length) {
        setPlans(data.plans);
        setActiveInlinePlan((prev) => {
          if (prev && data.plans.some((p: Plan) => String(p.id) === String(prev.id))) {
            return data.plans.find((p: Plan) => String(p.id) === String(prev.id)) || prev;
          }
          return data.plans.find((p: Plan) => Number(p.price) > 0) || data.plans[0];
        });
      }
    } catch {}
  }, [authedFetch, roleHydrated]);

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
    setCurrentUserPermissions((rest.permissions && typeof rest.permissions === "object") ? rest.permissions : {});
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
      const res = await authedFetch(url);
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
            gst_percent: Number(data.restaurant.gst_percent ?? prev.gst_percent),
            cgst_percent: Number(data.restaurant.cgst_percent ?? prev.cgst_percent),
            sgst_percent: Number(data.restaurant.sgst_percent ?? prev.sgst_percent),
            receipt_footer: data.restaurant.receipt_footer || prev.receipt_footer,
          }));
          setStoreForm((prev) => ({
            ...prev,
            name: data.restaurant.name,
            address: data.restaurant.address || prev.address,
            phone: data.restaurant.owner_phone || prev.phone,
            gstin: data.restaurant.gstin || prev.gstin,
            gst_percent: String(data.restaurant.gst_percent ?? prev.gst_percent),
            cgst_percent: String(data.restaurant.cgst_percent ?? prev.cgst_percent),
            sgst_percent: String(data.restaurant.sgst_percent ?? prev.sgst_percent),
            footer: data.restaurant.receipt_footer || prev.footer,
          }));
        }
      }
      if (data?.upi_id) setSubscriptionUpiId(data.upi_id);
      if (Array.isArray(data?.history)) setSubscriptionHistory(data.history);
    } catch {}
  }, [authUser, loginEmail, authedFetch]);

  const fetchAllRestaurants = useCallback(async () => {
    if (!isAdmin || !roleHydrated) return;
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
  }, [authedFetch, isAdmin, roleHydrated]);

  const fetchAdmins = useCallback(async () => {
    if (!isAdmin || !roleHydrated) return;
    try {
      const res = await authedFetch("/api/admin/admins");
      const json = await res.json();
      if (res.ok && Array.isArray(json?.admins)) setAdmins(json.admins);
      else if (!res.ok) throw new Error(json?.error || "Could not load admins");
    } catch (e: any) { toast.error(e.message || "Could not load admins"); }
  }, [authedFetch, isAdmin, roleHydrated]);

  const fetchRealApprovals = useCallback(async () => {
    if (!isAdmin || !roleHydrated) return;
    try {
      const res = await authedFetch("/api/admin/approvals");
      const json = await res.json();
      if (json?.approvals) {
        setApprovals(json.approvals);
      }
    } catch {}
  }, [authedFetch, isAdmin, roleHydrated]);

  const fetchSubscriptionRequests = useCallback(async () => {
    if (!isAdmin || !roleHydrated) return;
    try {
      const res = await authedFetch("/api/admin/subscriptions");
      const json = await res.json();
      if (json?.requests) setSubscriptionRequests(json.requests);
      if (json?.history) setSubscriptionHistory(json.history);
    } catch {
      const localReqs = localStorage.getItem("rp-local-sub-requests");
      if (localReqs) setSubscriptionRequests(JSON.parse(localReqs));
    }
  }, [authedFetch, isAdmin, roleHydrated]);

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
      setSupportForm({
        title: "Customer Support & Desk",
        description: "Reach out to our 24/7 technical and operations assistance team for any billing or restaurant terminal inquiries.",
        phone: "8122187039",
        whatsapp: "8122187039",
        email: "hosurwebservices@gmail.com",
        active: true
      });
      toast.success("Support details updated successfully");
    } catch (e: any) { toast.error(e.message || "Could not save support section"); }
  };

  const deleteSupportSection = async (id: string) => {
    if (!confirm("Are you sure you want to remove this support channel?")) return;
    try {
      const res = await authedFetch(`/api/support?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not delete support section");
      setSupportSections(json.sections || []);
      if (supportEditingId === id) setSupportEditingId(null);
      toast.success("Support channel deleted");
    } catch (e: any) { toast.error(e.message || "Could not delete support section"); }
  };

  // ENHANCED ADMIN SETTINGS PANEL WITH COMPREHENSIVE SUPPORT & HELP STUDIO
  const AdminSettingsPanel = () => {
    return (
      <div className="space-y-6">
        <div className="page-head flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <div className="eyebrow">PLATFORM CONFIGURATION</div>
            <h1>Admin Settings</h1>
            <p>Manage platform billing, administrator credentials, system operations, and restaurant support desks.</p>
          </div>
          <button className="quiet-btn text-xs font-semibold" onClick={() => { fetchSupportSections(); toast.success("Settings refreshed"); }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Top Cards: Payments & Account */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="panel p-6 border rounded-2xl bg-card space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Wallet size={20} />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">Platform Payment UPI</h2>
                <p className="text-xs text-muted-foreground">UPI ID displayed to restaurant owners for subscription upgrades.</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">Admin UPI Identifier</label>
              <div className="flex gap-2">
                <input
                  value={adminUpiId}
                  onChange={(e) => setAdminUpiId(e.target.value)}
                  placeholder="merchant@upi"
                  className="w-full p-2.5 border rounded-xl bg-background text-xs font-mono"
                />
                <button
                  className="primary-btn shrink-0 text-xs font-bold px-4"
                  onClick={saveAdminUpi}
                  disabled={adminUpiBusy}
                >
                  {adminUpiBusy ? "Saving…" : "Save UPI"}
                </button>
              </div>
            </div>
          </section>

          <section className="panel p-6 border rounded-2xl bg-card space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">Admin Account</h2>
                <p className="text-xs text-muted-foreground">Authenticated master platform credentials and authorization.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 border rounded-xl bg-secondary/20">
                <span className="text-muted-foreground block text-[11px]">Signed In Email</span>
                <b className="truncate block font-mono mt-0.5">{loginEmail}</b>
              </div>
              <div className="p-3 border rounded-xl bg-secondary/20">
                <span className="text-muted-foreground block text-[11px]">System Role</span>
                <b className="text-indigo-600 block mt-0.5">Platform Administrator</b>
              </div>
            </div>
          </section>
        </div>

        {/* Subscription Operations Stats */}
        <section className="panel p-6 border rounded-2xl bg-card space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <h2 className="text-base font-bold">Subscription Operations Status</h2>
              <p className="text-xs text-muted-foreground">High-level financial and onboarding lifecycle summary.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 border rounded-xl bg-background">
              <span className="text-[11px] text-muted-foreground block">Active / Trial Workspaces</span>
              <strong className="text-xl text-emerald-600 mt-1 block">
                {restaurants.filter((r: any) => ["Active", "Trial"].includes(r.status)).length}
              </strong>
            </div>
            <div className="p-3.5 border rounded-xl bg-background">
              <span className="text-[11px] text-muted-foreground block">Expired Subscriptions</span>
              <strong className="text-xl text-rose-600 mt-1 block">
                {restaurants.filter((r: any) => r.renewal && new Date(r.renewal) < new Date()).length}
              </strong>
            </div>
            <div className="p-3.5 border rounded-xl bg-background">
              <span className="text-[11px] text-muted-foreground block">Pending Pipeline Verifications</span>
              <strong className="text-xl text-amber-600 mt-1 block">
                {subscriptionRequests.length + approvals.length}
              </strong>
            </div>
            <div className="p-3.5 border rounded-xl bg-background">
              <span className="text-[11px] text-muted-foreground block">Total Verified Revenue</span>
              <strong className="text-xl text-foreground mt-1 block">
                {money(subscriptionHistory.filter((x: any) => x.status === "Approved").reduce((n: number, x: any) => n + Number(x.amount || 0), 0))}
              </strong>
            </div>
          </div>
        </section>

        {/* ENHANCED SUPPORT & HELP MANAGEMENT STUDIO */}
        <section className="panel p-6 border rounded-2xl bg-card space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <LifeBuoy size={22} />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">Support & Help Desk Management</h2>
                <p className="text-xs text-muted-foreground">Configure the contact methods (Phone, WhatsApp, Email) shown to all restaurant owners on their Support & Help page.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground self-start sm:self-auto">
              {supportSections.length} Channel(s) Configured
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor Form Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {supportEditingId ? "Edit Support Channel" : "Configure Channel Details"}
                </span>
                {supportEditingId && (
                  <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    Editing Mode
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="block space-y-1 sm:col-span-2">
                  <span className="font-semibold text-muted-foreground">Desk / Channel Title</span>
                  <input
                    value={supportForm.title}
                    onChange={(e) => setSupportForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. 24/7 Operations & Helpdesk"
                    className="w-full p-2.5 border rounded-xl bg-background font-medium"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Phone size={13} className="text-blue-500" /> Calling Number
                  </span>
                  <input
                    value={supportForm.phone}
                    onChange={(e) => setSupportForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. 8122187039"
                    className="w-full p-2.5 border rounded-xl bg-background font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <MessageCircle size={13} className="text-emerald-500" /> WhatsApp Number
                  </span>
                  <input
                    value={supportForm.whatsapp}
                    onChange={(e) => setSupportForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="e.g. 8122187039"
                    className="w-full p-2.5 border rounded-xl bg-background font-mono"
                  />
                </label>

                <label className="block space-y-1 sm:col-span-2">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Mail size={13} className="text-indigo-500" /> Support Email Address
                  </span>
                  <input
                    type="email"
                    value={supportForm.email}
                    onChange={(e) => setSupportForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. support@restopulse.com"
                    className="w-full p-2.5 border rounded-xl bg-background font-mono"
                  />
                </label>

                <label className="block space-y-1 sm:col-span-2">
                  <span className="font-semibold text-muted-foreground">Support Description & Working Hours</span>
                  <textarea
                    value={supportForm.description}
                    onChange={(e) => setSupportForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Need assistance with RestoPulse? Our support engineers are available Monday to Saturday..."
                    className="w-full min-h-24 p-2.5 border rounded-xl bg-background resize-none leading-relaxed"
                  />
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  className="primary-btn font-bold text-xs py-2.5 px-5 flex items-center gap-1.5 shadow-sm"
                  onClick={saveSupportSection}
                >
                  <Save size={15} /> {supportEditingId ? "Update Support Channel" : "Save Support Channel"}
                </button>
                {supportEditingId && (
                  <button
                    className="quiet-btn text-xs py-2.5 px-4 font-semibold"
                    onClick={() => {
                      setSupportEditingId(null);
                      setSupportForm({
                        title: "Customer Support & Desk",
                        description: "Reach out to our 24/7 technical and operations assistance team for any billing or restaurant terminal inquiries.",
                        phone: "8122187039",
                        whatsapp: "8122187039",
                        email: "hosurwebservices@gmail.com",
                        active: true,
                      });
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {/* Live Restaurant Preview Column */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Live Restaurant Preview
              </span>
              <div className="p-5 rounded-2xl border bg-slate-950 text-white space-y-3 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <b className="text-sm font-bold truncate">{supportForm.title || "Support & Help"}</b>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    Restaurant Support Page
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed min-h-12">
                  {supportForm.description || "Support guidelines and instructions for your restaurant team."}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-center font-bold flex flex-col items-center gap-1">
                    <Phone size={14} /> Call
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-center font-bold flex flex-col items-center gap-1">
                    <MessageCircle size={14} /> WhatsApp
                  </div>
                  <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-center font-bold flex flex-col items-center gap-1">
                    <Mail size={14} /> Email
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 space-y-1 font-mono">
                  {supportForm.phone && <div>📞 {supportForm.phone}</div>}
                  {supportForm.whatsapp && <div>💬 {supportForm.whatsapp}</div>}
                  {supportForm.email && <div>✉️ {supportForm.email}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Configured Support Desks List */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Configured Contact Channels
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supportSections.map((section: any) => (
                <div
                  key={section.id}
                  className={`p-4 border rounded-2xl bg-card flex flex-col justify-between space-y-3 transition-all ${
                    supportEditingId === section.id ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5" : "hover:border-border/80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <b className="text-sm font-bold text-foreground">{section.title}</b>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {section.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-muted-foreground pt-2 border-t">
                    {section.phone && <span className="bg-secondary/40 px-2 py-0.5 rounded-md">📞 {section.phone}</span>}
                    {section.whatsapp && <span className="bg-secondary/40 px-2 py-0.5 rounded-md">💬 {section.whatsapp}</span>}
                    {section.email && <span className="bg-secondary/40 px-2 py-0.5 rounded-md truncate max-w-[200px]">✉️ {section.email}</span>}
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      className="quiet-btn text-xs py-1 px-2.5 flex items-center gap-1"
                      onClick={() => {
                        setSupportEditingId(section.id);
                        setSupportForm({
                          title: section.title || "",
                          phone: section.phone || "",
                          whatsapp: section.whatsapp || "",
                          email: section.email || "",
                          description: section.description || "",
                          active: section.active !== false,
                        });
                        toast.info(`Editing "${section.title}"`);
                      }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      className="quiet-btn text-xs py-1 px-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                      onClick={() => deleteSupportSection(section.id)}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {!supportSections.length && (
                <div className="p-8 border rounded-2xl bg-muted/20 text-center text-xs text-muted-foreground md:col-span-2">
                  No support channels saved yet. Use the form above to add phone, WhatsApp, and email contact information.
                </div>
              )}
            </div>
          </div>
        </section>
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
      authGenerationRef.current += 1;
      setRoleHydrated(false);
      setTenantId(null);
      setTenantHydrating(false);
      setActiveRestaurantName("Loading workspace…");
      return;
    }
    const generation = ++authGenerationRef.current;
    setTenantHydrating(true);
    setRoleHydrated(false);
    // Reset the previous session's role immediately so an owner logging in
    // after an admin session cannot trigger platform-admin API calls.
    setIsAdmin(false);
    setAccountRole("restaurant");
    setCurrentUserPermissions({});
    setTenantId(null);
    setView("dashboard");
    setActiveRestaurantName("Loading workspace…");
    setActivePlanName("Free trial");
    setActiveRenewalDate("—");
    setTenantInfo((prev) => ({ ...prev, id: undefined, name: "" }));
  }, [authUser]);

  useEffect(() => {
    if (!db || !authUser) return;
    let live = true;
    const generation = authGenerationRef.current;
    (async () => {
      try {
        const a = await db.from("platform_admins").select("user_id").eq("user_id", authUser).maybeSingle();
        if (!live || generation !== authGenerationRef.current) return;
        const platform = !!a?.data;
        setIsAdmin(platform);
        setAccountRole(platform ? "admin" : "restaurant");
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          const onAdminPath = currentPath === "/admin" || currentPath.startsWith("/admin/");
          if (platform && !onAdminPath) {
            window.history.replaceState({ view: "dashboard" }, "", "/admin");
            setView("dashboard");
          } else if (!platform && onAdminPath) {
            window.history.replaceState({ view: "dashboard" }, "", "/dashboard");
            setView("dashboard");
          }
        }
        setCurrentUserPermissions(platform ? { restaurants: true, approvals: true, pricing: true, settings: true, support: true, admins: true } : {});
        if (!platform) {
          const wsRes = await authedFetch("/api/workspaces");
          const wsJson = await wsRes.json().catch(() => ({}));
          if (!live || generation !== authGenerationRef.current) return;
          const workspaces = wsRes.ok && Array.isArray(wsJson?.workspaces) ? wsJson.workspaces : [];
          setRestaurants(workspaces);
          const savedTenantId = localStorage.getItem("rp-active-tenant-id");
          const target = workspaces.find((r: any) => r.id === savedTenantId) || workspaces[0];
          if (target) {
            setTenantId(target.id);
            tenantIdRef.current = target.id;
            localStorage.setItem("rp-active-tenant-id", target.id);
            setActiveRestaurantName(target.name || "Restaurant");
            setActivePlanName(target.plan || "Free trial");
            setActiveRenewalDate(target.renewal || "—");
            setCurrentUserRole(String(target.role || "OWNER").toLowerCase());
            setCurrentUserPermissions((target.permissions && typeof target.permissions === "object") ? target.permissions : {});
          } else {
            setTenantId(null);
            tenantIdRef.current = null;
            localStorage.removeItem("rp-active-tenant-id");
          }
          setTenantHydrating(false);
          setRoleHydrated(true);
        } else {
          setTenantHydrating(false);
          setRoleHydrated(true);
        }
      } catch (e) {
        if (generation === authGenerationRef.current) {
          console.error("Auth hydration error", e);
          setRoleHydrated(true);
          setTenantHydrating(false);
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [db, authUser, authedFetch]);

  useEffect(() => {
    if (!authUser || !roleHydrated) return;
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
  }, [authUser, tenantId, isAdmin, roleHydrated, authedFetch]);

  useEffect(() => {
    const syncClock = () => setLiveDate(new Date());
    syncClock();
    const timer = window.setInterval(syncClock, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authUser || !roleHydrated) return;
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
  }, [authUser, roleHydrated, isAdmin, tenantId, fetchSubscriptionRequests, fetchRealApprovals, fetchAllRestaurants, fetchAdmins, syncLiveSubscriptionStatus, fetchLivePlans, fetchSupportSections]);

  useEffect(() => {
    if (authUser && roleHydrated) fetchLivePlans();
  }, [authUser, roleHydrated, fetchLivePlans]);

  const loadRestaurantData = useCallback(async (id: string) => {
    if (!id || isAdmin) return;
    // Keep the current workspace visible while refreshing; only show the blocking
    // loader on the first load so routine operations feel responsive.
    const hasCachedWorkspaceData = orders.length > 0 || dishes.length > 0 || expenses.length > 0 || suppliers.length > 0 || inventoryList.length > 0 || staff.length > 0;
    if (!hasCachedWorkspaceData) setIsDataLoading(true);
    try {
      const [salesRes, inventoryRes, menuRes, expensesRes, supplierRes, paymentRes, staffRes, wagesRes, membershipsRes] = await Promise.all([
        authedFetch(`/api/sales?restaurant_id=${encodeURIComponent(id)}`),
        authedFetch(`/api/inventory?restaurant_id=${encodeURIComponent(id)}`),
        db.from("menu_items").select("id,name,category,price,cost,available,emoji,diet,prep_minutes,image_url").eq("restaurant_id", id).order("created_at", { ascending: false }),
        db.from("expenses").select("id,name,category,vendor,amount,incurred_on,supplier_id").eq("restaurant_id", id).order("incurred_on", { ascending: false }),
        db.from("suppliers").select("id,name,contact_name,phone,email").eq("restaurant_id", id).order("name"),
        db.from("supplier_payments").select("id,supplier_id,amount,paid_on,method,note").eq("restaurant_id", id).order("paid_on", { ascending: false }),
        db.from("employees").select("id,user_id,name,role,shift,pay_type,monthly_salary,weekly_salary,daily_rate,email,phone,active").eq("restaurant_id", id).order("name"),
        db.from("daily_wages").select("id,employee_id,wage_date,amount,status,note").eq("restaurant_id", id).order("wage_date", { ascending: false }),
        db.from("memberships").select("user_id,role,permissions").eq("restaurant_id", id),
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
      if (!staffRes.error) {
        const membershipMap = new Map((membershipsRes.data || []).map((m: any) => [String(m.user_id), m.permissions || {}]));
        setStaff((staffRes.data || []).map((x: any) => ({ id: x.id, name: x.name, role: x.role, initial: x.name.slice(0, 2).toUpperCase(), shift: x.shift, payType: x.pay_type || "Daily", monthlySalary: Number(x.monthly_salary || 0), weeklySalary: Number(x.weekly_salary || 0), dailyRate: Number(x.daily_rate || 0), email: x.email, phone: x.phone, userId: x.user_id, active: x.active, permissions: x.user_id ? (membershipMap.get(String(x.user_id)) || {}) : {} })));
      }
      if (!wagesRes.error) setWages((wagesRes.data || []).map((x: any) => ({ id: x.id, staffId: x.employee_id, date: x.wage_date, amount: Number(x.amount), status: x.status, note: x.note })));
    } catch (e) {
      console.error("Restaurant data load failed", e);
      toast.error("Some restaurant data could not be loaded.");
    } finally { setIsDataLoading(false); }
  }, [authedFetch, db, isAdmin, orders.length, dishes.length, expenses.length, suppliers.length, inventoryList.length, staff.length]);

  useEffect(() => {
    if (tenantId && !isAdmin) loadRestaurantData(tenantId);
  }, [tenantId, isAdmin, loadRestaurantData]);

  useEffect(() => {
    if (!authUser || !db) return;
    const channels: any[] = [];
    let disposed = false;

    // Coalesce bursts of database events into one refresh. A sale can update
    // both sales and inventory, and without debouncing that used to trigger
    // several full restaurant-data loads at the same time.
    const scheduleRestaurantRefresh = (syncSubscription = false) => {
      if (syncSubscription) syncLiveSubscriptionStatus();
      if (isAdmin || !tenantIdRef.current) return;
      if (realtimeRefreshTimerRef.current) window.clearTimeout(realtimeRefreshTimerRef.current);
      realtimeRefreshTimerRef.current = window.setTimeout(() => {
        if (!disposed && tenantIdRef.current) loadRestaurantData(tenantIdRef.current);
      }, 350);
    };

    if (tenantId && !isAdmin) {
      const filter = `restaurant_id=eq.${tenantId}`;
      // One channel per tenant is faster than opening a separate realtime
      // channel for every table. All tenant events share one websocket topic.
      const tenantChannel = db.channel(`rp-tenant-${tenantId}`);
      tenantChannel
        .on("postgres_changes", { event: "*", schema: "public", table: "restaurants", filter }, () => {
          syncLiveSubscriptionStatus();
        });
      ["sales", "inventory_items", "inventory_transactions", "menu_items", "expenses", "employees", "daily_wages", "suppliers", "supplier_payments", "subscription_requests"].forEach((table) => {
        tenantChannel.on("postgres_changes", { event: "*", schema: "public", table, filter }, () => scheduleRestaurantRefresh(table === "subscription_requests"));
      });
      tenantChannel.subscribe();
      channels.push(tenantChannel);
    }

    if (isAdmin) {
      // Admin console also uses one multiplexed realtime channel. Restaurant
      // changes immediately refresh the restaurant list/overview, while
      // subscription request changes refresh approvals/history.
      const adminChannel = db.channel("rp-admin-live");
      adminChannel
        .on("postgres_changes", { event: "*", schema: "public", table: "restaurants" }, () => {
          fetchAllRestaurants();
          fetchRealApprovals();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "subscription_requests" }, () => {
          fetchSubscriptionRequests();
          fetchRealApprovals();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => {
          fetchLivePlans();
        })
        .subscribe();
      channels.push(adminChannel);
    }

    return () => {
      disposed = true;
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
        realtimeRefreshTimerRef.current = null;
      }
      channels.forEach((ch) => db.removeChannel(ch));
    };
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
      void loadRestaurantData(tenantId);
      setModal(null); setEditingInvId(null);
      setInvForm({ name: "", category: "Grains", onHand: "", unit: "bags", reorderLevel: "5" });
      toast.success(editingInvId ? "Inventory item updated successfully!" : "Inventory item added successfully!");
    } catch (e: any) { toast.error(e.message || "Could not save inventory item"); }
  };

  const handleDeleteInventory = async (id: string | number) => {
    if (!tenantId || !confirm("Are you sure you want to delete this inventory item?")) return;
    try {
      const res = await authedFetch("/api/inventory", { method: "DELETE", body: JSON.stringify({ restaurant_id: tenantId, id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not delete inventory item");
      void loadRestaurantData(tenantId);
      toast.success("Inventory item deleted");
    } catch (e: any) { toast.error(e.message || "Could not delete inventory item"); }
  };

  const adjustInventory = async (item: InventoryItem, delta: number, type: string, note = "") => {
    if (!tenantId || item.onHand + delta < 0) { toast.error("Stock cannot go below zero"); return false; }
    try {
      const res = await authedFetch("/api/inventory", {
        method: "POST",
        body: JSON.stringify({
          restaurant_id: tenantId,
          id: item.id,
          name: item.name,
          category: item.category,
          on_hand: item.onHand + delta,
          unit: item.unit,
          reorder_level: item.reorderLevel,
          transaction_type: type,
          note,
        })
      });
      const json = await res.json(); if (!res.ok) throw new Error(json.error || "Could not update stock");
      // Update the visible stock immediately; refresh history in the background.
      setInventoryList((items) => items.map((x) => String(x.id) === String(item.id) ? { ...x, onHand: item.onHand + delta } : x));
      void loadRestaurantData(tenantId); toast.success(`${type}: ${item.name}`);
      return true;
    } catch (e: any) { toast.error(e.message || "Could not update stock"); return false; }
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

  useEffect(() => {
    try { const raw = localStorage.getItem(notificationStorageKey); setReadNotificationKeys(raw ? JSON.parse(raw) : []); } catch { setReadNotificationKeys([]); }
  }, [notificationStorageKey]);

  const markNotificationRead = (key: string) => {
    const next = Array.from(new Set([...readNotificationKeys, key]));
    setReadNotificationKeys(next);
    try { localStorage.setItem(notificationStorageKey, JSON.stringify(next)); } catch {}
  };

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
        permissions: JSON.stringify(member.permissions || {}),
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
    } else if (which === "employee") {
      setForm({ name: "", role: "Staff", shift: "09:00 – 18:00", payType: "Monthly", monthlySalary: "", weeklySalary: "", dailyRate: "", email: "", phone: "", active: "true", permissions: JSON.stringify({ overview: true, pos: true }) });
    } else setForm({});
  };

  const handleDeleteDish = async (dishId: number | string) => {
    if (!tenantId || !confirm("Are you sure you want to delete this dish from the menu?")) return;
    const { error } = await db.from("menu_items").delete().eq("restaurant_id", tenantId).eq("id", dishId);
    if (error) { toast.error(error.message); return; }
    setDishes((old) => old.filter((d) => d.id !== dishId));
    toast.success("Dish deleted successfully!");
  };

  const save = async () => {
    if (modal === "admin") {
      if (!adminForm.name.trim() || !adminForm.email.trim()) { toast.error("Admin name and email are required"); return; }
      try {
        const method = editingAdminId ? "PATCH" : "POST";
        const payload: any = { name: adminForm.name.trim(), email: adminForm.email.trim(), permissions: adminForm.permissions };
        if (adminForm.password.trim()) payload.password = adminForm.password.trim();
        if (editingAdminId) payload.id = editingAdminId;
        const res = await authedFetch("/api/admin/admins", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not save admin");
        setModal(null); setEditingAdminId(null); setAdminForm({ name: "", email: "", password: "", permissions: defaultAdminPermissions });
        await fetchAdmins();
        toast.success(editingAdminId ? "Admin updated" : (json.temporary_password ? `Admin added. Temporary password: ${json.temporary_password}` : "Admin added to the existing login"));
      } catch (e: any) { toast.error(e.message || "Could not save admin"); }
      return;
    }
    if (modal === "restaurant") {
      if (!form.name?.trim() || !form.owner?.trim() || !form.email?.trim() || !form.phone?.trim()) {
        toast.error("Restaurant, owner, email and phone are required"); return;
      }
      try {
        const method = editing !== null ? "PATCH" : "POST";
        const body: any = { id: editing || undefined, name: form.name.trim(), owner: form.owner.trim(), email: form.email.trim(), phone: form.phone.trim(), city: form.city || "" };
        if (method === "POST") body.password = form.password || "";
        else { body.owner_name = form.owner.trim(); body.owner_email = form.email.trim(); body.owner_phone = form.phone.trim(); body.address = form.address || ""; body.plan = form.plan || "Free Trial"; body.status = form.status || "Active"; body.renewal_on = form.renewal || null; }
        const res = await authedFetch("/api/admin/restaurants", { method, body: JSON.stringify(body) });
        const json = await res.json(); if (!res.ok) throw new Error(json.error || "Could not save restaurant");
        setModal(null); setEditing(null); await fetchAllRestaurants();
        if (method === "POST" && json.temporary_password) {
          toast.success(`Restaurant created. Temporary password: ${json.temporary_password}`, { duration: 10000 });
        } else {
          toast.success(editing !== null ? "Restaurant updated" : (json.reused_existing_login ? "Restaurant created and linked to the existing owner login" : "Restaurant created"));
        }
      } catch (e: any) { toast.error(e.message || "Could not save restaurant"); }
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
          body: JSON.stringify({ action: "extend", restaurant_id: String(editing), days_to_add: days, renewal_on: form.renewal_on || undefined })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not extend subscription");
        setModal(null); setEditing(null);
        await fetchAllRestaurants();
        toast.success(`Subscription extended until ${json.renewal_on || "the new renewal date"}.`);
      } catch (e: any) { toast.error(e.message || "Could not extend subscription"); }
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
        price: Number(form.price), cost: Number(form.cost) || 0, available: editing ? (dishes.find(x => x.id === editing)?.stock ?? true) : true,
        emoji: form.emoji || "🍽", image_url: form.imageUrl?.trim() || null, diet: form.diet || "", prep_minutes: Number(form.time) || 15
      };
      const result = editing
        ? await db.from("menu_items").update(payload).eq("restaurant_id", tenantId).eq("id", editing).select().single()
        : await db.from("menu_items").insert(payload).select().single();
      if (result.error) { toast.error(result.error.message); return; }
      const x: any = result.data;
      const d: Dish = { id: x.id, name: x.name, category: x.category, price: Number(x.price), cost: Number(x.cost), stock: x.available, emoji: x.emoji, diet: x.diet, time: x.prep_minutes, imageUrl: x.image_url };
      setDishes(old => editing ? old.map(v => v.id === editing ? d : v) : [d, ...old]);
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
      setExpenses((old) => [{ ...newExp, id: data.id }, ...old]);
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
      const payload = { restaurant_id: tenantId, name: newSup.name, contact_name: newSup.contact, phone: newSup.phone, email: newSup.email };
      const result = editing ? await db.from("suppliers").update(payload).eq("restaurant_id", tenantId).eq("id", String(editing)).select().single()
        : await db.from("suppliers").insert(payload).select().single();
      if (result.error) { toast.error(result.error.message); return; }
      const mapped = { ...newSup, id: result.data.id };
      setSuppliers(old => editing ? old.map(x => x.id === editing ? mapped : x) : [mapped, ...old]);
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
      const { data, error } = await db.from("supplier_payments").insert({
        restaurant_id: tenantId, supplier_id: newPay.supplierId, amount: newPay.amount, paid_on: newPay.date, method: newPay.method, note: newPay.note
      }).select().single();
      if (error) { toast.error(error.message); return; }
      setSupplierPayments(old => [{ ...newPay, id: data.id }, ...old]); toast.success("Payment recorded");
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
      const selectedPermissions = (() => { try { const parsed = form.permissions ? JSON.parse(form.permissions) : {}; return parsed && typeof parsed === "object" ? parsed : {}; } catch { return {}; } })();

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
        permissions: selectedPermissions,
      };
      if (!tenantId) return;
      const payload = { restaurant_id: tenantId, name: person.name, role: person.role, shift: person.shift, daily_rate: person.dailyRate, pay_type: person.payType, monthly_salary: person.monthlySalary, weekly_salary: person.weeklySalary, email: person.email, phone: person.phone, active: person.active !== false };
      const result = editing !== null ? await db.from("employees").update(payload).eq("restaurant_id", tenantId).eq("id", String(editing)).select().single()
        : await db.from("employees").insert(payload).select().single();
      if (result.error) { toast.error(result.error.message); return; }
      const mapped = { ...person, id: result.data.id }; setStaff(old => editing !== null ? old.map(x => x.id === editing ? mapped : x) : [mapped, ...old]);
      if (form.email?.trim() && (form.password?.trim() || editing !== null)) {
        const loginRes = await authedFetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurant_id: tenantId, name: person.name, email: person.email, password: form.password, role: person.role, permissions: selectedPermissions }) });
        const loginJson = await loginRes.json();
        if (!loginRes.ok) { toast.error(loginJson.error || "Employee saved, but login could not be created"); return; }
      }
      toast.success(editing !== null ? "Employee updated" : "Employee added");
    }
    setModal(null);
  };

  const handleDeletePlan = async (planId: number) => {
    const target = plans.find(p => p.id === planId);
    if (target && restaurants.some((r: any) => String(r.plan).toLowerCase() === target.name.toLowerCase())) {
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
      const res = await authedFetch("/api/sales", { method: "POST", body: JSON.stringify({ restaurant_id: tenantId, placed_at: now.toISOString(), receipt: bill }) });
      const json = await res.json(); if (!res.ok) throw new Error(json.error || "Could not save sale");
      const sale: Sale = { id, time, placedAt: now.toISOString(), amount: total, type: orderType, status: "Paid", bill };
      setReceipt(bill); setOrders(old => [sale, ...old]); setCart([]); setOrderDiscount(0);
      toast.success("Payment complete · " + id);
    } catch (e: any) { toast.error(e.message || "Sale could not be saved"); }
  };

  const openStaff = (person: Staff) => {
    const today = new Date();
    const monday = new Date(today); monday.setHours(0, 0, 0, 0); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
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
        const failed = await res.clone().json().catch(() => ({ error: "Failed to submit payment reference" }));
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

  const handleSaveRestaurantSettings = async () => {
    try {
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
      if (typeof window !== "undefined" && window.location.pathname === "/admin-login") {
        const { data: signedIn } = await db.auth.getUser();
        const userId = signedIn.user?.id;
        const { data: adminRow } = userId ? await db.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle() : { data: null };
        if (!adminRow) {
          await db.auth.signOut();
          toast.error("This login is for platform administrators only.");
          return;
        }
      }
      toast.success("Signed in successfully!");
    }
  };

  const handleSignOut = async () => {
    if (db) await db.auth.signOut();
    localStorage.removeItem("rp-active-tenant-id");
    setTenantId(null);
    setAuthUser(null);
  };

  const viewPath = (v: View) => {
    const adminPaths: Record<string, string> = { dashboard: "/admin", restaurants: "/admin/restaurants", approvals: "/admin/approvals", pricing: "/admin/pricing", settings: "/admin/settings", admins: "/admin/admins", support: "/admin/support" };
    const restaurantPaths: Record<string, string> = { dashboard: "/dashboard", pos: "/pos", menu: "/menu", inventory: "/inventory", staff: "/staff", expenses: "/expenses", suppliers: "/suppliers", subscription: "/subscription", settings: "/settings", support: "/support" };
    return (isAdmin ? adminPaths : restaurantPaths)[v] || (isAdmin ? "/admin" : "/dashboard");
  };

  const nav = (v: View, replace = false) => {
    setView(v);
    setMobileNav(false);
    setProfileMenu(false);
    if (typeof window !== "undefined") {
      const path = viewPath(v);
      if (window.location.pathname !== path) {
        if (replace) window.history.replaceState({ view: v }, "", path);
        else window.history.pushState({ view: v }, "", path);
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pathToView = (path: string): View => {
      const map: Record<string, View> = {
        "/": "dashboard", "/dashboard": "dashboard", "/pos": "pos", "/menu": "menu", "/inventory": "inventory", "/staff": "staff", "/expenses": "expenses", "/suppliers": "suppliers", "/subscription": "subscription", "/settings": "settings", "/support": "support",
        "/admin": "dashboard", "/admin/restaurants": "restaurants", "/admin/approvals": "approvals", "/admin/pricing": "pricing", "/admin/settings": "settings", "/admin/admins": "admins", "/admin/support": "support"
      };
      return map[path] || "dashboard";
    };
    const syncFromUrl = () => setView(pathToView(window.location.pathname));
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

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

  if (authUser && !roleHydrated) return <div className="auth-page">Loading workspace…</div>;

  if (!authUser)
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={login}>
          <div className="brand-symbol">✳</div>
          <h1>{typeof window !== "undefined" && window.location.pathname === "/admin-login" ? "Platform Admin Login" : "Welcome to RestoPulse"}</h1>
          <p>{typeof window !== "undefined" && window.location.pathname === "/admin-login" ? "Sign in with your platform administrator account." : "Sign in to your restaurant or platform account."}</p>
          <label>
            Email
            <input type="email" autoComplete="username" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          </label>
          <label>
            Password
            <div className="relative auth-password-field">
              <input type={showLoginPassword ? "text" : "password"} autoComplete="current-password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pr-10" />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showLoginPassword ? "Hide password" : "Show password"} onClick={() => setShowLoginPassword(v => !v)}>{showLoginPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
          </label>
          <button className="primary-btn" disabled={loginBusy}>
            {loginBusy ? "Signing in…" : "Sign in"}
          </button>
          {typeof window !== "undefined" && window.location.pathname !== "/admin-login" && <a href="/admin-login" className="text-center text-xs text-muted-foreground underline mt-1">Platform Admin login</a>}
          {typeof window !== "undefined" && window.location.pathname === "/admin-login" && <a href="/" className="text-center text-xs text-muted-foreground underline mt-1">Restaurant / employee login</a>}
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

  const activePlanPrice = activeInlinePlan ? Number(activeInlinePlan.price) || 0 : 0;
  const inlineUpiPayUri = `upi://pay?pa=${encodeURIComponent(subscriptionUpiId)}&pn=${encodeURIComponent("RestoPulse")}&am=${encodeURIComponent(activePlanPrice.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`${activeRestaurantName} ${activeInlinePlan?.name || 'Subscription'}`)}`;
  const inlineQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(inlineUpiPayUri)}`;

  const nowForMetrics = liveDate;
  const activeRenewalTime = activeRenewalDate && activeRenewalDate !== "—" ? new Date(`${activeRenewalDate}T23:59:59`).getTime() : NaN;
  const subscriptionExpired = !isAdmin && Number.isFinite(activeRenewalTime) && activeRenewalTime < nowForMetrics.getTime();
  const dayStart = new Date(nowForMetrics); dayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(dayStart); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
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
  const filteredExpenses = expenses.filter(e => {
    const q = expenseSearch.trim().toLowerCase(); const d = String(e.date || "").slice(0, 10);
    return (!q || `${e.name} ${e.vendor || ""} ${e.category || ""}`.toLowerCase().includes(q))
      && (expenseCategoryFilter === "All categories" || e.category === expenseCategoryFilter)
      && (!expenseStartDate || d >= expenseStartDate)
      && (!expenseEndDate || d <= expenseEndDate)
      && (!expenseStartDate || !expenseEndDate || expenseStartDate <= expenseEndDate);
  });
  const selectedExpenses = expenses.filter(e => inSelectedRange(`${e.date}T12:00:00`));
  const selectedWages = wages.filter(w => w.status === "Paid" && inSelectedRange(`${w.date}T12:00:00`));
  const netSales = selectedOrders.reduce((n, o) => n + (Number(o.bill?.subtotal) || 0) - (Number(o.bill?.discount) || 0), 0);
  const totalExpenses = selectedExpenses.reduce((n, x) => n + Number(x.amount || 0), 0);
  const paidWages = selectedWages.reduce((n, x) => n + Number(x.amount || 0), 0);
  const salesBetween = (from: Date, to?: Date) => paidOrders.filter(o => { const d = new Date(o.placedAt); return d >= from && (!to || d < to); }).reduce((n, o) => n + (Number(o.bill?.subtotal) || 0) - (Number(o.bill?.discount) || 0), 0);
  const todaySales = salesBetween(dayStart, new Date(dayStart.getTime() + 86400000));
  const weeklySales = salesBetween(weekStart, new Date(dayStart.getTime() + 86400000));
  const monthlySales = salesBetween(monthStart, new Date(dayStart.getTime() + 86400000));
  const lowStockCount = inventoryList.filter(x => x.onHand > 0 && x.onHand <= x.reorderLevel).length;
  const outOfStockCount = inventoryList.filter(x => x.onHand === 0).length;
  const restaurantNotifications = !isAdmin ? [
    ...(outOfStockCount > 0 ? [{ key: "out", title: `${outOfStockCount} item(s) out of stock`, detail: "Review inventory and restock immediately." }] : []),
    ...(lowStockCount > 0 ? [{ key: "low", title: `${lowStockCount} item(s) low in stock`, detail: "Inventory has reached the reorder level." }] : []),
    ...(wages.filter(w => w.status === "Unpaid").length > 0 ? [{ key: "wage", title: `${wages.filter(w => w.status === "Unpaid").length} unpaid wage record(s)`, detail: "Review employee payments." }] : []),
    ...(activeRenewalDate && activeRenewalDate !== "—" && new Date(activeRenewalDate).getTime() - nowForMetrics.getTime() <= 7 * 86400000 && new Date(activeRenewalDate).getTime() >= nowForMetrics.getTime() ? [{ key: "sub", title: "Subscription renewal is due soon", detail: `Renewal date: ${new Date(activeRenewalDate).toLocaleDateString("en-IN")}` }] : []),
  ] : [];
  const visibleRestaurantNotifications = restaurantNotifications.filter((n: any) => !readNotificationKeys.includes(n.key));
  const chartStart = new Date(selectedStart);
  const chartDays = Math.max(1, Math.min(31, Math.ceil((selectedEnd.getTime() - chartStart.getTime()) / 86400000)));
  const dynamicChart = Array.from({ length: chartDays }, (_, idx) => {
    const d = new Date(chartStart); d.setDate(chartStart.getDate() + idx);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    return {
      day: chartDays <= 7 ? d.toLocaleDateString("en-IN", { weekday: "short" }) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: paidOrders.filter(o => { const x = new Date(o.placedAt); return x >= d && x < next; }).reduce((n, o) => n + Number(o.bill?.subtotal || 0) - Number(o.bill?.discount || 0), 0),
      expense: expenses.filter(e => { const x = new Date(`${e.date}T12:00:00`); return x >= d && x < next; }).reduce((n, e) => n + Number(e.amount || 0), 0)
    };
  });

  const adminChart = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(dayStart); d.setDate(dayStart.getDate() - 6 + idx);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), revenue: subscriptionHistory.filter(x => x.status === "Approved").filter(x => { const t = new Date(x.reviewed_at || x.requested_at); return t >= d && t < next; }).reduce((n, x) => n + Number(x.amount || 0), 0), expense: 0 };
  });
  const subscriptionRevenue = subscriptionHistory.filter(x => x.status === "Approved").reduce((n, x) => {
    const amount = Number(x.amount || 0); const fallback = plans.find(p => p.name.toLowerCase() === String(x.plan || "").toLowerCase())?.price || 0;
    return n + (amount || fallback);
  }, 0);
  const activeSubscriptionCount = restaurants.filter((r: any) => ["Active", "Trial"].includes(r.status) && r.renewal && new Date(r.renewal) >= nowForMetrics).length;
  const expiredSubscriptionCount = restaurants.filter((r: any) => r.renewal && new Date(r.renewal) < nowForMetrics).length;

  const normalizedRole = (currentUserRole || "").toLowerCase();
  const currentEmployee = !isAdmin && normalizedRole !== "owner"
    ? (staff.find((person) => person.userId === authUser) || staff.find((person) => (person.email || "").toLowerCase() === (loginEmail || "").toLowerCase()))
    : undefined;
  const roleFallback: Record<string, string> = { cashier: "Staff", kitchen: "Storekeeper", manager: "Manager", owner: "Restaurant Owner", admin: "Platform Administrator" };
  const profileDisplayName = isAdmin
    ? (admins.find((a: any) => a.id === authUser)?.name || "Platform Admin")
    : (currentEmployee?.name || (normalizedRole !== "owner" ? (loginEmail || "Employee") : (activeRestaurantName || "Account")));
  const profileDisplayRole = isAdmin ? "Platform Administrator" : currentEmployee?.role || roleFallback[normalizedRole] || (normalizedRole ? normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1) : "Restaurant Owner");
  const profileInitials = (profileDisplayName || "Account").trim().split(/\s+/).slice(0, 2).map((part: string) => part[0] || "").join("").toUpperCase() || "AC";
  const isOwnerOrAdmin = normalizedRole === "owner" || normalizedRole === "admin" || normalizedRole === "restaurant owner" || normalizedRole === "restaurant_owner" || normalizedRole === "restaurant-owner" || !normalizedRole;
  
  const currentAdminRecord = isAdmin ? admins.find((a: any) => a.id === authUser) : null;
  const currentAdminPermissions: any = currentAdminRecord?.permissions || {};
  const visibleNavPlatform = isAdmin ? navPlatform.filter((item: any) => {
    if (item.id === "dashboard") return true;
    if (currentAdminRecord && admins[0]?.id === authUser) return true;
    return currentAdminPermissions[item.id] === true;
  }) : [];

  const visibleNavTenant = isAdmin
    ? []
    : navTenant.filter((item) => {
        // Subscription and Settings must remain visible to restaurant owners.
        if (isOwnerOrAdmin && (item.id === "subscription" || item.id === "settings")) return true;
        if (isOwnerOrAdmin) return true;
        if (item.id === "dashboard") return true;
        if (item.id === "support") return currentUserPermissions.support !== false;
        return currentUserPermissions[item.id] === true;
      });

  return (
    <div className="app-shell">
      <Toaster richColors position="top-right" />

      {/* PRINT LAYOUT */}
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
          {tr("WORKSPACE")} <ChevronDown size={14} />
        </div>
        <div
          className="store-selector relative cursor-pointer"
          onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
        >
          <span className="store-avatar">
            {profileInitials}
          </span>
          <div className="truncate">
            <b className="truncate block">{activeRestaurantName || tr("Select Workspace")}</b>
            <small>{accountRole === "admin" ? tr("Platform console") : tr("Restaurant")}</small>
          </div>
          <ChevronDown size={15} />

          {workspaceMenuOpen && restaurants.length > 0 && (
            <div
              className="absolute left-0 top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-2 z-50 shadow-2xl max-h-60 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] text-gray-400 font-bold px-2 py-1 uppercase">{tr("Switch Workspace")}</div>
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

        <div className="px-3 py-3">
          <label htmlFor="rp-language-select" className="block text-xs font-semibold mb-1">{tr("Language")}</label>
          <select id="rp-language-select" value={uiLanguage} onChange={(e) => changeUiLanguage(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2 text-sm">
            <option value="en">English</option><option value="ta">தமிழ் (Tamil)</option><option value="kn">ಕನ್ನಡ (Kannada)</option>
          </select>
        </div>

        {isAdmin && <div className="platform-workspace-label">
          <span className="store-avatar"><Building2 size={16}/></span>
          <div><b className="block">Platform Admin</b><small>RestoPulse console</small></div>
        </div>}

        {/* RESTAURANT NAVIGATION */}
        {!isAdmin && <><div className="nav-heading">{tr("RESTAURANT")}</div>
        <nav aria-label="Restaurant navigation">
          {visibleNavTenant.map((item) => (
            <button
              key={item.id}
              className={"nav-link " + (view === item.id ? "active" : "")}
              onClick={() => nav(item.id)}
            >
              <item.icon size={18} />
              {tr(item.label)}
              {item.id === "pos" && <span className="nav-key">⌘2</span>}
            </button>
          ))}
        </nav></>}

        {/* PLATFORM ADMIN NAVIGATION */}
        {isAdmin && (
          <>
            <div className="nav-heading admin-heading">PLATFORM ADMIN</div>
            <nav aria-label="Platform navigation">
              {visibleNavPlatform.map((item) => (
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

        {/* DYNAMIC ACTIVE PLAN CARD */}
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
            <span className="profile-avatar">{profileInitials}</span>
            <div>
              <b>{profileDisplayName}</b>
              <small>{profileDisplayRole}</small>
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
              {((isAdmin ? ((approvals.length + subscriptionRequests.length) > 0 && !readNotificationKeys.includes("admin-pending")) : visibleRestaurantNotifications.length > 0)) && <span className="notification-dot" />}
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
              {profileInitials}
            </button>
          </div>

          {profileMenu && (
            <div className="profile-popover">
              <div className="profile-popover-head">
                <b>{profileDisplayName}</b>
                <small>{profileDisplayRole}</small>
              </div>
              <button onClick={() => nav("settings")}>
                <Settings size={17} /> Account & settings
              </button>
              {isAdmin ? (
                <>
                  <button onClick={() => nav("admins")}>
                    <Users size={17} /> Admin managements
                  </button>
                  <button onClick={() => nav("support")}>
                    <Send size={17} /> Support & Help
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => nav("staff")}>
                    <Users size={17} /> Manage employees
                  </button>
                  <button onClick={() => { setProfileMenu(false); nav("support"); }}>
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
                <span>{isAdmin ? ((approvals.length + subscriptionRequests.length) && !readNotificationKeys.includes("admin-pending") ? approvals.length + subscriptionRequests.length : 0) : visibleRestaurantNotifications.length} new</span>
              </div>
              {isAdmin ? (
                (approvals.length + subscriptionRequests.length) > 0 && !readNotificationKeys.includes("admin-pending") ? (
                  <div className="p-2 space-y-2">
                    <button className="w-full text-left" onClick={() => { markNotificationRead("admin-pending"); nav("approvals"); }}>
                      <span className="notif-icon amber">◎</span><span><b>{approvals.length + subscriptionRequests.length} pending items</b><small>Review applications & proofs</small></span>
                    </button>
                    <button className="quiet-btn w-full text-xs" onClick={() => markNotificationRead("admin-pending")}>Mark as read</button>
                  </div>
                ) : <div className="p-3 text-xs text-muted-foreground">No new platform notifications.</div>
              ) : (
                visibleRestaurantNotifications.length ? visibleRestaurantNotifications.map((n: any) => (
                  <div key={n.key} className="p-2 border-b last:border-0">
                    <button className="w-full text-left flex items-start gap-2" onClick={() => { markNotificationRead(n.key); setNotifications(false); nav(n.key === "wage" ? "staff" : n.key === "sub" ? "subscription" : "inventory"); }}>
                      <span className="notif-icon amber">!</span><span><b>{n.title}</b><small>{n.detail}</small></span>
                    </button>
                    <button className="quiet-btn text-[11px] mt-1" onClick={() => markNotificationRead(n.key)}>Mark as read</button>
                  </div>
                )) : <div className="p-3 text-xs text-muted-foreground">No new notifications for this restaurant.</div>
              )}
            </div>
          )}
        </header>

        <main className="content">
          {/* 1. OVERVIEW DASHBOARD VIEW (BOTH RESTAURANT & ADMIN CONSOLES) */}
          {view === "dashboard" && (
            <>
              {isAdmin ? (
                /* PLATFORM ADMIN OVERVIEW */
                <div className="space-y-6">
                  <div className="page-head flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <div className="eyebrow">PLATFORM OVERVIEW</div>
                      <h1>Good afternoon, Platform Admin</h1>
                      <p>Platform-wide operations, subscription volume, and revenue metrics.</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="quiet-btn text-xs" onClick={() => nav("approvals")}>
                        <BadgeCheck size={14} /> Approvals ({approvals.length + subscriptionRequests.length})
                      </button>
                      <button className="primary-btn text-xs font-bold" onClick={() => nav("restaurants")}>
                        <Building2 size={14} /> Manage Restaurants
                      </button>
                    </div>
                  </div>

                  {/* 4 Admin Platform KPIs */}
                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <div className="kpi-top">
                        <span>Subscription revenue</span>
                        <span className="kpi-icon teal"><Wallet size={19} /></span>
                      </div>
                      <strong>{money(subscriptionRevenue)}</strong>
                      <div className="kpi-foot"><span>Approved subscription payments</span></div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-top">
                        <span>Active workspaces</span>
                        <span className="kpi-icon green"><Building2 size={19} /></span>
                      </div>
                      <strong>{activeSubscriptionCount}</strong>
                      <div className="kpi-foot"><span>Restaurants on active/trial plans</span></div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-top">
                        <span>Pending approvals</span>
                        <span className="kpi-icon amber"><BadgeCheck size={19} /></span>
                      </div>
                      <strong>{subscriptionRequests.length + approvals.length}</strong>
                      <div className="kpi-foot"><span>Onboarding & payment verifications</span></div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-top">
                        <span>Expired subscriptions</span>
                        <span className="kpi-icon violet"><Clock size={19} /></span>
                      </div>
                      <strong>{expiredSubscriptionCount}</strong>
                      <div className="kpi-foot"><span>Require renewal outreach</span></div>
                    </div>
                  </div>

                  {/* Admin Analytics: Subscription Trend + Registered Restaurants */}
                  <div className="analytics-grid">
                    <section className="panel chart-panel">
                      <div className="panel-header">
                        <div>
                          <h2>Platform subscription revenue</h2>
                          <p>7-day approved billing trend</p>
                        </div>
                      </div>
                      <div className="chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={adminChart} margin={{ top: 15, right: 8, left: -17, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--chart-grid)" />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} dy={12} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12 }} />
                            <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.25} fill="#f59e0b" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </section>

                    <section className="panel top-dishes">
                      <div className="panel-header">
                        <div>
                          <h2>Registered restaurants</h2>
                          <p>Latest active workspaces</p>
                        </div>
                        <button className="quiet-btn text-xs" onClick={() => nav("restaurants")}>View all</button>
                      </div>
                      <div className="space-y-2 mt-2">
                        {restaurants.slice(0, 5).map((r: any, i: number) => (
                          <div className="leader-row" key={r.id}>
                            <span className="leader-rank">0{i + 1}</span>
                            <span className="dish-thumb flex items-center justify-center font-bold text-xs bg-muted">
                              {r.initial || (r.name ? r.name.slice(0, 2).toUpperCase() : "RS")}
                            </span>
                            <div className="leader-info">
                              <b>{r.name}</b>
                              <small>{r.owner} · {r.city || "India"}</small>
                            </div>
                            <span className={"status " + (r.status === "Active" ? "paid" : "trial")}>
                              {r.plan || "Free trial"}
                            </span>
                          </div>
                        ))}
                        {!restaurants.length && (
                          <div className="text-center py-8 text-xs text-muted-foreground">No restaurants registered yet.</div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              ) : (
                /* RESTAURANT OWNER OVERVIEW */
                <div className="space-y-6">
                  <div className="page-head flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <div className="eyebrow">OVERVIEW</div>
                      <h1>Good afternoon, {activeRestaurantName || "Owner"}</h1>
                      <p>Operational snapshot and financial health for {activeRestaurantName || "your workspace"}.</p>
                    </div>
                    <div className="head-actions flex flex-wrap items-center gap-2">
                      <select aria-label="Date range" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-background border rounded-lg text-xs p-2">
                        <option>Today</option>
                        <option>Yesterday</option>
                        <option>This week</option>
                        <option>This month</option>
                        <option>Custom</option>
                      </select>
                      {dateRange === "Custom" && (
                        <div className="flex items-center gap-1">
                          <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-background border rounded-lg text-xs p-1.5" />
                          <span className="text-xs text-muted-foreground">to</span>
                          <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-background border rounded-lg text-xs p-1.5" />
                        </div>
                      )}
                      <button className="primary-btn flex items-center gap-1.5 font-bold" onClick={() => nav("pos")}>
                        <Plus size={16} /> New order
                      </button>
                    </div>
                  </div>

                  {/* Expired Subscription Banner if active */}
                  {subscriptionExpired && (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <div>
                          <b className="text-red-600 block text-sm">Subscription Expired ({activeRenewalDate})</b>
                          <p className="text-xs text-muted-foreground">Renew your plan to maintain full access to POS and management terminals.</p>
                        </div>
                      </div>
                      <button className="primary-btn text-xs font-bold shrink-0" onClick={() => nav("subscription")}>
                        Renew Plan
                      </button>
                    </div>
                  )}

                  {/* 4 Core Financial KPIs */}
                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <div className="kpi-top">
                        <span>Gross sales</span>
                        <span className="kpi-icon amber"><Wallet size={19} /></span>
                      </div>
                      <strong>{money(selectedOrders.reduce((n, o) => n + Number(o.bill?.subtotal || 0), 0))}</strong>
                      <div className="kpi-foot"><span>{dateRange} registered sales</span></div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-top">
                        <span>Net revenue</span>
                        <span className="kpi-icon teal"><ArrowUpRight size={19} /></span>
                      </div>
                      <strong>{money(netSales)}</strong>
                      <div className="kpi-foot"><span>Paid sales, excluding tax</span></div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-top">
                        <span>Operating expenses</span>
                        <span className="kpi-icon violet"><ReceiptText size={19} /></span>
                      </div>
                      <strong>{money(totalExpenses + paidWages)}</strong>
                      <div className="kpi-foot"><span>Expenses + paid wages</span></div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-top">
                        <span>Real net profit</span>
                        <span className="kpi-icon green"><ArrowUpRight size={19} /></span>
                      </div>
                      <strong>{money(netSales - totalExpenses - paidWages)}</strong>
                      <div className="kpi-foot"><span>Net sales − operating costs</span></div>
                    </div>
                  </div>

                  {/* Operational Summary Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 border rounded-xl bg-card">
                      <small className="text-muted-foreground block text-[11px]">Today Sales</small>
                      <b className="text-sm">{money(todaySales)}</b>
                    </div>
                    <div className="p-3 border rounded-xl bg-card">
                      <small className="text-muted-foreground block text-[11px]">Weekly Sales</small>
                      <b className="text-sm">{money(weeklySales)}</b>
                    </div>
                    <div className="p-3 border rounded-xl bg-card">
                      <small className="text-muted-foreground block text-[11px]">Monthly Sales</small>
                      <b className="text-sm">{money(monthlySales)}</b>
                    </div>
                    <div className="p-3 border rounded-xl bg-card">
                      <small className="text-muted-foreground block text-[11px]">Stock Status</small>
                      <b className={`text-sm ${outOfStockCount > 0 ? "text-red-600" : lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {outOfStockCount > 0 ? `${outOfStockCount} Out of stock` : lowStockCount > 0 ? `${lowStockCount} Low stock` : "In stock"}
                      </b>
                    </div>
                  </div>

                  {/* Restaurant Analytics: Trend Chart + Top Dishes */}
                  <div className="analytics-grid">
                    <section className="panel chart-panel">
                      <div className="panel-header">
                        <div>
                          <h2>Revenue & expenses</h2>
                          <p>{dateRange} financial trend</p>
                        </div>
                      </div>
                      <div className="chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dynamicChart} margin={{ top: 15, right: 8, left: -17, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--chart-grid)" />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} dy={12} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12 }} />
                            <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.25} fill="#f59e0b" />
                            <Area type="monotone" dataKey="expense" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </section>

                    <section className="panel top-dishes">
                      <div className="panel-header">
                        <div>
                          <h2>Top performing dishes</h2>
                          <p>Popular catalog items</p>
                        </div>
                        <button className="quiet-btn text-xs" onClick={() => nav("menu")}>View menu</button>
                      </div>
                      <div className="space-y-2 mt-2">
                        {dishes.slice(0, 4).map((d, i) => (
                          <div className="leader-row" key={d.id}>
                            <span className="leader-rank">0{i + 1}</span>
                            <span className="dish-thumb overflow-hidden flex items-center justify-center">
                              {d.imageUrl ? (
                                <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                d.emoji
                              )}
                            </span>
                            <div className="leader-info">
                              <b>{d.name}</b>
                              <small>{d.category} · {d.diet || "Standard"}</small>
                            </div>
                            <strong>{money(d.price)}</strong>
                          </div>
                        ))}
                        {!dishes.length && (
                          <div className="text-center py-8 text-xs text-muted-foreground">No dishes added yet.</div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}
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
                        {(["58mm", "85mm", "A4"] as const).map((sz) => (
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

          {/* 3. MENU & DISHES */}
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
                  ["Available stock", inventoryList.reduce((n, x) => n + Number(x.onHand || 0), 0), "units on hand"],
                  ["Stock value", money(inventoryList.reduce((n, x) => n + Number(x.onHand || 0) * Number(x.cost || 0), 0)), "based on recorded cost"],
                  ["Low stock", inventoryList.filter(x => x.onHand > 0 && x.onHand <= x.reorderLevel).length, "reorder attention"],
                  ["Out of stock", inventoryList.filter(x => x.onHand === 0).length, "needs replenishment"],
                ].map(([label, value, note]) => <div className="kpi-card" key={String(label)}><div className="kpi-top"><span>{label}</span><span className="kpi-icon teal"><Package size={19}/></span></div><strong>{String(value)}</strong><div className="kpi-foot"><span>{note}</span></div></div>)}
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
                      {inventoryTransactions.map((tx: any) => {
                        const change = Number(tx.change_quantity || 0);
                        return <tr key={tx.id}>
                          <td className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                          <td className="strong">{inventoryList.find(i => i.id === tx.inventory_item_id)?.name || "Inventory item"}</td>
                          <td><span className={`history-type-badge ${change >= 0 ? "in" : "out"}`}>{tx.transaction_type}</span></td>
                          <td className={`text-right font-bold ${change >= 0 ? "text-emerald-600" : "text-red-600"}`}>{change >= 0 ? "+" : ""}{tx.change_quantity}</td>
                          <td className="text-right text-xs font-semibold">{tx.previous_quantity} → {tx.new_quantity}</td>
                        </tr>
                      })}
                      {!inventoryTransactions.length && <tr><td colSpan={5} className="text-center py-8 text-xs text-muted-foreground">No inventory movements recorded yet.</td></tr>}
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
                            onClick={async () => { if (!tenantId || !confirm("Delete this employee?")) return; const { error } = await db.from("employees").delete().eq("restaurant_id", tenantId).eq("id", s.id); if (error) { toast.error(error.message); return; } setStaff(old => old.filter(x => x.id !== s.id)); }}
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
                <div className="p-4 border-b space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Quick range:</span>
                    {[{label:"Today",days:0},{label:"Last 7 days",days:7},{label:"Last 30 days",days:30},{label:"This month",days:-1},{label:"Last month",days:-2}].map((range) => <button key={range.label} type="button" className="quiet-btn text-xs px-3 py-1.5" onClick={() => {
                      const now = new Date(); const end = new Date(now); let start = new Date(now);
                      if (range.days === -1) { start = new Date(now.getFullYear(), now.getMonth(), 1); }
                      else if (range.days === -2) { start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end.setDate(0); }
                      else { start.setDate(now.getDate() - range.days); }
                      const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                      setExpenseStartDate(fmt(start)); setExpenseEndDate(fmt(end));
                    }}>{range.label}</button>)}
                    <button type="button" className="quiet-btn text-xs px-3 py-1.5" onClick={() => { setExpenseStartDate(""); setExpenseEndDate(""); setExpenseSearch(""); setExpenseCategoryFilter("All categories"); }}>Clear filters</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input value={expenseSearch} onChange={e => setExpenseSearch(e.target.value)} placeholder="Search description or vendor" className="w-full p-2 border rounded-lg bg-background text-xs" />
                    <select value={expenseCategoryFilter} onChange={e => setExpenseCategoryFilter(e.target.value)} className="w-full p-2 border rounded-lg bg-background text-xs">
                      <option>All categories</option>
                      {[...new Set(expenses.map(e => e.category).filter(Boolean))].sort().map(c => <option key={c}>{c}</option>)}
                    </select>
                    <label className="text-xs text-muted-foreground">From date <input type="date" max={expenseEndDate || undefined} value={expenseStartDate} onChange={e => setExpenseStartDate(e.target.value)} className="block w-full p-2 border rounded-lg bg-background text-xs" /></label>
                    <label className="text-xs text-muted-foreground">To date <input type="date" min={expenseStartDate || undefined} value={expenseEndDate} onChange={e => setExpenseEndDate(e.target.value)} className="block w-full p-2 border rounded-lg bg-background text-xs" /></label>
                  </div>
                  {expenseStartDate && expenseEndDate && expenseStartDate > expenseEndDate && <p className="text-xs text-red-600">The start date must be on or before the end date.</p>}
                </div>
                <div className="table-scroll">
                  <table className="enhanced-data-table">
                    <thead>
                      <tr><th>DATE</th><th>DESCRIPTION</th><th>CATEGORY</th><th>VENDOR</th><th className="text-right">AMOUNT</th></tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((e) => (
                        <tr key={e.id}>
                          <td className="text-xs text-muted-foreground">{new Date(`${e.date}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                          <td className="strong">{e.name}</td>
                          <td><span className="data-badge">{e.category}</span></td>
                          <td>{e.vendor || "—"}</td>
                          <td className="strong text-right">{money(e.amount)}</td>
                        </tr>
                      ))}
                      {!filteredExpenses.length && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
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
                  <input value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} placeholder="Search supplier or contact" className="w-full p-2 border rounded-lg bg-background text-xs" />
                  <select value={supplierActivityFilter} onChange={e => setSupplierActivityFilter(e.target.value)} className="w-full p-2 border rounded-lg bg-background text-xs">
                    <option>All suppliers</option><option>With transactions</option><option>No transactions</option>
                  </select>
                  {suppliers.filter(sp => {
                    const q = supplierSearch.trim().toLowerCase();
                    const matchesSearch = !q || `${sp.name} ${sp.contact || ""} ${sp.phone || ""} ${sp.email || ""}`.toLowerCase().includes(q);
                    const hasTransactions = expenses.some(e => e.supplierId === sp.id) || supplierPayments.some(p => p.supplierId === sp.id);
                    return matchesSearch && (supplierActivityFilter === "All suppliers" || (supplierActivityFilter === "With transactions" ? hasTransactions : !hasTransactions));
                  }).map((sp) => (
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
                  {!suppliers.filter(sp => { const q = supplierSearch.trim().toLowerCase(); const matchesSearch = !q || `${sp.name} ${sp.contact || ""} ${sp.phone || ""} ${sp.email || ""}`.toLowerCase().includes(q); const hasTransactions = expenses.some(e => e.supplierId === sp.id) || supplierPayments.some(p => p.supplierId === sp.id); return matchesSearch && (supplierActivityFilter === "All suppliers" || (supplierActivityFilter === "With transactions" ? hasTransactions : !hasTransactions)); }).length && <div className="text-xs text-muted-foreground py-4">No suppliers match these filters.</div>}
                </div>

                <div className="panel p-4 border rounded-xl bg-card md:col-span-2">
                  {(() => {
                    const selected = suppliers.find(sp => sp.id === supplierDetail);
                    const supplierExpenses = selected ? expenses.filter(e => e.supplierId === selected.id) : [];
                    const supplierPaymentsForHistory = selected ? supplierPayments.filter(p => p.supplierId === selected.id) : [];
                    const transactions = [
                      ...supplierExpenses.map(e => ({ id: `expense-${e.id}`, date: e.date, type: "Purchase / Expense", description: e.name, amount: Number(e.amount || 0), method: e.vendor || "—" })),
                      ...supplierPaymentsForHistory.map(p => ({ id: `payment-${p.id}`, date: p.date, type: "Payment", description: p.note || "Supplier payment", amount: Number(p.amount || 0), method: p.method || "—" })),
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    const purchases = supplierExpenses.reduce((n, e) => n + Number(e.amount || 0), 0);
                    const payments = supplierPaymentsForHistory.reduce((n, p) => n + Number(p.amount || 0), 0);
                    return selected ? (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div><h2 className="text-sm font-bold">{selected.name}</h2><p className="text-[11px] text-muted-foreground">{selected.contact || ""} {selected.phone ? `· ${selected.phone}` : ""}</p></div>
                          <div className="text-right text-[11px]"><div>Purchases <b>{money(purchases)}</b></div><div>Payments <b>{money(payments)}</b></div><div>Balance <b>{money(purchases - payments)}</b></div></div>
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

          {/* 8. RESTAURANT SUBSCRIPTION */}
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
                  ["Payment history", String(subscriptionHistory.filter(x => x.restaurant_id === tenantId).length)],
                ].map(([label, value]) => <div className="kpi-card" key={String(label)}><div className="kpi-top"><span>{label}</span><span className="kpi-icon teal"><CreditCard size={18}/></span></div><strong className="text-lg">{String(value)}</strong><div className="kpi-foot"><span>Restaurant subscription</span></div></div>)}
              </div>
              <div className="panel p-4 mb-6">
                <div className="panel-header"><div><h2>Subscription history</h2><p>Payment and approval requests for this restaurant</p></div></div>
                <div className="space-y-2">
                  {subscriptionHistory.filter(x => x.restaurant_id === tenantId).slice(0, 6).map((x: any) => <div key={x.id} className="flex justify-between items-center border-b py-2 text-xs"><span><b>{x.plan}</b><span className="text-muted-foreground ml-2">{new Date(x.requested_at).toLocaleDateString("en-IN")}</span></span><span className="font-semibold">{x.status} · {money(Number(x.amount) || 0)}</span></div>)}
                  {!subscriptionHistory.filter(x => x.restaurant_id === tenantId).length && <div className="text-xs text-muted-foreground py-3">No subscription requests yet.</div>}
                </div>
              </div>

              {/* Grid of Plans */}
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
                <div className="panel max-w-md mx-auto rounded-2xl p-6 border text-center shadow-lg my-8">
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

          {/* SUPPORT & HELP */}
          {view === "support" && !isAdmin && (
            <div className="page-head">
              <div className="eyebrow">HELP & SUPPORT</div>
              <h1>Support & Help</h1>
              <p>Contact the RestoPulse support team for billing, technical, and restaurant operations assistance.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                {(supportSections.filter((x: any) => x.active !== false).length ? supportSections.filter((x: any) => x.active !== false) : [{ id: "default-support", title: "RestoPulse Support & Help", description: "Contact us for billing, technical, and restaurant operations assistance.", phone: "8122187039", whatsapp: "8122187039", email: "hosurwebservices@gmail.com", active: true }]).map((section: any) => (
                  <section key={section.id} className="panel p-6 border rounded-2xl bg-card space-y-4">
                    <h2 className="text-lg font-bold">{section.title || "Support & Help"}</h2>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                    {section.phone && <div className="flex items-center justify-between gap-3 border rounded-xl p-3"><span className="text-sm font-semibold">Support Phone</span><a className="font-bold text-indigo-600" href={`tel:${String(section.phone).replace(/\s+/g, "")}`}>{section.phone}</a></div>}
                    {section.email && <div className="flex items-center justify-between gap-3 border rounded-xl p-3"><span className="text-sm font-semibold">Support Email</span><a className="font-bold text-indigo-600 break-all" href={`mailto:${section.email}`}>{section.email}</a></div>}
                    {section.whatsapp && <a className="primary-btn inline-flex" href={`https://wa.me/${String(section.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp Support</a>}
                  </section>
                ))}
                {!supportSections.filter((x: any) => x.active !== false).length && <div className="panel p-6 border rounded-2xl text-sm text-muted-foreground">Support contact information is not configured yet.</div>}
              </div>
            </div>
          )}

          {/* 9. SETTINGS WITH SAFE DATABASE PERSISTENCE */}
          {view === "settings" && (
            <>
              {isAdmin ? (
                AdminSettingsPanel()
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
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2 pr-10 border rounded-lg text-xs bg-background"
                      />
                      <button type="button" className="text-muted-foreground" aria-label={showNewPassword ? "Hide password" : "Show password"} onClick={() => setShowNewPassword(v => !v)}>{showNewPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Confirm New Password</span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2 pr-10 border rounded-lg text-xs bg-background"
                      />
                      <button type="button" className="text-muted-foreground" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword(v => !v)}>{showConfirmPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
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
                <button className="primary-btn flex items-center gap-1.5" onClick={() => { setEditing(null); setForm({ name: "", owner: "", email: "", phone: "", city: "", password: "" }); setModal("restaurant"); }}>
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
                            <button className="quiet-btn text-xs" title="Edit restaurant" onClick={() => { setEditing(r.id); setForm({ name: r.name, owner: r.owner, email: r.email, phone: r.phone, city: r.city || "", plan: r.plan || "Free Trial", status: r.status || "Active", renewal: r.renewal || "" }); setModal("restaurant"); }}><Pencil size={13}/></button>
                            <button className="quiet-btn text-xs" title="Extend subscription" onClick={() => { setEditing(r.id); setForm({ days: "30" }); setModal("extend"); }}><Clock size={13}/></button>
                            <button className="quiet-btn text-xs text-red-600" title="Deactivate restaurant" onClick={async () => { if (!confirm("Deactivate this restaurant?")) return; const res = await authedFetch("/api/admin/restaurants", { method: "DELETE", body: JSON.stringify({ id: r.id }) }); const j = await res.json(); if (!res.ok) { toast.error(j.error || "Failed"); return; } fetchAllRestaurants(); toast.success("Restaurant deactivated"); }}><Trash2 size={13}/></button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ADMIN: MANAGE ADMINS */}
          {view === "admins" && (
            <>
              <div className="page-head flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div><div className="eyebrow">PLATFORM ADMINISTRATION</div><h1>Manage Admins</h1><p>Add, edit, or remove platform administrators.</p></div>
                <button className="primary-btn flex items-center gap-1.5" onClick={() => { setEditingAdminId(null); setAdminForm({ name: "", email: "", password: "", permissions: defaultAdminPermissions }); setModal("admin"); }}><Plus size={16}/> Add new admin</button>
              </div>
              <div className="panel management-panel mt-6">
                <div className="table-scroll"><table><thead><tr><th>ADMIN</th><th>EMAIL</th><th>CREATED</th><th>ACTIONS</th></tr></thead>
                <tbody>{admins.map((a: any) => <tr key={a.id}><td><b>{a.name}</b></td><td>{a.email}</td><td>{a.created_at ? new Date(a.created_at).toLocaleDateString("en-IN") : "—"}</td><td><div className="flex gap-1.5">
                  <button className="quiet-btn text-xs" title="Edit admin" onClick={() => { setEditingAdminId(a.id); setAdminForm({ name: a.name || "", email: a.email || "", password: "", permissions: { restaurants: true, approvals: true, pricing: true, settings: true, admins: false, ...(a.permissions || {}) } }); setModal("admin"); }}><Pencil size={13}/></button>
                  <button className="quiet-btn text-xs text-red-600" title="Remove admin" onClick={async () => { if (!confirm(`Remove ${a.name || a.email} from platform admins?`)) return; const res = await authedFetch("/api/admin/admins", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id }) }); const j = await res.json(); if (!res.ok) { toast.error(j.error || "Could not remove admin"); return; } await fetchAdmins(); toast.success("Admin access removed"); }}><Trash2 size={13}/></button>
                </div></td></tr>)}
                {!admins.length && <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No platform admins found.</td></tr>}</tbody></table></div>
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

          {/* 12. ADMIN: PRICING PLANS */}
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

      <Dialog open={modal === "extend"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Extend Subscription</DialogTitle><DialogDescription>Extend the selected restaurant's current subscription without changing its plan.</DialogDescription></DialogHeader>
          <div className="modal-fields">
            <label>Extension period<select value={form.days || "30"} onChange={e => setForm({ ...form, days: e.target.value })}>
              <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="180">180 days</option><option value="365">365 days</option>
            </select></label>
            <label>Or set a custom subscription end date<input type="date" value={form.renewal_on || ""} onChange={e => setForm({ ...form, renewal_on: e.target.value })} /></label>
            <p className="text-xs text-muted-foreground">Choose a custom date to override the preset extension period.</p>
          </div>
          <DialogFooter><button className="quiet-btn" onClick={() => setModal(null)}>Cancel</button><button className="primary-btn" onClick={save}>Extend subscription</button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "admin"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingAdminId ? "Edit Admin" : "Add New Admin"}</DialogTitle><DialogDescription>Manage platform administrator access.</DialogDescription></DialogHeader>
          <div className="modal-fields">
            <label>Admin name<input value={adminForm.name} onChange={e => setAdminForm({ ...adminForm, name: e.target.value })} /></label>
            <label>Admin email<input type="email" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} /></label>
            <label>Reset password {editingAdminId ? "(enter a new password; leave blank to keep current)" : "(optional)"}<div className="relative"><input type={showAdminPassword ? "text" : "password"} minLength={12} placeholder="Minimum 12 characters" value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} className="pr-10" /><button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" aria-label={showAdminPassword ? "Hide password" : "Show password"} onClick={() => setShowAdminPassword(v => !v)}>{showAdminPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div></label>
            <div className="border rounded-xl p-3 space-y-2"><b className="text-xs">Section access</b>{([['restaurants', 'Restaurants'], ['approvals', 'Approvals'], ['pricing', 'Pricing plans'], ['settings', 'Settings'], ['support', 'Support & Help'], ['admins', 'Manage admins']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!(adminForm.permissions as any)[key]} onChange={e => setAdminForm({ ...adminForm, permissions: { ...adminForm.permissions, [key]: e.target.checked } })} />{label}</label>)}</div>
          </div>
          <DialogFooter><button className="quiet-btn" onClick={() => setModal(null)}>Cancel</button><button className="primary-btn" onClick={save}>{editingAdminId ? "Save changes" : "Add admin"}</button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "restaurant"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="modal-content">
          <DialogHeader><DialogTitle>{editing ? "Edit Restaurant" : "Add Restaurant"}</DialogTitle><DialogDescription>Manage the platform restaurant account without changing the existing console style.</DialogDescription></DialogHeader>
          <div className="modal-fields">
            <label>Restaurant name<input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
            <label>Owner name<input value={form.owner || ""} onChange={e => setForm({ ...form, owner: e.target.value })} /></label>
            <label>Owner email<input type="email" disabled={editing !== null} value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
            <label>Owner phone<input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
            <label>City<input value={form.city || ""} onChange={e => setForm({ ...form, city: e.target.value })} /></label>
            {!editing && <label>Temporary password<div className="relative"><input type={showRestaurantPassword ? "text" : "password"} minLength={12} placeholder="Minimum 12 characters" value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} className="pr-10" /><button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" aria-label={showRestaurantPassword ? "Hide password" : "Show password"} onClick={() => setShowRestaurantPassword(v => !v)}>{showRestaurantPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div></label>}
            {editing && <><label>Plan<select value={form.plan || "Free Trial"} onChange={e => setForm({ ...form, plan: e.target.value })}>{plans.map(x => <option key={x.id}>{x.name}</option>)}</select></label><label>Status<select value={form.status || "Active"} onChange={e => setForm({ ...form, status: e.target.value })}><option>Trial</option><option>Active</option><option>Paused</option></select></label><label>Renewal date<input type="date" value={form.renewal === "—" ? "" : form.renewal || ""} onChange={e => setForm({ ...form, renewal: e.target.value })} /></label></>}
          </div>
          <DialogFooter><button className="quiet-btn" onClick={() => setModal(null)}>Cancel</button><button className="primary-btn" onClick={save}>{editing ? "Save changes" : "Create restaurant"}</button></DialogFooter>
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

            <div className="border rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold">Required access</div>
              <p className="text-[11px] text-muted-foreground">Select only the modules this employee needs. Owner retains full access.</p>
              <div className="grid grid-cols-2 gap-2">
                {([["overview","Overview"],["pos","POS"],["menu","Menu"],["inventory","Inventory"],["staff","Team & payroll"],["expenses","Expenses"],["suppliers","Suppliers"],["subscription","Subscription"],["settings","Settings"]] as const).map(([key,label]) => {
                  const perms = (() => { try { const p = form.permissions ? JSON.parse(form.permissions) : {}; return p && typeof p === "object" ? p : {}; } catch { return {}; } })();
                  return <label key={key} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={perms[key] === true} onChange={e => setForm({ ...form, permissions: JSON.stringify({ ...perms, [key]: e.target.checked }) })} />{label}</label>;
                })}
              </div>
            </div>

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

            <label className="block space-y-1">
              <span className="font-semibold text-muted-foreground">Login password {editing ? "(leave blank to keep existing)" : ""}</span>
              <div className="relative"><input type={showEmployeePassword ? "text" : "password"} value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 12 characters" className="w-full p-2 pr-10 border rounded-lg bg-background" /><button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showEmployeePassword ? "Hide password" : "Show password"} onClick={() => setShowEmployeePassword(v => !v)}>{showEmployeePassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div>
              <span className="text-[11px] text-muted-foreground">The employee signs in with the email above and receives only the selected designation's permissions.</span>
            </label>

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
                <label>Phone<input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>Status<select value={form.active || "true"} onChange={(e) => setForm({ ...form, active: e.target.value })}><option value="true">Active</option><option value="false">Inactive</option></select></label>
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
                    const { data, error } = await db.from("daily_wages").insert({
                      restaurant_id: tenantId, employee_id: selectedStaff.id, wage_date: wageForm.date,
                      amount: Number(wageForm.amount), status: "Unpaid", note: "Wage"
                    }).select().single();
                    if (error) { toast.error(error.message); return; }
                    setWages(old => [{ id: data.id, staffId: data.employee_id, date: data.wage_date, amount: Number(data.amount), status: data.status, note: data.note }, ...old]);
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
                  <label className="space-y-1"><span>Week start</span><input type="date" value={weeklyPaymentForm.start} onChange={e => setWeeklyPaymentForm(v => ({ ...v, start: e.target.value }))} className="w-full p-1.5 border rounded" /></label>
                  <label className="space-y-1"><span>Week end</span><input type="date" value={weeklyPaymentForm.end} onChange={e => setWeeklyPaymentForm(v => ({ ...v, end: e.target.value }))} className="w-full p-1.5 border rounded" /></label>
                </div>
                {(() => {
                  const start = weeklyPaymentForm.start ? new Date(`${weeklyPaymentForm.start}T00:00:00`) : null;
                  const end = weeklyPaymentForm.end ? new Date(`${weeklyPaymentForm.end}T23:59:59`) : null;
                  const weekRows = start && end ? wages.filter(w => w.staffId === selectedStaff.id && w.status === "Unpaid" && new Date(`${w.date}T12:00:00`) >= start && new Date(`${w.date}T12:00:00`) <= end) : [];
                  const weeklySalary = Number(selectedStaff.weeklySalary || 0);
                  const isWeeklySalary = selectedStaff.payType === "Weekly";
                  const total = weekRows.reduce((n, w) => n + Number(w.amount || 0), 0);
                  const payable = isWeeklySalary && weeklySalary > 0 && !weekRows.length ? weeklySalary : total;
                  return <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2"><span>{isWeeklySalary ? `Weekly salary · ${money(weeklySalary)}` : `${weekRows.length} unpaid record(s) · ${money(total)}`}</span><span className="font-bold text-foreground">Payable: {money(payable)}</span></div>
                    <button className="primary-btn w-full" disabled={!tenantId || !end || !payable} onClick={async () => {
                      if (!tenantId || !payable || !weeklyPaymentForm.end) return;
                      if (isWeeklySalary && !weekRows.length) {
                        const { data, error } = await db.from("daily_wages").insert({ restaurant_id: tenantId, employee_id: selectedStaff.id, wage_date: weeklyPaymentForm.end, amount: weeklySalary, status: "Paid", note: "Weekly salary" }).select().single();
                        if (error) { toast.error(error.message); return; }
                        setWages(old => [{ id: data.id, staffId: data.employee_id, date: data.wage_date, amount: Number(data.amount), status: data.status, note: data.note }, ...old]);
                        toast.success(`Weekly salary paid · ${money(weeklySalary)}`);
                      } else {
                        const ids = weekRows.map(w => w.id);
                        const { error } = await db.from("daily_wages").update({ status: "Paid", note: "Weekly payment" }).eq("restaurant_id", tenantId).in("id", ids);
                        if (error) { toast.error(error.message); return; }
                        setWages(old => old.map(w => ids.includes(w.id) ? { ...w, status: "Paid", note: "Weekly payment" } : w));
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
                            if (!tenantId) return;
                            const next = w.status === "Paid" ? "Unpaid" : "Paid";
                            const { error } = await db.from("daily_wages").update({ status: next }).eq("restaurant_id", tenantId).eq("id", w.id);
                            if (error) { toast.error(error.message); return; }
                            setWages(old => old.map(item => item.id === w.id ? { ...item, status: next } : item));
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
                {orders.map((sale) => (
                  <tr key={sale.id} className="border-b">
                    <td className="p-2 font-mono">{sale.bill.id}</td>
                    <td className="p-2">{sale.bill.issuedAt}</td>
                    <td className="p-2">{sale.bill.items.reduce((n, x) => n + x.qty, 0)} item(s)</td>
                    <td className="p-2">{sale.bill.payment}</td>
                    <td className="p-2 text-right font-bold">{money(sale.bill.total)}</td>
                    <td className="p-2 text-right"><button className="quiet-btn text-xs" onClick={() => setReceipt(sale.bill)}>View receipt</button></td>
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

          {/* Paper Size Format Selector (58mm, 85mm, A4) */}
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
