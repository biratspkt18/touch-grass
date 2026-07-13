# Touch Grass
Touch grass is an application that you can use to plan your outing. Ever feel like you want to go somewhere but nowhere in specific? Annoying isn't it? Well, not anymore. 

Touch Grass lists all the attractions near your local area. Whether it be local delish grub, or activities like cycling or indoor skydiving. Anything and everything that your area has to offer at your fingertips. No more staying home cuz of indecision.


### Tech Stack
The application is made using Expo and TypeScript with a Supabase backend (no authentication yet).

### Features
- **Feed** — browse your saved spots as cards with photo, category, and tags.
- **Search & filter** — search across titles, descriptions, tags and vibes, and filter by category with the chip bar.
- **Spot detail** — tap any spot to read its full write-up and see it pinned on a mini map.
- **Map** — every pinned spot shown as a marker; tap a marker's callout to open its detail page.
- **Add a spot** — title, description, category, tags, a photo, and a location you can pick from the map or your current position.

### Backend setup (required)
The app talks to a Supabase project. The original demo project is offline, so you
need your own:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). This
   creates the `Spots` table, the category enum, the `get_category_enum_values`
   RPC used by the Add-Spot form, the `location-images` storage bucket, and
   anonymous read/insert policies.
3. Copy `.env.example` to `.env` and fill in your project URL and anon key:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Running the application
1. Clone the repo and run `npm install`.
2. Complete the **Backend setup** above.
3. Run `npm run start` to start the Expo dev server.
4. Scan the QR code with the Expo Go app (or press `i` / `a` for a simulator).

#### Future plans
- Authentication, so spots belong to a user.
- Location-based sorting ("spots near me").
- Multiple photos per spot and editing/deleting spots.

