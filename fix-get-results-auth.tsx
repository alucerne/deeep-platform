// Fix for get-results authentication in instant-email-uploader.tsx
// Line ~270: Change this:

const response = await fetch('https://hapmnlakorkoklzfovne.functions.supabase.co/get-results', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${selectedApiKey}`  // ❌ Wrong - using API key instead of anon key
  },
  body: JSON.stringify({
    request_id: requestIdToCheck
  })
});

// To this:

const response = await fetch('https://hapmnlakorkoklzfovne.functions.supabase.co/get-results', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`  // ✅ Correct - using anon key
  },
  body: JSON.stringify({
    request_id: requestIdToCheck
  })
}); 