# 🚀 MESSAGES FROM HQ - QUICK START GUIDE

## ⚡ **GET IT RUNNING IN 10 MINUTES**

---

## **STEP 1: RUN DATABASE MIGRATION** (2 min)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project → SQL Editor
3. Copy the entire contents of `/database/migrations/messages_from_hq.sql`
4. Paste and click "Run"
5. ✅ You should see: "Success. No rows returned"

---

## **STEP 2: ADD TO MOBILE APP NAVIGATION** (5 min)

### **Option A: Add as 5th Tab in Bottom Nav**

Find your main navigation component and add:

```typescript
import { MessagesInbox } from './components/MessagesInbox';
import { MessagesBadge } from './components/MessagesBadge';
import { MessageSquare } from 'lucide-react';

// In your bottom navigation:
<button 
  onClick={() => navigate('messages')}
  className="relative"
>
  <MessageSquare className="w-6 h-6" />
  <MessagesBadge userId={user.id} />
  <span>HQ</span>
</button>

// In your router/screen switcher:
{activeScreen === 'messages' && (
  <MessagesInbox user={user} onBack={() => navigate('home')} />
)}
```

### **Option B: Add as Modal/Overlay**

```typescript
import { MessagesInbox } from './components/MessagesInbox';

// Add button to header:
<button onClick={() => setShowMessages(true)} className="relative">
  <Bell className="w-6 h-6" />
  <MessagesBadge userId={user.id} />
</button>

// Add modal:
{showMessages && (
  <div className="fixed inset-0 bg-[#050505] z-50">
    <MessagesInbox 
      user={user} 
      onBack={() => setShowMessages(false)}
    />
  </div>
)}
```

---

## **STEP 3: ADD TO ADMIN PANEL** (3 min)

In your website admin dashboard (`patronpass.com/admin`):

```typescript
// pages/admin/street-team.tsx (or similar)

import { ComposeHQMessage } from '@/components/admin/ComposeHQMessage';

export default function StreetTeamAdminPage() {
  const { user } = useAuth(); // Your admin auth
  
  return (
    <div className="p-6">
      <h1>Street Team Management</h1>
      
      <section className="mb-8">
        <h2>Send Message to Street Team</h2>
        <ComposeHQMessage 
          adminId={user.id}
          onSuccess={() => alert('Message sent!')}
        />
      </section>
      
      {/* Rest of your admin UI */}
    </div>
  );
}
```

---

## **STEP 4: TEST IT!** (5 min)

### **Send Your First Message:**

1. Open admin panel
2. Fill out the compose form:
   - **Title:** "🎉 Test Message"
   - **Body:** "This is a test message from HQ!"
   - **Priority:** Normal
   - **Target:** All Ambassadors
3. Click "Send Message"
4. ✅ See success confirmation

### **Check Mobile App:**

1. Open mobile app
2. Look for "HQ" tab (or wherever you added it)
3. ✅ See unread badge appear
4. Tap to open Messages inbox
5. ✅ See your test message
6. Tap to open message detail
7. ✅ Badge disappears (marked as read)

---

## **THAT'S IT! 🎉**

You now have a fully functional messaging system!

---

## **COMMON ISSUES & FIXES**

### **Issue: "RPC function not found"**
**Fix:** Re-run the migration SQL. The function might not have been created.

### **Issue: "Messages not appearing"**
**Fix:** Check that:
- User's `onboarding_status = 'approved'`
- Message `target_type` matches user's tier
- Message `sent_at` is in the past (not scheduled for future)

### **Issue: "Unread count not updating"**
**Fix:** Check that the real-time subscription is working:
```typescript
// In browser console:
console.log('Supabase realtime status:', supabase.getChannels());
```

### **Issue: "Permission denied"**
**Fix:** Check Row Level Security (RLS) policies in Supabase:
- Go to Database → Tables → street_team_messages
- Check "Policies" tab
- Ensure policies exist

---

## **EXAMPLE MESSAGES TO SEND**

### **Welcome Message**
```
Title: 🎉 Welcome to the Team!
Body: 
Hey! You're officially a Patron Pass Ambassador.

Next steps:
1. Watch training videos in Resources
2. Add your first 3 venue prospects
3. Sign your first venue (250 XP!)

Let's go! 💪
```

### **Weekly Motivation**
```
Title: 💪 Week of Nov 28 - Let's Crush It
Body:
This week's goal: Sign 2 new venues.

Pro tip: Visit venues Tue-Thu between 2-4pm. 
Owners are available and not stressed.

You got this! 🚀
```

### **System Update**
```
Title: 🚨 App Update Available
Priority: Urgent
Body:
New version with bug fixes and performance 
improvements is available.

Please update from the App Store to continue 
using Patron Pass.

Update now: [link]
```

---

## **NEXT STEPS**

Now that Messages from HQ is working, you can:

1. ✅ Send welcome messages on ambassador approval (automate)
2. ✅ Send weekly motivation messages (manual)
3. ✅ Send pro tips from top performers (manual)
4. ✅ Announce new features (manual)

**Ready to build the Referral System next? Let me know!** 🚀
