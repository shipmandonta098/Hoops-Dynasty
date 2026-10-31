# Cloud saves: design proposal (not built)

Optional cloud backup and sync for careers and presets. The local IndexedDB copy stays the primary copy; the cloud is a
background mirror. Nothing changes for players who never sign in.

## 1. Save sizes (measured, then projected)

Measured on a default 30-team league (seed 2026), `JSON.stringify(state)`; gzip level 6, Brotli default:

| Point | Raw JSON | gzip | Brotli |
|---|---|---|---|
| New career | 1.29 MB | 188 KB | 92 KB |
| After 1 simulated season (rolled over to year 2) | 21.3 MB | 2.48 MB | 1.35 MB |

Biggest sections after one season: `playerFeats` 15.6 MB, `teamStatsArchive` 1.56 MB, `teams` 1.03 MB,
`teamSeasonArchive` 0.55 MB, `contractBook` 0.50 MB, `family` 0.49 MB, `statsArchive` 0.30 MB.

**Why it grows so fast:** each `playerFeats.games` entry stores the full game (box score plus `summaryData` with up to
12,000 feat actions) so the game recap can be reopened later. Entries are never pruned (only `processed` resets each
year; the validator allows 500,000 games). Archives are also never pruned (`league-repository.js`: "Historical rows are
never pruned").

Projection, assuming each season adds about what season 1 added (a second and third season could not be measured
here: one simulated season took 23 minutes headless, and season 2 had not finished after another 38). Treat these as
estimates within roughly ±30%:

| Career length | Today, raw | Today, gzip | With `playerFeats` trimmed, raw | Trimmed, gzip |
|---|---|---|---|---|
| 10 seasons | ~200 MB | ~23 MB | ~45 MB | ~5 MB |
| 30 seasons | ~600 MB | ~70 MB | ~135 MB | ~15 MB |

"Trimmed" keeps the feat itself (player, type, value, game id, date, a one-line context) and drops the stored full game
and action log after the season ends: about 4.4 MB raw / 0.5 MB gzip per season.

A 30-season save in today's format also breaks things that have nothing to do with the cloud. A ~600 MB JSON string is
past V8's maximum string length (about 512 MB), so `JSON.stringify` of the whole state fails, and export and backup
would fail with it. **Prerequisite:** trim or cap `playerFeats` (e.g. full recaps only for the last season plus the
top-N feats of all time) before shipping cloud saves. It's also worth doing on its own.

## 2. Provider choice

**Recommendation: Supabase** (Postgres + Storage + Auth in one free project, Row Level Security, plain HTTPS).

| | Supabase free | Firebase Spark (free) |
|---|---|---|
| Blob storage | 1 GB file storage | Cloud Storage now needs the Blaze (billing) plan, as of Feb 2026 |
| Database | 500 MB Postgres | Firestore 1 GiB stored, 50K reads/day, 20K writes/day; **1 MiB max per document**, so multi-MB saves need chunking |
| Egress | 5 GB/month | Firestore network egress metered; Storage needs Blaze |
| Auth | Magic link built in; 50K MAU | Email-link sign-in built in; quotas reported inconsistently, check the pricing page |
| Catch | **Free projects pause after ~1 week of inactivity** (restore from the dashboard) | Blobs effectively require a billing account |

Supabase gotchas to plan for:
- **Pausing.** A paused project means sync silently fails. The client must treat the cloud as optional and retry later. A
  low-traffic hobby project may need Pro ($25/month) or a weekly keep-alive ping.
- **Magic-link email.** Supabase's built-in email sender is heavily rate-limited and meant for testing. Production
  magic links need custom SMTP (e.g. a transactional email provider's free tier).

All free-tier numbers came from third-party pricing summaries checked in 2026. Confirm on supabase.com/pricing and
firebase.google.com/pricing before building.

## 3. Architecture

```
IndexedDB (primary) ──► sync queue ──► Supabase Storage (compressed blobs)
        ▲                                   │
        └──── pull when cloud revision ◄────┘  Postgres table `saves` (metadata, revisions, RLS)
```

- **Login:** `supabase.auth.signInWithOtp({email})` (magic link). The session lives in the SDK's storage. Signing out
  stops sync and keeps all local data.
- **Table `saves`:** `user_id`, `save_id`, `kind` ('career' | 'presets'), `name`, `revision`, `updated_at`, `device_id`,
  `size_bytes`, `chunk_manifest jsonb`, `previous_manifest jsonb`, `previous_revision`, `previous_device_id`.
  - RLS: `user_id = auth.uid()`.
  - Unique `(user_id, save_id)`.
- **Storage bucket `saves`:** private; path `<user_id>/<save_id>/<chunk>.json.gz`. Storage policies restrict each user
  to their own prefix.
- **Chunking, which matches the existing normalized repository:**
  - `core.json.gz`: current-season state (teams, players, schedule, settings). Changes on every save.
  - `season-<year>.json.gz`: archives for one finished season. **Immutable once the season ends, so uploaded once.**
  - `presets.json.gz`: the preset list.

  A sync then normally uploads only `core` (~1–3 MB gzip), not the whole career. A new device downloads every chunk once.
- **Compression:** `CompressionStream('gzip')` (Chrome 80+, Firefox 113+, Safari 16.4+). Brotli would be about 45%
  smaller but has no native browser compressor; skip it at first.
- **When to sync:**
  - debounced after saves (at most every 2–5 minutes);
  - on `visibilitychange` to hidden;
  - at season rollover;
  - from a manual "Sync now" button.

  Use a queue in IndexedDB so a closed tab resumes later. Nothing blocks gameplay.
- **When to pull:** on launch and on focus, read the `saves` rows (tiny). Download chunks only when the cloud revision is
  newer than local, so egress stays small.

## 4. Conflicts (last-write-wins + keep the previous version)

Every local record already carries a `revision` (incremented on save) and `updatedAt`. Each device also has a stable
`device_id`.

1. **Upload:** chunks go to new paths first. A Postgres RPC then swaps the manifest:
   - in one transaction: `previous_* := current_*; current := new; revision := new`;
   - only if the stored revision is the one this device last saw (compare-and-swap).
2. **CAS succeeds:** done. The prior cloud version stays as `previous_*` (one level of history).
3. **CAS fails** (another device uploaded since):
   - **Last write wins** by `updated_at`.
   - The loser is not discarded. If the cloud wins, the local version is uploaded as `previous_*` and kept locally as a
     "Conflict copy" save slot. If local wins, the cloud's current version becomes `previous_*`.
   - Show: "This career was also played on *Device B* (Year 2031, day 54). Kept the newer one; the other is saved as
     a backup." Offer **Restore other version**.
4. Old chunk files are garbage-collected when no current or previous manifest references them.

## 5. Size limits

- **Per user:** 5 synced careers and 100 MB total compressed (current + previous). Show usage in the sync panel.
- **Per save:** refuse to sync careers above 50 MB compressed, with a clear message and export as the fallback.
  Supabase's free per-file upload cap (reported as 50 MB) also applies; chunking keeps individual files far below it.
- Presets: a few hundred KB at most; always allowed.

## 6. Cost at free-tier limits (Supabase)

Assumes `playerFeats` is trimmed. Without the trim, divide user counts by about 4–5.

- **Storage (1 GB).**
  - A typical user (one 10-season career plus its previous version): ~10–12 MB, so **~80–100 users**.
  - A heavy user (several long careers): ~50–100 MB, so **10–20 users**.

  Storage is the first limit hit.
- **Egress (5 GB/month).**
  - A new-device restore of a 10-season career is ~5 MB, so ~1,000 restores/month.
  - Routine pulls download only changed `core` chunks (~2 MB), so ~2,500 pulls/month.

  Uploads are not egress.
- **Database (500 MB):** metadata rows only; effectively unlimited for this use.
- **Beyond free:** Pro is $25/month (much larger storage and egress allowances; check current numbers). Free tier is fine
  for personal and friends use, not for a public release with many long careers.

## 7. Build order (when approved)

1. Trim/cap `playerFeats` (prerequisite; also fixes export of long careers).
2. Chunked export/import in `league-repository.js` (core + per-season archives) with gzip, reusing the existing
   normalized stores.
3. Supabase project, schema, RLS, storage policies, CAS RPC.
4. Sign-in UI, sync queue, pull-on-launch, conflict copy and restore UI, usage panel.
5. Tests: CAS conflict paths, immutable season chunks uploaded once, a quota-exceeded refusal, a pause/offline retry,
   and a round trip from one simulated device to another.
