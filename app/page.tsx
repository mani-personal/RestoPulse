"use client";

import { useEffect, useState, useCallback } from "react";
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

type InventoryItem = {
  id: string | number;
  name: string;
  category: string;
  onHand: number;
  unit: string;
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
  { id: 2, name: "Olive & Ember", owner: "Neha Kapoor", email: "neha@example.com", phone: "+91 98765 43211", city: "Mumbai", plan: "Starter", status: "Active", renewal: "04 Oct 2026", initial: "OE" },
  { id: 3, name: "Nori House", owner: "Arun Iyer", email: "arun@example.com", phone: "+91 98765 43212", city: "Chennai", plan: "Growth", status: "Trial", renewal: "29 Sep 2026", initial: "NH" },
  { id: 4, name: "Mira Kitchen", owner: "Sara Khan", email: "sara@example.com", phone: "+91 98765 43213", city: "Hyderabad", plan: "Starter", status: "Paused", renewal: "18 Oct 2026", initial: "MK" },
];

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

const initialExpenses: Expense[] = [
  { id: 1, name: "Fresh produce delivery", category: "Inventory", vendor: "Green Acres Co.", amount: 4850, date: "26 Sep 2026" },
  { id: 2, name: "Monthly electricity", category: "Utilities", vendor: "BESCOM", amount: 12400, date: "25 Sep 2026" },
  { id: 3, name: "Kitchen equipment service", category: "Maintenance", vendor: "ProChef Services", amount: 3200, date: "24 Sep 2026" },
  { id: 4, name: "Social media campaign", category: "Marketing", vendor: "Studio North", amount: 6500, date: "22 Sep 2026" },
];

