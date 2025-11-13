#!/bin/bash

# Test RapidAPI YouTube Transcriptor directly
# Get your API key from Supabase
RAPIDAPI_KEY=$(npx supabase secrets list | grep RAPIDAPI_KEY | awk '{print $3}')

echo "Testing RapidAPI YouTube Transcriptor..."
echo "Video ID: -moW9jvvMr4"
echo ""

# Note: We need the ACTUAL API key, not the hash
# Please replace YOUR_ACTUAL_KEY_HERE with your real RapidAPI key
curl -s -X GET \
  "https://youtube-transcriptor.p.rapidapi.com/transcript?video_id=-moW9jvvMr4" \
  -H "X-RapidAPI-Key: YOUR_ACTUAL_KEY_HERE" \
  -H "X-RapidAPI-Host: youtube-transcriptor.p.rapidapi.com" \
  | python3 -m json.tool | head -50

echo ""
echo "If you see an error about API key, replace YOUR_ACTUAL_KEY_HERE"
echo "with your actual RapidAPI key from https://rapidapi.com/hub"

