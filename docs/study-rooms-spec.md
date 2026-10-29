# North Synapse Study Rooms — Technical Specification

## Scope
This change extends the existing Study Lounge on `feat/social-interactions-profile-saves`. It must not replace the current app shell, authentication, resource hub, discussions, profile, announcements, feedback, or admin features.

## User-facing requirements
- One authenticated user may occupy only one room at a time; joining a different room atomically leaves the prior room.
- A permanent public room, **The Commons**, is pinned first and cannot be ended or deleted.
- User-created rooms have name, description/rules, subject, visibility, room code for private rooms, owner and creation time.
- Room directory supports name search, room-code join, newest-first sorting and online-member-count sorting. The Commons remains pinned regardless of sort.
- Room view has three columns: ordered member list, personal timer/goal, and real-time text chat.
- Members are ordered owner first, then by joined_at ascending. Show avatar, display name and time in room.
- Each user owns their own timer and goal. No audio/video/WebRTC.
- Owner may kick another member or end a room. A kicked user returns to the directory and sees a notice.
- On owner leave, the owner can select a successor; otherwise the earliest remaining member becomes owner. If the room becomes empty, owner_id is null and the room enters the 24-hour empty retention window.
- Empty user-created rooms are ended after 24 hours. The Commons is never expired.

## Database additions
- `study_rooms`: owner_id, is_system_lobby, status, empty_since, closed_at.
- `study_room_active_members`: one row per user, enforcing single-room membership at the database level.
- `study_room_kick_events`: durable kick notification.
- Security-definer RPCs perform join, private-code join, leave/owner handoff, kick, end and cleanup atomically.

## Authorization
- Supabase Auth identity is authoritative; no client-supplied user ID is trusted for privileged actions.
- Direct client writes to owner/lifecycle fields are not used for privileged operations. RPCs validate auth.uid(), room ownership, room status, target membership and private room code.
- The active-member table has read access for authenticated clients and no direct client insert/update/delete policy.
- Kick events can only be read/acknowledged by the target user.
- Chat and presence continue using the existing tables and policies; their current policies must be checked against active membership before production rollout.

## Presence and cleanup
- Existing room heartbeat remains the online source. Two minutes without heartbeat is treated as offline by cleanup.
- A scheduled `cleanup_study_rooms()` run every five minutes removes stale active membership, repairs owner assignment, and ends empty rooms after 24 hours.
- If pg_cron is unavailable, enable it in Supabase or schedule the function using Supabase Cron/Edge Functions before relying on automatic expiry.

## Rollout / verification
1. Apply the additive migration to a staging Supabase project first.
2. Confirm existing table columns and RLS policies match the migration assumptions.
3. Test two independent authenticated accounts in separate browsers.
4. Test public/private join, invalid codes, switching rooms, message sync, owner transfer, kick notification, room end, last-member leave and 24-hour cleanup.
5. Run `npm run lint` and `npm run build` before merging.
