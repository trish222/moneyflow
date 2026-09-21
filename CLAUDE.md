# MoneyFlow - Design & Implementation Guidelines

## ⚠️ PROJECT GUIDELINES & RULES

### Core Requirements & Specifications

**MANDATORY:** Before writing any code, designing components, or fixing bugs, you MUST read and strictly adhere to:

1. **`MONEYFLOW_SPEC.md`** — The authoritative technical specification
   - Read this FIRST for any feature work
   - All requirements, data models, API endpoints, and acceptance criteria defined here
   - Reference specific sections in PRs/commits (e.g., "Per MONEYFLOW_SPEC.md (API Design section)...")

2. **`HANDOFF.md`** — Session context and decisions
   - Quick orientation (5 min read)
   - Open questions and constraints
   - Implementation checklist

### Implementation Rules

- ✅ **Before starting ANY feature:** Read the corresponding section in `MONEYFLOW_SPEC.md`
- ✅ **All features** must match the spec's requirements, data model, and acceptance criteria exactly
- ✅ **All API endpoints** must follow the spec's endpoint definitions (methods, parameters, response formats)
- ✅ **All database changes** must align with the Prisma schema in the spec
- ✅ **All components** must use the glow card system and styling rules from CLAUDE.md (Design System section)
- ✅ **All forms & inputs** must have hover/focus states per spec requirements
- ✅ **Testing** must cover the test scenarios defined in MONEYFLOW_SPEC.md (Testing Plan section)
- ✅ **PRs must reference** the spec section they implement (e.g., "Implements MONEYFLOW_SPEC.md > Features > Recurring Transactions")

### If Something Conflicts with CLAUDE.md

The specification documents take precedence in this order:
1. **MONEYFLOW_SPEC.md** (MVP requirements, features, technical design)
2. **HANDOFF.md** (session decisions, open questions)
3. **CLAUDE.md** (existing design system, patterns, conventions)

---

## Project Overview

MoneyFlow is a modern financial tracker application with a sleek dark theme, responsive design, and interactive dashboard. Built with React, TypeScript, Tailwind CSS, and Vite.

**Tech Stack:**
- Frontend: React 18 with TypeScript
- Styling: Tailwind CSS
- Build: Vite
- Routing: React Router v6
- Backend: Node.js/Express API (running on `http://localhost:3000`)
- Database: PostgreSQL with Prisma ORM

---

## Ground Rules (September 2026 Session)

**Visual & Layout**:
- ✅ Background is **dark ombre**: `from-slate-950 via-gray-900 to-slate-950` (no purple)
- ✅ Activity summary filters are on the **same line as welcome message** on desktop
- ✅ **No layout shift** when changing filters - use fixed-height containers with `hidden` class instead of conditional rendering
- ✅ Maintain responsive design with `lg:flex-row` for desktop, stacked on mobile
- ✅ **Glow Card Effects** (September 14-15, 2026):
  - Inner glow (::before): White-to-color ombre gradient from bottom, fades upward
  - Border glow (::after): `opacity: 0.35` (normal), `opacity: 0.6` (hover) - subtle colored borders
  - Side glow accents at bottom corners with left-oval hover effect
  - Each card type has distinct, vibrant color pair for visual variety
- ✅ **Filter Button Styling** (September 15, 2026):
  - White borders (1px) with white/10 background
  - Inner white ombre glow using ::before pseudo-element (matches glow cards)
  - Active state: Full glow opacity (0.9), white text and border
  - Hover state: Subtle glow (0.7 opacity) on inactive buttons
  - Uses `filter-btn` class with positioned ::before element

**Database & Data**:
- ✅ Run seed script on fresh setup: `npx ts-node prisma/seed.ts`
- ✅ Default user ID is 1 - all API queries filter by this
- ✅ Test data includes accounts, transactions, investments, debts, savings goals, budgets

**Frontend Development**:
- ✅ Make optional API fields nullable with `?` in TypeScript interfaces
- ✅ Always provide fallback values for optional fields (e.g., `field || defaultValue`)
- ✅ Use glow-card system for all containers with appropriate color classes
- ✅ Ensure all pages show proper loading and empty states
- ✅ **Null/Undefined Handling Pattern** (September 10, 2026):
  - For numeric fields: `(field || 0).toFixed(2)` at point of display
  - For text fields: `field || "Unknown"` or `field || "N/A"` 
  - For calculated fields (division): Check denominator > 0 before calculating
  - Create intermediate variables with fallbacks: `const value = apiField || 0;`
  - Never chain `.toFixed()` on potentially undefined values
  - Test all pages with incomplete API responses
