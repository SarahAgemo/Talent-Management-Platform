# Storage setup — CVs & Resource Documents

Create two **private** Storage buckets in the Supabase dashboard: `student-cvs` and `resource-documents`.

For each bucket, add policies under Storage > Policies. **Important: each policy covers exactly
one operation, and the "Policy definition" box takes only a plain SQL boolean expression — no
labels, no colons, no backticks.**

## student-cvs (any staff member can read/upload/update)
Create three separate policies, each with this same expression, one per operation (SELECT, INSERT, UPDATE):
```
auth.role() = 'authenticated'
```

## resource-documents (read by all staff, write by Admins only)
- Policy 1 — operation SELECT:
```
auth.role() = 'authenticated'
```
- Policy 2 — operation INSERT, and Policy 3 — operation UPDATE, both using:
```
exists (
  select 1 from staff_users su
  where su.id = auth.uid()
  and su.role in ('super_admin', 'placement_admin')
)
```

Once both buckets and their policies exist, CV upload and the Resources Hub document library work end to end.
