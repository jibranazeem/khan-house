import type { Category, CategoryId, DayHours, MenuItem, OptionGroup, Settings } from "./types";

export const CATEGORIES: Category[] = [
  { id: "mediterranean", name: "Mediterranean", blurb: "Halal platters over seasoned rice with crisp salad and our signature white sauce.", image: "/images/menu/chicken-lamb-mix.jpg" },
  { id: "hibachi", name: "Hibachi", blurb: "Seared hot on the flat-top with veggies, rice and a drizzle of yum yum sauce.", image: "/images/menu/hibachi-chicken.jpg" },
  { id: "wraps", name: "Wraps & Gyros", blurb: "Warm pita, loaded fillings and sauces that drip — built to eat on the go.", image: "/images/menu/chicken-gyro.jpg" },
  { id: "sides", name: "Sides", blurb: "Wings, dumplings and extras to round out the meal.", image: "/images/menu/wings.jpg" },
];

export const CATEGORY_NAME = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name])) as Record<CategoryId, string>;

export const OPTION_GROUPS: Record<string, OptionGroup> = {
  platterBase: {
    id: "platterBase", name: "Choose your base", type: "one", required: true,
    choices: [
      { label: "Yellow rice", price: 0 },
      { label: "Half rice, half salad", price: 0 },
      { label: "Salad only (no rice)", price: 0 },
    ],
  },
  sauce: {
    id: "sauce", name: "Sauces", type: "many", required: false,
    choices: [
      { label: "White sauce", price: 0 },
      { label: "Hot sauce", price: 0 },
      { label: "BBQ sauce", price: 0 },
      { label: "Extra white sauce", price: 0.75 },
    ],
  },
  hibachiRice: {
    id: "hibachiRice", name: "Rice", type: "one", required: true,
    choices: [
      { label: "Hibachi fried rice", price: 0 },
      { label: "Steamed white rice", price: 0 },
      { label: "Sub hibachi noodles", price: 2.0 },
    ],
  },
  hibachiExtras: {
    id: "hibachiExtras", name: "Extras", type: "many", required: false,
    choices: [
      { label: "Extra yum yum sauce", price: 0.75 },
      { label: "Extra teriyaki sauce", price: 0.75 },
      { label: "Add fried egg", price: 1.5 },
      { label: "Double protein", price: 5.99 },
    ],
  },
  spice: {
    id: "spice", name: "Spice level", type: "one", required: false,
    choices: [
      { label: "Mild", price: 0 },
      { label: "Medium", price: 0 },
      { label: "Hot 🔥", price: 0 },
    ],
  },
  platterAddons: {
    id: "platterAddons", name: "Add-ons", type: "many", required: false,
    choices: [
      { label: "Extra chicken", price: 3.99 },
      { label: "Extra lamb", price: 4.49 },
      { label: "3 falafel", price: 2.99 },
      { label: "Pita bread", price: 1.25 },
    ],
  },
  wingSauce: {
    id: "wingSauce", name: "Wing flavor", type: "one", required: true,
    choices: [
      { label: "Buffalo", price: 0 },
      { label: "Honey BBQ", price: 0 },
      { label: "Teriyaki glaze", price: 0 },
      { label: "Lemon pepper (dry)", price: 0 },
    ],
  },
  dip: {
    id: "dip", name: "Dipping sauce", type: "one", required: false,
    choices: [
      { label: "Ranch", price: 0 },
      { label: "Yum yum", price: 0 },
      { label: "Sweet chili", price: 0 },
      { label: "Soy ginger", price: 0 },
    ],
  },
};

const MED = ["platterBase", "sauce", "spice", "platterAddons"];
const HIB = ["hibachiRice", "hibachiExtras", "spice"];
const WRAP = ["sauce", "spice"];

