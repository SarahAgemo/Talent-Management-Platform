# Design update: real logo, refreshed look, light and dark mode

Built on the code that is live now: GitHub `master`, commit **783d90f "Update Students"**.
This update changes no data and needs no SQL or new npm packages. It doesn't touch any page logic or database code.

## What changes

- **Real Refactory logo**, drawn from the master artwork with the same shapes and the brand purple and cerulean. It appears in the top bar and on the sign-in pages. In dark mode it uses the white-wordmark version from the brand manual. The browser tab icon is the Refactory icon (the anchors and slash) on a white tile.
- **Sign-in, forgot-password and reset-password pages** are redesigned. A purple brand panel carries the tagline, and the form has icons, a show/hide password button and a loading spinner. The sign-in logic is exactly as before.
- **Top bar**: sticky and slightly translucent, with rounded page tabs, the light/dark switch, and a new **Sign out** button with an icon. Sign out turns red on hover and shows "Signing out…" while it works. On narrow screens the tabs move to a second row instead of being squeezed.
- **Light / Dark / System switch** (sun / moon / screen icons, top right).
  - The choice is remembered in each browser. "System" follows the computer's own setting.
  - There is no flash of the wrong colours when a page loads.
  - Printing or "Save as PDF" always uses light colours.
- **Every page** follows the theme with no per-page work: backgrounds, cards, tables, inputs, badges, popups and the dashboard charts.
- **Brand colours and fonts**:
  - Colours are purple #663367 and cerulean #38BFC3.
  - Headings, tabs and figures use Century Gothic, falling back to Helvetica Neue (the manual's alternate) where it isn't installed. Tables and forms use Helvetica Neue / Segoe UI so dense data stays compact. No fonts are downloaded.
- **Buttons**: purple buttons now deepen in purple on hover (they used to flash teal), with smooth transitions and a visible focus ring for keyboard users.
- **Small fixes**:
  - Popups (Allocate, upload confirmations, error messages) used to leave a strip at the top of the screen uncovered. They now cover the whole screen.
  - The sticky "Staff" column in Staff Performance by Period no longer lets other columns show through when scrolled.

## Files

New:
- `components/Logo.tsx`
- `components/ThemeToggle.tsx`
- `components/AuthShell.tsx`
- `components/AppMain.tsx`
- `app/favicon.ico`

Replaced (full files in this zip):
- `tailwind.config.js`
- `app/globals.css`, `app/layout.tsx`
- `app/login/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`
- `app/dashboard/page.tsx`, `app/resources/page.tsx`, `app/students/upload/page.tsx`
- `components/NavBar.tsx`, `components/ErrorPopup.tsx`, `components/DashboardCharts.tsx`, `components/DashboardClient.tsx`, `components/StatusBadge.tsx`
- `components/ActivityLog.tsx`, `components/AllocationBoard.tsx`, `components/AllocationModal.tsx`, `components/CommentsSection.tsx`, `components/PlacementForm.tsx`, `components/ResourceDocumentUpload.tsx`, `components/SkillsetForm.tsx`, `components/StudentDetailsForm.tsx`, `components/StudentFilters.tsx`

In the last group, and in dashboard, resources and upload, only styling changed: colour class names, the popup fix, and a coloured strip on the dashboard's five summary cards. No logic changed in these files.

## Steps

1. In your project folder, confirm you're on the live code with nothing uncommitted:
   `git pull` → `git log -1 --oneline` should show `783d90f Update Students`, and `git status` should be clean.
   If you have local edits to any file listed above, stop and send them to me first so nothing is overwritten.
2. Unzip this file into the project root and choose **Replace** for every file. The folders in the zip match the project.
3. Run `npm run build`. It must finish with no errors.
4. Run `npm run dev` and check:
   - **Sign-in page**: try the light/dark switch, and try a wrong password to see the error popup.
   - **Dashboard**: look at the charts in both modes.
   - **Students**, **one student's page**, and **Allocations** (open an Allocate popup).
   - **Sign out**.
5. Commit and push:
   `git add -A && git commit -m "Brand logo, design refresh, light/dark mode" && git push`.
   Vercel deploys as usual.

## Undo

Either `git revert HEAD && git push`, or in Vercel promote the previous deployment. No data is involved either way.
