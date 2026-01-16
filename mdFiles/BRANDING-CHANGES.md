# Branding Changes: Replace with "Harmony Mellon"

## Main User-Facing Locations to Update

### 1. **Page Title (Browser Tab)**
- **File:** `app/layout.tsx`
- **Line 6:** `title: "Mellon Harmony - Issue Tracker"`
- **Change to:** `title: "Harmony Mellon"`

### 2. **Login Page Heading**
- **File:** `app/page.tsx`
- **Line 53:** `<h1 className="text-3xl text-gray-800">Mellon</h1>`
- **Change to:** `<h1 className="text-3xl text-gray-800">Harmony Mellon</h1>`

### 3. **Sidebar Header**
- **File:** `src/components/Sidebar.tsx`
- **Line 48:** `<h2 className="text-xl">Issue Tracker</h2>`
- **Change to:** `<h2 className="text-xl">Harmony Mellon</h2>`

## Summary
These are the three main user-facing locations where the branding appears. All other occurrences are in:
- Backend module names (technical, can stay as-is)
- Database names (technical, can stay as-is)
- Package.json name (technical, can stay as-is)
- Documentation files (can be updated if desired)