- ✅ **Hover Effects for All Clickable Elements** (September 14, 2026):
  - Every interactive element must show cursor change on hover
  - **Buttons**: Add `cursor-pointer` class
  - **Dropdowns/Selects**: Add `cursor-pointer` + `hover:border-{accent}-400 hover:bg-{shade} focus:border-{accent}-400 focus:outline-none transition`
  - **Text Inputs**: Add `cursor-text` + `hover:border-{accent}-400 hover:bg-{shade} focus:border-{accent}-400 focus:outline-none transition`
  - **Color scheme**: Use `hover:border-purple-400` for general pages, `hover:border-green-400` for Investments
  - **Background**: Use `hover:bg-slate-700` or `hover:bg-slate-600` depending on current shade
  - Always include `transition` class for smooth 0.3s animations
  - No exceptions: every click-able element must have clear hover feedback

**Investment Tracking**:
- ✅ Multi-account system: Brokerage, 401k, Roth IRA, Traditional IRA, HSA
- ✅ Each investment belongs to a specific account
- ✅ Support for creating, editing, and deleting accounts
- ✅ Support for adding and deleting investments per account
- ✅ "All Accounts - Total Portfolio" view for combined metrics

**Distribution Planning**:
- Target downloadable formats: Desktop (Electron), Mobile (React Native or PWA)
- Build mobile-friendly responsive web first, then wrap with Electron for desktop
- Use PWA for easy browser installation on mobile

---

## Design System

### Color Palette

#### Primary Colors
- **Background**: Gradient from slate-950 → gray-900 → slate-950 (dark ombre, no purple)
- **Primary Accent**: Purple-400 to Purple-600
- **Text Primary**: White (rgb(255, 255, 255))
- **Text Secondary**: Gray-300 (rgb(209, 213, 219))
- **Text Tertiary**: Gray-400 (rgb(156, 163, 175))
- **Text Faint**: Gray-500 (rgb(107, 114, 128))

#### Semantic Colors
- **Success/Income**: Green-400 (rgb(74, 222, 128))
- **Danger/Expense**: Red-400 (rgb(248, 113, 113))
- **Warning**: Yellow-500 (rgb(236, 181, 54))
- **Info**: Cyan-400 (rgb(34, 211, 238))

### Gradient & Glow Color System

Each component type has its own gradient and glow color for visual distinction:

```css
/* Red/Orange - Net Worth */
--color-1: #ff5555;
--color-2: #ffb366;
--glow-color: rgba(255, 85, 85, 0.8);

/* Cyan/Blue - Transactions, Dashboard */
--color-1: #00e5ff;
--color-2: #0088ff;
--glow-color: rgba(0, 229, 255, 0.8);

/* Purple/Magenta - Budgeting */
--color-1: #d580ff;
--color-2: #ff1493;
--glow-color: rgba(213, 128, 255, 0.8);

/* Green - Investments */
--color-1: #00ff88;
--color-2: #00b366;
--glow-color: rgba(0, 255, 136, 0.8);

/* Blue - Debt */
--color-1: #00c8ff;
--color-2: #0055ff;
--glow-color: rgba(0, 200, 255, 0.8);
```

### Typography

- **Heading 1**: `text-4xl font-bold text-white`
- **Heading 2**: `text-2xl font-bold text-white`
- **Heading 3**: `text-lg font-semibold text-white`
- **Body Text**: `text-sm md:text-base text-gray-300`
- **Caption**: `text-xs text-gray-400`
- **Emphasis (Net Worth)**: `text-5xl md:text-6xl font-bold`

### Spacing

Use Tailwind's spacing scale consistently:
- **Padding**: `p-4 md:p-8` for main containers
- **Gaps**: `gap-6` between sections, `gap-8` for major dividers
- **Margins**: Use `mb-` and `mt-` classes (mb-2, mb-4, mb-6, mb-8)
- **Card Padding**: `p-4 md:p-6` for standard cards, `p-6` for large cards

