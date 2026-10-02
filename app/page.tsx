"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  AlertTriangle,
  KeyRound,
  RefreshCw,
  Clock,
  X,
  TrendingDown,
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
  costPerUnit: number;
  reorderLevel: number;
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
  payType: "Monthly" | "Daily";
  monthlySalary: number;
  dailyRate: number;
  email: string;
  phone: string;
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

const defaultDishes: Dish[] = [
  { id: 1, name: "Burrata & Heirloom Tomato", category: "Appetizers", price: 520, cost: 210, stock: true, emoji: "🍅", diet: "Vegetarian", time: 12 },
  { id: 2, name: "Grilled Salmon Bowl", category: "Mains", price: 790, cost: 330, stock: true, emoji: "🥗", diet: "Gluten-free", time: 18 },
  { id: 3, name: "Dark Chocolate Fondant", category: "Desserts", price: 390, cost: 130, stock: true, emoji: "🍫", diet: "Vegetarian", time: 14 },
  { id: 4, name: "Truffle Mushroom Risotto", category: "Mains", price: 680, cost: 240, stock: true, emoji: "🍄", diet: "Vegetarian", time: 22 },
  { id: 5, name: "Smoked Chicken Tacos", category: "Mains", price: 560, cost: 185, stock: true, emoji: "🌮", diet: "", time: 16 },
  { id: 6, name: "Citrus Mint Cooler", category: "Drinks", price: 240, cost: 65, stock: true, emoji: "🍹", diet: "Vegan", time: 5 },
  { id: 7, name: "Crispy Calamari", category: "Appetizers", price: 490, cost: 210, stock: false, emoji: "🍤", diet: "", time: 15 },
  { id: 8, name: "Margherita Flatbread", category: "Mains", price: 470, cost: 155, stock: true, emoji: "🍕", diet: "Vegetarian", time: 17 },
];

