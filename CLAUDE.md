# MoneyFlow - Design & Implementation Guidelines

## Project Overview

MoneyFlow is a modern financial tracker application with a sleek dark theme, responsive design, and interactive dashboard. Built with React, TypeScript, Tailwind CSS, and Vite.

**Tech Stack:**
- Frontend: React 18 with TypeScript
- Styling: Tailwind CSS
- Build: Vite
- Routing: React Router v6
- Backend: Node.js/Express API (running on `http://localhost:3000`)

---

## Design System

### Color Palette

#### Primary Colors
- **Background**: Gradient from slate-900 → purple-900 → slate-900
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
--color-1: #ff6b6b;
--color-2: #ffa94d;
--glow-color: rgba(255, 107, 107, 0.8);

/* Cyan/Blue - Transactions, Dashboard */
--color-1: #00d9ff;
--color-2: #0099ff;
--glow-color: rgba(0, 217, 255, 0.8);

/* Purple/Magenta - Budgeting */
--color-1: #c77dff;
--color-2: #ff006e;
--glow-color: rgba(199, 125, 255, 0.8);

/* Green - Investments */
--color-1: #00d97e;
--color-2: #00a86b;
--glow-color: rgba(0, 217, 126, 0.8);

/* Blue - Debt */
--color-1: #00b4ff;
--color-2: #0066ff;
--glow-color: rgba(0, 180, 255, 0.8);
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

### Glow Card System

The core component used throughout the app for any card-based content.

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
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

/* Gradient border effect */
.glow-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border-radius: 1.5rem;
  padding: 2px;
  background: linear-gradient(135deg, var(--color-1), var(--color-2));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 10;
}

/* Glow effect (blurred background) */
.glow-card::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, var(--color-1), var(--color-2));
  z-index: -1;
  filter: blur(15px);
  opacity: 0.3;
  transition: opacity 0.3s ease, filter 0.3s ease;
  pointer-events: none;
}

/* Hover state - glow intensifies */
.glow-card:hover::before {
  opacity: 0.6;
  filter: blur(25px);
}
```

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

**Input Field:**
```tsx
<input
  type="text"
  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none transition"
  placeholder="Enter value"
/>
```

**Select Dropdown:**
```tsx
<select className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 text-sm">
  <option>Option</option>
</select>
```

**Form Container:**
```tsx
<form className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6 mb-8 space-y-4">
  {/* form fields */}
</form>
```

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

All pages use this consistent structure:

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
  {/* page content */}
</div>
```

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
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

// Fetch data changes based on filter
useEffect(() => {
  fetchData();
}, [filterType, selectedMonth, selectedYear]);
```

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

**Overall Structure**:
- **Left Column** (1fr): 4 metric cards stacked vertically
  - Net Worth
  - Available Funds
  - Savings
  - Debt
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

**Responsive Behavior**:
- Mobile (< 1024px): Single column layout, cards stack vertically
- Desktop (≥ 1024px): 2-column layout with left sidebar and right grid

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
6. Add navigation link in nav menu
7. Update this CLAUDE.md with new color assignments if needed

### Adding a New Dashboard Card

1. Create card in 2x2 grid on Dashboard
2. Use appropriate glow-{color} class
3. Add clickable navigation with arrow icon
4. Match text sizing and spacing patterns
5. Use interface definitions for data

### Adding a New Color Scheme

If adding a new feature needing a color:

1. Pick an unused gradient pair from the list
2. Add CSS variables to `<style>` tag
3. Document in the Gradient & Glow Color System section
4. Use consistently across all instances

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

---

## References

- **Tailwind CSS**: https://tailwindcss.com
- **React Documentation**: https://react.dev
- **React Router**: https://reactrouter.com
- **TypeScript**: https://www.typescriptlang.org
