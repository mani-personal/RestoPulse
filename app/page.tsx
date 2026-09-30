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

type InventoryRecord = {
  onHand: number | null;
  reorderLevel: number;
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
];

const initialWages: Wage[] = [
  { id: 1, staffId: 1, date: "2026-09-25", amount: 1800, status: "Paid", note: "Day shift" },
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
  const [modal, setModal] = useState<"plan" | "dish" | "expense" | "restaurant" | "extend" | "employee" | "supplier" | "payment" | null>(null);
  const [editing, setEditing] = useState<number | string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [dateRange, setDateRange] = useState("This week");
  const [inventory, setInventory] = useState<Record<string, InventoryRecord>>({});
  
  // Admin & Restaurant Subscription State
  const [adminUpiId, setAdminUpiId] = useState("admin-restopulse@upi");
  const [adminUpiBusy, setAdminUpiBusy] = useState(false);
  const [subscriptionUpiId, setSubscriptionUpiId] = useState("admin-restopulse@upi");
  const [showQrModal, setShowQrModal] = useState(false);
  const [extensionMessage, setExtensionMessage] = useState("");
  const [extensionFile, setExtensionFile] = useState<File | null>(null);
  const [extensionBusy, setExtensionBusy] = useState(false);
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
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event: string, session: any) => {
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

  // Fetch Admin & Restaurant subscription settings
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

  useEffect(() => {
    if (!db || !tenantId) return;
    let live = true;
    (async () => {
      const [r, menu, people, wage, exp, pay, sup, sales] = await Promise.all([
        db.from("restaurants").select("name,logo_url,address,business_phone,gstin,receipt_footer").eq("id", tenantId).single(),
        db.from("menu_items").select("*").eq("restaurant_id", tenantId).order("created_at"),
        db.from("employees").select("*").eq("restaurant_id", tenantId).eq("active", true).order("created_at"),
        db.from("daily_wages").select("*").eq("restaurant_id", tenantId).order("wage_date", { ascending: false }),
        db.from("expenses").select("*").eq("restaurant_id", tenantId).order("incurred_on", { ascending: false }),
        db.from("supplier_payments").select("*").eq("restaurant_id", tenantId).order("paid_on", { ascending: false }),
        db.from("suppliers").select("*").eq("restaurant_id", tenantId).order("name"),
        db.from("sales").select("*").eq("restaurant_id", tenantId).order("placed_at", { ascending: false }).limit(100),
      ]);
      if (!live) return;
      if (r.data) {
        setTenantInfo(r.data);
        setStoreForm({
          name: r.data.name,
          phone: r.data.business_phone,
          address: r.data.address,
          gstin: r.data.gstin,
          footer: r.data.receipt_footer,
        });
      }
      setDishes(
        (menu.data || []).map((x: any) => ({
          id: x.id,
          name: x.name,
          category: x.category,
          price: Number(x.price),
          cost: Number(x.cost),
          stock: x.available,
          emoji: x.emoji,
          diet: x.diet,
          time: x.prep_minutes,
          imageUrl: x.image_url,
        }))
      );
      setStaff(
        (people.data || []).map((x: any) => ({
          id: x.id,
          name: x.name,
          role: x.role,
          initial: x.name.split(/\s+/).map((z: string) => z[0]).join("").slice(0, 2).toUpperCase(),
          shift: x.shift,
          dailyRate: Number(x.daily_rate),
          email: x.email,
          phone: x.phone,
        }))
      );
      setWages(
        (wage.data || []).map((x: any) => ({
          id: x.id,
          staffId: x.employee_id,
          date: x.wage_date,
          amount: Number(x.amount),
          status: x.status,
          note: x.note,
        }))
      );
      setExpenses(
        (exp.data || []).map((x: any) => ({
          id: x.id,
          name: x.name,
          category: x.category,
          vendor: x.vendor,
          amount: Number(x.amount),
          date: x.incurred_on,
          supplierId: x.supplier_id,
        }))
      );
      setSupplierPayments(
        (pay.data || []).map((x: any) => ({
          id: x.id,
          supplierId: x.supplier_id,
          amount: Number(x.amount),
          date: x.paid_on,
          method: x.method,
          note: x.note,
        }))
      );
      setSuppliers(
        (sup.data || []).map((x: any) => ({
          id: x.id,
          name: x.name,
          contact: x.contact_name,
          phone: x.phone,
          email: x.email,
        }))
      );
      setOrders(
        (sales.data || []).map((x: any) => ({
          id: x.bill_no,
          time: new Date(x.placed_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
          placedAt: x.placed_at,
          amount: Number(x.amount),
          type: x.order_type,
          status: x.status,
          bill: x.receipt as Bill,
        }))
      );
    })();
    return () => {
      live = false;
    };
  }, [db, tenantId]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoginBusy(true);
    const { error } = await db.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoginBusy(false);
    if (error) toast.error(error.message);
  };

  const uploadImage = async (file: File, kind: "dish" | "logo" | "screenshot") => {
    if (!db) throw new Error("Database client not available");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)
      throw new Error("Upload a JPG, PNG, or WebP under 5 MB");
    const path = `${tenantId || 'admin'}/${kind}/${crypto.randomUUID()}.${
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
  const currentPlan = currentRestaurant
    ? plans.find((p) => p.name === currentRestaurant.plan) || initialPlans.find((p) => p.name === currentRestaurant.plan)
    : undefined;
  const inventoryValue = (id: number | string) => inventory[String(id)] || { onHand: null, reorderLevel: 5 };
  const saveInventoryRecord = (id: number | string, next: InventoryRecord) => {
    const all = { ...inventory, [String(id)]: next };
    setInventory(all);
    if (tenantId) localStorage.setItem(`rp-inventory:${tenantId}`, JSON.stringify(all));
  };

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

  // Save Admin UPI ID
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
    if (!currentPlan || currentPlan.price <= 0) {
      toast.info("There is no payment due for the current plan");
      return;
    }
    const link = `upi://pay?pa=${encodeURIComponent(subscriptionUpiId)}&pn=${encodeURIComponent(
      "RestoPulse"
    )}&am=${encodeURIComponent(currentPlan.price.toFixed(2))}&cu=INR&tn=${encodeURIComponent(
      `${currentRestaurant?.name || "Restaurant"} ${currentPlan.name} subscription`
    )}`;
    window.location.href = link;
  };

  // Submit Extension Request + Screenshot Upload
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
          plan: currentPlan?.name || "Starter",
          upi_id: subscriptionUpiId,
          screenshot_url: screenshotUrl,
          message: extensionMessage.trim() || "Validity extension requested with payment proof",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Could not send request");
        return;
      }

      toast.success("Validity extension request and payment proof sent to admin!");
      setExtensionMessage("");
      setExtensionFile(null);
    } finally {
      setExtensionBusy(false);
    }
  };

  // Admin approves subscription extension request
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

      // Also extend renewal date in restaurants table by 30 days
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
                  <span className="nav-count">{subscriptionRequests.length}</span>
                )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="trial-note">
            <span className="trial-icon">✦</span>
            <b>Growth plan</b>
            <p>Your workspace is in great shape.</p>
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
              <div className="profile-role">
                <span>Account role: {accountRole === "admin" ? "Platform admin" : "Restaurant owner"}</span>
              </div>
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
                          <span>{k.note}</span>
                        </div>
                      </div>
                    ))}
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
                        {displayed.map((d, i) => (
                          <button
                            className={"dish-tile " + (!d.stock ? "sold-out" : "")}
                            key={d.id}
                            onClick={() => d.stock && addCart(d.id)}
                            disabled={!d.stock}
                          >
                            <span className="dish-body">
                              <span className="dish-name">{d.name}</span>
                              <span className="dish-price">{money(d.price)}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                </>
              )}

              {view === "menu" && (
                <div className="page-head">
                  <h1>Menu & dishes</h1>
                </div>
              )}

              {view === "inventory" && tenantId && (
                <div className="page-head">
                  <h1>Inventory management</h1>
                  <p>Track your stock availability in real time.</p>
                </div>
              )}

              {/* SUBSCRIPTION & RENEWAL VIEW (Requirement 1, 2 & 3) */}
              {view === "subscription" && tenantId && !isAdmin && (
                <>
                  <div className="page-head">
                    <div>
                      <div className="eyebrow">SUBSCRIPTION</div>
                      <h1>Plan & payments</h1>
                      <p>View your plan, view Admin UPI details or QR code, and request validity extensions with payment proof.</p>
                    </div>
                  </div>
                  <div className="pricing-grid">
                    <div className="plan-card featured">
                      <div className="plan-top">
                        <span className="plan-icon pi1">
                          <CreditCard size={20} />
                        </span>
                        <span className="status paid">{currentRestaurant?.status || "Active"}</span>
                      </div>
                      <h2>{currentPlan?.name || currentRestaurant?.plan || "Starter Plan"}</h2>
                      <div className="plan-price">
                        {currentPlan ? money(currentPlan.price) : "₹2,499"} <span>/ month</span>
                      </div>
                      <p>{currentPlan?.features || "1 location · Menu & POS · 5 users"}</p>
                      <div className="plan-divider" />
                      <div className="plan-actions">
                        <span>
                          Renewal Date: <b>{currentRestaurant?.renewal || "31 Oct 2026"}</b>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="settings-grid">
                    <section className="panel settings-panel">
                      <h2>Pay via Admin UPI</h2>
                      <p>Scan the QR code or copy the UPI ID to complete your subscription payment.</p>
                      
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

                      <div className="head-actions pt-4">
                        <button className="primary-btn" onClick={paySubscription}>
                          <ExternalLink size={16} /> Pay via UPI App
                        </button>
                      </div>
                    </section>

                    <section className="panel settings-panel">
                      <h2>Request Validity Extension & Upload Proof</h2>
                      <p>After paying, upload your payment screenshot so the admin can verify and approve your extension.</p>
                      
                      <label className="block space-y-1">
                        <span className="text-sm font-medium">Payment Screenshot / Receipt</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setExtensionFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </label>

                      <label className="block space-y-1 pt-2">
                        <span className="text-sm font-medium">Message / Transaction ID</span>
                        <textarea
                          value={extensionMessage}
                          onChange={(e) => setExtensionMessage(e.target.value)}
                          maxLength={500}
                          placeholder="UTR / Transaction reference number..."
                          className="w-full p-2 border rounded-md text-sm bg-transparent"
                        />
                      </label>

                      <button
                        className="primary-btn mt-3"
                        onClick={requestExtension}
                        disabled={extensionBusy}
                      >
                        <Upload size={16} />
                        {extensionBusy ? "Uploading Proof…" : "Submit Request to Admin"}
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
                  <h1>Expenses</h1>
                </div>
              )}

              {view === "settings" && (
                <div className="page-head">
                  <h1>Settings</h1>
                </div>
              )}

              {view === "restaurants" && (
                <>
                  <div className="page-head">
                    <div>
                      <div className="eyebrow">PLATFORM CONTROL</div>
                      <h1>Restaurants & Subscription Approvals</h1>
                      <p>Review restaurant payment proofs and approve subscription extensions.</p>
                    </div>
                  </div>

                  {/* REQUIREMENT: Admin Console list of subscription extension requests with screenshots */}
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

                  <div className="panel management-panel">
                    <div className="panel-header">
                      <div>
                        <h2>Restaurant directory</h2>
                      </div>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>RESTAURANT</th>
                            <th>STATUS</th>
                            <th>RENEWAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {restaurants.map((r: any) => (
                            <tr key={r.id}>
                              <td><b>{r.name}</b></td>
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

              {view === "pricing" && isAdmin && (
                <>
                  <div className="page-head">
                    <div>
                      <div className="eyebrow">SUBSCRIPTION MANAGEMENT</div>
                      <h1>Pricing & Admin UPI Configuration</h1>
                      <p>Update the platform UPI ID to instantly display it on all restaurant consoles.</p>
                    </div>
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
                        />
                      </label>
                    </div>
                    <button className="primary-btn mt-3" onClick={saveAdminUpi} disabled={adminUpiBusy}>
                      <Save size={16} />
                      {adminUpiBusy ? "Saving…" : "Save Admin UPI ID"}
                    </button>
                  </section>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* QR CODE MODAL FOR UPI PAYMENT */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Scan to Pay via UPI</DialogTitle>
            <DialogDescription>Scan this QR code using any UPI app (GPay, PhonePe, Paytm)</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border space-y-3">
            {/* Simulated Clean QR Code display for active UPI ID */}
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
