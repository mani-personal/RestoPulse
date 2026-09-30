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
  AlertTriangle,
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

const initialApprovals: { id: number; name: string; city: string; submitted: string; docs: string; status: string }[] = [];

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

type ExtensionRequest = {
  restaurant_id: string;
  requested_at: string;
  message: string;
  status: string;
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
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<{
    name: string;
    logo_url: string | null;
    address: string;
    business_phone: string;
    gstin: string;
    receipt_footer: string;
  } | null>(null);
  const [storeForm, setStoreForm] = useState({ name: "", phone: "", address: "", gstin: "", footer: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [supplierDetail, setSupplierDetail] = useState<string | null>(null);
  const [dishFile, setDishFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [profileMenu, setProfileMenu] = useState(false);
  const [accountRole, setAccountRole] = useState<"admin" | "restaurant">("admin");
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [wages, setWages] = useState<Wage[]>(initialWages);
  const [wageForm, setWageForm] = useState({ date: new Date().toLocaleDateString("en-CA"), amount: "", note: "" });
  const [printSize, setPrintSize] = useState<"58mm" | "85mm" | "A4">("58mm");
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [dishes, setDishes] = useState(initialDishes);
  const [plans, setPlans] = useState(initialPlans);
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [orderType, setOrderType] = useState("Dine-in");
  const [table, setTable] = useState("T04");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [payment, setPayment] = useState("UPI");
  const [cash, setCash] = useState("");
  const [sound, setSound] = useState(false);
  const [receipt, setReceipt] = useState<Bill | null>(null);
  const [orders, setOrders] = useState<Sale[]>(initialSales);
  const [modal, setModal] = useState<"plan" | "dish" | "expense" | "restaurant" | "extend" | "employee" | "supplier" | "payment" | "inventory" | null>(null);
  const [editing, setEditing] = useState<number | string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [dateRange, setDateRange] = useState("This week");

  // Inventory Manager State
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([
    { id: 1, name: "Basmati Rice", category: "Grains", onHand: 12, unit: "bags", reorderLevel: 5 },
    { id: 2, name: "Refined Cooking Oil", category: "Oils", onHand: 3, unit: "tins", reorderLevel: 6 },
    { id: 3, name: "Whole Wheat Flour", category: "Grains", onHand: 18, unit: "bags", reorderLevel: 10 },
    { id: 4, name: "Fresh Paneer", category: "Dairy", onHand: 0, unit: "kg", reorderLevel: 4 },
  ]);
  const [invForm, setInvForm] = useState({ name: "", category: "Grains", onHand: "", unit: "bags", reorderLevel: "5" });
  const [editingInvId, setEditingInvId] = useState<string | number | null>(null);

  const [adminUpiId, setAdminUpiId] = useState("");
  const [adminUpiBusy, setAdminUpiBusy] = useState(false);
  const [subscriptionUpiId, setSubscriptionUpiId] = useState("");
  const [extensionRequest, setExtensionRequest] = useState<ExtensionRequest | null>(null);
  const [extensionMessage, setExtensionMessage] = useState("");
  const [extensionFile, setExtensionFile] = useState<File | null>(null);
  const [extensionBusy, setExtensionBusy] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [subscriptionRequests, setSubscriptionRequests] = useState<Array<any>>([]);

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
      setAccountRole(platform ? "admin" : "restaurant");
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
          const session = (await db.auth.getSession()).data.session;
          const reqRes = await fetch("/api/admin/subscriptions", {
            headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
          });
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
  }, [isAdmin, tenantId, db]);

  useEffect(() => {
    if (!tenantId) return;
    try {
      const raw = localStorage.getItem(`rp-inventory-list:${tenantId}`);
      if (raw) setInventoryList(JSON.parse(raw));
    } catch {}
  }, [tenantId]);

  const saveInventoryToStorage = (updated: InventoryItem[]) => {
    setInventoryList(updated);
    if (tenantId) {
      localStorage.setItem(`rp-inventory-list:${tenantId}`, JSON.stringify(updated));
    }
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

  const uploadImage = async (file: File, kind: "dish" | "logo" | "screenshot") => {
    if (!db) throw new Error("Database client not available");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)
      throw new Error("Upload a JPG, PNG, or WebP under 5 MB");
    const path = `${tenantId || "admin"}/${kind}/${crypto.randomUUID()}.${
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
    }`;
    const { error } = await db.storage.from("restaurant-media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return db.storage.from("restaurant-media").getPublicUrl(path).data.publicUrl;
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
  const currentRestaurant = restaurants.find((r) => String(r.id) === String(tenantId));

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
      if (!isAdmin) {
        toast.error("Platform admin access required");
        return;
      }
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
      if (!db || !tenantId) return;
      let imageUrl = editing ? dishes.find((x) => x.id === editing)?.imageUrl : undefined;
      if (dishFile) {
        try {
          imageUrl = await uploadImage(dishFile, "dish");
        } catch (err) {
          toast.error(String(err));
          return;
        }
      }
      const payload = {
        restaurant_id: tenantId,
        name: d.name,
        category: d.category,
        price: d.price,
        cost: d.cost,
        available: editing ? dishes.find((x) => x.id === editing)?.stock ?? true : true,
        emoji: d.emoji,
        diet: d.diet,
        prep_minutes: d.time,
        image_url: imageUrl || null,
      };
      const result = editing
        ? await db.from("menu_items").update(payload).eq("id", editing).eq("restaurant_id", tenantId).select().single()
        : await db.from("menu_items").insert(payload).select().single();
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      d.id = result.data.id;
      d.imageUrl = imageUrl;
      setDishes((old) => (editing ? old.map((x) => (x.id === editing ? { ...d, stock: x.stock } : x)) : [...old, d]));
      setDishFile(null);
      toast.success(editing ? "Dish updated" : "Dish added");
    }
    if (modal === "expense") {
      if (!form.name?.trim() || Number(form.amount) <= 0) {
        toast.error("Enter a description and amount");
        return;
      }
      if (!db || !tenantId) {
        toast.error("Sign in to a restaurant");
        return;
      }
      const supplier = suppliers.find((x) => x.id === form.supplierId);
      const { data, error } = await db
        .from("expenses")
        .insert({
          restaurant_id: tenantId,
          supplier_id: supplier?.id || null,
          name: form.name,
          category: form.category || "Inventory",
          vendor: supplier?.name || form.vendor || "—",
          amount: Number(form.amount),
          incurred_on: form.date || new Date().toISOString().slice(0, 10),
        })
        .select()
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      setExpenses((old) => [
        {
          id: data.id,
          name: data.name,
          category: data.category,
          vendor: data.vendor,
          amount: Number(data.amount),
          date: data.incurred_on,
          supplierId: data.supplier_id,
        },
        ...old,
      ]);
      toast.success("Expense recorded");
    }
    if (modal === "restaurant") {
      if (!isAdmin || !db) {
        toast.error("Platform admin access required");
        return;
      }
      const session = (await db.auth.getSession()).data.session;
      if (!session) {
        toast.error("Sign in required");
        return;
      }
      const response = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Could not add restaurant");
        return;
      }
      const r = result.restaurant;
      setRestaurants((old) => [
        {
          id: r.id,
          name: r.name,
          owner: r.owner_name,
          email: r.owner_email,
          phone: r.owner_phone,
          city: r.city,
          plan: r.plan,
          status: r.status,
          renewal: r.renewal_on,
          initial: r.name.slice(0, 2).toUpperCase(),
        },
        ...old,
      ]);
      setForm({});
      toast.success("Restaurant and owner account created");
    }
    if (modal === "supplier") {
      if (!db || !tenantId) return;
      const name = form.name?.trim();
      if (!name) {
        toast.error("Enter a supplier name");
        return;
      }
      const payload = {
        restaurant_id: tenantId,
        name,
        contact_name: form.contact || "",
        phone: form.phone || "",
        email: form.email || "",
      };
      const result = editing
        ? await db.from("suppliers").update(payload).eq("restaurant_id", tenantId).eq("id", editing).select().single()
        : await db.from("suppliers").insert(payload).select().single();
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      const data = result.data;
      setSuppliers((old) =>
        editing
          ? old.map((x) => (x.id === editing ? { id: data.id, name: data.name, contact: data.contact_name, phone: data.phone, email: data.email } : x))
          : [{ id: data.id, name: data.name, contact: data.contact_name, phone: data.phone, email: data.email }, ...old]
      );
      setSupplierDetail(data.id);
      toast.success(editing ? "Supplier updated" : "Supplier added");
    }
    if (modal === "payment") {
      if (!db || !tenantId || !form.supplierId || Number(form.amount) <= 0) {
        toast.error("Select a supplier and enter a positive amount");
        return;
      }
      const outstanding =
        expenses.filter((x) => x.supplierId === form.supplierId).reduce((n, x) => n + x.amount, 0) -
        supplierPayments.filter((x) => x.supplierId === form.supplierId).reduce((n, x) => n + x.amount, 0);
      if (Number(form.amount) > outstanding) {
        toast.error("Payment exceeds the outstanding balance");
        return;
      }
      const { data, error } = await db
        .from("supplier_payments")
        .insert({
          restaurant_id: tenantId,
          supplier_id: form.supplierId,
          amount: Number(form.amount),
          paid_on: form.date || new Date().toISOString().slice(0, 10),
          method: form.method || "Cash",
          note: form.note || "",
        })
        .select()
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      setSupplierPayments((old) => [
        {
          id: data.id,
          supplierId: data.supplier_id,
          amount: Number(data.amount),
          date: data.paid_on,
          method: data.method,
          note: data.note,
        },
        ...old,
      ]);
      toast.success("Payment recorded");
    }

    if (modal === "employee") {
      if (!form.name?.trim() || !form.role?.trim() || !/^\S+@\S+\.\S+$/.test(form.email || "")) {
        toast.error("Enter a name, role, and valid email");
        return;
      }
      const person: Staff = {
        id: editing ?? Date.now(),
        name: form.name.trim(),
        role: form.role.trim(),
        initial: form.name.trim().split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase(),
        shift: form.shift || "09:00 – 18:00",
        dailyRate: Math.max(0, Number(form.dailyRate) || 0),
        email: form.email.trim(),
        phone: form.phone || "",
      };
      if (!db || !tenantId) return;
      const payload = {
        restaurant_id: tenantId,
        name: person.name,
        role: person.role,
        shift: person.shift,
        daily_rate: person.dailyRate,
        email: person.email,
        phone: person.phone,
      };
      const result =
        editing !== null
          ? await db.from("employees").update(payload).eq("id", editing).eq("restaurant_id", tenantId).select().single()
          : await db.from("employees").insert(payload).select().single();
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      person.id = result.data.id;
      setStaff((old) => (editing !== null ? old.map((x) => (x.id === editing ? person : x)) : [...old, person]));
      toast.success(editing !== null ? "Employee updated" : "Employee added");
    }
    if (modal === "extend" && editing) {
      setRestaurants((old) => old.map((r) => (r.id === editing ? { ...r, renewal: form.renewal || r.renewal } : r)));
      toast.success("Subscription extended");
    }
    setModal(null);
  };

  const checkout = async () => {
    if (!cart.length) return;
    const now = new Date();
    const id = "RP-" + now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14) + "-" + crypto.randomUUID().slice(0, 4).toUpperCase();
    const time = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    const bill: Bill = {
      id,
      issuedAt: now.toLocaleString("en-IN"),
      business: tenantInfo || undefined,
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
      table,
      payment,
      status: "Paid",
    };
    if (!db || !tenantId) return;
    const { error } = await db.from("sales").insert({
      restaurant_id: tenantId,
      bill_no: id,
      placed_at: now.toISOString(),
      order_type: orderType,
      amount: total,
      status: "Paid",
      receipt: bill,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setReceipt(bill);
    setOrders((old) => [{ id, time, placedAt: now.toISOString(), amount: total, type: orderType, status: "Paid", bill }, ...old]);
    setCart([]);
    setOrderDiscount(0);
    toast.success("Payment complete · " + id);
  };

  const openStaff = (person: Staff) => {
    setSelectedStaff(person);
    setWageForm({ date: new Date().toLocaleDateString("en-CA"), amount: String(person.dailyRate), note: "" });
  };

  const addWage = async () => {
    if (!selectedStaff || !/^\d{4}-\d{2}-\d{2}$/.test(wageForm.date) || Number(wageForm.amount) <= 0) {
      toast.error("Choose a date and enter a positive daily wage");
      return;
    }
    if (wages.some((w) => w.staffId === selectedStaff.id && w.date === wageForm.date)) {
      toast.error("A wage entry already exists for this date");
      return;
    }
    if (!db || !tenantId) return;
    const { data, error } = await db
      .from("daily_wages")
      .insert({
        restaurant_id: tenantId,
        employee_id: selectedStaff.id,
        wage_date: wageForm.date,
        amount: Number(wageForm.amount),
        status: "Unpaid",
        note: wageForm.note,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setWages((old) => [
      {
        id: data.id,
        staffId: selectedStaff.id,
        date: wageForm.date,
        amount: Number(wageForm.amount),
        status: "Unpaid",
        note: wageForm.note,
      },
      ...old,
    ]);
    setWageForm((f) => ({ ...f, note: "" }));
    toast.success("Daily wage recorded");
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

  const handleChoosePlan = (plan: Plan) => {
    if (!subscriptionUpiId) {
      toast.error("Admin payment UPI ID is not configured");
      return;
    }
    setSelectedPlanForPayment(plan);
    setShowQrModal(true);
  };

  const paySelectedPlan = () => {
    if (!selectedPlanForPayment) return;
    const link = `upi://pay?pa=${encodeURIComponent(subscriptionUpiId)}&pn=RestoPulse&am=${encodeURIComponent(selectedPlanForPayment.price.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`${currentRestaurant?.name || 'Restaurant'} ${selectedPlanForPayment.name} subscription`)}`;
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

      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: tenantId,
          restaurant_name: tenantInfo?.name || "Restaurant",
          owner_name: currentRestaurant?.owner || "Owner",
          owner_email: currentRestaurant?.email || "owner@example.com",
          plan: selectedPlanForPayment?.name || "Starter Plan",
          upi_id: subscriptionUpiId,
          screenshot_url: screenshotUrl,
          message: extensionMessage.trim() || `Payment proof submitted for ${selectedPlanForPayment?.name || 'plan'}`,
        }),
      });

      if (!response.ok) {
        toast.error("Could not send request");
        return;
      }

      toast.success("Validity extension request and payment proof sent to admin!");
      setExtensionMessage("");
      setExtensionFile(null);
      setShowQrModal(false);
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
    await db.auth.signOut();
    setTenantId(null);
    setAuthUser(null);
  };

  const nav = (v: View) => {
    if (v === "pricing" && !isAdmin) {
      v = "subscription";
    }
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
          <p>Add the Supabase URL and publishable key in Vercel environment variables, then redeploy. See README.md.</p>
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

  if (!tenantId && !isAdmin)
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>No restaurant assigned</h1>
          <p>Ask the platform administrator to create your restaurant account.</p>
          <button className="quiet-btn" onClick={() => db.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );

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
            <b>{tenantInfo?.name || "Platform"}</b>
            <small>{tenantId ? "Restaurant workspace" : "Platform console"}</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-heading">RESTAURANT</div>
        <nav aria-label="Restaurant navigation">
          {navTenant
            .filter((item) => (item.id === "inventory" || item.id === "subscription" ? !!tenantId && !isAdmin : true))
            .map((item) => (
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
        <div className="nav-heading admin-heading">PLATFORM ADMIN</div>
        <nav aria-label="Platform navigation">
          {isAdmin &&
            navPlatform.map((item) => (
              <button
                key={item.id}
                className={"nav-link " + (view === item.id ? "active" : "")}
                onClick={() => nav(item.id)}
              >
                <item.icon size={18} />
                {item.label}
                {item.id === "approvals" && (
                  <span className="nav-count">{approvals.filter((x) => x.status === "Pending").length}</span>
                )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="trial-note">
            <span className="trial-icon">✦</span>
            <b>Growth plan</b>
            <p>Your workspace is in great shape. Renewal on 12 Oct 2026.</p>
            <button onClick={() => nav("pricing")}>
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
              <b>{authUser?.slice(0, 8) || "Account"}</b>
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
              <CalendarDays size={16} /> Sat, 26 Sep 2026
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

          {/* Profile Popover with Sign Out placed after Manage employees */}
          {profileMenu && (
            <div className="profile-popover">
              <div className="profile-popover-head">
                <b>{authUser?.slice(0, 8) || "Account"}</b>
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
                <span>{approvals.filter((x) => x.status === "Pending").length + 2} new</span>
              </div>
              <button onClick={() => nav("approvals")}>
                <span className="notif-icon amber">◎</span>
                <span>
                  <b>{approvals.filter((x) => x.status === "Pending").length} restaurants awaiting approval</b>
                  <small>Review registration documents</small>
                </span>
              </button>
              <button onClick={() => nav("restaurants")}>
                <span className="notif-icon teal">↗</span>
                <span>
                  <b>Nori House trial ending soon</b>
                  <small>Expires 29 Sep 2026</small>
                </span>
              </button>
              <button onClick={() => nav(isAdmin ? "pricing" : "subscription")}>
                <span className="notif-icon blue">◈</span>
                <span>
                  <b>{isAdmin ? "Subscription management" : "Your subscription"}</b>
                  <small>{isAdmin ? "Review plans and payment UPI" : "View plan, pay, or request an extension"}</small>
                </span>
              </button>
            </div>
          )}
        </header>

        <main className={"content " + (view === "pos" ? "pos-content" : "")}>
          {!tenantId && ["dashboard", "pos", "menu", "staff", "expenses", "suppliers", "settings"].includes(view) ? (
            <div className="panel empty-state">
              This account has no restaurant workspace. Add a restaurant and sign in as its owner to manage operations.
            </div>
          ) : (
            <>
              {view === "dashboard" && (
                <>
                  <div className="page-head">
                    <div>
                      <div className="eyebrow">SATURDAY, 26 SEPTEMBER 2026</div>
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
                            <XAxis
                              dataKey="day"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                              dy={12}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                              tickFormatter={(v) => `${v / 1000}k`}
                            />
                            <Tooltip
                              formatter={(v) => money(Number(v))}
                              contentStyle={{
                                background: "var(--panel)",
                                border: "1px solid var(--border)",
                                borderRadius: 12,
                                color: "var(--text)",
                              }}
                            />
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
                  <div className="bottom-grid">
                    <section className="panel recent-panel">
                      <div className="panel-header">
                        <div>
                          <h2>Recent sales</h2>
                          <p>Latest completed transactions</p>
                        </div>
                        <button className="text-btn" onClick={() => nav("pos")}>
                          Open POS <ArrowUpRight size={15} />
                        </button>
                      </div>
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>ORDER</th>
                              <th>TIME</th>
                              <th>TYPE</th>
                              <th>AMOUNT</th>
                              <th>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 5).map((o) => (
                              <tr key={o.id} className="clickable-sale" onClick={() => setReceipt(o.bill)}>
                                <td className="strong">
                                  <button
                                    className="sale-link"
                                    onClick={() => setReceipt(o.bill)}
                                    aria-label={"View receipt for " + o.id}
                                  >
                                    {o.id}
                                  </button>
                                </td>
                                <td>{o.time}</td>
                                <td>{o.type}</td>
                                <td className="strong">{money(o.amount)}</td>
                                <td>
                                  <span className={"status " + (o.status === "Paid" ? "paid" : "paused")}>
                                    {o.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                    <section className="panel heat-panel">
                      <div className="panel-header">
                        <div>
                          <h2>Peak hours</h2>
                          <p>Sales activity by time of day</p>
                        </div>
                      </div>
                      <div className="heat-bars">
                        {[28, 37, 60, 85, 97, 68, 42, 55, 91, 75, 48, 31].map((v, i) => (
                          <div key={i} className="heat-col">
                            <span style={{ height: v + "%", opacity: 0.35 + v / 150 }} />
                            <small>{i % 2 === 0 ? `${i + 10}` : ""}</small>
                          </div>
                        ))}
                      </div>
                      <div className="heat-caption">
                        10 AM <span>Peak at 2 PM & 6 PM</span> 9 PM
                      </div>
                    </section>
                  </div>
                </>
              )}

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
                              {d.imageUrl ? (
                                <img className="dish-image" src={d.imageUrl} alt={d.name} />
                              ) : (
                                <span>{d.emoji}</span>
                              )}
                              {!d.stock && <b>86'D OUT</b>}
                            </span>
                            <span className="dish-body">
                              <span className="dish-name">{d.name}</span>
                              <span className="dish-details">
                                {d.diet || d.category} · {d.time} min
                              </span>
                              <span className="dish-price">
                                {money(d.price)}
                                <span className="dish-add">
                                  <Plus size={17} />
                                </span>
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                      {displayed.length === 0 && <div className="empty-state">No dishes match your search.</div>}
                    </section>
                    <aside className="order-panel">
                      <div className="order-head">
                        <div>
                          <h2>Current order</h2>
                          <p>Order #RP-{10843 + orders.length - 4}</p>
                        </div>
                        <span className="order-count">{cart.reduce((a, x) => a + x.qty, 0)} items</span>
                      </div>
                      <div className="order-types">
                        {["Dine-in", "Takeaway", "Delivery"].map((t) => (
                          <button className={orderType === t ? "selected" : ""} onClick={() => setOrderType(t)} key={t}>
                            {t}
                          </button>
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
                                    <button aria-label={"Remove one " + d.name} onClick={() => qty(l.id, -1)}>
                                      <Minus size={13} />
                                    </button>
                                    <span>{l.qty}</span>
                                    <button aria-label={"Add one " + d.name} onClick={() => qty(l.id, 1)}>
                                      <Plus size={13} />
                                    </button>
                                    <button
                                      className="line-adjust"
                                      onClick={() => {
                                        const value = prompt("Item discount in ₹", String(l.discount));
                                        if (value !== null && Number(value) >= 0)
                                          setCart((old) =>
                                            old.map((x) => (x.id === l.id ? { ...x, discount: Number(value) } : x))
                                          );
                                      }}
                                    >
                                      Discount
                                    </button>
                                    <button
                                      className="line-adjust"
                                      onClick={() => {
                                        const pin = prompt("Manager PIN for price override (demo: 1234)");
                                        if (pin !== "1234") {
                                          toast.error("Invalid manager PIN");
                                          return;
                                        }
                                        const value = prompt("Override unit price in ₹", String(l.override ?? d.price));
                                        if (value !== null && Number(value) >= 0)
                                          setCart((old) =>
                                            old.map((x) => (x.id === l.id ? { ...x, override: Number(value) } : x))
                                          );
                                      }}
                                    >
                                      Price
                                    </button>
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
                        <div className="discount-row">
                          <span>Order discount</span>
                          <label>
                            ₹{" "}
                            <input
                              aria-label="Order discount in rupees"
                              type="number"
                              min="0"
                              value={orderDiscount}
                              onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value)))}
                            />
                          </label>
                        </div>
                        <div className="totals">
                          <div>
                            <span>Subtotal</span>
                            <b>{money(subtotal)}</b>
                          </div>
                          <div>
                            <span>Discount</span>
                            <b>−{money(totalDiscount)}</b>
                          </div>
                          <div>
                            <span>Tax (GST 5%)</span>
                            <b>{money(tax)}</b>
                          </div>
                          <div className="grand-total">
                            <span>Total due</span>
                            <strong>{money(total)}</strong>
                          </div>
                        </div>
                        <div className="payment-types">
                          {["UPI", "Cash", "Card"].map((p) => (
                            <button
                              key={p}
                              className={payment === p ? "selected" : ""}
                              onClick={() => setPayment(p)}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        {payment === "Cash" && (
                          <div className="cash-input">
                            <label>
                              Cash received{" "}
                              <input
                                type="number"
                                min="0"
                                value={cash}
                                onChange={(e) => setCash(e.target.value)}
                                placeholder="₹ Amount"
                              />
                            </label>
                            <span>Change: {money(Math.max(0, Number(cash) - total))}</span>
                          </div>
                        )}
                        <button
                          className="checkout-btn"
                          disabled={!cart.length || (payment === "Cash" && Number(cash) < total)}
                          onClick={checkout}
                        >
                          <CreditCard size={19} /> Charge {money(total)} <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </aside>
                  </div>
                </>
              )}

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
                        <h2>
                          All dishes <span className="count-pill">{dishes.length}</span>
                        </h2>
                        <p>Availability updates appear instantly in POS.</p>
                      </div>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>DISH</th>
                            <th>CATEGORY</th>
                            <th>SELLING PRICE</th>
                            <th>FOOD COST</th>
                            <th>AVAILABILITY</th>
                            <th>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dishes.map((d) => (
                            <tr key={d.id}>
                              <td>
                                <span className="table-dish">
                                  <span className="mini-emoji">{d.emoji}</span>
                                  <b>{d.name}</b>
                                </span>
                              </td>
                              <td>{d.category}</td>
                              <td className="strong">{money(d.price)}</td>
                              <td>{money(d.cost)}</td>
                              <td>
                                <label className="switch-cell">
                                  <Switch
                                    checked={d.stock}
                                    onCheckedChange={async (v) => {
                                      if (!db || !tenantId) return;
                                      const { error } = await db
                                        .from("menu_items")
                                        .update({ available: v })
                                        .eq("restaurant_id", tenantId)
                                        .eq("id", d.id);
                                      if (error) {
                                        toast.error(error.message);
                                        return;
                                      }
                                      setDishes((old) => old.map((x) => (x.id === d.id ? { ...x, stock: v } : x)));
                                    }}
                                    aria-label={"Available: " + d.name}
                                  />
                                  <span>{d.stock ? "Available" : "86’d out"}</span>
                                </label>
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button aria-label={"Edit " + d.name} onClick={() => open("dish", d.id)}>
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    aria-label={"Duplicate " + d.name}
                                    onClick={async () => {
                                      if (!db || !tenantId) return;
                                      const { data, error } = await db
                                        .from("menu_items")
                                        .insert({
                                          restaurant_id: tenantId,
                                          name: d.name + " copy",
                                          category: d.category,
                                          price: d.price,
                                          cost: d.cost,
                                          available: d.stock,
                                          emoji: d.emoji,
                                          diet: d.diet,
                                          prep_minutes: d.time,
                                          image_url: d.imageUrl || null,
                                        })
                                        .select()
                                        .single();
                                      if (error) {
                                        toast.error(error.message);
                                        return;
                                      }
                                      setDishes((old) => [...old, { ...d, id: data.id, name: data.name }]);
                                      toast.success("Dish duplicated");
                                    }}
                                  >
                                    <Plus size={17} />
                                  </button>
                                  <button
                                    aria-label={"Delete " + d.name}
                                    onClick={async () => {
                                      if (!confirm("Remove " + d.name + " from the menu?") || !db || !tenantId) return;
                                      const { error } = await db
                                        .from("menu_items")
                                        .delete()
                                        .eq("restaurant_id", tenantId)
                                        .eq("id", d.id);
                                      if (error) {
                                        toast.error(error.message);
                                        return;
                                      }
                                      setDishes((old) => old.filter((x) => x.id !== d.id));
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
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

              {view === "suppliers" && (
                <>
                  <div className="page-head">
                    <div>
                      <div className="eyebrow">SUPPLIER ACCOUNTS</div>
                      <h1>Suppliers</h1>
                      <p>Track purchases, payments, and balances due for each supplier.</p>
                    </div>
                    <div className="head-actions">
                      <button className="quiet-btn" onClick={() => open("payment")}>
                        <Wallet size={16} /> Record payment
                      </button>
                      <button className="primary-btn" onClick={() => open("supplier")}>
                        <Plus size={17} /> Add supplier
                      </button>
                    </div>
                  </div>
                  <div className="platform-stats">
                    <div>
                      <strong>{suppliers.length}</strong>
                      <span>Suppliers</span>
                    </div>
                    <div>
                      <strong>{money(expenses.filter((x) => x.supplierId).reduce((n, x) => n + x.amount, 0))}</strong>
                      <span>Purchases</span>
                    </div>
                    <div>
                      <strong>{money(supplierPayments.reduce((n, x) => n + x.amount, 0))}</strong>
                      <span>Paid</span>
                    </div>
                    <div>
                      <strong>
                        {money(
                          Math.max(
                            0,
                            expenses.filter((x) => x.supplierId).reduce((n, x) => n + x.amount, 0) -
                              supplierPayments.reduce((n, x) => n + x.amount, 0)
                          )
                        )}
                      </strong>
                      <span>Due</span>
                    </div>
                  </div>
                  <div className="supplier-layout">
                    <section className="panel supplier-list">
                      <div className="panel-header">
                        <div>
                          <h2>Supplier directory</h2>
                          <p>Select a supplier to see every transaction.</p>
                        </div>
                      </div>
                      {suppliers.map((sp) => {
                        const billed = expenses.filter((x) => x.supplierId === sp.id).reduce((n, x) => n + x.amount, 0);
                        const paid = supplierPayments.filter((x) => x.supplierId === sp.id).reduce((n, x) => n + x.amount, 0);
                        const due = Math.max(0, billed - paid);
                        return (
                          <button
                            key={sp.id}
                            className={"supplier-row " + (supplierDetail === sp.id ? "selected" : "")}
                            onClick={() => setSupplierDetail(sp.id)}
                          >
                            <span className="supplier-monogram">{sp.name.slice(0, 2).toUpperCase()}</span>
                            <span className="supplier-main">
                              <b>{sp.name}</b>
                              <small>{sp.contact || sp.phone || "Supplier account"}</small>
                            </span>
                            <span className="supplier-amount">
                              <b>{money(due)}</b>
                              <small
                                className={
                                  "status " +
                                  (billed === 0 ? "paused" : due === 0 ? "paid" : paid > 0 ? "trial" : "paused")
                                }
                              >
                                {billed === 0 ? "No activity" : due === 0 ? "Paid" : paid > 0 ? "Due" : "Pending"}
                              </small>
                            </span>
                          </button>
                        );
                      })}
                      {!suppliers.length && (
                        <div className="empty-state">Add a supplier to start tracking purchases and payments.</div>
                      )}
                    </section>
                    <section className="panel supplier-ledger">
                      {supplierDetail ? (
                        (() => {
                          const sp = suppliers.find((x) => x.id === supplierDetail);
                          const billed = expenses.filter((x) => x.supplierId === supplierDetail).reduce((n, x) => n + x.amount, 0);
                          const paid = supplierPayments.filter((x) => x.supplierId === supplierDetail).reduce((n, x) => n + x.amount, 0);
                          const lines = [
                            ...expenses
                              .filter((x) => x.supplierId === supplierDetail)
                              .map((x) => ({ id: String(x.id), date: x.date, label: x.name, kind: "Purchase", amount: x.amount })),
                            ...supplierPayments
                              .filter((x) => x.supplierId === supplierDetail)
                              .map((x) => ({ id: x.id, date: x.date, label: x.note || x.method, kind: "Payment", amount: x.amount })),
                          ].sort((a, b) => b.date.localeCompare(a.date));
                          return (
                            <>
                              <div className="panel-header">
                                <div>
                                  <h2>{sp?.name}</h2>
                                  <p>{sp?.email || sp?.phone || "Transaction history"}</p>
                                  <button className="text-btn" onClick={() => open("supplier", supplierDetail)}>
                                    Edit supplier <Pencil size={14} />
                                  </button>
                                </div>
                                <button
                                  className="text-btn"
                                  onClick={() => {
                                    open("payment");
                                    setForm({ supplierId: supplierDetail });
                                  }}
                                >
                                  Record payment <Plus size={15} />
                                </button>
                              </div>
                              <div className="supplier-totals">
                                <div>
                                  <span>Purchases</span>
                                  <strong>{money(billed)}</strong>
                                </div>
                                <div>
                                  <span>Paid</span>
                                  <strong>{money(paid)}</strong>
                                </div>
                                <div>
                                  <span>Balance due</span>
                                  <strong>{money(Math.max(0, billed - paid))}</strong>
                                </div>
                              </div>
                              <div className="table-scroll">
                                <table>
                                  <thead>
                                    <tr>
                                      <th>DATE</th>
                                      <th>TRANSACTION</th>
                                      <th>TYPE</th>
                                      <th>AMOUNT</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lines.map((x) => (
                                      <tr key={x.id}>
                                        <td>{x.date}</td>
                                        <td className="strong">{x.label}</td>
                                        <td>
                                          <span className={"status " + (x.kind === "Payment" ? "paid" : "trial")}>
                                            {x.kind}
                                          </span>
                                        </td>
                                        <td className="strong">
                                          {x.kind === "Payment" ? "−" : "+"}
                                          {money(x.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {!lines.length && (
                                <div className="empty-state">No transactions yet. Log an expense and assign this supplier.</div>
                              )}
                            </>
                          );
                        })()
                      ) : (
                        <div className="empty-state">Select a supplier to see purchases, payments, and the balance due.</div>
                      )}
                    </section>
                  </div>
                </>
              )}

              {/* PROFESSIONAL INVENTORY MANAGER CONSOLE */}
              {view === "inventory" && (
                <>
                  <div className="page-head flex justify-between items-center">
                    <div>
                      <div className="eyebrow">WAREHOUSE & STOCK CONTROL</div>
                      <h1>Inventory Manager</h1>
                      <p>Add, edit, and track inventory stock items. Real-time alerts flag low or out-of-stock items for reordering.</p>
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
                      <span>Low Stock Items ⚠️️</span>
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
                                    <button
                                      className="p-1.5 border rounded hover:bg-muted"
                                      onClick={() => openInventoryModal(item)}
                                      title="Edit Item"
                                    >
                                      <Pencil size={15} />
                                    </button>
                                    <button
                                      className="p-1.5 border rounded hover:bg-red-50 text-red-600"
                                      onClick={() => handleDeleteInventory(item.id)}
                                      title="Delete Item"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {!inventoryList.length && (
                            <tr>
                              <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                No inventory items added yet. Click "Add Stock Item" above.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* DYNAMIC SUBSCRIPTION PLANS VIEW (SYNCS PRICING PLANS CREATED BY ADMIN & SHOWS 'CHOOSE A PLAN') */}
              {view === "subscription" && tenantId && !isAdmin && (
                <>
                  <div className="page-head">
                    <div>
                      <div className="eyebrow">SUBSCRIPTION & PLANS</div>
                      <h1>Available Pricing Plans</h1>
                      <p>Choose a plan configured by the administrator to renew or upgrade your subscription.</p>
                    </div>
                  </div>

                  <div className="pricing-grid grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {plans.map((p, i) => (
                      <div className={"plan-card bg-card border rounded-xl p-6 flex flex-col justify-between shadow-sm relative " + (p.name === "Growth" || p.name === "Starter" ? "border-indigo-500 ring-1 ring-indigo-500" : "")} key={p.id}>
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                              <CreditCard size={20} />
                            </span>
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </div>
                          <h2 className="text-xl font-bold">{p.name}</h2>
                          <div className="text-2xl font-black my-2">
                            {money(p.price)} <span className="text-sm font-normal text-muted-foreground">/ {p.period}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{p.features}</p>
                        </div>
                        <div className="mt-6 pt-4 border-t">
                          <button
                            className="primary-btn w-full flex items-center justify-center gap-2"
                            onClick={() => handleChoosePlan(p)}
                          >
                            Choose Plan <ArrowUpRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="settings-grid">
                    <section className="panel settings-panel">
                      <h2>Request validity extension & upload payment proof</h2>
                      <p>After choosing a plan and paying via the QR code, upload your receipt screenshot below.</p>
                      
                      <label className="block space-y-1 mt-3">
                        <span className="text-sm font-medium">Payment Screenshot / Receipt</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setExtensionFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </label>

                      <label className="block space-y-1 pt-3">
                        <span className="text-sm font-medium">Transaction Note / Reference Number</span>
                        <textarea
                          value={extensionMessage}
                          onChange={(e) => setExtensionMessage(e.target.value)}
                          maxLength={500}
                          placeholder="UTR / Transaction reference..."
                          className="w-full p-2 border rounded-md text-sm bg-transparent"
                        />
                      </label>

                      <button
                        className="primary-btn mt-4"
                        onClick={requestExtension}
                        disabled={extensionBusy}
                      >
                        <Upload size={16} />
                        {extensionBusy ? "Uploading Proof…" : "Submit Proof to Admin"}
                      </button>
                    </section>
                  </div>
                </>
              )}

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
                      <div
                        className="staff-card"
                        key={s.name}
                        role="button"
                        tabIndex={0}
                        onClick={() => openStaff(s)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openStaff(s);
                          }
                        }}
                      >
                        <span className={"staff-avatar a" + i}>{s.initial}</span>
                        <span className="staff-name">{s.name}</span>
                        <span className="staff-role">{s.role}</span>
                        <span className="staff-manage">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              open("employee", s.id);
                            }}
                            aria-label={"Edit " + s.name}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Deactivate " + s.name + "?") && db && tenantId) {
                                db.from("employees")
                                  .update({ active: false })
                                  .eq("restaurant_id", tenantId)
                                  .eq("id", s.id)
                                  .then(({ error }: { error: any }) => {
                                    if (error) toast.error(error.message);
                                    else setStaff((old) => old.filter((x) => x.id !== s.id));
                                  });
                              }
                            }}
                            aria-label={"Deactivate " + s.name}
                          >
                            <Trash2 size={15} />
                          </button>
                        </span>
                        <span className="staff-divider" />
                        <span className="staff-meta">
                          <span>Today’s shift</span>
                          <b>{s.shift}</b>
                        </span>
                        <span className="staff-meta">
                          <span>Base pay</span>
                          <b>{money(s.dailyRate)} / day</b>
                        </span>
                        <span className="staff-view">
                          View profile <ArrowUpRight size={15} />
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="panel pay-note">
                    <Wallet size={21} />
                    <div>
                      <b>Payroll overview</b>
                      <p>
                        {money(wages.filter((w) => w.status === "Paid").reduce((sum, w) => sum + w.amount, 0))} paid ·{" "}
                        {money(wages.filter((w) => w.status === "Unpaid").reduce((sum, w) => sum + w.amount, 0))} due across recorded daily wages.
                      </p>
                    </div>
                  </div>
                </>
              )}

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
                  <div className="expense-summary">
                    <div>
                      <span>Recorded expenses</span>
                      <strong>{money(expenses.reduce((a, x) => a + x.amount, 0))}</strong>
                      <small>Included in net profit</small>
                    </div>
                    <div>
                      <span>Transactions</span>
                      <strong>{expenses.length}</strong>
                      <small>Across {new Set(expenses.map((x) => x.category)).size} categories</small>
                    </div>
                    <div>
                      <span>Largest category</span>
                      <strong>
                        {expenses.length ? [...expenses].sort((a, b) => b.amount - a.amount)[0].category : "—"}
                      </strong>
                      <small>Based on recorded costs</small>
                    </div>
                  </div>
                  <div className="panel management-panel">
                    <div className="panel-header">
                      <div>
                        <h2>Expense ledger</h2>
                        <p>Recent operational spending</p>
                      </div>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>DESCRIPTION</th>
                            <th>CATEGORY</th>
                            <th>VENDOR</th>
                            <th>DATE</th>
                            <th>AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((e) => (
                            <tr key={e.id}>
                              <td className="strong">{e.name}</td>
                              <td>
                                <span className="category-badge">{e.category}</span>
                              </td>
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

              {view === "settings" && (
                <>
                  <div className="page-head">
                    <div>
                      <div className="eyebrow">WORKSPACE PREFERENCES</div>
                      <h1>Settings</h1>
                      <p>Store details and your point-of-sale experience.</p>
                    </div>
                  </div>
                  <div className="settings-grid">
                    <section className="panel settings-panel">
                      <h2>Restaurant identity</h2>
                      <p>Information shown on receipts and invoices.</p>
                      <label className="logo-upload">
                        Restaurant logo {tenantInfo?.logo_url && <img src={tenantInfo.logo_url} alt="Current restaurant logo" />}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={logoUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !tenantId) return;
                            setLogoUploading(true);
                            try {
                              const url = await uploadImage(file, "logo");
                              const { error } = await db.from("restaurants").update({ logo_url: url }).eq("id", tenantId);
                              if (error) throw error;
                              setTenantInfo((old) => (old ? { ...old, logo_url: url } : old));
                              toast.success("Logo updated");
                            } catch (err) {
                              toast.error(String(err));
                            } finally {
                              setLogoUploading(false);
                            }
                          }}
                        />
                        <small>{logoUploading ? "Uploading…" : "JPG, PNG or WebP · up to 5 MB"}</small>
                      </label>
                      <div className="settings-fields">
                        <label>
                          Restaurant name
                          <input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} />
                        </label>
                        <label>
                          Phone number
                          <input value={storeForm.phone} onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })} />
                        </label>
                        <label>
                          Address
                          <input value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} />
                        </label>
                        <label>
                          GSTIN
                          <input value={storeForm.gstin} onChange={(e) => setStoreForm({ ...storeForm, gstin: e.target.value })} />
                        </label>
                      </div>
                      <button
                        className="primary-btn"
                        onClick={async () => {
                          if (!tenantId || !storeForm.name.trim()) return;
                          const payload = {
                            name: storeForm.name.trim(),
                            business_phone: storeForm.phone,
                            address: storeForm.address,
                            gstin: storeForm.gstin,
                            receipt_footer: storeForm.footer,
                          };
                          const { error } = await db.from("restaurants").update(payload).eq("id", tenantId);
                          if (error) {
                            toast.error(error.message);
                            return;
                          }
                          setTenantInfo((old) => (old ? { ...old, ...payload } : old));
                          toast.success("Restaurant details saved");
                        }}
                      >
                        Save details
                      </button>
                    </section>
                    <section className="panel settings-panel">
                      <h2>Regional & receipt settings</h2>
                      <p>Choose how your team sees prices and prints bills.</p>
                      <div className="settings-fields">
                        <label>
                          Currency
                          <select defaultValue="INR">
                            <option value="INR">INR · Indian rupee</option>
                            <option>USD · US dollar</option>
                            <option>EUR · Euro</option>
                            <option>GBP · Pound sterling</option>
                          </select>
                        </label>
                        <label>
                          Time zone
                          <select defaultValue="Asia/Kolkata">
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option>UTC</option>
                          </select>
                        </label>
                        <label>
                          Tax rate
                          <input defaultValue="GST 5%" />
                        </label>
                        <label>
                          Receipt footer
                          <input value={storeForm.footer} onChange={(e) => setStoreForm({ ...storeForm, footer: e.target.value })} />
                        </label>
                      </div>
                      <button
                        className="primary-btn"
                        onClick={() =>
                          toast.info(
                            "Currency and tax changes require an accounting configuration update; receipt footer saves with restaurant details"
                          )
                        }
                      >
                        Save preferences
                      </button>
                    </section>
                    <section className="panel settings-panel">
                      <h2>Appearance & sound</h2>
                      <div className="setting-toggle">
                        <span>
                          <b>Dark appearance</b>
                          <small>Use a darker workspace palette</small>
                        </span>
                        <Switch checked={dark} onCheckedChange={setDark} />
                      </div>
                      <div className="setting-toggle">
                        <span>
                          <b>POS sound feedback</b>
                          <small>A short tone when dishes are added</small>
                        </span>
                        <Switch checked={sound} onCheckedChange={setSound} />
                      </div>
                    </section>
                    <section className="panel settings-panel">
                      <h2>Account & security</h2>
                      <p>Signed in as Mani Raj · Platform administrator</p>
                      <div className="setting-toggle">
                        <span>
                          <b>Two-factor authentication</b>
                          <small>Manage MFA in your Supabase account settings</small>
                        </span>
                        <span className="status trial">Setup required</span>
                      </div>
                      <button
                        className="quiet-btn"
                        onClick={async () => {
                          await db.auth.signOut();
                          setTenantId(null);
                        }}
                      >
                        <LogOut size={16} /> Sign out
                      </button>
                    </section>
                  </div>
                </>
              )}

              {view === "restaurants" && (
                <>
                  <div className="page-head">
                    <div>
                      <div className="eyebrow">PLATFORM CONTROL</div>
                      <h1>Restaurants & Subscription Approvals</h1>
                      <p>Review restaurant payment proofs and approve subscription extensions.</p>
                    </div>
                    <button className="primary-btn" onClick={() => open("restaurant")}>
                      <Plus size={17} /> Add restaurant
                    </button>
                  </div>

                  {subscriptionRequests.length > 0 && (
                    <section className="panel management-panel mb-6">
                      <div className="panel-header">
                        <div>
                          <h2>
                            Pending Subscription Requests <span className="count-pill">{subscriptionRequests.length}</span>
                          </h2>
                          <p>Review payment screenshots sent by restaurant owners.</p>
                        </div>
                      </div>
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>RESTAURANT</th>
                              <th>OWNER</th>
                              <th>PLAN</th>
                              <th>PROOF</th>
                              <th>NOTE</th>
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
                                <td>{req.plan}</td>
                                <td>
                                  {req.screenshot_url ? (
                                    <a href={req.screenshot_url} target="_blank" rel="noreferrer" className="text-indigo-600 underline text-xs font-semibold">
                                      View Screenshot
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 text-xs">No screenshot</span>
                                  )}
                                </td>
                                <td>{req.message}</td>
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
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  <div className="platform-stats">
                    <div>
                      <strong>{restaurants.length}</strong>
                      <span>Total restaurants</span>
                    </div>
                    <div>
                      <strong>{restaurants.filter((r) => r.status === "Active").length}</strong>
                      <span>Active subscriptions</span>
                    </div>
                    <div>
                      <strong>{restaurants.filter((r) => r.status === "Trial").length}</strong>
                      <span>In trial</span>
                    </div>
                    <div>
                      <strong>{approvals.filter((a) => a.status === "Pending").length}</strong>
                      <span>Awaiting approval</span>
                    </div>
                  </div>
                  <div className="panel management-panel">
                    <div className="panel-header">
                      <div>
                        <h2>Restaurant directory</h2>
                        <p>Subscriptions and account status</p>
                      </div>
                    </div>
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
                              <td>
                                <div className="restaurant-name">
                                  <span className="store-avatar">{r.initial}</span>
                                  <span>
                                    <b>{r.name}</b>
                                    <small>{r.city}</small>
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="owner-cell">
                                  <b>{r.owner}</b>
                                  <small>
                                    {r.email} · {r.phone}
                                  </small>
                                </div>
                              </td>
                              <td>{r.plan}</td>
                              <td>
                                <span
                                  className={
                                    "status " +
                                    (r.status === "Active" ? "paid" : r.status === "Trial" ? "trial" : "paused")
                                  }
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td>{r.renewal}</td>
                              <td>
                                <div className="row-actions">
                                  <button
                                    title="Extend subscription"
                                    onClick={() => {
                                      open("extend", r.id);
                                      setForm({ renewal: r.renewal });
                                    }}
                                  >
                                    <CalendarDays size={16} />
                                  </button>
                                  <button
                                    title={r.status === "Paused" ? "Resume" : "Pause"}
                                    onClick={() => toast.info("Subscription status changes require a platform billing workflow")}
                                  >
                                    {r.status === "Paused" ? <Check size={16} /> : <PanelRightClose size={16} />}
                                  </button>
                                  <button
                                    title="Delete restaurant"
                                    onClick={() => toast.info("Restaurant deletion requires a verified offboarding workflow")}
                                  >
                                    <Trash2 size={16} />
                                  </button>
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

              {view === "approvals" && (
                <>
                  <div className="page-head">
                    <div>
                      <div className="eyebrow">ONBOARDING PIPELINE</div>
                      <h1>
                        Pending approvals{" "}
                        <span className="heading-count">{approvals.filter((a) => a.status === "Pending").length}</span>
                      </h1>
                      <p>Review businesses before they join the platform.</p>
                    </div>
                  </div>
                  <div className="approval-grid">
                    {approvals
                      .filter((a) => a.status === "Pending")
                      .map((a) => (
                        <div className="approval-card" key={a.id}>
                          <div className="approval-top">
                            <span className="approval-avatar">{a.name.slice(0, 2).toUpperCase()}</span>
                            <span className="status trial">Awaiting review</span>
                          </div>
                          <h2>{a.name}</h2>
                          <p>
                            {a.city} · Submitted {a.submitted}
                          </p>
                          <div className="approval-doc">
                            <BadgeCheck size={17} />
                            <span>{a.docs}</span>
                          </div>
                          <div className="approval-actions">
                            <button
                              className="quiet-btn"
                              onClick={() => {
                                setApprovals((old) => old.map((x) => (x.id === a.id ? { ...x, status: "Rejected" } : x)));
                                toast.info(a.name + " rejected");
                              }}
                            >
                              Reject
                            </button>
                            <button
                              className="primary-btn"
                              onClick={() => {
                                setApprovals((old) => old.map((x) => (x.id === a.id ? { ...x, status: "Approved" } : x)));
                                setRestaurants((old) => [
                                  ...old,
                                  {
                                    id: Date.now(),
                                    name: a.name,
                                    city: a.city,
                                    plan: "Free Trial",
                                    status: "Trial",
                                    renewal: "10 Oct 2026",
                                    initial: a.name.slice(0, 2).toUpperCase(),
                                    owner: "Pending owner",
                                    email: "—",
                                    phone: "—",
                                  },
                                ]);
                                toast.success(a.name + " approved");
                              }}
                            >
                              <Check size={16} /> Approve
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                  {approvals.every((a) => a.status !== "Pending") && (
                    <div className="panel empty-state">All caught up. No pending registrations.</div>
                  )}
                </>
              )}

              {view === "pricing" && isAdmin && (
                <>
                  <div className="page-head">
                    <div>
                      <div className="eyebrow">SUBSCRIPTION MANAGEMENT</div>
                      <h1>Pricing plans & Admin UPI Configuration</h1>
                      <p>Configure the UPI ID that restaurant owners will use to pay their subscription.</p>
                    </div>
                    <button className="primary-btn" onClick={() => open("plan")}>
                      <Plus size={17} /> Add plan
                    </button>
                  </div>
                  <section className="panel settings-panel">
                    <div className="panel-header">
                      <div>
                        <h2>Restaurant payment UPI ID</h2>
                        <p>This UPI ID will immediately appear in all restaurant dashboards for payments.</p>
                      </div>
                    </div>
                    <div className="settings-fields">
                      <label>
                        Admin UPI ID
                        <input
                          value={adminUpiId}
                          onChange={(e) => setAdminUpiId(e.target.value)}
                          placeholder="merchant@upi"
                          autoComplete="off"
                        />
                      </label>
                    </div>
                    <button className="primary-btn" onClick={saveAdminUpi} disabled={adminUpiBusy}>
                      <Save size={16} />
                      {adminUpiBusy ? "Saving…" : "Save Admin UPI ID"}
                    </button>
                  </section>
                  <div className="pricing-grid">
                    {plans.map((p, i) => (
                      <div className={"plan-card " + (p.name === "Growth" ? "featured" : "")} key={p.id}>
                        <div className="plan-top">
                          <span className={"plan-icon pi" + i}>
                            <CreditCard size={20} />
                          </span>
                          <span className={"status " + (p.active ? "paid" : "paused")}>
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <h2>{p.name}</h2>
                        <div className="plan-price">
                          {money(p.price)} <span>/ {p.period}</span>
                        </div>
                        <p>{p.features}</p>
                        <div className="plan-divider" />
                        <div className="plan-actions">
                          <button onClick={() => open("plan", p.id)}>
                            <Pencil size={16} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete " + p.name + " plan?")) setPlans((old) => old.filter((x) => x.id !== p.id));
                            }}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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

      <Dialog open={!!modal && modal !== "inventory"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="modal-content">
          <DialogHeader>
            <DialogTitle>
              {modal === "plan"
                ? editing
                  ? "Edit plan"
                  : "Add pricing plan"
                : modal === "dish"
                ? editing
                  ? "Edit dish"
                  : "Add dish"
                : modal === "expense"
                ? "Log expense"
                : modal === "restaurant"
                ? "Add restaurant"
                : modal === "employee"
                ? editing !== null
                  ? "Edit employee"
                  : "Add employee"
                : modal === "supplier"
                ? editing
                  ? "Edit supplier"
                  : "Add supplier"
                : modal === "payment"
                ? "Record supplier payment"
                : "Extend subscription"}
            </DialogTitle>
            <DialogDescription>
              {modal === "extend"
                ? "Set a new renewal date for this restaurant."
                : "Complete the details below to update the workspace."}
            </DialogDescription>
          </DialogHeader>
          <div className="modal-fields">
            {modal === "plan" && (
              <>
                <label>
                  Plan name
                  <input
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Premium"
                  />
                </label>
                <div className="field-pair">
                  <label>
                    Price (₹)
                    <input
                      type="number"
                      min="0"
                      value={form.price || ""}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </label>
                  <label>
                    Billing period
                    <select
                      value={form.period || "month"}
                      onChange={(e) => setForm({ ...form, period: e.target.value })}
                    >
                      <option>month</option>
                      <option>year</option>
                      <option>14 days</option>
                    </select>
                  </label>
                </div>
                <label>
                  Features
                  <input
                    value={form.features || ""}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                    placeholder="Locations · Features · Users"
                  />
                </label>
              </>
            )}
            {modal === "dish" && (
              <>
                <label>
                  Dish image (JPG, PNG or WebP · up to 5 MB)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setDishFile(e.target.files?.[0] || null)}
                  />
                </label>
                <label>
                  Dish name
                  <input
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <div className="field-pair">
                  <label>
                    Category
                    <select
                      value={form.category || "Mains"}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {["Appetizers", "Mains", "Drinks", "Desserts"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Emoji / image symbol
                    <input
                      value={form.emoji || ""}
                      onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                      placeholder="🍽️"
                    />
                  </label>
                </div>
                <div className="field-pair">
                  <label>
                    Selling price (₹)
                    <input
                      type="number"
                      value={form.price || ""}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </label>
                  <label>
                    Food cost (₹)
                    <input
                      type="number"
                      value={form.cost || ""}
                      onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    />
                  </label>
                </div>
                <div className="field-pair">
                  <label>
                    Dietary label
                    <input
                      value={form.diet || ""}
                      onChange={(e) => setForm({ ...form, diet: e.target.value })}
                    />
                  </label>
                  <label>
                    Prep time (min)
                    <input
                      type="number"
                      value={form.time || ""}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </label>
                </div>
              </>
            )}
            {modal === "expense" && (
              <>
                <label>
                  Description
                  <input
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <div className="field-pair">
                  <label>
                    Category
                    <select
                      value={form.category || "Inventory"}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {["Inventory", "Utilities", "Maintenance", "Marketing", "Rent", "Staff welfare"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Amount (₹)
                    <input
                      type="number"
                      value={form.amount || ""}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Supplier (optional)
                  <select
                    value={form.supplierId || ""}
                    onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  >
                    <option value="">No linked supplier</option>
                    {suppliers.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    value={form.date || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </label>
                <label>
                  Vendor
                  <input
                    value={form.vendor || ""}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  />
                </label>
              </>
            )}
            {modal === "restaurant" && (
              <>
                <label>
                  Restaurant name
                  <input
                    autoComplete="organization"
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  Owner name
                  <input
                    autoComplete="name"
                    value={form.owner || ""}
                    onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  />
                </label>
                <div className="field-pair">
                  <label>
                    Email
                    <input
                      type="email"
                      autoComplete="email"
                      value={form.email || ""}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </label>
                  <label>
                    Phone number
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={form.phone || ""}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    value={form.password || ""}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 12 characters"
                  />
                  <small className="credential-note">
                    The owner account will be created in Supabase Auth. Password is sent only to the server.
                  </small>
                </label>
                <div className="field-pair">
                  <label>
                    City
                    <input
                      value={form.city || ""}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </label>
                  <label>
                    Plan
                    <select
                      value={form.plan || "Free Trial"}
                      onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    >
                      {plans.map((p) => (
                        <option key={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}
            {modal === "employee" && (
              <>
                <label>
                  Full name
                  <input
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <div className="field-pair">
                  <label>
                    Role
                    <input
                      value={form.role || ""}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      placeholder="Cashier"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email || ""}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </label>
                </div>
                <div className="field-pair">
                  <label>
                    Shift
                    <input
                      value={form.shift || ""}
                      onChange={(e) => setForm({ ...form, shift: e.target.value })}
                      placeholder="09:00 – 18:00"
                    />
                  </label>
                  <label>
                    Daily wage (₹)
                    <input
                      type="number"
                      min="0"
                      value={form.dailyRate || ""}
                      onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                      placeholder="900"
                    />
                  </label>
                </div>
                <label>
                  Phone number
                  <input
                    type="tel"
                    value={form.phone || ""}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </label>
              </>
            )}
            {modal === "supplier" && (
              <>
                <label>
                  Supplier name
                  <input
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  Contact person
                  <input
                    value={form.contact || ""}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  />
                </label>
                <div className="field-pair">
                  <label>
                    Phone
                    <input
                      type="tel"
                      value={form.phone || ""}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email || ""}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </label>
                </div>
              </>
            )}
            {modal === "payment" && (
              <>
                <label>
                  Supplier
                  <select
                    value={form.supplierId || ""}
                    onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  >
                    <option value="">Choose supplier</option>
                    {suppliers.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="field-pair">
                  <label>
                    Amount paid (₹)
                    <input
                      type="number"
                      min="1"
                      value={form.amount || ""}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </label>
                  <label>
                    Payment date
                    <input
                      type="date"
                      value={form.date || new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Method
                  <select
                    value={form.method || "Cash"}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank transfer</option>
                    <option>Card</option>
                  </select>
                </label>
                <label>
                  Note
                  <input
                    value={form.note || ""}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </label>
              </>
            )}
            {modal === "extend" && (
              <label>
                New renewal date
                <input
                  value={form.renewal || ""}
                  onChange={(e) => setForm({ ...form, renewal: e.target.value })}
                  placeholder="e.g. 12 Nov 2026"
                />
              </label>
            )}
          </div>
          <DialogFooter>
            <button className="quiet-btn" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="primary-btn" onClick={save}>
              Save changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedStaff} onOpenChange={(v) => !v && setSelectedStaff(null)}>
        <SheetContent className="profile-sheet wage-sheet">
          <SheetHeader>
            <SheetTitle>Employee & daily wages</SheetTitle>
          </SheetHeader>
          {selectedStaff && (
            <div className="sheet-inner">
              <span className="staff-avatar sheet-avatar">{selectedStaff.initial}</span>
              <h2>{selectedStaff.name}</h2>
              <p>{selectedStaff.role}</p>
              <div className="sheet-section">
                <span>EMPLOYEE DETAILS</span>
                <div>
                  <small>Email</small>
                  <b>{selectedStaff.email}</b>
                </div>
                <div>
                  <small>Phone</small>
                  <b>{selectedStaff.phone || "—"}</b>
                </div>
                <div>
                  <small>Shift</small>
                  <b>{selectedStaff.shift}</b>
                </div>
                <div>
                  <small>Daily wage rate</small>
                  <b>{money(selectedStaff.dailyRate)} / day</b>
                </div>
                <div>
                  <small>Assigned store</small>
                  <b>{tenantInfo?.name || "Restaurant"}</b>
                </div>
              </div>
              <div className="wage-summary">
                <span>
                  <small>Total paid</small>
                  <b>
                    {money(
                      wages
                        .filter((w) => w.staffId === selectedStaff.id && w.status === "Paid")
                        .reduce((n, w) => n + w.amount, 0)
                    )}
                  </b>
                </span>
                <span>
                  <small>Outstanding</small>
                  <b>
                    {money(
                      wages
                        .filter((w) => w.staffId === selectedStaff.id && w.status === "Unpaid")
                        .reduce((n, w) => n + w.amount, 0)
                    )}
                  </b>
                </span>
              </div>
              <div className="wage-form">
                <h3>Record a day’s wage</h3>
                <div>
                  <label>
                    Date
                    <input
                      type="date"
                      value={wageForm.date}
                      onChange={(e) => setWageForm({ ...wageForm, date: e.target.value })}
                    />
                  </label>
                  <label>
                    Amount (₹)
                    <input
                      type="number"
                      min="1"
                      value={wageForm.amount}
                      onChange={(e) => setWageForm({ ...wageForm, amount: e.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Note (optional)
                  <input
                    value={wageForm.note}
                    onChange={(e) => setWageForm({ ...wageForm, note: e.target.value })}
                    placeholder="Shift, overtime or adjustment"
                  />
                </label>
                <button className="primary-btn" onClick={addWage}>
                  <Plus size={16} /> Record wage
                </button>
              </div>
              <div className="wage-history">
                <h3>Daily wage history</h3>
                {wages
                  .filter((w) => w.staffId === selectedStaff.id)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((w) => (
                    <div className="wage-entry" key={w.id}>
                      <div>
                        <b>
                          {new Date(w.date + "T12:00:00").toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </b>
                        <small>{w.note || "Daily shift"}</small>
                      </div>
                      <strong>{money(w.amount)}</strong>
                      <button
                        className={"status " + (w.status === "Paid" ? "paid" : "trial")}
                        onClick={async () => {
                          if (!db || !tenantId) return;
                          const next = w.status === "Paid" ? "Unpaid" : "Paid";
                          const { error } = await db
                            .from("daily_wages")
                            .update({ status: next })
                            .eq("restaurant_id", tenantId)
                            .eq("id", w.id);
                          if (error) {
                            toast.error(error.message);
                            return;
                          }
                          setWages((old) => old.map((x) => (x.id === w.id ? { ...x, status: next } : x)));
                        }}
                        aria-label={"Mark " + w.date + " as " + (w.status === "Paid" ? "unpaid" : "paid")}
                      >
                        {w.status}
                      </button>
                    </div>
                  ))}
                {!wages.some((w) => w.staffId === selectedStaff.id) && (
                  <p className="empty-state">No wage entries yet.</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!receipt} onOpenChange={(v) => !v && setReceipt(null)}>
        <DialogContent className="receipt-dialog">
          <DialogHeader>
            <DialogTitle>Bill details</DialogTitle>
            <DialogDescription>
              Order {receipt?.id} · {receipt?.status}
            </DialogDescription>
          </DialogHeader>
          {receipt && (
            <>
              <style media="print">{`@page { size: ${
                printSize === "A4" ? "A4" : printSize + " 297mm"
              }; margin: ${printSize === "A4" ? "12mm" : "2mm"}; }`}</style>
              <div className={"receipt-paper format-" + printSize} id="print-receipt">
                <div className="receipt-center">
                  <div className="receipt-logo">
                    {(receipt.business || tenantInfo)?.logo_url ? (
                      <img src={(receipt.business || tenantInfo)!.logo_url!} alt="" />
                    ) : (
                      "✳"
                    )}
                  </div>
                  <strong>{(receipt.business || tenantInfo)?.name || "Restaurant"}</strong>
                  <span>{(receipt.business || tenantInfo)?.address || "Address not set"}</span>
                  <span>
                    {(receipt.business || tenantInfo)?.business_phone || ""}
                    {(receipt.business || tenantInfo)?.gstin
                      ? " · GSTIN " + (receipt.business || tenantInfo)!.gstin
                      : ""}
                  </span>
                </div>
                <div className="receipt-dash" />
                <div className="receipt-meta">
                  <span>Bill: {receipt.id}</span>
                  <span>{receipt.issuedAt}</span>
                  <span>Cashier: Mani Raj</span>
                  <span>
                    {receipt.type}
                    {receipt.type === "Dine-in" ? " · " + receipt.table : ""}
                  </span>
                </div>
                <div className="receipt-dash" />
                <div className="receipt-lines">
                  <div className="receipt-line receipt-column">
                    <span>ITEM</span>
                    <span>QTY</span>
                    <span>AMOUNT</span>
                  </div>
                  {receipt.items.map((l, i) => (
                    <div className="receipt-line" key={i}>
                      <span>
                        {l.name}
                        <small>
                          {money(l.unitPrice)} each{l.discount ? " · discount " + money(l.discount) : ""}
                        </small>
                      </span>
                      <span>{l.qty}</span>
                      <span>{money((l.unitPrice - l.discount) * l.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="receipt-dash" />
                <div className="receipt-sums">
                  <div>
                    <span>Subtotal</span>
                    <span>{money(receipt.subtotal)}</span>
                  </div>
                  <div>
                    <span>Discount</span>
                    <span>−{money(receipt.discount)}</span>
                  </div>
                  <div>
                    <span>GST 5%</span>
                    <span>{money(receipt.tax)}</span>
                  </div>
                  <div className="receipt-total">
                    <b>Total</b>
                    <b>{money(receipt.total)}</b>
                  </div>
                  <div>
                    <span>Paid via {receipt.payment}</span>
                    <span>{money(receipt.total)}</span>
                  </div>
                </div>
                <div className="receipt-dash" />
                <div className="receipt-center receipt-footer">
                  <span>{(receipt.business || tenantInfo)?.receipt_footer || "Thank you for dining with us!"}</span>
                  <span>Order verification: {receipt.id}</span>
                </div>
              </div>
              <label className="print-format">
                Print paper size{" "}
                <select
                  aria-label="Receipt paper size"
                  value={printSize}
                  onChange={(e) => setPrintSize(e.target.value as "58mm" | "85mm" | "A4")}
                >
                  <option value="58mm">58 mm thermal roll</option>
                  <option value="85mm">85 mm thermal roll</option>
                  <option value="A4">A4 sheet</option>
                </select>
              </label>
            </>
          )}
          <DialogFooter>
            <button className="quiet-btn" onClick={() => setReceipt(null)}>
              Close
            </button>
            <button className="primary-btn" onClick={() => window.print()}>
              <Printer size={17} /> Print Bill
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DYNAMIC QR CODE MODAL FOR CHOSEN SUBSCRIPTION PLAN */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Pay for {selectedPlanForPayment?.name || 'Subscription'}</DialogTitle>
            <DialogDescription>Amount Due: {money(selectedPlanForPayment?.price || 0)}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border space-y-3">
            <div className="w-48 h-48 bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-2">
              <QrCode size={96} className="text-gray-800" />
              <span className="text-[11px] font-mono text-gray-600 mt-2 break-all">{subscriptionUpiId}</span>
            </div>
            <p className="text-xs font-semibold text-indigo-600">{subscriptionUpiId}</p>
          </div>
          <div className="space-y-2 pt-2">
            <button className="primary-btn w-full" onClick={paySelectedPlan}>Pay via Installed UPI App</button>
          </div>
          <DialogFooter>
            <button className="quiet-btn w-full" onClick={() => setShowQrModal(false)}>Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
