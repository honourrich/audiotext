# Fixed YouTube Duration Issue

## Problem
Older YouTube episodes imported before the duration fix don't have duration values.

## Solution
The code now:
1. ✅ Imports new YouTube videos with correct duration (e.g., 12:28 for Naval video)
2. ✅ Fixes older episodes without duration to show "00:00" instead of undefined
3. ✅ Extracts duration from YouTube API, captions, or defaults to 0

## Current Status
- Older episodes (like "Transformers"): Shows 00:00 (no duration data saved)
- Newer episodes (like "Naval Ravikant"): Shows correct duration (12:28)

## To Fix Old Episodes
Simply re-import the YouTube video to get the correct duration.