// Menu and prices from the Khan House DoorDash listing. Photos marked with a real
// dish come from the restaurant; the rest are stand-ins until real photos are added.
export const DEFAULT_MENU: MenuItem[] = [
  // Mediterranean
  { id: "chicken-lamb-mix", name: "Chicken & Lamb Mix", price: 14.99, category: "mediterranean", image: "/images/menu/chicken-lamb-mix.jpg",
    description: "Tender chicken and lamb pieces served with chopped lettuce, tomatoes and cucumbers over seasoned yellow rice, finished with white sauce.",
    tags: ["halal", "popular"], available: true, featured: true, optionGroups: MED, sort: 1 },
  { id: "chicken-over-rice", name: "Chicken over Rice", price: 14.99, category: "mediterranean", image: "/images/menu/chicken-over-rice.jpg",
    description: "New York-style grilled chicken over rice, tossed with sautéed green peppers and onions, with fresh salad and our house white sauce.",
    tags: ["halal", "popular"], available: true, featured: true, optionGroups: MED, sort: 2 },
  { id: "seekh-kebabs-rice", name: "Seekh Kebabs with Rice", price: 13.99, category: "mediterranean", image: "/images/menu/seekh-kebabs.jpg",
    description: "Hand-pressed, spice-rubbed seekh kebabs charred on the grill, served over yellow rice with salad and chutney.",
    tags: ["halal", "spicy"], available: true, featured: false, optionGroups: MED, sort: 3 },
  { id: "falafel-over-rice", name: "Falafel over Rice", price: 12.99, category: "mediterranean", image: "/images/menu/falafel-over-rice.jpg",
    description: "Crispy herb falafel over rice with lettuce, tomato and cucumber, drizzled with white sauce.",
    tags: ["halal", "vegetarian"], available: true, featured: true, optionGroups: MED, sort: 4 },

  // Hibachi
  { id: "hibachi-chicken", name: "Hibachi Chicken", price: 14.99, category: "hibachi", image: "/images/menu/hibachi-chicken.jpg",
    description: "Tender, juicy chicken grilled to perfection on a sizzling hibachi grill with savory butter-soy glaze, vegetables, sesame and scallions.",
    tags: ["halal", "popular"], available: true, featured: true, optionGroups: HIB, sort: 1 },
  { id: "hibachi-shrimp", name: "Hibachi Shrimp", price: 14.99, category: "hibachi", image: "/images/menu/hibachi-shrimp.jpg",
    description: "Succulent shrimp grilled to perfection on a sizzling hibachi grill, seasoned with garlic butter and served with vegetables and rice.",
    tags: ["halal"], available: true, featured: false, optionGroups: HIB, sort: 2 },
  { id: "hibachi-chicken-shrimp", name: "Hibachi Chicken & Shrimp", price: 12.99, category: "hibachi", image: "/images/menu/hibachi-chicken-shrimp.jpg",
    description: "A delicious combination of tender, juicy chicken and succulent shrimp, grilled to perfection on a sizzling hibachi grill and seasoned with garlic butter.",
    tags: ["halal", "popular"], available: true, featured: true, optionGroups: HIB, sort: 3 },
  { id: "teriyaki-chicken", name: "Teriyaki Chicken", price: 14.99, category: "hibachi", image: "/images/menu/teriyaki-chicken.jpg",
    description: "Flame-seared chicken glazed in sweet-savory teriyaki, served with vegetables and rice.",
    tags: ["halal"], available: true, featured: false, optionGroups: HIB, sort: 4 },
  { id: "teriyaki-shrimp", name: "Teriyaki Shrimp", price: 14.99, category: "hibachi", image: "/images/menu/teriyaki-shrimp.jpg",
    description: "Juicy shrimp tossed in house teriyaki glaze with grilled vegetables and rice.",
    tags: ["halal"], available: true, featured: false, optionGroups: HIB, sort: 5 },
  { id: "teriyaki-chicken-shrimp", name: "Teriyaki Chicken & Shrimp", price: 14.99, category: "hibachi", image: "/images/menu/hibachi-shrimp.jpg",
    description: "The best of both — teriyaki-glazed chicken and shrimp off the flat-top, with vegetables and rice.",
    tags: ["halal"], available: true, featured: false, optionGroups: HIB, sort: 6 },

  // Wraps
  { id: "chicken-gyro", name: "Chicken Gyro", price: 9.99, category: "wraps", image: "/images/menu/chicken-gyro.jpg",
    description: "Marinated grilled chicken in warm pita with lettuce, tomato, onion and white sauce.",
    tags: ["halal", "popular"], available: true, featured: true, optionGroups: WRAP, sort: 1 },
  { id: "lamb-gyro", name: "Lamb Gyro", price: 9.99, category: "wraps", image: "/images/menu/lamb-gyro.jpg",
    description: "Seasoned lamb sliced hot off the grill, wrapped in warm pita with fresh veggies and tzatziki-style white sauce.",
    tags: ["halal"], available: true, featured: false, optionGroups: WRAP, sort: 2 },
  { id: "kebab-wrap", name: "Kebab Wrap", price: 8.99, category: "wraps", image: "/images/menu/kebab-wrap.jpg",
    description: "Seekh kebab rolled with crunchy slaw, onions, herbs and sauce in a soft wrap.",
    tags: ["halal", "spicy"], available: true, featured: false, optionGroups: WRAP, sort: 3 },
  { id: "falafel-sandwich", name: "Falafel Sandwich", price: 8.99, category: "wraps", image: "/images/menu/falafel-sandwich.jpg",
    description: "Golden falafel, lettuce, tomato, cucumber and white sauce tucked into warm pita.",
    tags: ["halal", "vegetarian"], available: true, featured: false, optionGroups: WRAP, sort: 4 },

  // Sides
  { id: "wings-6", name: "Wings (6 pcs)", price: 8.99, category: "sides", image: "/images/menu/wings.jpg",
    description: "Six crispy halal wings tossed in your choice of flavor, with a dipping sauce.",
    tags: ["halal", "popular"], available: true, featured: false, optionGroups: ["wingSauce", "dip"], sort: 1 },
  { id: "shrimp-dumplings-6", name: "Shrimp Dumplings (6 pcs)", price: 7.99, category: "sides", image: "/images/menu/shrimp-dumplings.jpg",
    description: "Six pan-seared shrimp dumplings with a side of soy-ginger dip.",
    tags: ["new"], available: true, featured: false, optionGroups: ["dip"], sort: 2 },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DEFAULT_HOURS: DayHours[] = DAYS.map((day) => ({ day, open: "11:00", close: "21:10", closed: false }));

export const DEFAULT_SETTINGS: Settings = {
  acceptingOrders: true,
  pickupEnabled: true,
  deliveryEnabled: true,
  taxRate: 8.25, // Wake County 7.25% sales tax + 1% prepared food & beverage tax
  deliveryFee: 3.99,
  freeDeliveryOver: 40,
  deliveryRadiusMiles: 6,
  prepMinutes: 20,
  announcement: "Now taking online orders — skip the line and pick up hot off the grill.",
  locationNote: "Proudly serving Apex, Cary, Holly Springs and the Triangle. Follow @KhanHouseCo for specials.",
  hours: DEFAULT_HOURS,
};
