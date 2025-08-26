// Run this in browser console after logging in
// Go to: http://localhost:3000 (logged in)
// Open DevTools → Console → Paste this code:

(async function getClerkToken() {
  try {
    // Get Clerk session
    const response = await fetch("/api/get-auth-token");
    const data = await response.json();

    if (data.success) {
      console.log("🎯 COPY THIS TOKEN FOR POSTMAN:");
      console.log(`Bearer ${data.token}`);
      console.log("\n📋 Postman Setup:");
      console.log("1. Go to Headers tab");
      console.log("2. Add: Authorization: Bearer " + data.token);
      console.log("\n⏰ Token expires in 1 hour");

      // Copy to clipboard if available
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`Bearer ${data.token}`);
        console.log("✅ Token copied to clipboard!");
      }
    } else {
      console.error("❌ Failed to get token:", data.error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
})();
