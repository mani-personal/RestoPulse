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

// Nav items: Inventory is a first-class feature in Restaurant Console
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
  const [accountRole, setAccountRole] = useState<"admin" | "restaurant">("restaurant");
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

  // Inventory Manager State (Default Seeded Data)
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

  // Load Inventory for Restaurant (falls back to demo key so it always functions)
  useEffect(() => {
    const key = tenantId ? `rp-inventory-list:${tenantId}` : `rp-inventory-list:default`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setInventoryList(JSON.parse(raw));
      }
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
    if (!db) return;
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
          restaurant_id: tenantId || "00000000-0000-0000-0000-000000000000",
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

        {/* RESTAURANT NAVIGATION (Always visible in restaurant console) */}
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
                  {item.id === "approvals" && (
                    <span className="nav-count">{approvals.filter((x) => x.status === "Pending").length}</span>
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
            <p>Your workspace is in great shape. Renewal on 12 Oct 2026.</p>
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
            </>
          )}

          {view === "pos" && (
            <div className="page-head">
              <h1>POS Terminal</h1>
              <p>Find a dish, build an order, and check out.</p>
            </div>
          )}

          {view === "menu" && (
            <div className="page-head">
              <h1>Menu & dishes</h1>
              <p>Manage dishes and availability.</p>
            </div>
          )}

          {/* INVENTORY MANAGEMENT SECTION (Fully integrated and visible) */}
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

              {/* Status KPI summary cards */}
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
          {view === "subscription" && (
            <>
              <div className="page-head">
                <div>
                  <div className="eyebrow">SUBSCRIPTION & PLANS</div>
                  <h1>Available Pricing Plans</h1>
                  <p>Choose a plan configured by the administrator to renew or upgrade your subscription.</p>
                </div>
              </div>

              <div className="pricing-grid grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {plans.map((p) => (
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
            <div className="page-head">
              <h1>Team & payroll</h1>
            </div>
          )}

          {view === "expenses" && (
            <div className="page-head">
              <h1>Expenses ledger</h1>
            </div>
          )}

          {view === "suppliers" && (
            <div className="page-head">
              <h1>Suppliers directory</h1>
            </div>
          )}

          {view === "settings" && (
            <div className="page-head">
              <h1>Workspace settings</h1>
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

          {view === "pricing" && isAdmin && (
            <>
              <div className="page-head">
                <h1>Pricing plans & Admin UPI Configuration</h1>
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
