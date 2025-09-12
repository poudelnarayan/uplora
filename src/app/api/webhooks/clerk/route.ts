import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { welcomeEmailTemplate } from "@/lib/emailTemplates";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error occured -- no svix headers", {
        status: 400,
      });
    }

    // Get the body
    const payload = await req.text();
    const body = JSON.parse(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

    let evt: any;

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occured", {
        status: 400,
      });
    }

    // Handle the webhook
    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name } = evt.data;
      
      console.log("🎉 New user signup detected:", {
        userId: id,
        email: email_addresses[0]?.email_address,
        name: `${first_name || ""} ${last_name || ""}`.trim()
      });

      // Create user in database with onboardingCompleted = false
      try {
        const userEmail = email_addresses[0]?.email_address;
        const userName = `${first_name || ""} ${last_name || ""}`.trim() || "User";
        
        const { error: userError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: id,
            clerkId: id,
            email: userEmail || "",
            name: userName,
            onboardingcompleted: false, // New users need to complete onboarding
            updatedAt: new Date().toISOString()
          }, {
            onConflict: 'clerkId'
          });

        if (userError) {
          console.error("❌ Failed to create user in database:", userError);
        } else {
          console.log("✅ User created in database with onboardingCompleted = false");
        }
      } catch (dbError) {
        console.error("❌ Database error during user creation:", dbError);
      }

      // Send welcome email
      try {
        const userEmail = email_addresses[0]?.email_address;
        const userName = `${first_name || ""} ${last_name || ""}`.trim() || "there";
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`;

        if (userEmail) {
          const emailTemplate = welcomeEmailTemplate({
            userName,
            userEmail,
            dashboardUrl
          });

          // Send email via our email API
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: userEmail,
              subject: emailTemplate.subject,
              text: emailTemplate.text,
              html: emailTemplate.html,
            }),
          });

          if (emailResponse.ok) {
            console.log("✅ Welcome email sent successfully to:", userEmail);
          } else {
            console.error("❌ Failed to send welcome email:", await emailResponse.text());
          }
        } else {
          console.warn("⚠️ No email address found for new user:", id);
        }
      } catch (emailError) {
        console.error("❌ Error sending welcome email:", emailError);
        // Don't fail the webhook if email sending fails
      }
    }

    return new Response("", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }
}
