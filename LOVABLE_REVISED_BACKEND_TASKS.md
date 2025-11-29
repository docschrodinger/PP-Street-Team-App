# Project Brief for Lovable AI: Finalizing the Patron Pass Street Team App Backend

**Subject: Revisiting Backend Tasks for Patron Pass App - V2**

Hi Lovable,

We're doing a final push to get the Patron Pass Street Team App ready for launch. We previously assigned a set of backend tasks, but a verification audit shows that there are still some open items.

This document provides a revised and more detailed set of instructions to ensure everything is implemented correctly. Your focus is the Supabase project (`djsuqvmefbgnmoyfpqhi`).

---

### **1. Context: Backend Isolation and Admin Dashboard Coordination**

It is critical that these changes **do not interfere with the primary website's backend**.

*   **Isolation:** All work described here should be contained within the Supabase project specified. The database functions, triggers, and Edge Functions are isolated to this environment and should not have unintended side effects on other systems.
*   **Admin Dashboard Awareness:** Your new features might need to be visible or usable by the main admin dashboard.
    *   When you add new columns to the `street_users` table (e.g., for streaks or push tokens), please be aware that the admin dashboard may need read-only access to display this data.
    *   If you create a feature like "send a manual push notification," consider implementing it as a database function that the admin dashboard's backend could securely call.

---

### **2. Review of Previously Assigned Tasks & What Was Missed**

Here’s a summary of the previous tasks and their current status.

#### **Task A: Automated Email System**
*   **Claimed Status:** Done.
*   **Verification Result:** **Incomplete.** The code files exist, but the system is not live.
*   **What's Missing:**
    1.  The `send-email` Edge Function needs to be deployed to Supabase.
    2.  The database triggers that automatically call this function have not been created.

#### **Task B: Real-Time Leaderboard**
*   **Claimed Status:** Done.
*   **Verification Result:** **Incomplete.**
*   **What's Missing:** The backend change (enabling Realtime on the table) is the first step, but the frontend code has not been updated to *use* this real-time connection. The leaderboard is still static.

#### **Task C & D: Push Notifications & Daily Streaks**
*   **Claimed Status:** Done.
*   **Verification Result:** **Not Started.**
*   **What's Missing:** There is no evidence of these features in the codebase. The required database schema changes (new columns), backend functions, and frontend logic are all missing.

---

### **3. Revised & Actionable Task List**

Please execute the following tasks in order.

#### **✅ Task 1: Deploy the Email System (Final Steps)**

1.  **Set API Key:** Ensure the Resend API key is set as a Supabase secret.
    ```bash
    npx supabase secrets set RESEND_API_KEY=re_51gH45sW_JFpk9XZpFsvuCE4dUaW5E9pN --project-ref djsuqvmefbgnmoyfpqhi
    ```

2.  **Deploy the Function:** Deploy the `send-email` function from the `supabase/functions/` directory.
    ```bash
    npx supabase functions deploy send-email --project-ref djsuqvmefbgnmoyfpqhi
    ```

3.  **Create Database Triggers:** Execute the provided SQL in the Supabase SQL Editor. **This is the most critical missing piece.**
    *   **Important:** You must replace the placeholder `YOUR_SUPABASE_ANON_KEY` with the project's actual public `anon` key.

    **Trigger for Mission Completion:**
    ```sql
    CREATE OR REPLACE FUNCTION handle_mission_complete()
    RETURNS TRIGGER AS $$
    DECLARE
      user_email TEXT;
      user_name TEXT;
      anon_key TEXT := 'YOUR_SUPABASE_ANON_KEY';
    BEGIN
      SELECT email, full_name INTO user_email, user_name FROM public.street_users WHERE id = NEW.user_id;
      PERFORM net.http_post(
        url:='https://djsuqvmefbgnmoyfpqhi.supabase.co/functions/v1/send-email',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || anon_key || '"}'::jsonb,
        body:=jsonb_build_object(
          'type', 'mission_complete',
          'data', jsonb_build_object(
            'to', user_email, 'agentName', user_name,
            'missionTitle', (SELECT title FROM public.street_missions WHERE id = NEW.mission_id),
            'xpEarned', (SELECT xp_reward FROM public.street_missions WHERE id = NEW.mission_id)
          )
        )
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER on_mission_complete_trigger
    AFTER UPDATE OF status ON public.street_mission_progress
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION handle_mission_complete();
    ```

    **Trigger for Application Approval:**
    ```sql
    CREATE OR REPLACE FUNCTION handle_application_approved()
    RETURNS TRIGGER AS $$
    DECLARE
      anon_key TEXT := 'YOUR_SUPABASE_ANON_KEY';
    BEGIN
      PERFORM net.http_post(
        url:='https://djsuqvmefbgnmoyfpqhi.supabase.co/functions/v1/send-email',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || anon_key || '"}'::jsonb,
        body:=jsonb_build_object(
          'type', 'application_approved',
          'data', jsonb_build_object('to', NEW.email, 'applicantName', NEW.full_name)
        )
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER on_application_approved_trigger
    AFTER UPDATE OF status ON public.street_applications
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved')
    EXECUTE FUNCTION handle_application_approved();
    ```

#### **✅ Task 2: Implement Real-Time Leaderboard**

1.  **Backend:** In the Supabase Dashboard, navigate to **Database > Replication** and enable Realtime for the `street_users` table.
2.  **Frontend:** The frontend code needs to be updated to listen for these real-time changes. Please inform us when the backend part is done, and our frontend AI will implement the necessary UI changes in `LeaderboardScreen.tsx`.

#### **✅ Task 3: Implement Push Notifications**

This is a foundational feature that needs to be built.

1.  **Backend Schema:** Add a new column to the `street_users` table:
    *   `push_token` of type `TEXT`, nullable.
2.  **Backend Function:** Create a new Edge Function named `send-push-notification`. This function should be able to receive a `user_id` and a `payload` (title, message) and use a service like Firebase Cloud Messaging (FCM) to send a push notification to the `push_token` associated with that user.
3.  **Backend Trigger:** Create a database trigger that calls this new function whenever a new record is inserted into the `street_notifications` table.
4.  **Frontend Coordination:** The frontend app will need to be updated to ask for user permission and send the device token to the backend. Please notify us when your backend is ready to receive a `push_token`.

#### **✅ Task 4: Implement Daily Login Streaks**

This feature is designed to improve retention.

1.  **Backend Schema:** Add two new columns to the `street_users` table:
    *   `last_login_date` of type `DATE`, nullable.
    *   `login_streak_count` of type `INTEGER`, with a default value of `0`.
2.  **Backend Function:** Create a new database function `handle_user_login(user_id UUID)`.
3.  **Backend Logic:** This function should contain the core logic:
    *   It will be called by the frontend's authentication hook after a successful login.
    *   It must compare the `last_login_date` with the current date to determine if the streak should be incremented or reset.
    *   It should award bonus XP via the existing `xpService` logic if a streak milestone is met.
    *   Finally, it must update the `last_login_date` to the current date.
4.  **Frontend Coordination:** Please notify us when this function is ready to be called, and our frontend AI will integrate it into the login flow.

---

Thank you for your work on this. Please confirm once each task is fully complete, and we will proceed with frontend integration and verification.
