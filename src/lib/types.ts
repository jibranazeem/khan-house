export type CategoryId = "mediterranean" | "hibachi" | "wraps" | "sides";

export type Category = { id: CategoryId; name: string; blurb: string; image: string };

export type OptionChoice = { label: string; price: number };
export type OptionGroup = {
  id: string;
  name: string;
  /** "one" = pick exactly one (radio), "many" = pick any (checkbox). */
  type: "one" | "many";
  required: boolean;
  choices: OptionChoice[];
};

export type MenuTag = "halal" | "spicy" | "popular" | "vegetarian" | "new";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CategoryId;
  image: string;
  tags: MenuTag[];
  available: boolean;
  featured: boolean;
  optionGroups: string[];
  sort: number;
};

export type OrderType = "pickup" | "delivery";
export type OrderSource = "website" | "doordash" | "walk-in" | "phone";
export type PaymentMethod = "card" | "cash";
export type PaymentStatus = "paid" | "unpaid" | "refunded";
export type OrderStatus = "new" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";

export type OrderLine = {
  itemId: string;
  name: string;
  category: CategoryId;
  quantity: number;
  unitPrice: number; // base + selected options
  options: string[];
  instructions: string;
};

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  type: OrderType;
  source: OrderSource;
  customer: { name: string; phone: string; email: string };
  address: string | null;
  scheduledFor: string | null; // null = ASAP
  items: OrderLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  total: number;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes: string;
  history: { status: OrderStatus; at: string; by: string }[];
};

export type Role = "owner" | "manager" | "cashier" | "kitchen";

export type Staff = {
  id: string;
  name: string;
  email: string;
  password: string; // demo mode only — production uses Supabase Auth
  role: Role;
  active: boolean;
  createdAt: string;
  lastLogin: string | null;
};

export type ExpenseCategory = "Food & Ingredients" | "Packaging" | "Fuel & Propane" | "Payroll" | "Permits & Fees" | "Maintenance" | "Marketing" | "Other";

export type Expense = { id: string; date: string; category: ExpenseCategory; amount: number; note: string };

export type MessageType = "General" | "Catering" | "Feedback" | "Order Issue";

export type Message = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  type: MessageType;
  message: string;
  eventDate: string | null;
  guests: number | null;
  read: boolean;
};

export type DayHours = { day: string; open: string; close: string; closed: boolean };

export type Settings = {
  acceptingOrders: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  taxRate: number; // percent
  deliveryFee: number;
  freeDeliveryOver: number;
  deliveryRadiusMiles: number;
  prepMinutes: number;
  announcement: string;
  locationNote: string;
  hours: DayHours[];
};

export type TrafficDay = { visits: number; menuViews: number; carts: number; checkouts: number };

export type StoreState = {
  version: number;
  seq: number;
  menu: MenuItem[];
  orders: Order[];
  staff: Staff[];
  expenses: Expense[];
  messages: Message[];
  settings: Settings;
  traffic: Record<string, TrafficDay>;
};
