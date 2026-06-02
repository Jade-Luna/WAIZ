# Decline Reason Feature - Implementation Summary

## ✅ What's Been Implemented

### 1. **Household Side (HouseholdDash.jsx)**
- Added decline modal that appears when "Decline" button is clicked
- Modal shows predefined reasons:
  - "Price too low"
  - "Location inconvenient"
  - "Already sold"
  - "Changed my mind"
  - "Don't have items ready yet"
  - "Other (please specify)"
- If "Other" is selected, household can enter custom text
- Validation ensures a reason is selected before confirming
- Decline reason is stored in database when pickup is declined

### 2. **Junkshop Side (JunkshopDash.jsx)**
- RequestCard component now displays decline reason for cancelled pickups
- Shows format: "📋 Reason for decline: [reason text]"
- Only displays if status is 'cancelled' AND decline_reason exists
- Appears in pickup history so junkshops can see why offers were rejected

### 3. **Database Migration**
- Created migration file: `/migrations/add_decline_reason.sql`
- Adds `decline_reason` (TEXT, nullable) column to pickups table
- Ready to be executed in Supabase console

## 🚀 Next Steps

### Required: Run Database Migration
You must execute the SQL migration to add the `decline_reason` column:

**Option 1: Supabase Console (Recommended)**
1. Go to your Supabase project → SQL Editor
2. Open file: `/migrations/add_decline_reason.sql`
3. Copy the SQL and run it in the console
4. Verify the column appears in pickups table

**Option 2: SQL Query**
```sql
ALTER TABLE pickups ADD COLUMN decline_reason TEXT;
COMMENT ON COLUMN pickups.decline_reason IS 'Reason provided by household when declining an offer.';
```

### Testing Checklist
- [ ] Migration has been run
- [ ] Household can click "Decline" and see the modal
- [ ] All reason options are visible
- [ ] Can select predefined reasons
- [ ] "Other" option shows text input
- [ ] Submitting decline shows confirmation
- [ ] Junkshop sees the decline reason in history
- [ ] Non-cancelled pickups don't show reason
- [ ] Long custom reasons wrap nicely in the UI

## 📁 Modified Files
- `src/pages/dashboard/HouseholdDash.jsx` - Added decline modal and logic
- `src/pages/dashboard/JunkshopDash.jsx` - Added reason display in RequestCard
- `migrations/add_decline_reason.sql` - Database migration

## 💡 How It Works

**User Flow:**
1. Household views pending offer in "Requests" tab
2. Clicks "Decline" button
3. Modal appears with reason options
4. Household selects reason (or "Other" + custom text)
5. Clicks "Confirm decline"
6. Pickup status changes to 'cancelled' with decline_reason stored
7. Listing becomes 'available' again for other junkshops

**Junkshop View:**
1. Junkshop sees cancelled pickup in "History" tab
2. Can see decline reason displayed below the request
3. Helps them understand why offer was rejected
4. Can improve future offers based on feedback

## ✨ Features
- Clean modal UI matching existing design patterns
- Predefined reasons for quick selection
- Custom text option for specific feedback
- Non-intrusive display in history (only shows for cancelled pickups)
- Fully responsive design
- Loading states during submission
- Validation to ensure reason is provided
