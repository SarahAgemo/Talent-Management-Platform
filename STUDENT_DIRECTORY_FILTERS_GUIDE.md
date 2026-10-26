# Student Directory: "Placed" filters (period or date range) and a Status dropdown

This update is built on the code that is live now: GitHub `master`, commit **ddacd18 "Update dashboard reporting"**.
It **replaces `student_directory_placed_in_update.zip`**, so don't apply that one. Everything it contained is included here.
No data changes, no SQL and no new npm packages.

## What's new in the Student Directory

### Status is a single dropdown

The row of status buttons is now one **Status** list: All statuses / Unplaced / Onboarding / Applying / … / Further Skilling. All the filters sit on one tidy row.

### "Placed" row: By period or Date range

Use the switch on the left of the row to pick how you want to filter.

**By period**: Year → Month → Week → Day, the same periods as the Dashboard.

- **Year**: Any time / a year / **No date recorded**.
- **Month**: the year's 12 months.
- **Week**: the month's weeks, running Monday to Sunday.
- **Day**: the week's days.
- Periods that haven't started yet are greyed out.

**Date range**: **From** and **To** dates, then **Apply** (or press Enter).

- Both dates are included, so 21 Sep to 21 Oct counts placements on 21 Sep and on 21 Oct.
- You can fill in just one side: "From 1 Jan 2026" means from that day up to today, and "To 31 Dec 2024" means everything up to that day.
- If From is after To, Apply stays off and a short message explains why.

**How results work**

- The list shows people **placed** in the period or range, in the order they were placed.
- The count at the top says so, e.g. "5 students matching current filters · placed between 21 Sep 2026 and 21 Oct 2026".
- The Placed filters combine with the other filters (program, staff, 10X file, graduated, sponsor, inclusion support, name search).
- While a period or range is set, the Status list shows **Placed**. Choosing another status, or **All statuses**, removes the period or range.
- **Clear** removes it too.

**Export → Download CSV / Excel (all matching)** downloads exactly the list on screen, named after the filter, e.g. `students_placed_2026-09-21_to_2026-10-21.xlsx` or `students_placed_2026-10.xlsx`.

## What's new on the Dashboard

- **See names →** under "Placements in this period" opens the directory on that period.
- Every number in the **New placements** column links to the people behind it.
- The links keep the Dashboard's "10X file participants" / "Graduates only" setting, so the list always matches the number.

## Counting rules (same as the Dashboard)

Someone counts as placed in a period or range when both of these are true:

- their placement status is **Placed**, and
- their placement date is inside it and isn't in the future.

"Today" means today in Uganda.

## Files

New:
- `lib/placedFilter.ts`

Replaced (full files in this zip):
- `app/students/page.tsx`
- `components/StudentFilters.tsx`
- `components/ExportStudentsButton.tsx`
- `components/DashboardClient.tsx`
- `app/dashboard/page.tsx`

The commented-out older versions at the top of these files are left as they were.

## Steps

1. In your project folder, run `git pull`. Then `git log -1 --oneline` should show `ddacd18 Update dashboard reporting`, and `git status` should be clean. If you have local edits to any file listed above, send them to me first.
2. Unzip into the project root and choose **Replace** for every file.
3. Run `npm run build`. It must finish with no errors.
4. Run `npm run dev` and check:
   - In the Student Directory, pick a Status from the dropdown.
   - Switch to **Date range**, enter 21 Sep – 21 Oct and press **Apply**, then **Export → Download Excel**.
   - On the Dashboard, pick 2026 → October and click **See names →**.
5. Commit and push:
   `git add -A && git commit -m "Student Directory: placed period/date range filters, status dropdown" && git push`.

## Undo

Run `git revert HEAD && git push`, or promote the previous deployment in Vercel.
