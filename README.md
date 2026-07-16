# Touch Grass
Touch grass is an application that you can use to plan your outing. Ever feel like you want to go somewhere but nowhere in specific? Annoying isn't it? Well, not anymore. 

Touch Grass lists all the attractions near your local area. Whether it be local delish grub, or activities like cycling or indoor skydiving. Anything and everything that your area has to offer at your fingertips. No more staying home cuz of indecision.


### Tech Stack
The application is made using Expo and TypeScript with a Supabase backend (Supabase Auth for accounts).

### Features
- **Accounts** — sign in with Google or create an account with email + password (you pick your username); sessions persist across app restarts. Browsing is open to everyone, but pinning spots and commenting require an account.
- **Private-by-default photos** — every photo is resized (max 1080px), recompressed (~150–300KB) and stripped of EXIF/GPS metadata on the phone before upload; the original never leaves the device.
- **Feed ("Near you")** — everyone's spots as photo-forward cards; when location is allowed, the closest pins come first and each card shows how far away it is.
- **Search & filter** — search across titles, descriptions, tags and vibes, and filter by category with the chip bar.
- **Spot detail** — tap any spot to read its full write-up, see it pinned on a mini map, and join the comments (long-press one of your own comments to delete it).
- **Map** — every pinned spot shown as a marker; tap a marker's callout to open its detail page.
- **Discover green spots** — parks, gardens, playgrounds, nature reserves, beaches and viewpoints from OpenStreetMap (free Overpass API, no key) appear as small dots for the visible map area; toggle them with the tree button. Tap a dot to see its name — been there? Pin it yourself.
- **Add a spot** — title, description, category, tags, up to 5 photos, and a location you can pick from the map or your current position. Spots are published under your username.
- **Profile** — tap your avatar in the top-right of the map or feed: your identity, the spots you've pinned, and sign out.

### Backend setup (required)
The app talks to a Supabase project. The original demo project is offline, so you
need your own:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). This
   creates the `Spots`, `profiles` and `Comments` tables, the category enum,
   the `get_category_enum_values` RPC used by the Add-Spot form, the
   `location-images` storage bucket, a trigger that creates a profile row on
   signup, and row-level-security policies (public reads; writes require a
   signed-in user; storage writes only under your own `<user-id>/` folder).
   The file is idempotent — re-run it on an existing project to upgrade it
   (it also migrates any stored image URLs to bare paths).
3. Copy `.env.example` to `.env` and fill in your project URL and anon key:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Email sign-in setup
Email + password works out of the box — Supabase's Email provider is enabled
by default. One decision to make in the dashboard (Authentication → Sign In /
Providers → Email): the **"Confirm email"** toggle. Leave it on and new
sign-ups must click a link emailed to them before they can sign in (the app
shows a "check your inbox" notice); turn it off and accounts work immediately.
For a first iteration, turning it off is the smoothest.

New email accounts pick their username at sign-up; Google accounts get an
auto-generated `explorer_…` handle via the signup trigger.

### Google sign-in setup (required for the Google button)
Google sign-in goes via the backend's OAuth flow and a deep link back into
the app.

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)
   → APIs & Services → Credentials): create an **OAuth client ID** of type
   **Web application** for this app (keep it separate from other apps'
   credentials). Add this authorized redirect URI, substituting your project
   ref:
   ```
   https://YOUR-PROJECT.supabase.co/auth/v1/callback
   ```
   If prompted, configure the OAuth consent screen first (External, add
   yourself as a test user while unverified).
2. **Supabase dashboard** → Authentication → Sign In / Providers → Google:
   enable it and paste the client ID and client secret from step 1.
3. **Supabase dashboard** → Authentication → URL Configuration → Redirect
   URLs: add the deep links the app returns on. For dev builds/TestFlight:
   ```
   touchgrass://auth-callback
   ```
   For Expo Go, the redirect uses Expo's scheme — start the dev server, tap
   "Continue with Google" once, and copy the exact `exp://.../--/auth-callback`
   URL from the browser error if sign-in bounces; add it here. (It looks like
   `exp://192.168.x.x:8081/--/auth-callback`.)

### Architecture notes
- All backend calls live behind wrappers the app owns: `src/lib/auth.tsx`
  (sign-in/session), `src/lib/storage.ts` (image upload/URLs/delete) and the
  data modules `src/lib/spots.ts` / `src/lib/comments.ts`, all sitting on the
  single client in `src/lib/backend.ts`. No screen or component talks to the
  vendor directly, and the vendor's name appears nowhere else in the app.
- The database stores image **paths** (`<user-id>/<timestamp>.jpg`), never
  URLs. Full URLs are built from one base-URL value in `backend.ts`.
- Images are compressed client-side before upload (1080px long edge, JPEG
  ~78%), which also strips EXIF/GPS metadata — photos are public, so location
  tags must never be uploaded. Feeds render through `expo-image`'s disk cache
  to keep egress low.

### Verification checklist (after setup)
- [ ] Sign in with Google, kill the app, reopen — still signed in.
- [ ] Upload a camera photo; in the dashboard (Storage → location-images) the
      file sits under your user-id folder and is under ~300KB.
- [ ] Download that file and check EXIF (e.g. `exiftool file.jpg` or an online
      viewer) — no GPS/date metadata.
- [ ] Signed out you can browse the feed but the Add tab asks you to sign in.
- [ ] With user A's token, deleting a file under user B's folder via the
      storage REST API fails (policy scopes deletes to your own prefix).
- [ ] A new spot's `image_url` in the `Spots` table contains a bare path, not
      a full URL.

### Running the application
1. Clone the repo and run `npm install`.
2. Complete the **Backend setup** above.
3. Run `npm run start` to start the Expo dev server.
4. Scan the QR code with the Expo Go app (or press `i` / `a` for a simulator).

#### Future plans
- Location-based sorting ("spots near me").
- Multiple photos per spot and editing/deleting spots.
- Persisted likes and follower feeds.

