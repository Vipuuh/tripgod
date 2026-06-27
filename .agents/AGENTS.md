# Workspace Guidelines: TripGod Adventure & Booking Platform

This file contains design rules, architectural specifications, database columns, and integration workflows for the TripGod project. Any AI assistant editing this workspace should read and follow these rules.

---

## 1. Tech Stack & Configuration
- **Build Engine**: Vite + React (JavaScript, JSX)
- **Styling**: Vanilla CSS with Tailwind CSS v4 (`@import "tailwindcss"` in `src/index.css`)
- **Typography**: 
  - Display headers: `'Outfit', sans-serif`
  - Body text: `'Inter', sans-serif`
- **Database**: Supabase client (`src/supabase.js`)
- **Secrets Management**: Stored locally in `.env.local` (not committed to git). Core keys:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

---

## 2. Design System & Styling Rules
- **Color Scheme**: Primary accent is orange (`#FF6B00` or `#FF5F00`). Use gradient class `bg-accent-gradient` or text `text-accent-gradient`.
- **Glassmorphism**: Use `.glass-card` for transparent, premium UI backdrops with backdrop-filter blur.
- **Micro-animations**: Use `.hover-scale-premium` and `.hover-glow` for tactile, bouncy interactive states.
- **Card Design**: Cards must have rounded corners (`rounded-3xl` or `rounded-2xl`), subtle shadows (`shadow-[0_4px_25px_rgba(0,0,0,0.03)]`), and zoomable images on hover (`group-hover:scale-105 transition-transform duration-700`).

---

## 3. Core Pages Layout Specifications

### Tour Listing View (`Tours.jsx`)
- **Rating Stack**: Format as two-line vertical stack instead of generic inline ratings:
  ```
  ⭐ 4.5
  80 Reviews
  ```
- **Overlay Badges**: Maximum of 2 badges overlaid on the image card:
  - `🟢 Verified Operator` (emerald-600)
  - `🔥 Fast Filling` (red-600)
  - `⭐ Top Rated` (indigo-650)
  - `💰 Best Price` (blue-600)
- **Inclusions Ribbon**: Small icons mapping Hotel, Meals, Transport, and Guide support.
- **Pricing**: Displays "Starting From", strike-through original rate, discount percent, and a prominent "Per Person" label.

### Tour Details View (`Tours.jsx`)
- **Floating Search/Pricing Widget**: Price card block styled as a premium OTA checkout widget.
- **Who is this tour perfect for?**: Rendered under the description using Indigo pill badges and the `Users` / `Sparkles` icon tags.
- **Mobile Sticky Bar**: Always keep a bottom bar containing WhatsApp, Call, and checkout button fixed to `bottom-0` on mobile viewports (`lg:hidden`).

---

## 4. Payment & Razorpay Flow
- The Razorpay checkout script is loaded globally in `index.html`:
  `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`
- Payment triggers are managed through the central `BookingModal.jsx` component.
- **Rule**: Never expose test or live API secret keys in code files; consume credentials strictly from environment variables or handle via back-end server functions.