type Staff = {
  id: number | string;
  name: string;
  role: string;
  initial: string;
  shift: string;
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

const initialStaff: Staff[] = [
  { id: 1, name: "Ananya Rao", role: "Store Manager", initial: "AR", shift: "09:00 – 18:00", dailyRate: 1800, email: "ananya@restopulse.demo", phone: "+91 98765 43210" },
  { id: 2, name: "Rohan Mehta", role: "Cashier", initial: "RM", shift: "10:00 – 19:00", dailyRate: 900, email: "rohan@restopulse.demo", phone: "+91 98765 43211" },
  { id: 3, name: "Priya Nair", role: "Head Chef", initial: "PN", shift: "11:00 – 21:00", dailyRate: 2100, email: "priya@restopulse.demo", phone: "+91 98765 43212" },
  { id: 4, name: "Arjun Das", role: "Waitstaff", initial: "AD", shift: "12:00 – 21:00", dailyRate: 750, email: "arjun@restopulse.demo", phone: "+91 98765 43213" },
];

const initialWages: Wage[] = [
  { id: 1, staffId: 1, date: "2026-09-25", amount: 1800, status: "Paid", note: "Day shift" },
  { id: 2, staffId: 1, date: "2026-09-24", amount: 1800, status: "Paid", note: "" },
  { id: 3, staffId: 2, date: "2026-09-25", amount: 900, status: "Paid", note: "Day shift" },
  { id: 4, staffId: 2, date: "2026-09-26", amount: 900, status: "Unpaid", note: "Evening cover" },
  { id: 5, staffId: 3, date: "2026-09-25", amount: 2100, status: "Paid", note: "" },
  { id: 6, staffId: 4, date: "2026-09-25", amount: 750, status: "Paid", note: "" },
];

function seededSale(
  id: string,
  time: string,
  type: string,
  status: string,
  items: BillItem[],
  tax: number,
  table: string,
  payment: string
): Sale {
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  const discount = items.reduce((n, i) => n + i.discount * i.qty, 0);
  const total = subtotal - discount + tax;
  return {
    id,
    time,
    placedAt: "2026-09-26T12:00:00+05:30",
    type,
    status,
    amount: total,
    bill: {
      id,
      issuedAt: `26 Sep 2026, ${time}`,
      items,
      subtotal,
      discount,
      tax,
      total,
      type,
      table,
      payment,
      status,
    },
  };
}

const initialSales: Sale[] = [
  seededSale("RP-10842", "12:42 PM", "Dine-in", "Paid", [{ name: "Truffle Mushroom Risotto", qty: 2, unitPrice: 680, discount: 0 }, { name: "Citrus Mint Cooler", qty: 2, unitPrice: 240, discount: 0 }], 92, "T04", "UPI"),
  seededSale("RP-10841", "12:18 PM", "Takeaway", "Paid", [{ name: "Margherita Flatbread", qty: 2, unitPrice: 470, discount: 0 }, { name: "Citrus Mint Cooler", qty: 1, unitPrice: 240, discount: 0 }], 59, "", "Card"),
  seededSale("RP-10840", "11:55 AM", "Dine-in", "Paid", [{ name: "Grilled Salmon Bowl", qty: 2, unitPrice: 790, discount: 0 }, { name: "Burrata & Heirloom Tomato", qty: 2, unitPrice: 520, discount: 0 }], 131, "T02", "Cash"),
  seededSale("RP-10839", "11:32 AM", "Delivery", "Refunded", [{ name: "Smoked Chicken Tacos", qty: 1, unitPrice: 560, discount: 0 }, { name: "Citrus Mint Cooler", qty: 1, unitPrice: 240, discount: 0 }], 40, "", "UPI"),
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

const navTenant: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "pos", label: "POS Terminal", icon: ShoppingBag },
  { id: "menu", label: "Menu & dishes", icon: UtensilsCrossed },
  { id: "inventory", label: "Inventory", icon: Package },
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
  const [tenantId, setTenantId] = useState<string | null>("1");
  const [tenantInfo, setTenantInfo] = useState<{
    name: string;
    logo_url: string | null;
    address: string;
    business_phone: string;
    gstin: string;
    receipt_footer: string;
  } | null>({
    name: "The Saffron Table",
    logo_url: null,
    address: "12 Church Street, Bengaluru",
    business_phone: "+91 98765 43210",
    gstin: "29AAAAA0000A1Z5",
    receipt_footer: "Thank you for dining with us!",
  });
  const [storeForm, setStoreForm] = useState({
    name: "The Saffron Table",
    phone: "+91 98765 43210",
    address: "12 Church Street, Bengaluru",
    gstin: "29AAAAA0000A1Z5",
    footer: "Thank you for dining with us!",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: "sp-1", name: "Green Acres Co.", contact: "Vikram Shah", phone: "+91 98765 00001", email: "vikram@greenacres.in" },
    { id: "sp-2", name: "ProChef Supplies", contact: "Sunita Roy", phone: "+91 98765 00002", email: "sunita@prochef.in" }
  ]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([
    { id: "pay-1", supplierId: "sp-1", amount: 2500, date: "2026-09-26", method: "UPI", note: "Weekly vegetable delivery advance" }
  ]);
  const [supplierDetail, setSupplierDetail] = useState<string | null>("sp-1");
  const [dishFile, setDishFile] = useState<File | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [profileMenu, setProfileMenu] = useState(false);
  const [accountRole, setAccountRole] = useState<"admin" | "restaurant">("restaurant");
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [wages, setWages] = useState<Wage[]>(initialWages);
  const [wageForm, setWageForm] = useState({ date: new Date().toLocaleDateString("en-CA"), amount: "", note: "" });
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  
  // Real Restaurant Onboarding Approvals State (replaces dummy Spice Route Bistro)
  const [approvals, setApprovals] = useState<RestaurantApproval[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [orderType, setOrderType] = useState("Dine-in");
  const [table, setTable] = useState("T04");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [payment, setPayment] = useState("UPI");
  const [sound, setSound] = useState(false);
  const [receipt, setReceipt] = useState<Bill | null>(null);
  const [orders, setOrders] = useState<Sale[]>(initialSales);
  const [modal, setModal] = useState<"plan" | "dish" | "expense" | "restaurant" | "extend" | "employee" | "supplier" | "payment" | "inventory" | null>(null);
  const [editing, setEditing] = useState<number | string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [dateRange, setDateRange] = useState("This week");

  // Inventory State
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([
    { id: 1, name: "Basmati Rice", category: "Grains", onHand: 12, unit: "bags", reorderLevel: 5 },
    { id: 2, name: "Refined Cooking Oil", category: "Oils", onHand: 3, unit: "tins", reorderLevel: 6 },
    { id: 3, name: "Whole Wheat Flour", category: "Grains", onHand: 18, unit: "bags", reorderLevel: 10 },
    { id: 4, name: "Fresh Paneer", category: "Dairy", onHand: 0, unit: "kg", reorderLevel: 4 },
  ]);
  const [invForm, setInvForm] = useState({ name: "", category: "Grains", onHand: "", unit: "bags", reorderLevel: "5" });
  const [editingInvId, setEditingInvId] = useState<string | number | null>(null);

  // Admin UPI & Subscription Payment States
  const [adminUpiId, setAdminUpiId] = useState<string>("admin-restopulse@upi");
  const [adminUpiBusy, setAdminUpiBusy] = useState(false);
  const [subscriptionUpiId, setSubscriptionUpiId] = useState<string>("admin-restopulse@upi");
  const [extensionMessage, setExtensionMessage] = useState("");
  const [extensionFile, setExtensionFile] = useState<File | null>(null);
  const [extensionBusy, setExtensionBusy] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [subscriptionRequests, setSubscriptionRequests] = useState<Array<any>>([]);

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  // Real-Time Fetcher for Real Restaurant Registration Approvals
  const fetchRealApprovals = useCallback(async () => {
    try {
      if (db) {
        const { data, error } = await db
          .from("restaurants")
          .select("*")
          .eq("status", "Pending")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setApprovals(
            data.map((r: any) => ({
              id: r.id,
              name: r.name,
              city: r.city || "Not specified",
              submitted: r.created_at
                ? new Date(r.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent",
              docs: r.gstin ? `GSTIN: ${r.gstin}` : "Registration Docs",
              status: "Pending",
              owner: r.owner_name,
              email: r.owner_email,
              phone: r.owner_phone,
              plan: r.plan || "Free Trial",
            }))
          );
          return;
        }
      }
      const res = await fetch("/api/admin/approvals");
      const json = await res.json();
      if (json?.approvals) {
        setApprovals(json.approvals);
      }
    } catch {
      // Fallback: check pending restaurants in state
      const pendingInList = restaurants
        .filter((r) => r.status === "Pending")
        .map((r) => ({
          id: r.id,
          name: r.name,
          city: r.city,
          submitted: "Recent",
          docs: "Business Certificate",
          status: "Pending",
          owner: r.owner,
          email: r.email,
          phone: r.phone,
          plan: r.plan,
        }));
      setApprovals(pendingInList);
    }
  }, [db, restaurants]);

  // Centralized Request Fetcher for Admin Subscriptions
  const fetchSubscriptionRequests = useCallback(async () => {
    try {
      if (db) {
        const { data, error } = await db
          .from("subscription_requests")
          .select("*")
          .eq("status", "Pending")
          .order("requested_at", { ascending: false });

        if (!error && data) {
          setSubscriptionRequests(data);
          return;
        }
      }
      const res = await fetch("/api/admin/subscriptions");
      const json = await res.json();
      if (json?.requests) {
        setSubscriptionRequests(json.requests);
      }
    } catch {
      const localReqs = localStorage.getItem("rp-local-sub-requests");
      if (localReqs) setSubscriptionRequests(JSON.parse(localReqs));
    }
  }, [db]);

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
    if (!db || !authUser) return;
    let live = true;
    (async () => {
      try {
        const [a, m, r] = await Promise.all([
          db.from("platform_admins").select("user_id").eq("user_id", authUser).maybeSingle(),
          db.from("memberships").select("restaurant_id,role").eq("user_id", authUser).limit(1).maybeSingle(),
          db.from("restaurants").select("*").order("created_at", { ascending: false }),
        ]);
        if (!live) return;
        const platform = !!a?.data;
        setIsAdmin(platform);
        setAccountRole(platform ? "admin" : "restaurant");
        if (r?.data?.length) {
          setRestaurants(
            r.data.map((x: any) => ({
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
        }
        if (m?.data?.restaurant_id) {
          setTenantId(m.data.restaurant_id);
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
    const savedUpi = localStorage.getItem("rp-admin-upi");
    if (savedUpi) {
      setAdminUpiId(savedUpi);
      setSubscriptionUpiId(savedUpi);
    }
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data?.upi_id) {
          setSubscriptionUpiId(data.upi_id);
          setAdminUpiId(data.upi_id);
          localStorage.setItem("rp-admin-upi", data.upi_id);
        }
      })
      .catch(() => {});
  }, [isAdmin, tenantId]);

  // Real-Time Sync & Polling for Approvals and Subscriptions
  useEffect(() => {
    fetchSubscriptionRequests();
    fetchRealApprovals();

    let channel1: any = null;
    let channel2: any = null;
    if (db) {
      channel1 = db
        .channel("realtime-sub-reqs")
        .on("postgres_changes", { event: "*", schema: "public", table: "subscription_requests" }, () => {
          fetchSubscriptionRequests();
        })
        .subscribe();

      channel2 = db
        .channel("realtime-restaurants-approval")
        .on("postgres_changes", { event: "*", schema: "public", table: "restaurants" }, () => {
          fetchRealApprovals();
        })
        .subscribe();
    }

    const interval = setInterval(() => {
      fetchSubscriptionRequests();
      fetchRealApprovals();
    }, 5000);

    return () => {
      clearInterval(interval);
      if (channel1 && db) db.removeChannel(channel1);
      if (channel2 && db) db.removeChannel(channel2);
    };
  }, [db, fetchSubscriptionRequests, fetchRealApprovals]);

  useEffect(() => {
    const key = tenantId ? `rp-inventory-list:${tenantId}` : `rp-inventory-list:default`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setInventoryList(JSON.parse(raw));
    } catch {}
  }, [tenantId]);

  const saveInventoryToStorage = (updated: InventoryItem[]) => {
    setInventoryList(updated);
    const key = tenantId ? `rp-inventory-list:${tenantId}` : `rp-inventory-list:default`;
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const handleAddOrEditInventory = () => {
    if (!invForm.name.trim()) {
      toast.error("Please enter an item name");
      return;
    }
    const qty = Number(invForm.onHand);
    const reorder = Number(invForm.reorderLevel);
    if (isNaN(qty) || qty < 0) {
      toast.error("Enter a valid quantity on hand");
      return;
    }

    if (editingInvId !== null) {
      const updated = inventoryList.map((item) =>
        item.id === editingInvId
          ? { ...item, name: invForm.name.trim(), category: invForm.category, onHand: qty, unit: invForm.unit, reorderLevel: isNaN(reorder) ? 5 : reorder }
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
        reorderLevel: isNaN(reorder) ? 5 : reorder,
      };
      saveInventoryToStorage([...inventoryList, newItem]);
      toast.success("Inventory item added successfully!");
    }

    setModal(null);
    setEditingInvId(null);
    setInvForm({ name: "", category: "Grains", onHand: "", unit: "bags", reorderLevel: "5" });
  };

  const handleDeleteInventory = (id: string | number) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;
    const updated = inventoryList.filter((item) => item.id !== id);
    saveInventoryToStorage(updated);
    toast.success("Inventory item deleted");
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
  const currentRestaurant = restaurants.find((r) => String(r.id) === String(tenantId)) || restaurants[0];

  const subtotal = cart.reduce((sum, l) => {
    const d = dishes.find((x) => x.id === l.id);
    return sum + (l.override ?? d?.price ?? 0) * l.qty;
  }, 0);
  const lineDiscount = cart.reduce((sum, l) => sum + l.discount * l.qty, 0);
  const totalDiscount = Math.min(subtotal, lineDiscount + orderDiscount);
  const tax = Math.round((subtotal - totalDiscount) * 0.05);
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
    if (which === "plan" && id) {
      const p = plans.find((x) => x.id === id)!;
      setForm({ name: p.name, price: String(p.price), period: p.period, features: p.features });
    } else if (which === "supplier" && id !== undefined) {
      const sp = suppliers.find((x) => x.id === id)!;
      setForm({ name: sp.name, contact: sp.contact, phone: sp.phone, email: sp.email });
    } else if (which === "employee" && id !== undefined) {
      const member = staff.find((x) => x.id === id)!;
      setForm({
        name: member.name,
        role: member.role,
        shift: member.shift,
        dailyRate: String(member.dailyRate),
        email: member.email,
        phone: member.phone,
      });
    } else if (which === "dish" && id) {
      const d = dishes.find((x) => x.id === id)!;
      setDishFile(null);
      setForm({
        name: d.name,
        category: d.category,
        price: String(d.price),
        cost: String(d.cost),
        emoji: d.emoji,
        diet: d.diet,
        time: String(d.time),
      });
    } else setForm({});
  };

  const save = async () => {
    if (modal === "plan") {
      if (!form.name?.trim() || !Number.isFinite(Number(form.price))) {
        toast.error("Enter a plan name and price");
        return;
      }
      const p: Plan = {
        id: editing !== null ? Number(editing) : Date.now(),
        name: form.name.trim(),
        price: Number(form.price),
        period: form.period || "month",
        features: form.features || "",
        active: true,
      };
      setPlans((old) => (editing ? old.map((x) => (x.id === editing ? p : x)) : [...old, p]));
      toast.success(editing ? "Plan updated" : "Plan created");
    }
    if (modal === "dish") {
      if (!form.name?.trim() || Number(form.price) <= 0) {
        toast.error("Enter a dish name and valid price");
        return;
      }
      const d: Dish = {
        id: editing ?? Date.now(),
        name: form.name.trim(),
        category: form.category || "Mains",
        price: Number(form.price),
        cost: Number(form.cost) || 0,
        stock: true,
        emoji: form.emoji || "🍽️",
        diet: form.diet || "",
        time: Number(form.time) || 15,
      };
      setDishes((old) => (editing ? old.map((x) => (x.id === editing ? { ...d, stock: x.stock } : x)) : [...old, d]));
      toast.success(editing ? "Dish updated" : "Dish added");
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
      setExpenses((old) => [newExp, ...old]);
      toast.success("Expense recorded");
    }
    if (modal === "restaurant") {
      const newRest = {
        id: Date.now(),
        name: form.name || "New Restaurant",
        owner: form.owner || "Owner",
        email: form.email || "owner@example.com",
        phone: form.phone || "+91 98765 00000",
        city: form.city || "Bengaluru",
        plan: form.plan || "Growth",
        status: "Active",
        renewal: "15 Oct 2026",
        initial: (form.name || "NR").slice(0, 2).toUpperCase(),
      };
      setRestaurants((old) => [newRest, ...old]);
      toast.success("Restaurant added successfully!");
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
      setSuppliers((old) => (editing ? old.map((x) => (x.id === editing ? newSup : x)) : [newSup, ...old]));
      setSupplierDetail(newSup.id);
      toast.success(editing ? "Supplier updated" : "Supplier added");
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
      setSupplierPayments((old) => [newPay, ...old]);
      toast.success("Payment recorded");
    }
    if (modal === "employee") {
      if (!form.name?.trim() || !form.role?.trim()) {
        toast.error("Enter a name and role");
        return;
      }
      const person: Staff = {
        id: editing ?? Date.now(),
        name: form.name.trim(),
        role: form.role.trim(),
        initial: form.name.trim().split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase(),
        shift: form.shift || "09:00 – 18:00",
        dailyRate: Math.max(0, Number(form.dailyRate) || 0),
        email: form.email || "staff@restopulse.demo",
        phone: form.phone || "",
      };
      setStaff((old) => (editing !== null ? old.map((x) => (x.id === editing ? person : x)) : [...old, person]));
      toast.success(editing !== null ? "Employee updated" : "Employee added");
    }
    if (modal === "extend" && editing) {
      setRestaurants((old) => old.map((r) => (r.id === editing ? { ...r, renewal: form.renewal || r.renewal } : r)));
      toast.success("Subscription extended");
    }
    setModal(null);
  };

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
      business: tenantInfo || {
        name: currentRestaurant?.name || "The Saffron Table",
        logo_url: null,
        address: "12 Church Street, Bengaluru",
        business_phone: "+91 98765 43210",
        gstin: "29AAAAA0000A1Z5",
        receipt_footer: "Thank you for dining with us!",
      },
      items: cart.map((l) => ({
        name: dishes.find((d) => d.id === l.id)?.name || "Menu item",
        qty: l.qty,
        unitPrice: l.override ?? dishes.find((d) => d.id === l.id)?.price ?? 0,
        discount: l.discount,
      })),
      subtotal,
      discount: totalDiscount,
      tax,
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
    setOrders((old) => [newSale, ...old]);
    setCart([]);
    setOrderDiscount(0);
    toast.success("Payment complete · " + id);
  };

  const openStaff = (person: Staff) => {
    setSelectedStaff(person);
    setWageForm({ date: new Date().toLocaleDateString("en-CA"), amount: String(person.dailyRate), note: "" });
  };

  const saveAdminUpi = async () => {
    setAdminUpiBusy(true);
    const trimmed = adminUpiId.trim();
    localStorage.setItem("rp-admin-upi", trimmed);
    setSubscriptionUpiId(trimmed);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upi_id: trimmed }),
      });
    } catch {}
    toast.success("Admin payment UPI ID saved successfully!");
    setAdminUpiBusy(false);
  };

  const copyUpi = async () => {
    const targetUpi = subscriptionUpiId || adminUpiId || "admin-restopulse@upi";
    try {
      await navigator.clipboard.writeText(targetUpi);
      toast.success("UPI ID copied to clipboard!");
    } catch {
      toast.info(`UPI ID: ${targetUpi}`);
    }
  };

  const handleChoosePlan = (plan: Plan) => {
    const activeUpi = localStorage.getItem("rp-admin-upi") || subscriptionUpiId || adminUpiId || "admin-restopulse@upi";
    setSubscriptionUpiId(activeUpi);
    setSelectedPlanForPayment(plan);
    setShowQrModal(true);
  };

  const paySelectedPlan = () => {
    if (!selectedPlanForPayment) return;
    const link = `upi://pay?pa=${encodeURIComponent(subscriptionUpiId)}&pn=RestoPulse&am=${encodeURIComponent(selectedPlanForPayment.price.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`${currentRestaurant?.name || 'Restaurant'} ${selectedPlanForPayment.name} subscription`)}`;
    window.location.href = link;
  };

  const requestExtension = async () => {
    setExtensionBusy(true);
    try {
      let screenshotUrl = "";
      if (extensionFile) {
        try {
          if (db) {
            const path = `subscriptions/${Date.now()}-${extensionFile.name.replace(/\s+/g, "_")}`;
            const { error: uploadErr } = await db.storage
              .from("restaurant-media")
              .upload(path, extensionFile, { contentType: extensionFile.type, upsert: true });

            if (!uploadErr) {
              const { data: pubData } = db.storage.from("restaurant-media").getPublicUrl(path);
              screenshotUrl = pubData.publicUrl;
            }
          }
        } catch {
          screenshotUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(extensionFile);
          });
        }
      }

      const payload = {
        restaurant_id: tenantId && tenantId !== "1" ? tenantId : null,
        restaurant_name: tenantInfo?.name || currentRestaurant?.name || "The Saffron Table",
        owner_name: currentRestaurant?.owner || "Mani Raj",
        owner_email: currentRestaurant?.email || "mani@example.com",
        plan: selectedPlanForPayment?.name || currentRestaurant?.plan || "Growth",
        upi_id: subscriptionUpiId,
        screenshot_url: screenshotUrl,
        message: extensionMessage.trim() || `Payment proof uploaded for ${selectedPlanForPayment?.name || 'subscription'}`,
        status: "Pending",
        requested_at: new Date().toISOString(),
      };

      if (db) {
        await db.from("subscription_requests").insert(payload);
      }

      await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const existing = JSON.parse(localStorage.getItem("rp-local-sub-requests") || "[]");
      const newRecord = { id: `req-${Date.now()}`, ...payload };
      localStorage.setItem("rp-local-sub-requests", JSON.stringify([newRecord, ...existing]));

      toast.success("Payment proof and subscription request submitted to Admin successfully!");
      setExtensionMessage("");
      setExtensionFile(null);
      setShowQrModal(false);
      fetchSubscriptionRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setExtensionBusy(false);
    }
  };

  const reviewExtensionRequest = async (requestId: string, restId?: string) => {
    try {
      if (db) {
        await db.from("subscription_requests").update({ status: "Approved" }).eq("id", requestId);
        if (restId) {
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + 30);
          const renewalStr = newDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
          await db.from("restaurants").update({ renewal_on: renewalStr, status: "Active" }).eq("id", restId);
        }
      }
      await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });

      const existing = JSON.parse(localStorage.getItem("rp-local-sub-requests") || "[]");
      localStorage.setItem("rp-local-sub-requests", JSON.stringify(existing.filter((x: any) => x.id !== requestId)));

      setSubscriptionRequests((old) => old.filter((x) => x.id !== requestId));
      toast.success("Subscription approved and extended successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve request");
    }
  };

  // Real Restaurant Onboarding Approval Handler
  const handleReviewRestaurantApproval = async (approvalId: string | number, action: "approve" | "reject") => {
    try {
      if (db) {
        await db
          .from("restaurants")
          .update({ status: action === "approve" ? "Active" : "Rejected" })
          .eq("id", approvalId);
      }
      await fetch("/api/admin/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: approvalId, action }),
      });

      setApprovals((old) => old.filter((x) => x.id !== approvalId));
      setRestaurants((old) =>
        old.map((r) =>
          r.id === approvalId
            ? { ...r, status: action === "approve" ? "Active" : "Rejected" }
            : r
        )
      );

      toast.success(
        action === "approve"
          ? "Restaurant approved and activated successfully!"
          : "Restaurant registration rejected"
      );
      fetchRealApprovals();
    } catch (err: any) {
      toast.error(err.message || "Failed to update restaurant status");
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
    setTenantId(null);
    setAuthUser(null);
  };

  const nav = (v: View) => {
    setView(v);
    setMobileNav(false);
    setNotifications(false);
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

  const upiPayUri = selectedPlanForPayment
    ? `upi://pay?pa=${encodeURIComponent(subscriptionUpiId)}&pn=${encodeURIComponent("RestoPulse")}&am=${encodeURIComponent(selectedPlanForPayment.price.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`${currentRestaurant?.name || 'Restaurant'} ${selectedPlanForPayment.name}`)}`
    : `upi://pay?pa=${encodeURIComponent(subscriptionUpiId)}&pn=${encodeURIComponent("RestoPulse")}&cu=INR`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayUri)}`;

  return (
    <div className="app-shell">
      <Toaster richColors position="top-right" />
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
        <div className="workspace-label">
          WORKSPACE <ChevronDown size={14} />
        </div>
        <div className="store-selector">
          <span className="store-avatar">
            {tenantInfo?.logo_url ? <img src={tenantInfo.logo_url} alt="Restaurant logo" /> : "ST"}
          </span>
          <div>
            <b>{tenantInfo?.name || "The Saffron Table"}</b>
            <small>{accountRole === "admin" ? "Platform console" : "Restaurant workspace"}</small>
          </div>
          <ChevronDown size={15} />
        </div>

        {/* RESTAURANT NAVIGATION */}
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
              {item.id === "pos" && <span className="nav-key">⌘2</span>}
            </button>
          ))}
        </nav>

        {/* PLATFORM ADMIN NAVIGATION: STRICTLY SHOWN ONLY IF ADMIN */}
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
                  {item.id === "approvals" && approvals.length > 0 && (
                    <span className="nav-count">{approvals.length}</span>
                  )}
                </button>
              ))}
            </nav>
          </>
        )}

        <div className="sidebar-bottom">
          <div className="trial-note">
            <span className="trial-icon">✦</span>
            <b>Growth plan</b>
            <p>Your workspace is active. Renewal on 12 Oct 2026.</p>
            <button onClick={() => nav(isAdmin ? "pricing" : "subscription")}>
              Manage plan <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className="profile profile-trigger"
            onClick={() => setProfileMenu(!profileMenu)}
            aria-label="Open profile menu"
          >
            <span className="profile-avatar">MR</span>
            <div>
              <b>{authUser?.slice(0, 8) || "Mani Raj"}</b>
              <small>{accountRole === "admin" ? "Platform administrator" : "Restaurant owner"}</small>
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
            <span className="today-label">
              <CalendarDays size={16} /> Thu, 1 Oct 2026
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
              MR
            </button>
          </div>

          {profileMenu && (
            <div className="profile-popover">
              <div className="profile-popover-head">
                <b>{authUser?.slice(0, 8) || "Mani Raj"}</b>
                <small>{accountRole === "admin" ? "Platform administrator" : "Restaurant owner"}</small>
              </div>
              <button onClick={() => nav("settings")}>
                <Settings size={17} /> Account & settings
              </button>
              <button onClick={() => nav("staff")}>
                <Users size={17} /> Manage employees
              </button>
              <button onClick={handleSignOut} className="text-red-600 hover:text-red-700">
                <LogOut size={17} /> Sign out
              </button>
              <div className="profile-role">
                <span>Account role: {accountRole === "admin" ? "Platform admin" : "Restaurant owner"}</span>
              </div>
            </div>
          )}

          {notifications && (
            <div className="notification-popover">
              <div className="popover-title">
                <b>Notifications</b>
                <span>{approvals.length + subscriptionRequests.length} new</span>
              </div>
              {approvals.length > 0 && (
                <button onClick={() => nav("approvals")}>
                  <span className="notif-icon amber">◎</span>
                  <span>
                    <b>{approvals.length} pending restaurant approvals</b>
                    <small>Review restaurant onboarding applications</small>
                  </span>
                </button>
              )}
              {subscriptionRequests.length > 0 && (
                <button onClick={() => nav("restaurants")}>
                  <span className="notif-icon teal">↗</span>
                  <span>
                    <b>{subscriptionRequests.length} subscription renewals pending</b>
                    <small>Review payment screenshots</small>
                  </span>
                </button>
              )}
            </div>
          )}
        </header>

        <main className={"content " + (view === "pos" ? "pos-content" : "")}>
          {/* 1. OVERVIEW DASHBOARD */}
          {view === "dashboard" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">THURSDAY, 1 OCTOBER 2026</div>
                  <h1>
                    Good afternoon, Mani <span className="wave">✳</span>
                  </h1>
                  <p>Here’s what’s happening at {tenantInfo?.name || "your restaurant"}.</p>
                </div>
                <div className="head-actions">
                  <select aria-label="Date range" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option>Today</option>
                    <option>Yesterday</option>
                    <option>This week</option>
                    <option>This month</option>
                    <option>Custom range</option>
                  </select>
                  <button className="primary-btn" onClick={() => nav("pos")}>
                    <Plus size={18} /> New order
                  </button>
                </div>
              </div>
              <div className="kpi-grid">
                {[
                  {
                    label: "Gross sales",
                    value: money(orders.filter((o) => o.status !== "Voided").reduce((n, o) => n + o.bill.subtotal, 0)),
                    change: "",
                    icon: Wallet,
                    tone: "amber",
                    note: "before discounts & refunds",
                  },
                  {
                    label: "Net sales",
                    value: money(orders.filter((o) => o.status === "Paid").reduce((n, o) => n + o.bill.subtotal - o.bill.discount, 0)),
                    change: "",
                    icon: ArrowUpRight,
                    tone: "teal",
                    note: "paid sales, excluding tax",
                  },
                  {
                    label: "Operating expenses",
                    value: money(
                      expenses.reduce((a, x) => a + x.amount, 0) +
                        wages.filter((w) => w.status === "Paid").reduce((a, x) => a + x.amount, 0)
                    ),
                    change: "",
                    icon: ReceiptText,
                    tone: "violet",
                    note: "expenses + paid wages",
                  },
                  {
                    label: "Real net profit",
                    value: money(
                      orders.filter((o) => o.status === "Paid").reduce((n, o) => n + o.bill.subtotal - o.bill.discount, 0) -
                        expenses.reduce((a, x) => a + x.amount, 0) -
                        wages.filter((w) => w.status === "Paid").reduce((a, x) => a + x.amount, 0)
                    ),
                    change: "",
                    icon: ArrowUpRight,
                    tone: "green",
                    note: "net sales − operating costs",
                  },
                ].map((k) => (
                  <div className="kpi-card" key={k.label}>
                    <div className="kpi-top">
                      <span>{k.label}</span>
                      <span className={"kpi-icon " + k.tone}>
                        <k.icon size={19} />
                      </span>
                    </div>
                    <strong>{k.value}</strong>
                    <div className="kpi-foot">
                      {k.change && (
                        <span className={"change " + (k.label === "Operating expenses" ? "negative" : "")}>
                          {k.change}
                        </span>
                      )}
                      <span>{k.note}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="analytics-grid">
                <section className="panel chart-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Revenue & expenses</h2>
                      <p>Illustrative weekly trend · live totals are shown above</p>
                    </div>
                    <span className="legend">
                      <i /> Revenue <i /> Expenses
                    </span>
                  </div>
                  <div className="chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chart} margin={{ top: 15, right: 8, left: -17, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} dy={12} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)" }} />
                        <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fill="url(#rev)" />
                        <Area type="monotone" dataKey="expense" stroke="#10b981" strokeWidth={2} fill="transparent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section className="panel top-dishes">
                  <div className="panel-header">
                    <div>
                      <h2>Top performing dishes</h2>
                      <p>Sample menu inspiration</p>
                    </div>
                    <button className="text-btn" onClick={() => nav("menu")}>
                      View menu <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {initialDishes.slice(0, 4).map((d, i) => (
                    <div className="leader-row" key={d.id}>
                      <span className="leader-rank">0{i + 1}</span>
                      <span className={"dish-thumb t" + i}>{d.emoji}</span>
                      <div className="leader-info">
                        <b>{d.name}</b>
                        <small>{[82, 67, 54, 42][i]} orders</small>
                      </div>
                      <strong>{money([55760, 52930, 28080, 23520][i])}</strong>
                    </div>
                  ))}
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
                  <p>Find a dish, build an order, and check out.</p>
                </div>
                <div className="head-actions">
                  <button className="quiet-btn" onClick={() => setSound(!sound)}>
                    {sound ? <Volume2 size={17} /> : <VolumeX size={17} />} Sound {sound ? "on" : "off"}
                  </button>
                  <span className="terminal-status">
                    <i /> Terminal online
                  </span>
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
                        placeholder="Search dishes, SKU or barcode…"
                        aria-label="Search dishes"
                      />
                      <kbd>⌘ K</kbd>
                    </label>
                  </div>
                  <div className="category-list">
                    {["All items", "Appetizers", "Mains", "Drinks", "Desserts"].map((c) => (
                      <button key={c} className={category === c ? "selected" : ""} onClick={() => setCategory(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="catalog-count">
                    {displayed.length} dishes <span>·</span> Tap to add to order
                  </div>
                  <div className="dish-grid">
                    {displayed.map((d, i) => (
                      <button
                        className={"dish-tile " + (!d.stock ? "sold-out" : "")}
                        key={d.id}
                        onClick={() => d.stock && addCart(d.id)}
                        disabled={!d.stock}
                      >
                        <span className={"dish-photo photo-" + (i % 8)}>
                          {d.imageUrl ? <img className="dish-image" src={d.imageUrl} alt={d.name} /> : <span>{d.emoji}</span>}
                          {!d.stock && <b>86'D OUT</b>}
                        </span>
                        <span className="dish-body">
                          <span className="dish-name">{d.name}</span>
                          <span className="dish-details">
                            {d.diet || d.category} · {d.time} min
                          </span>
                          <span className="dish-price">
                            {money(d.price)}
                            <span className="dish-add"><Plus size={17} /></span>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <aside className="order-panel">
                  <div className="order-head">
                    <div>
                      <h2>Current order</h2>
                      <p>Order #RP-{10843 + orders.length}</p>
                    </div>
                    <span className="order-count">{cart.reduce((a, x) => a + x.qty, 0)} items</span>
                  </div>
                  <div className="order-types">
                    {["Dine-in", "Takeaway", "Delivery"].map((t) => (
                      <button key={t} className={orderType === t ? "selected" : ""} onClick={() => setOrderType(t)}>{t}</button>
                    ))}
                  </div>
                  {orderType === "Dine-in" && (
                    <label className="table-select">
                      Table number{" "}
                      <select value={table} onChange={(e) => setTable(e.target.value)}>
                        {["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08"].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="cart-items">
                    {cart.length ? (
                      cart.map((l) => {
                        const d = dishes.find((x) => x.id === l.id)!;
                        return (
                          <div className="cart-item" key={l.id}>
                            <span className="cart-emoji">{d.emoji}</span>
                            <div className="cart-item-main">
                              <b>{d.name}</b>
                              <small>{money(l.override ?? d.price)} each</small>
                              <div className="cart-controls">
                                <button aria-label={"Remove one " + d.name} onClick={() => qty(l.id, -1)}><Minus size={13} /></button>
                                <span>{l.qty}</span>
                                <button aria-label={"Add one " + d.name} onClick={() => qty(l.id, 1)}><Plus size={13} /></button>
                              </div>
                            </div>
                            <strong>{money(((l.override ?? d.price) - l.discount) * l.qty)}</strong>
                          </div>
                        );
                      })
                    ) : (
                      <div className="cart-empty">
                        <ShoppingBag size={32} />
                        <b>Your order is empty</b>
                        <span>Select dishes to get started.</span>
                      </div>
                    )}
                  </div>
                  <div className="cart-footer">
                    <div className="totals">
                      <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
                      <div><span>Discount</span><b>−{money(totalDiscount)}</b></div>
                      <div><span>Tax (GST 5%)</span><b>{money(tax)}</b></div>
                      <div className="grand-total"><span>Total due</span><strong>{money(total)}</strong></div>
                    </div>
                    <div className="payment-types">
                      {["UPI", "Cash", "Card"].map((p) => (
                        <button key={p} className={payment === p ? "selected" : ""} onClick={() => setPayment(p)}>{p}</button>
                      ))}
                    </div>
                    <button className="checkout-btn" disabled={!cart.length} onClick={checkout}>
                      <CreditCard size={19} /> Charge {money(total)} <ArrowUpRight size={18} />
                    </button>
                  </div>
                </aside>
              </div>
            </>
          )}

          {/* 3. MENU & DISHES */}
          {view === "menu" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">CATALOG MANAGEMENT</div>
                  <h1>Menu & dishes</h1>
                  <p>Keep your menu up to date across every terminal.</p>
                </div>
                <button className="primary-btn" onClick={() => open("dish")}>
                  <Plus size={17} /> Add dish
                </button>
              </div>
              <div className="panel management-panel">
                <div className="panel-header">
                  <div>
                    <h2>All dishes <span className="count-pill">{dishes.length}</span></h2>
                    <p>Availability updates appear instantly in POS.</p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>DISH</th><th>CATEGORY</th><th>SELLING PRICE</th><th>FOOD COST</th><th>AVAILABILITY</th><th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dishes.map((d) => (
                        <tr key={d.id}>
                          <td><span className="table-dish"><span className="mini-emoji">{d.emoji}</span><b>{d.name}</b></span></td>
                          <td>{d.category}</td>
                          <td className="strong">{money(d.price)}</td>
                          <td>{money(d.cost)}</td>
                          <td>
                            <label className="switch-cell">
                              <Switch
                                checked={d.stock}
                                onCheckedChange={(v) => setDishes((old) => old.map((x) => (x.id === d.id ? { ...x, stock: v } : x)))}
                              />
                              <span>{d.stock ? "Available" : "86’d out"}</span>
                            </label>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button aria-label={"Edit " + d.name} onClick={() => open("dish", d.id)}><Pencil size={16} /></button>
                              <button aria-label={"Delete " + d.name} onClick={() => setDishes((old) => old.filter((x) => x.id !== d.id))}><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
                  <div className="eyebrow">WAREHOUSE & STOCK CONTROL</div>
                  <h1>Inventory Manager</h1>
                  <p>Add, edit, and track stock items in your restaurant. Monitor threshold alerts for low and out-of-stock items.</p>
                </div>
                <button className="primary-btn flex items-center gap-2" onClick={() => openInventoryModal()}>
                  <Plus size={17} /> Add Stock Item
                </button>
              </div>

              <div className="platform-stats grid grid-cols-4 gap-4 my-6">
                <div className="p-4 bg-card rounded-xl border">
                  <strong>{inventoryList.length}</strong>
                  <span>Total Stock Items</span>
                </div>
                <div className="p-4 bg-card rounded-xl border">
                  <strong>{inventoryList.filter(x => x.onHand > x.reorderLevel).length}</strong>
                  <span>In Stock</span>
                </div>
                <div className="p-4 bg-card rounded-xl border border-amber-300 bg-amber-50/20">
                  <strong className="text-amber-600">{inventoryList.filter(x => x.onHand > 0 && x.onHand <= x.reorderLevel).length}</strong>
                  <span>Low Stock Warning ⚠️</span>
                </div>
                <div className="p-4 bg-card rounded-xl border border-red-300 bg-red-50/20">
                  <strong className="text-red-600">{inventoryList.filter(x => x.onHand === 0).length}</strong>
                  <span>Out of Stock 🚨</span>
                </div>
              </div>

              <div className="panel management-panel bg-card border rounded-xl p-6">
                <div className="table-scroll overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-sm text-muted-foreground">
                        <th className="p-3">ITEM NAME</th>
                        <th className="p-3">CATEGORY</th>
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
                            <td className="p-3 text-sm text-muted-foreground">{item.category}</td>
                            <td className="p-3 font-mono font-bold">{item.onHand} {item.unit}</td>
                            <td className="p-3 font-mono text-muted-foreground">{item.reorderLevel} {item.unit}</td>
                            <td className="p-3">
                              {isOut ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                  <AlertTriangle size={12} /> Out of Stock (Reorder Now)
                                </span>
                              ) : isLow ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <AlertTriangle size={12} /> Low Stock Warning
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                  In Stock
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex gap-2">
                                <button className="p-1.5 border rounded hover:bg-muted" onClick={() => openInventoryModal(item)} title="Edit Item"><Pencil size={15} /></button>
                                <button className="p-1.5 border rounded hover:bg-red-50 text-red-600" onClick={() => handleDeleteInventory(item.id)} title="Delete Item"><Trash2 size={15} /></button>
                              </div>
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

          {/* 5. TEAM & PAYROLL */}
          {view === "staff" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">YOUR PEOPLE</div>
                  <h1>Team & payroll</h1>
                  <p>Profiles, shifts, and compensation in one place.</p>
                </div>
                <button className="primary-btn" onClick={() => open("employee")}>
                  <Plus size={17} /> Add employee
                </button>
              </div>
              <div className="staff-grid">
                {staff.map((s, i) => (
                  <div className="staff-card" key={s.name} role="button" tabIndex={0} onClick={() => openStaff(s)}>
                    <span className={"staff-avatar a" + i}>{s.initial}</span>
                    <span className="staff-name">{s.name}</span>
                    <span className="staff-role">{s.role}</span>
                    <span className="staff-manage">
                      <button onClick={(e) => { e.stopPropagation(); open("employee", s.id); }}><Pencil size={15} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setStaff((old) => old.filter((x) => x.id !== s.id)); }}><Trash2 size={15} /></button>
                    </span>
                    <span className="staff-divider" />
                    <span className="staff-meta"><span>Today’s shift</span><b>{s.shift}</b></span>
                    <span className="staff-meta"><span>Base pay</span><b>{money(s.dailyRate)} / day</b></span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 6. EXPENSES */}
          {view === "expenses" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">COST CONTROL</div>
                  <h1>Expenses</h1>
                  <p>Every cost accounted for. Every margin clearer.</p>
                </div>
                <button className="primary-btn" onClick={() => open("expense")}>
                  <Plus size={17} /> Log expense
                </button>
              </div>
              <div className="panel management-panel">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr><th>DESCRIPTION</th><th>CATEGORY</th><th>VENDOR</th><th>DATE</th><th>AMOUNT</th></tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id}>
                          <td className="strong">{e.name}</td>
                          <td><span className="category-badge">{e.category}</span></td>
                          <td>{e.vendor}</td>
                          <td>{e.date}</td>
                          <td className="strong">{money(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 7. SUPPLIERS */}
          {view === "suppliers" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">SUPPLIER ACCOUNTS</div>
                  <h1>Suppliers</h1>
                  <p>Track purchases, payments, and balances due for each supplier.</p>
                </div>
                <div className="head-actions">
                  <button className="quiet-btn" onClick={() => open("payment")}><Wallet size={16} /> Record payment</button>
                  <button className="primary-btn" onClick={() => open("supplier")}><Plus size={17} /> Add supplier</button>
                </div>
              </div>
              <div className="supplier-layout">
                <section className="panel supplier-list">
                  <div className="panel-header"><div><h2>Supplier directory</h2></div></div>
                  {suppliers.map((sp) => (
                    <button key={sp.id} className={"supplier-row " + (supplierDetail === sp.id ? "selected" : "")} onClick={() => setSupplierDetail(sp.id)}>
                      <span className="supplier-monogram">{sp.name.slice(0, 2).toUpperCase()}</span>
                      <span className="supplier-main"><b>{sp.name}</b><small>{sp.phone || "Supplier"}</small></span>
                    </button>
                  ))}
                </section>
                <section className="panel supplier-ledger">
                  {supplierDetail ? (
                    <div className="p-4">
                      <h3>{suppliers.find(x => x.id === supplierDetail)?.name}</h3>
                      <p className="text-sm text-muted-foreground">{suppliers.find(x => x.id === supplierDetail)?.contact}</p>
                    </div>
                  ) : <div className="empty-state">Select a supplier to see records.</div>}
                </section>
              </div>
            </>
          )}

          {/* 8. SUBSCRIPTION & CHOOSE PLAN */}
          {view === "subscription" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">SUBSCRIPTION & PLANS</div>
                  <h1>Available Pricing Plans</h1>
                  <p>Choose a plan configured by the administrator to renew or upgrade your subscription.</p>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-xl border bg-card flex justify-between items-center">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Active Admin UPI ID for Payments</span>
                  <div className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{subscriptionUpiId}</div>
                </div>
                <button className="quiet-btn flex items-center gap-1.5" onClick={copyUpi}>
                  <Copy size={16} /> Copy UPI
                </button>
              </div>

              <div className="pricing-grid grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {plans.map((p) => (
                  <div className={"plan-card bg-card border rounded-xl p-6 flex flex-col justify-between shadow-sm relative " + (p.name === "Growth" ? "border-indigo-500 ring-1 ring-indigo-500" : "")} key={p.id}>
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"><CreditCard size={20} /></span>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">Active</span>
                      </div>
                      <h2 className="text-xl font-bold">{p.name}</h2>
                      <div className="text-2xl font-black my-2">{money(p.price)} <span className="text-sm font-normal text-muted-foreground">/ {p.period}</span></div>
                      <p className="text-sm text-muted-foreground mt-2">{p.features}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t">
                      <button className="primary-btn w-full flex items-center justify-center gap-2" onClick={() => handleChoosePlan(p)}>
                        Choose Plan <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="settings-grid">
                <section className="panel settings-panel">
                  <h2>Request validity extension & upload proof</h2>
                  <p>After completing payment via the QR code or UPI ID, upload your payment receipt screenshot below.</p>
                  <label className="block space-y-1 mt-3">
                    <span className="text-sm font-medium">Payment Screenshot</span>
                    <input type="file" accept="image/*" onChange={(e) => setExtensionFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
                  </label>
                  <label className="block space-y-1 pt-3">
                    <span className="text-sm font-medium">Transaction Note / Reference Number</span>
                    <textarea value={extensionMessage} onChange={(e) => setExtensionMessage(e.target.value)} placeholder="UTR / Transaction reference..." className="w-full p-2 border rounded-md text-sm bg-transparent" />
                  </label>
                  <button className="primary-btn mt-4" onClick={requestExtension} disabled={extensionBusy}>
                    <Upload size={16} /> {extensionBusy ? "Uploading…" : "Submit Proof to Admin"}
                  </button>
                </section>
              </div>
            </>
          )}

          {/* 9. SETTINGS WITH PASSWORD RESET */}
          {view === "settings" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">WORKSPACE PREFERENCES</div>
                  <h1>Settings</h1>
                  <p>Store details, security, and your point-of-sale experience.</p>
                </div>
              </div>
              <div className="settings-grid">
                <section className="panel settings-panel">
                  <h2>Restaurant identity</h2>
                  <div className="settings-fields">
                    <label>Restaurant name<input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} /></label>
                    <label>Phone number<input value={storeForm.phone} onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })} /></label>
                    <label>Address<input value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} /></label>
                    <label>GSTIN<input value={storeForm.gstin} onChange={(e) => setStoreForm({ ...storeForm, gstin: e.target.value })} /></label>
                  </div>
                  <button className="primary-btn mt-3" onClick={() => toast.success("Details saved successfully!")}>Save details</button>
                </section>

                <section className="panel settings-panel">
                  <h2>Password & Security</h2>
                  <p className="text-sm text-muted-foreground mb-4">Reset your login password for this restaurant account.</p>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <label className="block space-y-1">
                      <span className="text-sm font-medium">New Password</span>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2 border rounded-md text-sm bg-transparent"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm font-medium">Confirm New Password</span>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2 border rounded-md text-sm bg-transparent"
                      />
                    </label>
                    <button type="submit" className="primary-btn flex items-center gap-2" disabled={pwdBusy}>
                      <KeyRound size={16} /> {pwdBusy ? "Resetting…" : "Reset Password"}
                    </button>
                  </form>
                </section>
              </div>
            </>
          )}

          {/* 10. ADMIN: RESTAURANTS DIRECTORY & SUBSCRIPTION APPROVALS */}
          {view === "restaurants" && isAdmin && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">PLATFORM CONTROL</div>
                  <h1>Restaurants & Subscription Approvals</h1>
                  <p>Review restaurant payment proofs and manage registered venues.</p>
                </div>
                <button className="primary-btn" onClick={() => open("restaurant")}><Plus size={17} /> Add restaurant</button>
              </div>

              <section className="panel management-panel mb-6">
                <div className="panel-header flex justify-between items-center">
                  <div>
                    <h2>
                      Pending Subscription Requests{" "}
                      <span className="count-pill">{subscriptionRequests.length}</span>
                    </h2>
                    <p>Live incoming payment screenshots from restaurant owners.</p>
                  </div>
                  <button className="quiet-btn text-xs flex items-center gap-1" onClick={fetchSubscriptionRequests}>
                    Refresh List
                  </button>
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
                        <th>ACTION</th>
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
                          <td><span className="status paid">{req.plan}</span></td>
                          <td>
                            {req.screenshot_url ? (
                              <a
                                href={req.screenshot_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 underline text-xs font-semibold inline-flex items-center gap-1"
                              >
                                View Proof <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">No screenshot</span>
                            )}
                          </td>
                          <td className="text-sm max-w-xs truncate">{req.message || "—"}</td>
                          <td>
                            <button
                              className="primary-btn text-xs py-1 px-3"
                              onClick={() => reviewExtensionRequest(req.id, req.restaurant_id)}
                            >
                              Approve Renewal
                            </button>
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

              <div className="panel management-panel">
                <div className="panel-header">
                  <div>
                    <h2>Restaurant Directory</h2>
                    <p>Registered restaurants on RestoPulse</p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr><th>RESTAURANT</th><th>OWNER</th><th>PLAN</th><th>STATUS</th><th>RENEWAL</th></tr>
                    </thead>
                    <tbody>
                      {restaurants.map((r: any) => (
                        <tr key={r.id}>
                          <td><b>{r.name}</b></td>
                          <td>{r.owner}</td>
                          <td>{r.plan}</td>
                          <td><span className="status paid">{r.status}</span></td>
                          <td>{r.renewal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 11. ADMIN: REAL ONBOARDING APPROVALS (REPLACES DUMMY DATA) */}
          {view === "approvals" && isAdmin && (
            <>
              <div className="page-head flex justify-between items-center">
                <div>
                  <div className="eyebrow">ONBOARDING PIPELINE</div>
                  <h1>
                    Pending Approvals{" "}
                    <span className="heading-count">{approvals.length}</span>
                  </h1>
                  <p>Review real restaurant accounts waiting to join RestoPulse.</p>
                </div>
                <button className="quiet-btn text-xs" onClick={fetchRealApprovals}>
                  Refresh
                </button>
              </div>
              <div className="approval-grid">
                {approvals.map((a) => (
                  <div className="approval-card" key={a.id}>
                    <div className="approval-top">
                      <span className="approval-avatar">{a.name.slice(0, 2).toUpperCase()}</span>
                      <span className="status trial">Pending Review</span>
                    </div>
                    <h2>{a.name}</h2>
                    <p>
                      {a.city} · Submitted {a.submitted}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                      {a.owner && <div>Owner: <b>{a.owner}</b></div>}
                      {a.email && <div>Email: <b>{a.email}</b></div>}
                      {a.phone && <div>Phone: <b>{a.phone}</b></div>}
                      {a.plan && <div>Requested Plan: <b className="text-indigo-600">{a.plan}</b></div>}
                    </div>
                    <div className="approval-doc mt-2">
                      <BadgeCheck size={16} />
                      <span>{a.docs}</span>
                    </div>
                    <div className="approval-actions mt-4 flex gap-2">
                      <button
                        className="primary-btn"
                        onClick={() => handleReviewRestaurantApproval(a.id, "approve")}
                      >
                        Approve & Activate
                      </button>
                      <button
                        className="quiet-btn text-red-600"
                        onClick={() => handleReviewRestaurantApproval(a.id, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {!approvals.length && (
                  <div className="panel empty-state">
                    All caught up. No pending restaurant registrations right now.
                  </div>
                )}
              </div>
            </>
          )}

          {/* 12. ADMIN: PRICING & UPI CONFIGURATION */}
          {view === "pricing" && isAdmin && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">SUBSCRIPTION MANAGEMENT</div>
                  <h1>Pricing plans & Admin UPI Configuration</h1>
                  <p>Configure plans and update the UPI ID used by restaurants for payments.</p>
                </div>
                <button className="primary-btn" onClick={() => open("plan")}><Plus size={17} /> Add plan</button>
              </div>
              <section className="panel settings-panel mb-6">
                <h2>Restaurant payment UPI ID</h2>
                <div className="settings-fields mt-3">
                  <label>Admin UPI ID<input value={adminUpiId} onChange={(e) => setAdminUpiId(e.target.value)} placeholder="merchant@upi" /></label>
                </div>
                <button className="primary-btn mt-3" onClick={saveAdminUpi} disabled={adminUpiBusy}>Save Admin UPI ID</button>
              </section>
              <div className="pricing-grid grid md:grid-cols-4 gap-4">
                {plans.map((p) => (
                  <div key={p.id} className="p-4 bg-card border rounded-xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{p.name}</h3>
                      <p className="text-xl font-black mt-1">{money(p.price)} <small className="text-xs font-normal">/{p.period}</small></p>
                      <p className="text-xs text-muted-foreground mt-2">{p.features}</p>
                    </div>
                    <div className="mt-4 flex gap-2 border-t pt-3">
                      <button className="text-xs quiet-btn" onClick={() => open("plan", p.id)}><Pencil size={14} /> Edit</button>
                      <button className="text-xs text-red-600 quiet-btn" onClick={() => setPlans((old) => old.filter((x) => x.id !== p.id))}><Trash2 size={14} /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {mobileNav && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}

      {/* Inventory Add/Edit Modal */}
      <Dialog open={modal === "inventory"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingInvId !== null ? "Edit Stock Item" : "Add New Stock Item"}</DialogTitle>
            <DialogDescription>Enter item details, quantity, and reorder threshold for stock tracking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Item Name</span>
              <input
                type="text"
                value={invForm.name}
                onChange={(e) => setInvForm({ ...invForm, name: e.target.value })}
                placeholder="e.g. Basmati Rice, Refined Oil"
                className="w-full p-2 border rounded-md text-sm bg-transparent"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Category</span>
              <select
                value={invForm.category}
                onChange={(e) => setInvForm({ ...invForm, category: e.target.value })}
                className="w-full p-2 border rounded-md text-sm bg-transparent"
              >
                <option value="Grains">Grains</option>
                <option value="Oils">Oils & Fats</option>
                <option value="Dairy">Dairy</option>
                <option value="Produce">Produce / Vegetables</option>
                <option value="Spices">Spices & Condiments</option>
                <option value="Beverages">Beverages</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Quantity On Hand</span>
                <input
                  type="number"
                  min="0"
                  value={invForm.onHand}
                  onChange={(e) => setInvForm({ ...invForm, onHand: e.target.value })}
                  placeholder="10"
                  className="w-full p-2 border rounded-md text-sm bg-transparent"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Unit</span>
                <input
                  type="text"
                  value={invForm.unit}
                  onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
                  placeholder="bags, kg, tins"
                  className="w-full p-2 border rounded-md text-sm bg-transparent"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Reorder Threshold (Low Stock Warning Level)</span>
              <input
                type="number"
                min="0"
                value={invForm.reorderLevel}
                onChange={(e) => setInvForm({ ...invForm, reorderLevel: e.target.value })}
                placeholder="5"
                className="w-full p-2 border rounded-md text-sm bg-transparent"
              />
            </label>
          </div>
          <DialogFooter>
            <button className="quiet-btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="primary-btn" onClick={handleAddOrEditInventory}>Save Item</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Add/Edit Entity Modal */}
      <Dialog open={!!modal && modal !== "inventory"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="modal-content">
          <DialogHeader>
            <DialogTitle>
              {modal === "plan" ? (editing ? "Edit Plan" : "Add Plan")
                : modal === "dish" ? (editing ? "Edit Dish" : "Add Dish")
                : modal === "supplier" ? (editing ? "Edit Supplier" : "Add Supplier")
                : modal === "employee" ? (editing ? "Edit Employee" : "Add Employee")
                : modal === "expense" ? "Log Expense"
                : modal === "restaurant" ? "Add Restaurant"
                : "Record Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="modal-fields">
            {modal === "plan" && (
              <>
                <label>Plan name<input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label>Price (₹)<input type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
                <label>Features<input value={form.features || ""} onChange={(e) => setForm({ ...form, features: e.target.value })} /></label>
              </>
            )}
            {modal === "dish" && (
              <>
                <label>Dish name<input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label>Category<input value={form.category || "Mains"} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
                <label>Price (₹)<input type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
                <label>Food cost (₹)<input type="number" value={form.cost || ""} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></label>
              </>
            )}
            {modal === "expense" && (
              <>
                <label>Description<input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label>Amount (₹)<input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
                <label>Vendor<input value={form.vendor || ""} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></label>
              </>
            )}
            {modal === "supplier" && (
              <>
                <label>Supplier name<input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label>Phone<input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
                <label>Contact person<input value={form.contact || ""} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></label>
              </>
            )}
            {modal === "employee" && (
              <>
                <label>Full name<input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label>Role<input value={form.role || ""} onChange={(e) => setForm({ ...form, role: e.target.value })} /></label>
                <label>Daily wage (₹)<input type="number" value={form.dailyRate || ""} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} /></label>
              </>
            )}
            {modal === "restaurant" && (
              <>
                <label>Restaurant name<input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label>Owner name<input value={form.owner || ""} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></label>
                <label>City<input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
              </>
            )}
            {modal === "payment" && (
              <>
                <label>Supplier
                  <select value={form.supplierId || ""} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                    <option value="">Select supplier</option>
                    {suppliers.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
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

      {/* RECEIPT POPUP DIALOG */}
      <Dialog open={!!receipt} onOpenChange={(v) => !v && setReceipt(null)}>
        <DialogContent className="receipt-dialog max-w-sm">
          <DialogHeader>
            <DialogTitle>Bill Details & Receipt</DialogTitle>
            <DialogDescription>Order {receipt?.id} · {receipt?.status}</DialogDescription>
          </DialogHeader>
          {receipt && (
            <div className="p-4 bg-white text-gray-900 rounded-lg font-mono text-xs space-y-2 border">
              <div className="text-center font-bold text-sm">{receipt.business?.name || "The Saffron Table"}</div>
              <div className="text-center text-[10px] text-gray-500">{receipt.business?.address}</div>
              <div className="border-b border-dashed my-2" />
              <div className="flex justify-between">
                <span>Bill: {receipt.id}</span>
                <span>{receipt.type} {receipt.table ? `· ${receipt.table}` : ''}</span>
              </div>
              <div className="text-[10px] text-gray-500">{receipt.issuedAt}</div>
              <div className="border-b border-dashed my-2" />
              <div className="space-y-1">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.qty}x {item.name}</span>
                    <span>{money(item.qty * item.unitPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="border-b border-dashed my-2" />
              <div className="flex justify-between"><span>Subtotal:</span><span>{money(receipt.subtotal)}</span></div>
              {receipt.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount:</span><span>−{money(receipt.discount)}</span></div>}
              <div className="flex justify-between"><span>Tax (5%):</span><span>{money(receipt.tax)}</span></div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t"><span>Total:</span><span>{money(receipt.total)}</span></div>
              <div className="text-center text-[10px] text-gray-500 pt-2">{receipt.business?.receipt_footer}</div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <button className="quiet-btn" onClick={() => setReceipt(null)}>Close</button>
            <button className="primary-btn flex items-center gap-1.5" onClick={() => window.print()}>
              <Printer size={16} /> Print Receipt
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DYNAMIC SCANNABLE QR CODE MODAL FOR CHOSEN SUBSCRIPTION PLAN */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Pay for {selectedPlanForPayment?.name || 'Subscription'}</DialogTitle>
            <DialogDescription>
              Amount to Pay: <strong className="text-base text-gray-900 dark:text-gray-100">{money(selectedPlanForPayment?.price || 0)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border space-y-3">
            <div className="p-2 border-2 border-dashed border-gray-300 rounded-xl bg-white shadow-inner flex items-center justify-center">
              <img
                src={qrImageUrl}
                alt="UPI Payment QR Code"
                className="w-48 h-48 object-contain rounded-lg"
              />
            </div>
            <div className="text-center">
              <span className="text-[11px] text-gray-500 block">Scan using any UPI App (GPay / PhonePe / Paytm)</span>
              <p className="text-xs font-mono font-bold text-indigo-600 mt-1 select-all">{subscriptionUpiId}</p>
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <button className="primary-btn w-full flex items-center justify-center gap-2" onClick={paySelectedPlan}>
              <ExternalLink size={16} /> Open UPI App Directly
            </button>
          </div>
          <DialogFooter>
            <button className="quiet-btn w-full" onClick={() => setShowQrModal(false)}>Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
