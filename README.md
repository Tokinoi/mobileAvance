# InventoryLife — Mobile App

A React Native / Expo application to organize personal inventories into groups, track items with custom fields, visualize them on a map, and share collections with friends.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Technical Choices](#technical-choices)
- [Backend](#backend)
- [State Management](#state-management)
- [Implemented Features](#implemented-features)
- [How to Run](#how-to-run)

---

## Project Structure

```
app/
├── src/
│   ├── components/
│   │   ├── atoms/           # Smallest building blocks (no business logic)
│   │   │   ├── Badge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBox.tsx
│   │   │   ├── FAB.tsx
│   │   │   ├── IconBox.tsx
│   │   │   └── IconButton.tsx
│   │   ├── molecules/       # Combinations of atoms
│   │   │   ├── GroupCard.tsx
│   │   │   ├── ItemCard.tsx
│   │   │   ├── ScreenHeader.tsx
│   │   │   └── SubGroupCard.tsx
│   │   ├── organisms/       # Complex UI sections
│   │   │   ├── FABMenu.tsx
│   │   │   ├── GroupDetailHeader.tsx
│   │   │   ├── LocationPermissionPopup.tsx
│   │   │   └── MapFilterPanel.tsx
│   │   ├── templates/       # Page-level layout wrappers
│   │   │   └── ScreenShell.tsx
│   │   └── *.tsx            # Complex modals (AddItemModal, ItemDetailModal, etc.)
│   ├── context/
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── GroupsContext.tsx # Groups & items state
│   ├── lib/
│   │   └── supabase.ts       # Supabase client singleton
│   ├── navigation/
│   │   ├── RootNavigator.tsx # Auth gate + stack navigator
│   │   └── TabNavigator.tsx  # Bottom tab navigation (PagerView)
│   ├── screens/
│   │   ├── HomeScreen.tsx        # Discover / search public groups & users
│   │   ├── GroupsScreen.tsx      # Personal & shared groups
│   │   ├── GroupDetailScreen.tsx # Group content (items + subgroups)
│   │   ├── MapScreen.tsx         # Map view of pinned items
│   │   ├── ProfileScreen.tsx     # User profile & friends
│   │   ├── CreateGroupScreen.tsx # Group creation form
│   │   ├── UserProfileScreen.tsx # Public profile of another user
│   │   ├── LoginScreen.tsx
│   │   └── SignupScreen.tsx
│   └── types/
│       └── index.ts          # Shared TypeScript types (Group, Item, TemplateField)
└── assets/
```

### Component Architecture (ATOM pattern)

The UI follows a 4-layer hierarchy:

| Layer | Role | Examples |
|---|---|---|
| **Atoms** | Primitive, stateless UI pieces | `FAB`, `IconBox`, `Badge` |
| **Molecules** | Compositions of atoms | `GroupCard`, `ItemCard`, `ScreenHeader` |
| **Organisms** | Complex, self-contained sections | `FABMenu`, `GroupDetailHeader`, `MapFilterPanel` |
| **Templates** | Page-level layout shells | `ScreenShell` |

Screens consume all layers above and hold navigation/business logic.

---

## Technical Choices

| Concern | Choice | Reason |
|---|---|---|
| Framework | **Expo SDK 54** (React Native 0.81) | Managed workflow, easy OTA updates, cross-platform |
| Language | **TypeScript** | Type safety across the whole codebase |
| Navigation | **React Navigation v7** (native stack) + **PagerView** for tabs | Native performance; PagerView gives a swipeable tab feel |
| Icons | **@expo/vector-icons** (Ionicons) | Consistent icon set, no extra bundle step |
| Maps | **react-native-maps** | De-facto standard for RN map integration |
| Location | **expo-location** | Permission handling + position APIs in one package |
| Image picker | **expo-image-picker** | Camera + gallery access with permission management |
| Session persistence | **AsyncStorage** | Keeps the Supabase session alive across app restarts |

---

## Backend

The app uses **[Supabase](https://supabase.com)** as its entire backend:

- **Authentication** — email/password sign-in via `supabase.auth`. The session is persisted locally with AsyncStorage and auto-refreshed.
- **Database** — PostgreSQL tables accessed through the Supabase JS client:
  - `groups` — group hierarchy (`parent_id`), template fields, visibility flag (`is_public`)
  - `items` — items linked to a group, dynamic data stored as JSONB
  - `profiles` — user public info (pseudo)
  - `friend_requests` — social graph (pending / accepted)
  - `group_invitations` — sharing groups with specific users (pending / accepted)
- **Realtime** — Supabase Realtime channels are used to listen for friend request changes and update the badge count live.
- **Row-Level Security** — access control is handled at the database level via Supabase RLS policies.

The client is initialized once in `src/lib/supabase.ts` and imported wherever needed.

---

## State Management

The app uses **React Context API + useState** only — no external state library (no Redux, Zustand, or Jotai).

### AuthContext (`src/context/AuthContext.tsx`)

Manages the authentication session globally.

- **State:** `session` (Supabase `Session`), `isLoading`
- **Derived:** `isLoggedIn` (boolean)
- **Actions:** `login(email, password)`, `logout()`
- **Behaviour:** subscribes to `onAuthStateChange` to react to sign-in/out events from any source
- **Hook:** `useAuth()`

### GroupsContext (`src/context/GroupsContext.tsx`)

Manages all business data — groups and items — for the authenticated user.

- **State:** `groups[]`, `items[]`, `loading`
- **Actions:** `addGroup`, `updateGroup`, `deleteGroup`, `saveTemplate`, `addItem`, `updateItem`, `refresh`
- **Helpers:** `getGroupItems(groupId)`, `getSubGroups(parentId)`, `resolveTemplate(groupId)` (walks the parent chain to find the nearest template)
- **Behaviour:** fetches on mount, re-fetches on `SIGNED_IN`, clears on `SIGNED_OUT`
- **Hook:** `useGroups()`

> For **shared / public groups** (not owned by the current user), data is fetched directly from Supabase inside `GroupDetailScreen` — outside the context — since those groups are not part of the user's personal collection.

### Why no external library?

The app data fits naturally into two global concerns (auth + owned data). Context is sufficient, avoids an extra dependency, and keeps the data flow easy to follow.

---

## Implemented Features

### Authentication
- Sign up with email, password, and a pseudo
- Sign in / sign out
- Session persisted across app restarts

### Groups
- Create, edit, and delete groups with a custom icon and color
- Nested groups (subgroups) with unlimited depth
- Template system: define custom fields per group (text, number, date, rating, toggle, dropdown, image, location)
- Template inheritance: a subgroup without its own template inherits the nearest parent's template
- Mark a group as public to make it discoverable by other users

### Items
- Add items to any group using the group's template
- Edit and view item details in a bottom-sheet modal with swipe-to-dismiss
- Fields render according to their type (stars for rating, badge for toggle, image preview, etc.)

### Map
- Items with a `location` field are plotted as color-coded pins on the map (color matches the group)
- Tap a pin to open the item detail modal
- Filter visible pins by group
- Auto-center on the user's location on first load
- Graceful permission flow (request / denied banner)

### Discovery & Social
- **Discover tab:** gallery of public groups from other users
- **Search:** find public groups or users by name (debounced, 350 ms)
- **Friend system:** send, accept, and decline friend requests; view friends list
- **Group sharing:** invite friends to a group via the share modal; track pending / accepted invitations
- **Shared tab:** view groups shared with you (read-only)
- View another user's public profile

---

## How to Run

### Prerequisites

- Node.js >= 18
- Expo CLI: `npm install -g expo-cli`
- A Supabase project with the required tables and RLS policies

### Environment variables

Create a `.env` file at the root of the `app/` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Install dependencies

```bash
cd app
npm install
```

### Start the development server

```bash
# Interactive menu (scan QR code with Expo Go)
npm start

# Android emulator
npm run android

# iOS simulator
npm run ios

# Tunnel mode (for physical device on a different network)
npm run tunnel
```

### Build for production

The project is configured with EAS Build (`eas.json`). To create a production build:

```bash
npx eas build --platform android
npx eas build --platform ios
```
