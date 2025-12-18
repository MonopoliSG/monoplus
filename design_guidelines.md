# Design Guidelines: Insurance Customer Database Platform

## Design Approach
**Design System Foundation**: Material Design principles adapted for enterprise B2B context, drawing inspiration from Linear's clean data presentation, Notion's information hierarchy, and modern enterprise dashboards like Retool and Airtable.

**Core Philosophy**: Professional, data-focused interface prioritizing clarity, efficiency, and quick access to insights. Clean, minimal aesthetic that keeps focus on data while maintaining visual hierarchy.

---

## Typography System

**Font Family**: Inter (primary) via Google Fonts CDN for excellent readability at small sizes
- Headlines/Page Titles: text-2xl to text-3xl, font-semibold
- Section Headers: text-lg to text-xl, font-medium  
- Body Text: text-sm to text-base, font-normal
- Data/Numbers: text-sm, font-medium (tabular-nums for alignment)
- Labels/Captions: text-xs to text-sm, font-medium, uppercase tracking-wide

---

## Layout & Spacing

**Grid System**: Standard Tailwind spacing units: **2, 3, 4, 6, 8, 12, 16**
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Page margins: p-6 to p-8
- Card spacing: p-4 to p-6

**Layout Structure**:
- Sidebar Navigation: Fixed left sidebar (w-64), collapsible on mobile
- Main Content Area: max-w-7xl with responsive padding
- Dashboard Grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for metrics cards
- Data Tables: Full-width containers with horizontal scroll on mobile

---

## Component Library

### Navigation & Layout
- **Sidebar**: Fixed navigation with icon + text labels, grouped sections (Dashboard, Customers, Products, Segments, Analytics)
- **Top Bar**: Breadcrumb navigation, search bar, user profile dropdown
- **Dashboard Cards**: Metric cards with large numbers, trend indicators, mini charts

### Data Display
- **Customer Table**: Sortable columns, row actions menu, pagination, bulk selection checkboxes, inline filters
- **Profile Cards**: Customer summary cards with avatar placeholder, key metrics, quick actions
- **Segment Pills**: Rounded tags showing segment membership (e.g., "Araç Sigortası", "30-40 Yaş")
- **Analytics Panels**: Card-based insights with icon, headline, supporting text, and optional chart

### Forms & Inputs
- **CSV Upload Zone**: Drag-drop area with file icon, supported format text, file preview after selection
- **Filter Panels**: Collapsible filter sections with checkboxes, dropdowns, date pickers
- **Product Definition Form**: Multi-step form with text areas for detailed descriptions
- **Search Bar**: Prominent search with icon, placeholder text, keyboard shortcut indicator

### AI Features
- **Insight Cards**: Distinct visual treatment with AI icon/badge, analysis text, confidence indicators
- **Recommendation Panels**: Product suggestions with reasoning, acceptance/dismissal actions
- **Segment Analysis**: Expandable sections showing behavior patterns, percentage breakdowns, visual progress bars

### Overlays
- **Modal Dialogs**: Customer profile detail view, product creation, confirmation prompts
- **Slide-over Panels**: Quick filters, customer quick view, AI recommendations drawer
- **Toast Notifications**: Success/error messages for imports, updates, AI analysis completion

---

## Page Layouts

### Dashboard
3-column grid of metric cards, recent activity feed, quick action buttons, segment highlights panel

### Customer List
Full-width data table with sticky header, left sidebar filters (collapsible), top search/import actions

### Customer Profile
Two-column layout: Left (demographic info, contact, KVKK status), Right (policy list, AI recommendations, activity timeline)

### Segment Analysis
Split view: Left (segment list with selection), Right (detailed analysis, charts, customer count, behavior insights)

### Product Management
Grid of product cards with category filters, create/edit modal forms

---

## Visual Enhancements

**Icons**: Material Icons via CDN - use for navigation, actions, status indicators, data categories

**Charts**: Recharts library for segment analysis - simple bar charts, line trends, pie charts for distribution

**Empty States**: Friendly illustrations (placeholder comments) with helpful text and primary action

**Loading States**: Skeleton screens for tables, shimmer effect for cards, spinner for AI analysis

**Status Indicators**: Dot badges for active/inactive, colored pills for categories, progress bars for completion

---

## Images

**No hero images** - This is a data-focused enterprise tool. Images used sparingly:
- Empty state illustrations (CSV import zone, no customers found, no segments)
- Avatar placeholders for customer profiles (use initials in circular containers)
- Optional: Small brand logo in sidebar header

---

## Responsive Behavior

- **Mobile (< 768px)**: Hamburger menu, stacked layouts, simplified tables (show key columns only), bottom sheet for filters
- **Tablet (768-1024px)**: Persistent sidebar, 2-column grids, full tables with horizontal scroll
- **Desktop (> 1024px)**: Full 3-column layouts, expanded sidebar, side-by-side panels