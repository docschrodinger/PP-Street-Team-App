# Patron Pass Street Team App: Architecture & Feature Audit

**Audit Date:** November 28, 2025
**Status:** Read-only analysis of the current codebase.

---

## **1. Screens, Routes, and Navigation Map**

The application uses a custom, state-based navigation system controlled within `src/App.tsx`. A state variable `currentScreen` determines which component is rendered. There is no formal routing library like React Router.

### **1.1 Screen Components**

Here are the major screens implemented in the application:

| Component Name | File Path | Description & Navigation |
| :--- | :--- | :--- |
| **WelcomeScreen** | `src/components/WelcomeScreen.tsx` | The initial landing screen for new users. It presents options to either log in or apply. This is the default screen when no user is authenticated. |
| **LoginScreen** | `src/components/LoginScreen.tsx` | Handles user login with email and password. Navigated to from `WelcomeScreen` by tapping "Login". |
| **ApplicationForm** | `src/components/ApplicationForm.tsx` | A form for new users to apply to the street team. Navigated to from `WelcomeScreen` by tapping "Apply Now". |
| **ContractScreen** | `src/components/ContractScreen.tsx` | Displays the independent contractor agreement and requires a typed signature for acceptance. Automatically shown after login if the user has not yet signed the contract. |
| **OnboardingTour** | `src/components/OnboardingTour.tsx` | A multi-step tour that introduces new users to the app's core features. Automatically shown after the contract is signed if the user has not completed it. |
| **Dashboard** | `src/components/Dashboard.tsx` | The main home screen for authenticated users. It displays key stats (XP, Rank, Earnings), recent activity, and messages from HQ. This is the default screen after login/onboarding. |
| **StartRunScreen** | `src/components/StartRunScreen.tsx` | A form to begin a new "street run" or shift. Users can name the run and set a goal. Navigated to from the `Dashboard`. |
| **ActiveRunScreen**| `src/components/ActiveRunScreen.tsx` | The screen for managing an ongoing run. It shows a timer, venue checklist, and allows for adding photos. Activated after a run is started from `StartRunScreen`. |
| **LeadPipeline** | `src/components/LeadPipeline.tsx` | A Kanban-style board to manage venue leads through different stages (`New`, `Contacted`, `Follow-up`, `Closed`). Accessed via the "Leads" tab in the bottom navigation. |
| **AddLeadForm** | `src/components/AddLeadForm.tsx` | A form to add a new venue lead to the pipeline. Accessed via a button on the `LeadPipeline` screen. |
| **LeadDetailsScreen**| `src/components/LeadDetailsScreen.tsx` | Shows detailed information about a specific lead, including contact info, notes, and activity history. Navigated to by tapping a lead card in the `LeadPipeline`. |
| **MissionsScreen** | `src/components/MissionsScreen.tsx` | Displays daily, weekly, and one-off challenges (missions) for users to complete for XP rewards. Accessed via the "Missions" tab in the bottom navigation. |
| **LeaderboardScreen**| `src/components/LeaderboardScreen.tsx` | Shows rankings of street team members based on total XP. Accessed via the "Leaderboard" tab in the bottom navigation. |
| **RankSystemScreen**| `src/components/RankSystemScreen.tsx` | An informational screen that explains the different ranks (e.g., Bronze, Silver, Gold) and the XP required to achieve them. Accessed from the `ProfileScreen`. |
| **EarningsScreen** | `src/components/EarningsScreen.tsx` | Displays the user's estimated earnings, commission rates, and a breakdown of earnings per lead. Accessed from the `ProfileScreen`. |
| **NotificationsScreen**| `src/components/NotificationsScreen.tsx`| A list of notifications for the user, such as rank-ups or messages. Accessed from the `ProfileScreen`. |
| **ProfileScreen** | `src/components/ProfileScreen.tsx` | Displays the user's profile information, stats, and provides navigation to Settings, Ranks, Earnings, etc. Accessed via the "Profile" tab in the bottom navigation. |
| **SettingsScreen** | `src/components/SettingsScreen.tsx` | Allows the user to manage notification preferences, change their password, and request account deletion. Accessed from the `ProfileScreen`. |
| **HQAdminDashboard**| `src/components/HQAdminDashboard.tsx` | A special dashboard for users with the `hq_admin` role to manage applications, users, and send messages. Conditionally rendered for admin users. |

### **1.2 Navigation Structure**

The app's navigation is controlled by a custom state machine in `src/App.tsx`.