### Border Radius

- **Cards/Containers**: `rounded-xl` (0.75rem) for standard, `rounded-lg` (0.5rem) for smaller elements
- **Glow Cards**: `rounded-full` for buttons, explicit `rounded-[1.5rem]` in CSS for glow effect

---

## Component Patterns

### Glow Card System (September 15, 2026 - Glassy Bubble Design)

The core component used throughout the app for any card-based content. Features glassy transparent cards with vibrant bottom ombre glow, subtle colored borders, and elegant hover effects.

**HTML Structure:**
```tsx
<div className="glow-card glow-{color-type}">
  {/* content */}
</div>
```

**CSS (included in each component's `<style>` tag):**
```css
.glow-card {
  position: relative;
  border-radius: 1.5rem;
  padding: 1.5rem;
  background: rgba(10, 15, 30, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 0.3px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* Muted colored border */
.glow-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border-radius: 1.5rem;
  padding: 1px;
  background: linear-gradient(135deg, var(--color-1), var(--color-2));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 10;
  opacity: 0.35;
  transition: opacity 0.3s ease;
}

.glow-card:hover::after {
  opacity: 0.6;
}

/* Bottom ombre glow + side accents + hover left-oval glow */
.glow-card::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  background:
    linear-gradient(to top, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 5%, transparent 15%),
    radial-gradient(ellipse 20% 250% at 1% 115%, var(--glow-color-dim) 0%, transparent 25%),
    radial-gradient(ellipse 20% 250% at 99% 115%, var(--glow-color-dim) 0%, transparent 25%),
    linear-gradient(to top, var(--glow-color) 0%, var(--glow-color-dim) 20%, var(--glow-color-dim) 35%, transparent 70%);
  z-index: 1;
  pointer-events: none;
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.glow-card:hover::before {
  opacity: 1;
  background:
    radial-gradient(ellipse 60% 120% at -10% 50%, var(--glow-color-dim) 0%, rgba(0, 0, 0, 0.3) 30%, transparent 45%),
    linear-gradient(to top, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 5%, transparent 15%),
    radial-gradient(ellipse 20% 250% at 1% 115%, var(--glow-color-dim) 0%, transparent 25%),
    radial-gradient(ellipse 20% 250% at 99% 115%, var(--glow-color-dim) 0%, transparent 25%),
    linear-gradient(to top, var(--glow-color) 0%, var(--glow-color-dim) 20%, var(--glow-color-dim) 35%, transparent 70%);
}
```

**Glow Card Features:**
- **Glassy transparent background** — `rgba(10, 15, 30, 0.3)` with 20px backdrop blur
- **Ultra-thin border** — 0.3px subtle white border for minimal visual weight
- **Muted border glow** — Tinted gradient borders (0.35 opacity, 0.6 on hover)
- **Bottom ombre glow** — White-to-color gradient from bottom edge, fades upward
- **Side glow accents** — Subtle colored glows at bottom-left and bottom-right corners
- **Hover left-oval effect** — Darker oval glow from left side that extends to top/bottom edges

**Color Class Definitions:**
```css
.glow-red { --color-1: #ff6b6b; --color-2: #ffa94d; }
.glow-cyan { --color-1: #00d9ff; --color-2: #0099ff; }
.glow-purple { --color-1: #c77dff; --color-2: #ff006e; }
.glow-green { --color-1: #00d97e; --color-2: #00a86b; }
.glow-blue { --color-1: #00b4ff; --color-2: #0066ff; }
```

### Toggle Switch

Used for binary state toggles (e.g., Include Debt toggle):

```tsx
<div
  onClick={() => setState(!state)}
  className={`toggle-switch ${state ? "active" : ""}`}
/>
```

**CSS:**
```css
.toggle-switch {
  position: relative;
  display: inline-flex;
  width: 50px;
  height: 28px;
  background-color: #334155;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  border: 1px solid #475569;
}
.toggle-switch.active {
  background-color: #6366f1;
  border-color: #818cf8;
}
.toggle-switch::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  background-color: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: left 0.3s;
}
.toggle-switch.active::after {
  left: 24px;
}
```

### Button Styles

**Primary Button (CTA):**
```tsx
<button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
  Button Text
</button>
```

**Secondary/Filter Button:**
```tsx
<button className={`py-2 px-4 rounded-full border-2 font-medium transition ${
  isActive
    ? "border-purple-400 bg-purple-500/20 text-purple-300"
    : "border-slate-600 text-gray-300 hover:border-purple-400"
}`}>
  Filter
</button>
```

**Icon Button with Hover Effect:**
```tsx
<svg className="w-6 h-6 text-{color}-400 group-hover:translate-x-1 transition">
  {/* SVG content */}
</svg>
```

### Form Elements

**Input Field (with Hover Effects):**
```tsx
<input
  type="text"
  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 cursor-text hover:border-purple-400 hover:bg-slate-700 focus:border-purple-400 focus:outline-none transition"
  placeholder="Enter value"
/>
```

**Select Dropdown (with Hover Effects):**
```tsx
<select className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm cursor-pointer hover:border-purple-400 hover:bg-slate-700 focus:border-purple-400 focus:outline-none transition">
  <option>Option</option>
</select>
```

**Form Container:**
```tsx
<form className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6 mb-8 space-y-4">
  {/* form fields */}
</form>
```

### Interactive Element Hover Effects

**All clickable elements must provide clear visual feedback on hover:**

**Button (Primary CTA):**
```tsx
<button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition cursor-pointer">
  Button Text
</button>
```

**Button (Secondary/Filter - with Inner Glow, September 15, 2026):**
```tsx
<button className={`filter-btn py-2 px-3 rounded-full border font-medium transition text-sm cursor-pointer backdrop-blur-md relative ${
  isActive
    ? "active border-white bg-white/10 text-white"
    : "border-slate-600 text-gray-300 hover:border-white hover:bg-white/10"
}`}>
  Filter
</button>
```

**CSS for Filter Buttons (white inner ombre glow):**
```css
.filter-btn {
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.filter-btn::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  background:
    linear-gradient(to top, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 3%, transparent 10%),
    linear-gradient(to top, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 15%, transparent 50%);
  z-index: -1;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.filter-btn.active::before {
  opacity: 0.9;
}

.filter-btn:hover::before {
  opacity: 0.7;
}
```

**Filter Button Features:**
- **White borders** — Clean, minimal 1px borders
- **Inner white ombre glow** — Matches glow card design, white gradient from bottom fading upward
- **Active state** — White border, white/10 background, full opacity glow (0.9)
- **Hover state** — Subtle glow on inactive buttons (0.7 opacity)
- **Responsive** — Uses `backdrop-blur-md` for glass effect, matches card aesthetic

**Text Input:**
```tsx
<input
  type="text"
  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 cursor-text hover:border-purple-400 hover:bg-slate-600 focus:border-purple-400 focus:outline-none transition"
/>
```

**Select/Dropdown:**
```tsx
<select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white cursor-pointer hover:border-purple-400 hover:bg-slate-600 focus:border-purple-400 focus:outline-none transition">
  <option>Option</option>
</select>
```

**Navigation Link:**
```tsx
<Link to="/path" className="text-gray-300 hover:text-purple-400 font-medium transition cursor-pointer">
  Link Text
</Link>
```

**Icon/Delete Button:**
```tsx
<button onClick={() => handleDelete(id)} className="text-red-400 hover:text-red-300 transition cursor-pointer">
  ✕
</button>
```

**Hover Effect Color Scheme:**
- **General Pages** (Dashboard, Transactions, Budgets, Savings): Use `hover:border-purple-400`
- **Investments Page**: Use `hover:border-green-400`
- **Background Highlights**: Use `hover:bg-slate-700` or `hover:bg-slate-600` depending on current background shade
- **Always include** `transition` class for smooth 0.3s animations
- **Always include** proper cursor class: `cursor-pointer` for buttons/clickables, `cursor-text` for inputs

### Progress Bars

**Horizontal Progress Bar:**
```tsx
<div className="w-full bg-slate-700 rounded-full h-2">
  <div
    className="bg-blue-500 h-2 rounded-full transition-all"
    style={{ width: `${Math.min(percentage, 100)}%` }}
  />
</div>
```

Color variations based on progress:
- `bg-blue-500` - Normal
- `bg-yellow-500` - Warning (75%+)
- `bg-red-500` - Danger (100%+)

---

## Layout Patterns

### Page Container

All pages use this consistent structure with pure black background (September 15, 2026):

```tsx
<div className="min-h-screen p-4 md:p-8" style={{background: 'linear-gradient(to bottom right, #000000, #0f0f0f, #000000)'}}>
  {/* page content */}
</div>
```

**Background Details:**
- Uses pure black (#000000) at corners with minimal grey (#0f0f0f) in center
- Creates subtle depth without color hue (no purple/blue undertones)
- Pairs perfectly with glassy cards and vibrant glow effects

### Responsive Grid

**Dashboard Layout (2-column on desktop):**
```tsx
<div className="flex flex-col lg:flex-row gap-8">
  <div className="w-full lg:w-1/4">{/* Sidebar */}</div>
  <div className="w-full lg:flex-1">{/* Main Content */}</div>
</div>
```

**Card Grid (2x2 on desktop):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Cards */}
</div>
```

### Breakpoints

- **Mobile**: Default (< 640px)
- **Tablet**: `md:` (≥768px)
- **Desktop**: `lg:` (≥1024px)

### Navigation Bar

**Structure:**
```tsx
<nav className="bg-slate-900/80 backdrop-blur border-b border-purple-500/20">
  <div className="w-full px-4 md:px-8 py-4">
    <div className="flex items-center justify-between gap-8">
      {/* Logo */}
      {/* Nav Links (centered, flex-wrap) */}
      {/* Right Actions */}
    </div>
  </div>
</nav>
```

---

## Page Structure & Guidelines

### Creating a New Page

1. **Create component** in `frontend/src/pages/{PageName}.tsx`
2. **Use functional component** with React hooks
3. **Include interfaces** for data types at the top
4. **Use the glow-card system** for all card-based layouts
5. **Import useEffect and useState** for data fetching and state
6. **Fetch data from** `http://localhost:3000/api/{endpoint}`
7. **Add to App.tsx routes** and navigation menu

### Standard Page Template

```tsx
import { useEffect, useState } from "react";

interface DataType {
  id: number;
  // properties
}

export default function PageName() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/endpoint");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <style>{`
        /* Glow card styles here */
      `}</style>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Page Title</h1>
        <p className="text-purple-300">Subtitle or description</p>
      </div>

      {/* Page content */}
    </div>
  );
}
```

### Clickable Page Cards (Dashboard)

For cards that navigate to pages, use this pattern:

```tsx
<div
  onClick={() => navigate("/path")}
  className="glow-card glow-{color} cursor-pointer group"
>
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-white">Title</h2>
    <svg
      className="w-6 h-6 text-{color}-400 group-hover:translate-x-1 transition"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  </div>
  {/* Card content */}
</div>
```

---

## Code Style Conventions

### React Patterns

- **Components**: Functional components only (hooks-based)
- **State Management**: Use `useState` for component state
- **Effects**: Use `useEffect` for data fetching with dependency arrays
- **Navigation**: Use `useNavigate` from React Router for page navigation
- **Callbacks**: Use `useCallback` for optimized event handlers when needed

### TypeScript

- **Define interfaces** for all data structures at the top of the file
- **Use explicit types** for useState (e.g., `useState<DataType[]>([])`)
- **Export components** as `export default function ComponentName()`

### Naming Conventions

- **Components**: PascalCase (Dashboard, Investments, Debt)
- **Functions**: camelCase (fetchData, handleClick, calculateTotal)
- **Variables**: camelCase (totalIncome, selectedMonth)
- **Constants**: UPPER_SNAKE_CASE (API_URL, DEFAULT_MONTH)
- **CSS Classes**: lowercase with hyphens (glow-card, toggle-switch)

### API Integration

- **Base URL**: `http://localhost:3000/api`
- **Error Handling**: Always wrap in try-catch, console.error on failure
- **Loading State**: Always manage loading with useState
- **Data Fetching**: Use async/await pattern
- **Field Handling**: Assume API responses may have missing fields:
  - Make interface fields optional with `?` (except required id)
  - Provide safe fallback values at point of use
  - Never chain methods on potentially undefined values
  - For numeric: `(field || 0).toFixed(2)` 
  - For text: `field || "Unknown"`
  - For calculations: Check denominators before division

### Comments

- Keep comments minimal and focused on the "why" not the "what"
- Omit comments for self-explanatory code
- Use comments for business logic or non-obvious patterns

---

## Interactive Features

### Filter/Date Selection

Pattern used in Dashboard activity summary:

```tsx
const [filterType, setFilterType] = useState("month");
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
const [selectedYear] = useState(new Date().getFullYear());

// Fetch data changes based on filter
useEffect(() => {
  fetchData();
}, [filterType, selectedMonth, selectedYear]);
```

**Important**: To prevent layout shift when changing filter types, **always render filter dropdowns with reserved space** instead of conditional rendering. Use a fixed-height container with `hidden` classes:

```tsx
<div className="mb-6 flex flex-wrap gap-3 justify-end h-10">
  <select className={`... ${filterType === "day" || filterType === "week" ? "" : "hidden"}`}>
    {/* Day select */}
  </select>
  <select className={`... ${filterType === "week" || filterType === "month" ? "" : "hidden"}`}>
    {/* Month select */}
  </select>
  {/* more selects */}
</div>
```

This keeps the container height constant regardless of which dropdowns are visible.

### Hover Effects

- **Text**: Use `hover:text-{color}` for color change
- **Arrow Icons**: Use `group-hover:translate-x-1 transition` for movement
- **Glow**: Built into glow-card (opacity and blur increase)
- **Buttons**: Use `hover:bg-{color}` for background change

### Transitions

- **Default Duration**: `0.3s`
- **Easing**: `ease` (default cubic-bezier)
- **Property**: Usually `all` or specific property
- **Example**: `transition-all 0.3s ease` or `transition`

### Dashboard Layout

Dashboard uses a 2-column layout for organizing metric cards and page cards:

**Header with Activity Filters**:
- Welcome message and subtitle on the left
- Activity summary time filter buttons (Day/Week/Month/Year/All Time) on the right, same line on desktop
- Responsive: stacks on mobile, horizontal on lg screens with `gap-6`
- Filters always positioned with welcome message, no separate "Activity Summary" label

**Overall Structure**:
- **Left Column** (1fr): 4 metric cards stacked vertically
  - Net Worth (metric only)
  - Available Funds (metric only)
  - **Savings (clickable → /savings page)** ⭐ NEW
  - Debt (metric only)
- **Right Column** (2fr): 3 large clickable page cards in a grid
  - Transactions
  - Budgeting
  - Investments (page)

**Implementation:**
```css
.dashboard-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  align-items: start;
}

.metrics-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  grid-auto-rows: max-content;
}

@media (max-width: 1024px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }
}
```

**Responsive Implementation (Updated September 21)**:
```css
.dashboard-layout {
  display: grid;
  grid-template-columns: 0.85fr 1.5fr;  /* Responsive proportions */
  gap: 1.5rem;
  height: screen;  /* Fills viewport */
  overflow-y: auto;  /* Vertical scroll only */
}

.metrics-column {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;  /* Good breathing room */
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;  /* Maintained spacing */
}

@media (max-width: 1280px) {
  .dashboard-layout {
    grid-template-columns: 0.8fr 1fr;  /* Slightly adjusted */
  }
}

@media (max-width: 1024px) {
  .dashboard-layout {
    grid-template-columns: 1fr;  /* Stack vertically */
  }
  .metrics-column {
    display: grid;
    grid-template-columns: repeat(4, 1fr);  /* 4-column metric cards */
    gap: 0.8rem;
  }
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .metrics-column {
    grid-template-columns: repeat(2, 1fr);  /* 2-column on mobile */
  }
  .cards-grid {
    grid-template-columns: 1fr;  /* Single column */
  }
}
```

**Responsive Behavior**:
- **Desktop (≥1280px)**: 2-column layout (metrics left 0.85fr, cards right 1.5fr) - fills screen with proper spacing
- **Tablet (1024-1280px)**: Same layout with slightly reduced grid proportions
- **Tablet landscape (768-1024px)**: Metrics become 4-column grid, cards stay 2-column - all content visible
- **Mobile (<768px)**: Metrics 2-column, cards single column - optimized for small screens
- **All screens**: Vertical scrolling only, never horizontal - content scales to fill width

---

## Responsive Design Strategy

### Mobile First Approach

1. Start with mobile styles (base classes)
2. Add `md:` breakpoint for tablet optimizations
3. Add `lg:` breakpoint for desktop layouts

### Key Responsive Patterns

**Text Sizing:**
```tsx
<h1 className="text-3xl md:text-4xl">Responsive Heading</h1>
<p className="text-sm md:text-base">Responsive Body</p>
```

**Spacing:**
```tsx
<div className="p-4 md:p-8">Responsive padding</div>
<div className="gap-6 md:gap-8">Responsive gap</div>
```

**Layout Stacking:**
```tsx
<div className="flex flex-col md:flex-row gap-6">
  {/* Stacks vertically on mobile, horizontal on tablet+ */}
</div>
```

**Grid Columns:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

---

## Performance Considerations

- **Component Styling**: Include CSS in `<style>` tags within components (scoped to that page)
- **Lazy Loading**: Consider React.lazy for pages if bundle size grows
- **Memoization**: Use `useCallback` for expensive computations or event handlers
- **API Calls**: Fetch only needed data, use proper endpoints

---

## Browser Compatibility

- **CSS Masks**: Uses `-webkit-mask` for Safari compatibility
- **Backdrop Filter**: Blur effect supported in modern browsers
- **Gradients**: Linear gradients work across all modern browsers
- **CSS Variables**: Used for theming but with fallback values

---

## Adding New Features

### Adding a New Page

1. Create file in `frontend/src/pages/{FeatureName}.tsx`
2. Follow the standard page template above
3. Use glow-card system for all containers
4. Add to `App.tsx` imports
5. Add route in `<Routes>`
6. Add navigation link in nav menu (with `cursor-pointer`)
7. Update this CLAUDE.md with new color assignments if needed
8. **CRITICAL**: Add hover effects to ALL interactive elements:
   - All buttons: Add `cursor-pointer`
   - All form inputs: Add `cursor-text` + `hover:border-{accent}-400 hover:bg-{shade}` + `focus:border-{accent}-400 focus:outline-none`
   - All dropdowns/selects: Add `cursor-pointer` + `hover:border-{accent}-400 hover:bg-{shade}` + `focus:border-{accent}-400 focus:outline-none`
   - All clickable elements: Add `cursor-pointer` + appropriate hover effects
   - Always include `transition` class for smooth animations

### Adding a New Dashboard Card

1. Create card in 2x2 grid on Dashboard
2. Use appropriate glow-{color} class
3. Add clickable navigation with arrow icon
4. Match text sizing and spacing patterns
5. Use interface definitions for data
6. **Add hover effects**: Card automatically gets glow effect with `cursor-pointer`
7. **Add arrow icon hover**: Use `group-hover:translate-x-1 transition` for arrow

### Adding Form Inputs

For any new form (add, edit, delete operations):

1. All text inputs: Apply `cursor-text hover:border-{accent}-400 hover:bg-slate-600 focus:border-{accent}-400 focus:outline-none transition`
2. All select/dropdowns: Apply `cursor-pointer hover:border-{accent}-400 hover:bg-slate-600 focus:border-{accent}-400 focus:outline-none transition`
3. All buttons: Apply `cursor-pointer` to submit, cancel, and action buttons
4. Test all hover states before submitting

### Adding a New Color Scheme

If adding a new feature needing a color:

1. Pick an unused gradient pair from the list
2. Add CSS variables to `<style>` tag
3. Document in the Gradient & Glow Color System section
4. Use consistently across all instances
5. Apply correct accent color to hover effects (e.g., `hover:border-green-400` for green theme)

---

## File Organization

```
frontend/
├── src/
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Budgets.tsx
│   │   ├── Investments.tsx
│   │   ├── Debt.tsx
│   │   └── Savings.tsx
│   ├── components/         # Reusable components (future)
│   ├── App.tsx            # Main router and nav
│   ├── App.css            # Global styles
│   ├── main.tsx           # Entry point
│   └── index.css          # Global CSS
├── public/                # Static assets
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript config
```

---

## Common Issues & Solutions

**Issue**: Glow effect not showing
- Solution: Ensure `glow-card` and `glow-{color}` classes are both applied
- Check that CSS variables are defined in `<style>` tag

**Issue**: Text not readable on hover
- Solution: Ensure text color has sufficient contrast with background
- Use `group-hover:text-{color}` instead of changing background only

**Issue**: Cards not stacking on mobile
- Solution: Use `flex flex-col md:flex-row` instead of `flex flex-row`
- Ensure gap is specified: `gap-6`

**Issue**: API 404 errors
- Solution: Verify backend is running on `http://localhost:3000`
- Check endpoint path matches backend routes

**Issue**: Pages show empty state even after adding data
- Solution: Run database seed script: `cd backend && npx ts-node prisma/seed.ts`
- Verify backend and frontend are both running

**Issue**: Optional API fields causing TypeScript errors
- Solution: Make interface fields optional with `?` (e.g., `gain?: number`)
- Provide default values when using optional fields (e.g., `investment.gain || 0`)

**Issue**: Page shows blank/white screen with "Cannot read properties of undefined" error
- Solution: Check browser console for exact field causing the error
- Make the field optional in interface: `fieldName?: type`
- Add safe fallback at point of use: `(field || defaultValue).toFixed(2)` for numbers
- Test page with incomplete API responses to ensure all fields have fallbacks
- Pattern for calculations: `const spent = api.spent || 0; const percentage = limit > 0 ? (spent/limit)*100 : 0;`

---

## Database Setup

### Initial Data Population

After setting up the PostgreSQL database and running migrations, populate it with seed data:

```bash
cd backend
npx ts-node prisma/seed.ts
```

This creates:
- 1 default user (userId: 1)
- 2 sample accounts (Checking, Savings)
- 6 sample transactions (income and expenses)
- 3 sample investments (stocks, ETF, crypto)
- 2 sample debts (Student Loan, Credit Card)
- 3 sample savings goals
- 3 sample budget categories for current month

**Note**: The backend uses `DEFAULT_USER_ID = 1` for all API queries. Seed script ensures user exists before adding data.

### API Data Format

When designing API endpoints, ensure:
- Return fields match frontend interface definitions
- Optional fields should be handled gracefully (with `?` in TypeScript interfaces)
- All numeric values should be properly typed (numbers, not strings)
- Dates should be ISO format strings for consistent parsing

---

## Investment Account Management (September 10, 2026)

### Database Schema
- **InvestmentAccount** table: Stores account details (name, accountType, userId)
- **Investment** table: Now has foreign key `investmentAccountId` linking to InvestmentAccount
- Supports account types: Brokerage, 401k, Roth IRA, Traditional IRA, HSA

### Backend API Endpoints

**Investment Accounts:**
- `GET /api/investment-accounts` - List all accounts
- `GET /api/investment-accounts/:id` - Get account with all investments
- `POST /api/investment-accounts` - Create new account
  - Required: `name`, `accountType`
- `PUT /api/investment-accounts/:id` - Update account
  - Fields: `name`, `accountType`
- `DELETE /api/investment-accounts/:id` - Delete account (cascades to investments)

**Investments (Updated):**
- `POST /api/investments` - Create investment
  - Now accepts `investmentAccountId` parameter
  - If not provided, uses first available account
- All other endpoints updated to support new schema

### Frontend Features

**Investments Page:**
- Account dropdown selector with "All Accounts - Total Portfolio" option
- Add Account form (name + type selection)
- Delete Account button (visible when account selected)
- Add Investment form (name, type, value)
- Summary cards showing:
  - Total Contributions (invested amount)
  - Portfolio Value (current worth)
  - Total Gain/Loss (with percentage return)
- Holdings list with delete buttons on hover
- All metrics update per-account or show combined totals

**Dashboard Investments Card:**
- Dropdown selector for account selection
- "All Accounts - Total Portfolio" option
- Shows:
  - Total Value (large emphasis, text-4xl)
  - Invested Amount (smaller, text-sm)
- Click dropdown to switch without navigating away

### Data Calculations

**Invested Amount:** `Total Value - Total Gain` (cost basis)
**Percentage Return:** `(Total Gain / Invested Amount) * 100`

Color coding:
- Positive gains: Green
- Negative gains: Red

### Migration Notes
- Existing investments auto-migrated to "Default Account"
- Seed script creates 3 sample accounts with associated investments
- All existing data preserved during migration

---

## References

- **Tailwind CSS**: https://tailwindcss.com
- **React Documentation**: https://react.dev
- **React Router**: https://reactrouter.com
- **TypeScript**: https://www.typescriptlang.org
