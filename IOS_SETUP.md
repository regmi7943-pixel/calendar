# Life Calendar iOS Shortcut Setup Guide

This guide explains how to create the iOS Shortcut that powers your Life Calendar wallpaper.

## Prerequisites
- iPhone with iOS 16 or later (for Lock Screen wallpaper support).
- The Life Calendar web service URL (your Vercel deployment).

## Step-by-Step Instructions

1. **Create a New Shortcut**
   - Open the **Shortcuts** app on your iPhone.
   - Tap the **+** icon to create a new shortcut.
   - Name it "Life Calendar Refresh".

2. **Add "Get Contents of URL" Action**
   - Search for **"Get Contents of URL"**.
   - **URL**: Obtain this from the web app by clicking **"Copy API URL"** for your desired calendar.
   - **Method**: `GET`
   - **Parameters** (If manually entering):
     - `type`: `life`, `year`, or `goal`
     - `dob`: `YYYY-MM-DD`
     - `theme`: `dark`
     - `t`: Tap "Variables" and select **Current Date** (Critical for daily updates).

3. **Add "Set Wallpaper" Action**
   - Search for **"Switch Wallpaper"** or **"Set Wallpaper"**.
   - Input: Select the output from the previous step ("Contents of URL").
   - **Location**: Lock Screen.
   - **Show Preview**: Toggle **OFF**. (Important for automation).

4. **Test the Shortcut**
   - Tap the Play button (▶️) to run it.
   - Check your Lock Screen. It should have the Life Calendar wallpaper.

## Automation (Daily Update)

1. Go to the **Automation** tab in Shortcuts.
2. Tap **New Automation**.
3. Select **Time of Day** (e.g., 4:00 AM) -> **Daily**.
4. Select **Run Immediately** (Don't ask before running).
5. Action: **Run Shortcut** -> Select "Life Calendar Refresh".

## Troubleshooting
- **Image handling**: If the wallpaper is not setting, ensure the URL is correct and returning a PNG.
- **Cache**: Adding `?t={{Current Date}}` is critical to force iOS to fetch a new image.