*   **Navigator:** A `useState` hook (`const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');`) manages the currently visible screen. Navigation is performed by calling `setCurrentScreen()` with the desired screen's identifier.
*   **Bottom Navigation:** A bottom navigation bar is defined in `src/components/BottomNav.tsx`. It is displayed for authenticated users and provides access to five main tabs:
    1.  **Dashboard**
    2.  **Leads** (`LeadPipeline`)
    3.  **Missions** (`MissionsScreen`)
    4.  **Leaderboard** (`LeaderboardScreen`)
    5.  **Profile** (`ProfileScreen`)
*   **Navigation Flow Logic:**
    *   **Pre-Authentication:** If no user is logged in (`!user`), the app defaults to the `welcome` screen. From there, the user can navigate to `login` or `apply`.
    *   **Onboarding:** After a successful login, a `useEffect` hook in `App.tsx` checks the user's status:
        1.  If `needsContract` is true, it forces navigation to the `contract` screen.
        2.  If `needsOnboarding` is true, it forces navigation to the `onboarding` screen.
    *   **Authenticated Flow:** Once the user is authenticated and has completed onboarding, they are directed to the `dashboard`. They can then navigate between the main sections using the `BottomNav` component.

---

## **2. Supabase Integration & Data Model**

### **2.1 Supabase Client Configuration**

*   **Client Definition:** The Supabase client is defined and exported from **`src/utils/supabase/client.ts`**. It is configured using credentials from `src/utils/supabase/info.tsx`.
*   **Singleton Instance:** The client is created once and exported as a singleton, ensuring that the entire application shares a single `SupabaseClient` instance. This prevents issues with multiple `GoTrueClient` initializations.
*   **Authentication Handling:**
    *   **Login:** Handled in the `useAuth.ts` hook, which calls `supabase.auth.signInWithPassword()`.
    *   **Session:** The Supabase client automatically handles session management and token refreshes in secure storage. The `useAuth` hook listens for `onAuthStateChange` to update the application state when the user logs in or out.
    *   **Logout:** The `signOut` function in `useAuth.ts` calls `supabase.auth.signOut()`.

### **2.2 Supabase Tables & Data Model**

The following tables are referenced in the codebase through queries.

| Table Name | Columns Referenced & Purpose | Screens / Components |
| :--- | :--- | :--- |
| **`street_users`** | `id`, `email`, `role`, `full_name`, `city`, `status`, `total_xp`, `current_rank`, `avatar_url`, `preferences` (JSON for notification settings). This is the core user profile table. | **Read:** `useAuth`, `Dashboard`, `ProfileScreen`, `LeaderboardScreen`.<br>**Write:** `useAuth` (on signup), `SettingsScreen` (preferences), `xpService` (XP/rank updates). |
| **`street_applications`** | `full_name`, `email`, `phone`, `city`, `instagram_handle`, `experience_tags`. Stores new user applications. | **Write:** `ApplicationForm.tsx`.<br>**Read:** `HQAdminDashboard.tsx`. |
| **`street_contract_acceptances`** | `user_id`, `agreement_version`, `ip_address`, `typed_signature`. Logs when a user signs their contract. | **Write:** `ContractScreen.tsx`.<br>**Read:** `useAuth.ts` (to check `needsContract`). |
| **`street_runs`** | `id`, `user_id`, `title`, `start_time`, `end_time`, `status`. Represents a user's work shift. | **Write:** `StartRunScreen.tsx`, `ActiveRunScreen.tsx`.<br>**Read:** `Dashboard.tsx` (for recent runs). |
| **`street_venue_leads`** | `id`, `user_id`, `venue_name`, `contact_name`, `contact_email`, `contact_phone`, `status` (e.g., 'New', 'Contacted'), `notes`, `relationship_strength`. The central table for venue leads. | **Write:** `AddLeadForm.tsx`, `LeadDetailsScreen.tsx`.<br>**Read:** `LeadPipeline.tsx`, `LeadDetailsScreen.tsx`, `EarningsScreen.tsx`. |
| **`street_venue_photos`** | `id`, `lead_id`, `user_id`, `photo_url`, `description`. Stores URLs of photos taken for a specific lead. | **Write:** `ActiveRunScreen.tsx`.<br>**Read:** `LeadDetailsScreen.tsx`. |
| **`street_missions`** | `id`, `title`, `description`, `type` ('daily', 'weekly', 'one_off'), `xp_reward`, `goal_value`, `metric` (e.g., 'leads_added'). Defines the available missions. | **Read:** `MissionsScreen.tsx`. |
| **`street_mission_progress`** | `user_id`, `mission_id`, `current_value`, `status` ('in_progress', 'completed'). Tracks a user's progress on a mission. | **Write:** `xpService.ts` (updates progress).<br>**Read:** `MissionsScreen.tsx`. |
| **`street_xp_events`** | `user_id`, `xp_amount`, `event_type` (e.g., 'LEAD_ADDED', 'MISSION_COMPLETE'), `description`. An audit log of all XP awarded. | **Write:** `xpService.ts`.<br>**Read:** `Dashboard.tsx` (for activity feed). |
| **`street_ranks`** | `rank_name`, `min_xp`. Defines the XP thresholds for each rank. | **Read:** `xpService.ts`, `RankSystemScreen.tsx`. |
| **`street_notifications`** | `id`, `user_id`, `title`, `message`, `type`, `is_read`, `deep_link`. Stores notifications for users. | **Read:** `NotificationsScreen.tsx`.<br>**Write:** (Presumably by backend triggers, not directly from the app). |
| **`street_account_deletion_requests`** | `user_id`, `reason`, `status`. Logs user requests for account deletion. | **Write:** `SettingsScreen.tsx`. |