const defaultPlans: Plan[] = [
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

  // Persistent Selected Tenant Locking
  const [tenantId, setTenantId] = useState<string | null>(null);
  const tenantIdRef = useRef<string | null>(null);
  tenantIdRef.current = tenantId;

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("owner");

  // Dynamic Workspace Identity
  const [activePlanName, setActivePlanName] = useState<string>("Monthly");
  const [activeRenewalDate, setActiveRenewalDate] = useState<string>("—");
  const [activeRestaurantName, setActiveRestaurantName] = useState<string>("");

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
  const [dark, setDark] = useState(false);
  const [notifications, setNotifications] = useState(false);

  // Scoped Data Collections
  const [dishes, setDishes] = useState<Dish[]>(defaultDishes);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [wages, setWages] = useState<Wage[]>([]);
  const [wageForm, setWageForm] = useState({ date: new Date().toLocaleDateString("en-CA"), amount: "", note: "" });
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: "sp-1", name: "Green Acres Co.", contact: "Vikram Shah", phone: "+91 98765 00001", email: "vikram@greenacres.in" },
    { id: "sp-2", name: "ProChef Supplies", contact: "Sunita Roy", phone: "+91 98765 00002", email: "sunita@prochef.in" },
  ]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [supplierDetail, setSupplierDetail] = useState<string | null>("sp-1");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Sale[]>([]);

  // Inventory Management State
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([
    { id: 1, name: "Basmati Rice", category: "Grains", onHand: 12, unit: "bags", costPerUnit: 1400, reorderLevel: 5 },
    { id: 2, name: "Refined Cooking Oil", category: "Oils", onHand: 3, unit: "tins", costPerUnit: 1850, reorderLevel: 6 },
    { id: 3, name: "Fresh Paneer", category: "Dairy", onHand: 10, unit: "kg", costPerUnit: 340, reorderLevel: 4 },
    { id: 4, name: "Heirloom Tomatoes", category: "Produce", onHand: 25, unit: "kg", costPerUnit: 45, reorderLevel: 8 },
  ]);
  const [invForm, setInvForm] = useState({ name: "", category: "Grains", onHand: "", unit: "kg", costPerUnit: "", reorderLevel: "5" });
  const [editingInvId, setEditingInvId] = useState<string | number | null>(null);

  // Kitchen Inventory Consumption State
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [selectedStockForUsage, setSelectedStockForUsage] = useState<InventoryItem | null>(null);
  const [usageQuantity, setUsageQuantity] = useState("");

  // Platform Admin Data
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<RestaurantApproval[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<Array<any>>([]);
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);

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
  const [printPaperSize, setPrintPaperSize] = useState<"58mm" | "80mm" | "A4">("80mm");
  const [dateRange, setDateRange] = useState("This week");

  // Admin UPI & Subscription Verification
  const [adminUpiId, setAdminUpiId] = useState<string>("admin-restopulse@upi");
  const [adminUpiBusy, setAdminUpiBusy] = useState(false);
  const [subscriptionUpiId, setSubscriptionUpiId] = useState<string>("admin-restopulse@upi");
  const [activeInlinePlan, setActiveInlinePlan] = useState<Plan | null>(null);
  const [inlineRefId, setInlineRefId] = useState("");
  const [inlineScreenshotFile, setInlineScreenshotFile] = useState<File | null>(null);
  const [inlineSubmitBusy, setInlineSubmitBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Reset
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  // Modals
  const [modal, setModal] = useState<"plan" | "dish" | "expense" | "employee" | "supplier" | "payment" | "inventory" | null>(null);
  const [editing, setEditing] = useState<number | string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  // Sync Live Subscription & Restaurant Identity (Strict Tenant Scoping)
  const syncLiveSubscriptionStatus = useCallback(async () => {
    try {
      const currentId = tenantIdRef.current;
      const url = `/api/subscription?restaurant_id=${encodeURIComponent(currentId || "")}&user_id=${encodeURIComponent(authUser || "")}&email=${encodeURIComponent(loginEmail || "")}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.restaurant) {
        if (!tenantIdRef.current) {
          setTenantId(data.restaurant.id);
        }
        setActiveRestaurantName(data.restaurant.name);
        setActivePlanName(data.restaurant.plan || "Monthly");
        setActiveRenewalDate(data.restaurant.renewal_on || "—");
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
      if (data?.upi_id) {
        setSubscriptionUpiId(data.upi_id);
      }
    } catch {}
  }, [authUser, loginEmail]);

  // Load Platform Plans (Read-only for restaurant owners)
  const fetchLivePlans = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pricing");
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

  // Scoped Data Persisters
  useEffect(() => {
    if (!tenantId) return;
    try {
      const savedInv = localStorage.getItem(`rp-inventory:${tenantId}`);
      if (savedInv) setInventoryList(JSON.parse(savedInv));

      const savedExp = localStorage.getItem(`rp-expenses:${tenantId}`);
      if (savedExp) setExpenses(JSON.parse(savedExp));

      const savedDishes = localStorage.getItem(`rp-dishes:${tenantId}`);
      if (savedDishes) setDishes(JSON.parse(savedDishes));

      const savedStaff = localStorage.getItem(`rp-staff:${tenantId}`);
      if (savedStaff) setStaff(JSON.parse(savedStaff));

      const savedOrders = localStorage.getItem(`rp-orders:${tenantId}`);
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch {}
  }, [tenantId]);

  const saveInventoryToStorage = (updated: InventoryItem[]) => {
    setInventoryList(updated);
    if (tenantId) localStorage.setItem(`rp-inventory:${tenantId}`, JSON.stringify(updated));
  };

  const saveExpensesToStorage = (updated: Expense[]) => {
    setExpenses(updated);
    if (tenantId) localStorage.setItem(`rp-expenses:${tenantId}`, JSON.stringify(updated));
  };

  // Kitchen Inventory Consumption & Cost Tracking
  const handleLogStockUsage = () => {
    if (!selectedStockForUsage) return;
    const qty = Number(usageQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity taken for use");
      return;
    }
    if (qty > selectedStockForUsage.onHand) {
      toast.error(`Only ${selectedStockForUsage.onHand} ${selectedStockForUsage.unit} currently available in stock!`);
      return;
    }

    const usageCost = Math.round(qty * (selectedStockForUsage.costPerUnit || 0));

    // 1. Deduct quantity from warehouse inventory
    const updatedInventory = inventoryList.map((item) =>
      item.id === selectedStockForUsage.id ? { ...item, onHand: Math.max(0, item.onHand - qty) } : item
    );
    saveInventoryToStorage(updatedInventory);

    // 2. Automatically record inventory cost in restaurant expenses ledger
    const newUsageExpense: Expense = {
      id: `exp-${Date.now()}`,
      name: `Kitchen Usage: ${qty} ${selectedStockForUsage.unit} of ${selectedStockForUsage.name}`,
      category: "Inventory / Kitchen Usage",
      vendor: "Internal Stock Consumption",
      amount: usageCost,
      date: new Date().toLocaleDateString("en-CA"),
      supplierId: null,
    };
    saveExpensesToStorage([newUsageExpense, ...expenses]);

    toast.success(`Used ${qty} ${selectedStockForUsage.unit} of ${selectedStockForUsage.name}. Added ₹${usageCost} to operating expenses!`);
    setUsageModalOpen(false);
    setSelectedStockForUsage(null);
    setUsageQuantity("");
  };

  // Auth & Roles Initializer
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
    if (!db || !authUser) return;
    (async () => {
      try {
        const [a, m] = await Promise.all([
          db.from("platform_admins").select("user_id").eq("user_id", authUser).maybeSingle(),
          db.from("memberships").select("restaurant_id,role").eq("user_id", authUser).limit(1).maybeSingle(),
        ]);
        const platform = !!a?.data;
        setIsAdmin(platform);
        setAccountRole(platform ? "admin" : "restaurant");
        if (m?.data?.role) {
          setCurrentUserRole(m.data.role.toLowerCase());
        }
        if (m?.data?.restaurant_id) {
          setTenantId(m.data.restaurant_id);
        }
      } catch (e) {
        console.error("Auth hydration error", e);
      }
    })();
  }, [db, authUser]);

  // Real-time synchronization loop
  useEffect(() => {
    syncLiveSubscriptionStatus();
    fetchLivePlans();
    const interval = setInterval(() => {
      syncLiveSubscriptionStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, [syncLiveSubscriptionStatus, fetchLivePlans]);

  // Inventory CRUD
  const handleAddOrEditInventory = () => {
    if (!invForm.name.trim()) {
      toast.error("Please enter an item name");
      return;
    }
    const qty = Number(invForm.onHand);
    const unitCost = Number(invForm.costPerUnit) || 0;
    const reorder = Number(invForm.reorderLevel) || 5;

    if (isNaN(qty) || qty < 0) {
      toast.error("Enter a valid quantity on hand");
      return;
    }

    if (editingInvId !== null) {
      const updated = inventoryList.map((item) =>
        item.id === editingInvId
          ? { ...item, name: invForm.name.trim(), category: invForm.category, onHand: qty, unit: invForm.unit, costPerUnit: unitCost, reorderLevel: reorder }
          : item
      );
      saveInventoryToStorage(updated);
      toast.success("Inventory item updated successfully!");
    } else {
      const newItem: InventoryItem = {
        id: Date.now(),
        name: invForm.name.trim(),
        category: invForm.category,
        onHand: qty,
        unit: invForm.unit,
        costPerUnit: unitCost,
        reorderLevel: reorder,
      };
      saveInventoryToStorage([...inventoryList, newItem]);
      toast.success("Inventory item added to warehouse!");
    }

    setModal(null);
    setEditingInvId(null);
    setInvForm({ name: "", category: "Grains", onHand: "", unit: "kg", costPerUnit: "", reorderLevel: "5" });
  };

  const handleDeleteInventory = (id: string | number) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;
    const updated = inventoryList.filter((item) => item.id !== id);
    saveInventoryToStorage(updated);
    toast.success("Inventory item removed");
  };

  const openInventoryModal = (item?: InventoryItem) => {
    if (item) {
      setEditingInvId(item.id);
      setInvForm({
        name: item.name,
        category: item.category,
        onHand: String(item.onHand),
        unit: item.unit,
        costPerUnit: String(item.costPerUnit || 0),
        reorderLevel: String(item.reorderLevel),
      });
    } else {
      setEditingInvId(null);
      setInvForm({ name: "", category: "Grains", onHand: "", unit: "kg", costPerUnit: "", reorderLevel: "5" });
    }
    setModal("inventory");
  };

  // POS Order Calculation
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

  const checkout = () => {
    if (!cart.length) {
      toast.error("Add dishes to the order first");
      return;
    }
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
      subtotal,
      discount: totalDiscount,
      tax,
      cgst: cgstAmount,
      sgst: sgstAmount,
      total,
      type: orderType,
      table: orderType === "Dine-in" ? table : "",
      payment,
      status: "Paid",
    };

    setReceipt(bill);

    const newSale: Sale = {
      id,
      time,
      placedAt: now.toISOString(),
      amount: total,
      type: orderType,
      status: "Paid",
      bill,
    };
    const updatedSales = [newSale, ...orders];
    setOrders(updatedSales);
    if (tenantId) localStorage.setItem(`rp-orders:${tenantId}`, JSON.stringify(updatedSales));

    setCart([]);
    setOrderDiscount(0);
    toast.success("Payment complete · " + id);
  };

  // Safe Restaurant Details Save
  const handleSaveRestaurantSettings = async () => {
    try {
      const payload = {
        id: tenantId || tenantInfo.id,
        name: storeForm.name.trim() || activeRestaurantName,
        phone: storeForm.phone.trim(),
        address: storeForm.address.trim(),
        gstin: storeForm.gstin.trim(),
        gst_percent: Number(storeForm.gst_percent) || 5,
        cgst_percent: Number(storeForm.cgst_percent) || 2.5,
        sgst_percent: Number(storeForm.sgst_percent) || 2.5,
      };

      const res = await fetch("/api/restaurant", {
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

      toast.success("Restaurant profile updated successfully!");
      syncLiveSubscriptionStatus();
    } catch {
      toast.error("Failed to update profile details");
    }
  };

  // Strict Navigation Filter (Never shows platform admin options to restaurant owners)
  const normalizedRole = (currentUserRole || "").toLowerCase();
  const visibleNavTenant = navTenant.filter((item) => {
    if (isAdmin) return true;
    return !item.allowedRoles || item.allowedRoles.includes(normalizedRole);
  });

  const nav = (v: View) => {
    setView(v);
    setMobileNav(false);
    setProfileMenu(false);
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen bg-white">Loading RestoPulse…</div>;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      <Toaster richColors position="top-right" />

      {/* DYNAMIC THERMAL PRINT CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${printPaperSize === "A4" ? "A4" : printPaperSize === "58mm" ? "58mm auto" : "80mm auto"};
            margin: 0mm;
          }
          body * { visibility: hidden !important; }
          #printable-receipt-card, #printable-receipt-card * { visibility: visible !important; }
          #printable-receipt-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printPaperSize === "A4" ? "100%" : printPaperSize === "58mm" ? "48mm" : "72mm"} !important;
            max-width: ${printPaperSize === "A4" ? "100%" : printPaperSize === "58mm" ? "48mm" : "72mm"} !important;
            margin: 0 auto !important;
            padding: 3mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* MOBILE DRAWER OVERLAY BACKDROP */}
      {mobileNav && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileNav(false)}
        />
      )}

      {/* SIDEBAR MATCHING IMAGE_1FCCDE.PNG */}
      <aside className={`w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:translate-x-0 ${mobileNav ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="p-4 space-y-4">
          {/* Brand */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#f59e0b] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              RP
            </div>
            <div>
              <strong className="block text-sm font-bold text-slate-900 leading-tight">RestoPulse</strong>
              <small className="text-[10px] tracking-wider text-slate-400 font-semibold uppercase">GASTRONOMY POS</small>
            </div>
          </div>

          {/* Restaurant Workspace Box */}
          <div className="p-3 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <small className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">RESTAURANT WORKSPACE</small>
            <b className="text-sm font-bold text-slate-900 block truncate mt-0.5">{activeRestaurantName || "Mani"}</b>
            <span className="text-xs text-slate-500 capitalize">{currentUserRole} Account</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {visibleNavTenant.map((item) => {
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => nav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? "bg-[#f59e0b] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Platform Admin Links (Hidden from restaurant logins) */}
          {isAdmin && (
            <div className="pt-3 border-t border-slate-100 space-y-1">
              <small className="text-[10px] font-bold text-slate-400 px-3 block uppercase tracking-wider">PLATFORM ADMIN</small>
              {navPlatform.map((item) => (
                <button
                  key={item.id}
                  onClick={() => nav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                    view === item.id ? "bg-[#f59e0b] text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Current Plan Box */}
        <div className="p-4 space-y-3">
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">CURRENT PLAN</span>
            <b className="text-sm font-bold text-slate-900 block capitalize mt-0.5">{activePlanName || "Monthly"}</b>
            <span className="text-[11px] text-slate-400 block mt-0.5">Expires: {activeRenewalDate || "2026-11-12"}</span>
          </div>

          <button
            onClick={async () => { if (db) await db.auth.signOut(); }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Responsive Topbar */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold min-w-0">
            <button className="lg:hidden p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 mr-1 shrink-0" onClick={() => setMobileNav(!mobileNav)}>
              <Menu size={18} />
            </button>
            <span className="hidden sm:inline">Workspace</span>
            <span className="hidden sm:inline">/</span>
            <strong className="text-slate-800 capitalize font-bold truncate">{view === "dashboard" ? "Dashboard" : view}</strong>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600">
              <Sun size={15} />
            </button>
            <div className="text-right max-w-[120px] sm:max-w-[180px]">
              <b className="text-xs font-bold text-slate-900 block leading-tight truncate">{activeRestaurantName || "Mani"}</b>
              <small className="text-[11px] text-slate-400 font-medium block truncate">{loginEmail || "mani@gmail.com"}</small>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* 1. OVERVIEW DASHBOARD */}
          {view === "dashboard" && (
            <div className="space-y-6 max-w-7xl">
              {/* Header with Title and New Order Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Good afternoon, {activeRestaurantName || "Mani"}</h1>
                  <p className="text-xs text-slate-500 mt-1">Operational snapshot for {activeRestaurantName || "Mani"}.</p>
                </div>
                <button
                  onClick={() => nav("pos")}
                  className="bg-[#f59e0b] hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                  <Plus size={16} /> New Order
                </button>
              </div>

              {/* Four Responsive Top Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Gross sales</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {money(orders.reduce((sum, o) => sum + o.bill.subtotal, 0))}
                  </div>
                  <small className="text-[10px] text-slate-400 block mt-1">Total registered sales</small>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Net revenue</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {money(orders.filter(o => o.status === "Paid").reduce((sum, o) => sum + o.bill.total, 0))}
                  </div>
                  <small className="text-[10px] text-slate-400 block mt-1">Paid sales</small>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Operating expenses</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {money(expenses.reduce((sum, e) => sum + e.amount, 0))}
                  </div>
                  <small className="text-[10px] text-slate-400 block mt-1">Ingredients & overheads</small>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Real net profit</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {money(
                      orders.filter(o => o.status === "Paid").reduce((sum, o) => sum + o.bill.total, 0) -
                      expenses.reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </div>
                  <small className="text-[10px] text-slate-400 block mt-1">Net sales minus expenses</small>
                </div>
              </div>

              {/* Charts & Top Dishes Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trends Chart */}
                <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Revenue Trends</h3>
                  <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                        <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                        <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="#fef3c7" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Dishes Ranking */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Top Dishes</h3>
                  <div className="space-y-3 pt-2">
                    {dishes.slice(0, 4).map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-base">{d.emoji}</span>
                          <span className="truncate font-bold text-slate-800">{d.name}</span>
                        </div>
                        <b className="font-bold font-mono text-slate-900">{money(d.price)}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. POS TERMINAL */}
          {view === "pos" && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search menu dishes..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {["All items", "Appetizers", "Mains", "Drinks", "Desserts"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${category === cat ? "bg-[#f59e0b] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {displayedDishes.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => addCart(d.id)}
                      className="p-3.5 border border-slate-200 rounded-2xl text-left bg-white hover:border-[#f59e0b] transition-all flex flex-col justify-between space-y-3 shadow-xs"
                    >
                      <div className="text-2xl">{d.emoji}</div>
                      <div>
                        <b className="text-xs font-bold text-slate-900 block truncate">{d.name}</b>
                        <span className="text-[11px] font-black text-[#f59e0b] block mt-0.5">{money(d.price)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Cart Drawer */}
              <div className="w-full lg:w-80 p-5 border border-slate-200 rounded-2xl bg-white flex flex-col justify-between space-y-4 shadow-xs">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900">Current Order</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {cart.reduce((a, b) => a + b.qty, 0)} items
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
                    {cart.map((line) => {
                      const d = dishes.find((x) => x.id === line.id);
                      if (!d) return null;
                      return (
                        <div key={line.id} className="p-2.5 border border-slate-100 rounded-xl flex items-center justify-between text-xs bg-slate-50/50">
                          <div className="truncate pr-2">
                            <span className="font-bold text-slate-800 block truncate">{d.name}</span>
                            <small className="text-slate-400">{money(d.price)} each</small>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                              <button className="px-2 py-0.5" onClick={() => qty(line.id, -1)}>-</button>
                              <span className="px-1.5 font-bold font-mono">{line.qty}</span>
                              <button className="px-2 py-0.5" onClick={() => qty(line.id, 1)}>+</button>
                            </div>
                            <b className="w-14 text-right font-mono font-bold text-slate-900">{money(d.price * line.qty)}</b>
                          </div>
                        </div>
                      );
                    })}
                    {!cart.length && <div className="text-center py-10 text-slate-400 text-xs">Order is empty</div>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="space-y-1 text-xs text-slate-600 font-medium">
                    <div className="flex justify-between"><span>Subtotal:</span><span>{money(subtotal)}</span></div>
                    <div className="flex justify-between"><span>GST ({effectiveGst}%):</span><span>{money(tax)}</span></div>
                    <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-100">
                      <span>Total Due:</span><span>{money(total)}</span>
                    </div>
                  </div>
                  <button
                    onClick={checkout}
                    disabled={!cart.length}
                    className="w-full bg-[#f59e0b] hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-xs disabled:opacity-50"
                  >
                    Charge {money(total)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. INVENTORY WITH KITCHEN CONSUMPTION & COSTING */}
          {view === "inventory" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Warehouse & Stock Control</h1>
                  <p className="text-xs text-slate-500">Track raw stock levels, set reorder points, and log kitchen ingredient usage costs.</p>
                </div>
                <button
                  className="bg-[#f59e0b] hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                  onClick={() => openInventoryModal()}
                >
                  <Plus size={16} /> Add Stock Item
                </button>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-xs text-slate-400 font-semibold">Stock Items</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{inventoryList.length}</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-xs text-slate-400 font-semibold">Total Stock Value</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {money(inventoryList.reduce((acc, i) => acc + i.onHand * (i.costPerUnit || 0), 0))}
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
                  <span className="text-xs text-amber-700 font-bold">Low Stock Alert</span>
                  <div className="text-2xl font-black text-amber-700 mt-1">
                    {inventoryList.filter((i) => i.onHand > 0 && i.onHand <= i.reorderLevel).length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs">
                  <span className="text-xs text-rose-700 font-bold">Out of Stock</span>
                  <div className="text-2xl font-black text-rose-700 mt-1">
                    {inventoryList.filter((i) => i.onHand === 0).length}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="p-3">ITEM NAME</th>
                        <th className="p-3">CATEGORY</th>
                        <th className="p-3">UNIT COST</th>
                        <th className="p-3">ON HAND</th>
                        <th className="p-3">TOTAL VALUE</th>
                        <th className="p-3">STATUS</th>
                        <th className="p-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryList.map((item) => {
                        const isOut = item.onHand === 0;
                        const isLow = item.onHand > 0 && item.onHand <= item.reorderLevel;
                        return (
                          <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                            <td className="p-3 font-bold text-slate-900">{item.name}</td>
                            <td className="p-3 text-slate-600">{item.category}</td>
                            <td className="p-3 font-mono text-slate-700">{money(item.costPerUnit || 0)} / {item.unit}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">{item.onHand} {item.unit}</td>
                            <td className="p-3 font-mono font-bold text-emerald-600">{money(item.onHand * (item.costPerUnit || 0))}</td>
                            <td className="p-3">
                              {isOut ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Out of Stock</span>
                              ) : isLow ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Low Stock</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">In Stock</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 hover:bg-[#f59e0b] hover:text-white transition-all flex items-center gap-1"
                                  onClick={() => {
                                    setSelectedStockForUsage(item);
                                    setUsageQuantity("");
                                    setUsageModalOpen(true);
                                  }}
                                  title="Log kitchen usage / consumption"
                                >
                                  <TrendingDown size={13} /> Use Stock
                                </button>
                                <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50" onClick={() => openInventoryModal(item)}>
                                  <Pencil size={13} />
                                </button>
                                <button className="p-1.5 border border-slate-200 rounded-lg text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteInventory(item.id)}>
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
              </div>
            </div>
          )}

          {/* 4. EXPENSES WITH AUTOMATIC INVENTORY CONSUMPTION REFLECTION */}
          {view === "expenses" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Expenses Ledger</h1>
                  <p className="text-xs text-slate-500">Tracks operating expenditures alongside automatic kitchen inventory consumption costs.</p>
                </div>
                <button
                  className="bg-[#f59e0b] hover:bg-amber-600 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1 shadow-xs"
                  onClick={() => setModal("expense")}
                >
                  <Plus size={15} /> Log Expense
                </button>
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="p-3">DESCRIPTION</th>
                        <th className="p-3">CATEGORY</th>
                        <th className="p-3">VENDOR / CONSUMPTION</th>
                        <th className="p-3">DATE</th>
                        <th className="p-3 text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-900">{e.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {e.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{e.vendor}</td>
                          <td className="p-3 font-mono text-slate-600">{e.date}</td>
                          <td className="p-3 font-bold font-mono text-right text-slate-900">{money(e.amount)}</td>
                        </tr>
                      ))}
                      {!expenses.length && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-400">No expenses recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. MENU & DISHES */}
          {view === "menu" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Menu Catalog</h1>
                  <p className="text-xs text-slate-500">Configure dishes, pricing, and live availability.</p>
                </div>
                <button
                  className="bg-[#f59e0b] hover:bg-amber-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs"
                  onClick={() => setModal("dish")}
                >
                  <Plus size={15} /> Add Dish
                </button>
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="p-3">DISH</th>
                      <th className="p-3">CATEGORY</th>
                      <th className="p-3">PRICE</th>
                      <th className="p-3">AVAILABILITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dishes.map((d) => (
                      <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                          <span>{d.emoji}</span> {d.name}
                        </td>
                        <td className="p-3 text-slate-600">{d.category}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{money(d.price)}</td>
                        <td className="p-3">
                          <Switch checked={d.stock} onCheckedChange={(val) => setDishes(dishes.map(x => x.id === d.id ? { ...x, stock: val } : x))} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. SETTINGS */}
          {view === "settings" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Restaurant Settings</h1>
                <p className="text-xs text-slate-500">Update restaurant details and billing identity.</p>
              </div>

              <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
                <div className="space-y-3 text-xs">
                  <label className="block space-y-1 font-semibold text-slate-700">
                    <span>Restaurant Name</span>
                    <input
                      value={storeForm.name}
                      onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50"
                    />
                  </label>
                  <label className="block space-y-1 font-semibold text-slate-700">
                    <span>Phone Number</span>
                    <input
                      value={storeForm.phone}
                      onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50"
                    />
                  </label>
                  <label className="block space-y-1 font-semibold text-slate-700">
                    <span>Address</span>
                    <input
                      value={storeForm.address}
                      onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50"
                    />
                  </label>
                  <label className="block space-y-1 font-semibold text-slate-700">
                    <span>GSTIN</span>
                    <input
                      value={storeForm.gstin}
                      onChange={(e) => setStoreForm({ ...storeForm, gstin: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50"
                    />
                  </label>
                </div>
                <button
                  onClick={handleSaveRestaurantSettings}
                  className="w-full bg-[#f59e0b] hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs"
                >
                  Save Details
                </button>
              </div>
            </div>
          )}

          {/* 7. SUBSCRIPTION */}
          {view === "subscription" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Subscription Plans</h1>
                <p className="text-xs text-slate-500">Choose an active plan for your restaurant workspace.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((p) => {
                  const isCurrent = (activePlanName || "").toLowerCase().includes(p.name.toLowerCase());
                  return (
                    <div key={p.id} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Active Tier
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-2">{money(p.price)}</div>
                        <small className="text-slate-400 font-medium block">{p.period}</small>
                        <p className="text-xs text-slate-600 mt-3 leading-relaxed">{p.features}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: USE INVENTORY STOCK */}
      <Dialog open={usageModalOpen} onOpenChange={setUsageModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Use Stock for Kitchen</DialogTitle>
          </DialogHeader>
          {selectedStockForUsage && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Ingredient:</span>
                  <b className="text-slate-900">{selectedStockForUsage.name}</b>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Available On Hand:</span>
                  <b>{selectedStockForUsage.onHand} {selectedStockForUsage.unit}</b>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Unit Cost:</span>
                  <b className="font-mono text-emerald-700">{money(selectedStockForUsage.costPerUnit || 0)} / {selectedStockForUsage.unit}</b>
                </div>
              </div>

              <label className="block space-y-1 font-bold text-slate-700">
                <span>Quantity Taken ({selectedStockForUsage.unit})</span>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={usageQuantity}
                  onChange={(e) => setUsageQuantity(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm font-mono"
                />
              </label>

              {Number(usageQuantity) > 0 && (
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 flex justify-between items-center">
                  <span className="text-amber-800 font-bold">Added to Operating Expenses:</span>
                  <strong className="text-sm font-bold font-mono text-amber-900">
                    {money(Number(usageQuantity) * (selectedStockForUsage.costPerUnit || 0))}
                  </strong>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold" onClick={() => setUsageModalOpen(false)}>Cancel</button>
            <button className="px-4 py-2 bg-[#f59e0b] hover:bg-amber-600 text-white rounded-xl text-xs font-bold" onClick={handleLogStockUsage}>Confirm & Deduct</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADD / EDIT INVENTORY */}
      <Dialog open={modal === "inventory"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">{editingInvId !== null ? "Edit Stock Item" : "Add New Stock Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <label className="block space-y-1 font-semibold text-slate-700">
              <span>Item Name</span>
              <input value={invForm.name} onChange={(e) => setInvForm({ ...invForm, name: e.target.value })} className="w-full p-2 border border-slate-200 rounded-xl" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1 font-semibold text-slate-700">
                <span>Quantity On Hand</span>
                <input type="number" value={invForm.onHand} onChange={(e) => setInvForm({ ...invForm, onHand: e.target.value })} className="w-full p-2 border border-slate-200 rounded-xl" />
              </label>
              <label className="block space-y-1 font-semibold text-slate-700">
                <span>Unit (kg, bags, tins)</span>
                <input value={invForm.unit} onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })} className="w-full p-2 border border-slate-200 rounded-xl" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1 font-semibold text-slate-700">
                <span>Unit Cost (₹)</span>
                <input type="number" value={invForm.costPerUnit} onChange={(e) => setInvForm({ ...invForm, costPerUnit: e.target.value })} placeholder="140" className="w-full p-2 border border-slate-200 rounded-xl" />
              </label>
              <label className="block space-y-1 font-semibold text-slate-700">
                <span>Reorder Point</span>
                <input type="number" value={invForm.reorderLevel} onChange={(e) => setInvForm({ ...invForm, reorderLevel: e.target.value })} className="w-full p-2 border border-slate-200 rounded-xl" />
              </label>
            </div>
          </div>
          <DialogFooter>
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold" onClick={() => setModal(null)}>Cancel</button>
            <button className="px-4 py-2 bg-[#f59e0b] hover:bg-amber-600 text-white rounded-xl text-xs font-bold" onClick={handleAddOrEditInventory}>Save Item</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
