# Admin bootstrap — first registry staff account

`/registry-admin` is denied to everyone until a row exists in `public.staff_roles`
for that user. There is no self-service way to become staff, and nothing in the
client can create or edit a staff role: `staff_roles` grants the `authenticated`
role `SELECT` only.

## One-time setup

1. Have the person who should be the first admin **sign up normally** at `/auth`
   and confirm their email address.
2. Run the following SQL **server-side** (Lovable Cloud → run SQL / migration
   tooling). Replace the email with the real one.

```sql
insert into public.staff_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'first.admin@example.com'
on conflict (user_id, role) do nothing;
```

3. Confirm it landed:

```sql
select u.email, s.role, s.created_at
from public.staff_roles s
join auth.users u on u.id = s.user_id;
```

4. That user can now open `/registry-admin`. Everyone else keeps seeing the
   "Access denied" panel.

## Adding more staff later

Admins add reviewers the same way, changing `'admin'` to `'reviewer'`:

```sql
insert into public.staff_roles (user_id, role)
select id, 'reviewer'
from auth.users
where email = 'reviewer@example.com'
on conflict (user_id, role) do nothing;
```

## Removing staff

```sql
delete from public.staff_roles
where user_id = (select id from auth.users where email = 'former.staff@example.com');
```

## Notes

- Never derive staff status from `raw_user_meta_data` or any user-editable field.
- `/registry-admin` is not linked from the public homepage or user navigation,
  but hiding the link is not the control — the route guard plus the RLS policies
  on `property_registrations`, `staff_notes` and `registration_status_history`
  are.
- The route is marked `noindex, nofollow`.
