# Khan House

Website, online ordering and restaurant dashboard for **Khan House**: halal hibachi and Mediterranean fusion in Apex, NC · (919) 307-9893.

The look follows the Khan House livery: black, fire red, ember orange and gold, with a bold condensed display font.

## What's included

**Customer website**
- Home: hero slider, Mediterranean + Hibachi showcase, fan favorites, stats, how it works, catering, hours and location
- Menu: all items from the DoorDash listing with prices, category tabs, filters (popular, spicy, vegetarian), search, and a customize dialog (base, sauces, spice level, add-ons, notes)
- Cart and checkout: pickup or delivery, ASAP or scheduled time slots, tip, NC tax (8.25%), free delivery threshold, pay online or at pickup
- Live order tracking (`/track`): Received → Confirmed → On the grill → Ready / Out for delivery → Done
- Catering (packages + quote form), Our Story, Contact

**Dashboard** (`/admin`, "Staff login" in the footer)
| Page | What it does |
|---|---|
| Overview | Net sales, orders, average order, web conversion (each vs previous period), sales chart, live orders, top sellers, conversion funnel, orders by hour, sales by channel and category |
| Orders | Live board (Incoming → Accepted → On the grill → Ready/Out) with sound and pop-up alerts for new orders, wait timers, printable kitchen tickets, full searchable history, CSV export |
| Menu | Add, edit and delete items, mark sold out (86) instantly, feature on homepage, set photos, tags and options |
| Finance | Sales vs expenses, profit & loss (card fees, DoorDash commission, expenses), tax collected, tips, cash vs card, daily breakdown, expense log, CSV export |
| Customers | Every customer with order count, lifetime spend, favorite dish, repeat rate |
| Messages | Contact form and catering inbox, with event date and headcount |
| Staff & Roles | Add team members, change roles, deactivate, permission matrix |
| Settings | Pause online ordering, pickup and delivery switches, tax, fees, prep time, hours, announcement bar |

**Roles**

| | Owner | Manager | Cashier | Kitchen |
|---|:-:|:-:|:-:|:-:|
| Overview & reports | ✓ | ✓ | | |
| Orders | ✓ | ✓ | ✓ | ✓ |
| Menu, Finance, Settings | ✓ | ✓ | | |
| Customers, Messages | ✓ | ✓ | ✓ | |
| Staff & Roles | ✓ | | | |

## Demo mode (current)

This build runs with **no backend**, so it can be shown right away. Everything is stored in the visitor's browser and starts with 45 days of sample orders so the reports have something to show. Open the site in one tab and `/admin` in another: an order placed on the site appears on the board straight away, with a chime.

Demo sign-ins (also one-click buttons on the login page):

| Role | Email | Password |
|---|---|---|
| Owner | owner@khanhouse.co | owner123 |
| Manager | manager@khanhouse.co | manager123 |
| Cashier | cashier@khanhouse.co | cashier123 |
| Kitchen | kitchen@khanhouse.co | kitchen123 |

**Settings → Reset demo data** restores the sample data.

> Demo mode is for showing the client. Data is per browser, passwords are not secret, and no cards are charged. Connect the database (below) before taking real orders.

## Going live

1. Create a Supabase project and apply `supabase/migrations/` (tables, roles, row-level security, order-status history trigger, realtime).
2. Replace the actions in `src/lib/store.ts` with Supabase calls. Each action matches a table, and `src/lib/types.ts` matches the schema.
3. Use Supabase Auth for staff sign-in in place of the demo accounts in `src/lib/auth.ts`.
4. Payments: Square online checkout (the same approach as the Istanbul Sweets site), with a webhook that marks orders paid.
5. Optional: Twilio SMS for "your order is ready", Resend for email receipts.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build into .output/
npm run typecheck
npm run lint
```

Stack: TanStack Start (React 19, file-based routes, SSR), Vite, Tailwind CSS v4, Recharts, Radix UI, Nitro (deploys to Vercel with no extra config). Node 22.

## Project layout
```
src/
  routes/              index, menu, checkout, track, catering, about, contact
  routes/admin/        index (overview), orders, menu, finance, customers, messages, staff, settings, login
  components/site/     header, footer, logo, menu cards, item dialog, cart, inquiry form
  components/admin/    dashboard UI pieces
  lib/brand.ts         name, phone, socials: edit once, used everywhere
  lib/menu-data.ts     menu items, prices, option groups, default hours & settings
  lib/store.ts         demo data store + actions (swap for Supabase to go live)
  lib/auth.ts          roles & permissions
  lib/analytics.ts     report calculations
supabase/migrations/   production database schema
public/images/         food photos
```

## Photos
- **Real Khan House dishes** (cropped from the DoorDash listing): Chicken & Lamb Mix, Chicken over Rice, Falafel over Rice, Hibachi Chicken, Hibachi Shrimp (also used for Teriyaki Chicken & Shrimp), Chicken Gyro, Lamb Gyro. These are low resolution, so swap in the originals or new photos when you have them.
- **Stock photos (Unsplash, free to use)** for items with no photo yet and for the large banners. Replace the files in `public/images/` with the same names and the site updates.

## Things to confirm with the client
- Instagram/Facebook/TikTok handle (set to `@KhanHouseCo` from the truck), email address, and whether to list a street address
- Option groups and add-on prices (sauces, rice, spice, extras) are typical choices, not from DoorDash
- Catering package prices ("from $15 / guest") are placeholders
- Delivery radius, fee and free-delivery threshold