### **2.3 Unused Types vs. Queried Tables**

All tables listed above are actively queried in the application code. There are no major TypeScript types defined that do not correspond to an active query. The data model is well-utilized.

---

## **3. Features & Flows Status**

### **3.1 Auth & Onboarding**

*   **Implemented?** Yes, fully.
*   **Files:** `LoginScreen.tsx`, `ApplicationForm.tsx`, `ContractScreen.tsx`, `OnboardingTour.tsx`, `hooks/useAuth.ts`.
*   **Behavior:**
    *   Users can log in with email/password, with error handling for invalid credentials.
    *   New users can submit an application with their details.
    *   Contract signing is enforced after login for new users, capturing a typed signature.
    *   A multi-page onboarding tour introduces the app's features.
*   **Missing:** Nothing. This flow is complete.

### **3.2 Lead Management**

*   **Implemented?** Yes, fully.
*   **Files:** `AddLeadForm.tsx`, `LeadPipeline.tsx`, `LeadDetailsScreen.tsx`.
*   **Behavior:**
    *   **Add Lead Form:** Captures `venue_name`, `address`, `contact_name`, `contact_email`, and `contact_phone`. Validation is in place for required fields. Adding a lead awards XP via `xpService`.
    *   **Lead Pipeline:** A fully functional Kanban board allows users to drag and drop leads between stages: `New`, `Contacted`, `Follow-up`, `Negotiation`, `Closed`, and `Lost`.
    *   **Lead Details:** Users can view all lead information, add notes, and update the lead's status.
    *   **Relationship Strength:** The `relationship_strength` field exists in the database but there is no UI in `LeadDetailsScreen` to modify it. It appears to be a placeholder for a future "heat score" feature.
*   **Missing:** UI for editing the `relationship_strength` score.

### **3.3 Street Runs / Shifts**

*   **Implemented?** Yes.
*   **Files:** `StartRunScreen.tsx`, `ActiveRunScreen.tsx`.
*   **Behavior:**
    *   Users can start a run by providing a `title`.
    *   The active run screen displays a timer and a checklist of venues to visit (though this checklist is manually entered, not preloaded).
    *   Users can take and upload photos associated with the run.
    *   Ending a run updates the `street_runs` table with an `end_time` and `status`. XP is awarded for completing the run.
*   **Missing:** Nothing for the core feature.

### **3.4 Gamification**

*   **Implemented?** Yes, fully.
*   **Files:** `services/xpService.ts`, `RankSystemScreen.tsx`, `MissionsScreen.tsx`, `LeaderboardScreen.tsx`.
*   **Behavior:**
    *   **XP Logic:** The `xpService.ts` centralizes all XP awards. It contains functions like `awardXP('LEAD_ADDED', userId)` which creates a record in `street_xp_events` and updates the user's `total_xp` in `street_users`.
    *   **Rank System:** The app fetches ranks from the `street_ranks` table. When a user's `total_xp` crosses a threshold, `xpService` updates their `current_rank` and dispatches a "rank-up" event, which triggers a celebratory modal (`RankUpModal.tsx`).
    *   **Missions:** The `MissionsScreen` displays missions from the `street_missions` table and progress from `street_mission_progress`. The `xpService` updates progress when relevant actions (like adding a lead) occur.
    *   **Leaderboard:** The `LeaderboardScreen` fetches all users from `street_users` and ranks them by `total_xp`.
*   **Missing:** Nothing. The gamification loop is complete and robust.

### **3.5 Earnings / Commission**

*   **Implemented?** Yes, a basic version.
*   **Files:** `EarningsScreen.tsx`.
*   **Behavior:**
    *   The `EarningsScreen` calculates **estimated earnings**. It fetches all of the user's leads with a `Closed` status.
    *   It uses a hardcoded commission rate (`const COMMISSION_RATE = 0.10;`) and a hardcoded estimated deal value (`const ESTIMATED_DEAL_VALUE = 500;`) to calculate `ESTIMATED_DEAL_VALUE * COMMISSION_RATE` for each closed lead.
    *   It **does not** read from a dedicated earnings or commissions table. The calculation is purely an estimate based on the number of closed leads.
