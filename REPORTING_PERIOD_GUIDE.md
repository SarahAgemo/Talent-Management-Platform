# Dashboard reporting period: Year → Month → Week → Day, with downloads

This update is built on the code that is live now: GitHub `master`, commit **616d225 "Update system designs"**.
It changes no data, needs no SQL and adds no npm packages. It only changes the Dashboard.

## What changes on the Dashboard

**A new "Reporting period" box** replaces the old two filters ("All years" and "By day / week / month / year"). It has four lists that open in order:

- **Year**: "All years" or a single year.
- **Month**: once you pick a year, all 12 months of that year are listed (months that haven't started yet are greyed out).
- **Week**: once you pick a month, its weeks are listed, e.g. "Week 2 (5-11 Oct)".
  - Weeks run Monday to Sunday and are cut at the month's edges, so Week 1 can be short and the weeks always add up exactly to the month.
- **Day**: once you pick a week, its days are listed, e.g. "Wed 7 Oct".

Each level breaks down into the one below it:

| You pick | The tables and chart show |
|---|---|
| All years | one row per year |
| A year | its 12 months |
| A month | its weeks |
| A week | its days |
| A day | that single day |

**Ways to move around the periods**

- Click any row in the Placed vs Unplaced table (for example "Oct 2026") to open it.
- Use the trail under the lists (All years › 2026 › October › Week 2) to go back up.

**Four headline figures** for the chosen period:

- Placements in the period
- Placed by the end of the period
- Unplaced at the end of the period
- Placed %

**Every section below follows the period**: Placed vs Unplaced, Staff Performance, Placement Rate by Program, Placement Rate by Sponsorship, Employment Types and Top 10 Job Titles.

- Staff Performance now has one column per month, week or day of the period (from August 2026, when allocation tracking began). It also has a new **Period Total** column.
- The summary cards at the top of the page and Staff Accountability Overview stay as they were: they show the situation right now, not a period.

## Downloads

- **Download report (Excel)** gives one file for the chosen period, e.g. `placement_report_2026-10.xlsx`. It has seven sheets:
  1. Summary (the period, which participants are included, and the headline figures)
  2. Placed vs Unplaced
  3. Staff performance
  4. By program
  5. By sponsorship
  6. Employment types
  7. Top job titles
- **Export ▾** on each section downloads just that table as CSV or Excel.

## How the numbers are counted (unchanged rules)

- "Placed (cumulative)" counts every placement up to the end of each row, including earlier years. "Unplaced" is the rest of the participants counted.
- Placements with no placement date (or a date in the future) only appear under **All years**, in the "Placement Date Not Recorded" row. In Staff Performance they appear under "Not Recorded".
- Staff placements before 1 Aug 2026 are grouped under "Before Aug 2026".
- One deliberate change: with **All years**, the Placed vs Unplaced chart now shows one bar per year, where it used to show one per month. To see months, pick a year.

## Files

New:
- `lib/reportPeriods.ts`

Replaced (full files in this zip):
- `components/DashboardClient.tsx`
- `components/DashboardCharts.tsx` (the chart tooltip handles periods that haven't started)
- `lib/exportUtils.ts` (adds the multi-sheet Excel download; existing exports are untouched)
- `app/dashboard/page.tsx` (one line: passes "Everyone / 10X file participants · All participants / Graduates only" so the downloaded report says who it covers)

## Steps

1. In your project folder, run `git pull`. Then `git log -1 --oneline` should show `616d225 Update system designs`, and `git status` should be clean. If you have local edits to any file listed above, send them to me first.
2. Unzip into the project root and choose **Replace** for every file.
3. Run `npm run build`. It must finish with no errors.
4. Run `npm run dev`, open the Dashboard and check:
   - Pick 2026 and see 12 months.
   - Pick October and see 5 weeks.
   - Pick Week 2 and see 7 days.
   - Click **Download report (Excel)** and open the file.
5. Commit and push:
   `git add -A && git commit -m "Dashboard reporting period drill-down and report download" && git push`.

## Undo

Run `git revert HEAD && git push`, or promote the previous deployment in Vercel.