*   **Missing:** Integration with a real earnings/payouts table. The current implementation is for estimation purposes only.

### **3.6 Notifications**

*   **Implemented?** Yes.
*   **Files:** `NotificationsScreen.tsx`.
*   **Behavior:**
    *   The `NotificationsScreen` fetches and displays records from the `street_notifications` table for the current user.
    *   The UI marks notifications as read.
    *   The `deep_link` column exists in the table, but there is **no logic implemented** in the app to handle navigation when a notification is tapped. It simply displays the message.
*   **Missing:** Deep linking functionality from notifications to specific screens (e.g., a new lead notification taking you to the `LeadDetailsScreen`).

### **3.7 Settings & Account Management**

*   **Implemented?** Yes, fully.
*   **Files:** `SettingsScreen.tsx`.
*   **Behavior:**
    *   Users can toggle email and push notification preferences, which updates the `preferences` JSON object in their `street_users` record.
    *   Users can trigger a password reset email.
    *   A full account deletion request flow is present. It opens a dialog, asks for an optional reason, and inserts a request into the `street_account_deletion_requests` table for admin review.
    *   Links to Privacy Policy and Terms of Service are present and functional.
*   **Missing:** Nothing. This feature is complete and compliant.

---

## **4. “Up for Grabs” / Preloaded Venue Target System**

After a thorough search of the entire codebase, including all components, services, and type definitions, I can confirm the following:

**There is currently NO ‘up for grabs’ / preloaded venue target system implemented.**

*   The app's lead management flow is entirely user-driven. An ambassador must manually create a new lead via the `AddLeadForm`.
*   There are no tables, types, or components named `target_venues`, `available_venues`, `cold_leads`, or any similar variation.
*   There is no map-based view for discovering or claiming venues.

### **High-Level Implementation Suggestion:**

If this feature were to be added, it would fit best as follows:

1.  **New Supabase Table:** A new table named **`street_target_venues`** would be required.
    *   **Columns:** `id`, `venue_name`, `address`, `city`, `neighborhood`, `category`, `status` ('available', 'claimed'), `claimed_by` (nullable `user_id`), `claimed_at` (nullable `timestamp`).
2.  **New Screen:** A new screen, possibly named **`TargetsScreen.tsx`**, could be added as a new tab in the `BottomNav`.
    *   This screen would fetch all venues from `street_target_venues` with a status of 'available'.
    *   It could display them as a list or on a map.
    *   A "Claim" button would update the venue's status to 'claimed' and assign it to the user. Once claimed, it could be automatically added to their `LeadPipeline`.

---

## **5. Copy & Naming Summary**

The app maintains consistent and professional branding and terminology.

*   **App Name:** "Patron Pass Street Team"
*   **Key Labels:**
    *   **Ambassadors:** Referred to as "Street Team," "Ambassador," or by their rank (e.g., "Bronze Ambassador").
    *   **Missions:** Consistently called "Missions."
    *   **Ranks:** "Ranks" (e.g., "Bronze," "Silver," "Gold," "Platinum," "Diamond").
    *   **Earnings:** "Earnings" or "Commissions."
    *   **Runs:** "Runs" or "Street Runs."
    *   **Leads:** "Leads" or "Venues."
*   **Notable Headlines & Copy:**
    *   **Dashboard:** "Welcome Back," "Your Stats," "Recent Activity," "Messages from HQ."
    *   **Missions Screen:** "Missions Control," "Complete challenges to earn XP and climb the ranks."
    *   **Leaderboard:** "Leaderboard," "See how you stack up against the rest of the street team."
    *   **Earnings Screen:** "Your Estimated Earnings."
    *   **Lead Pipeline:** "Lead Pipeline," with columns for each stage.

The tone is professional, encouraging, and slightly gamified.

---

## **6. TODOs & Missing Pieces**

The codebase is very clean and contains almost no explicit `TODO` comments. The main missing pieces are inferred from the data model and UI, rather than explicit comments:

*   **`LeadDetailsScreen`:** UI to view or edit the `relationship_strength` of a lead is missing.
*   **`EarningsScreen`:** The earnings calculation is an **estimation** based on hardcoded values. It needs to be connected to a real financial data source for accuracy.
*   **`NotificationsScreen`:** The deep linking functionality is not implemented. Tapping a notification does not navigate the user to the relevant content.
*   **"Up for Grabs" Feature:** This entire concept is not present in the current codebase.
