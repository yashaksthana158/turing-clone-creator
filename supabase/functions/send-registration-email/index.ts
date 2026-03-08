import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { registrationIds, eventTitle } = await req.json();

    if (!registrationIds?.length || !eventTitle) {
      return new Response(
        JSON.stringify({ error: "registrationIds and eventTitle required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch registrations with user details
    const { data: registrations, error: regError } = await supabaseAdmin
      .from("event_registrations")
      .select("id, user_id, status")
      .in("id", registrationIds)
      .eq("status", "APPROVED");

    if (regError) throw regError;
    if (!registrations?.length) {
      return new Response(
        JSON.stringify({ error: "No approved registrations found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = registrations.map((r) => r.user_id);

    // Get user emails from auth
    const emailResults: { email: string; name: string }[] = [];
    for (const userId of userIds) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userData?.user?.email) {
        // Get profile name
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();

        emailResults.push({
          email: userData.user.email,
          name: profile?.full_name || "Participant",
        });
      }
    }

    // Use Lovable AI Gateway to generate & send emails via a simple approach
    // Since we don't have a direct email provider, we'll log the approved users
    // and return their details for the frontend to show confirmation
    
    // For actual email sending, we'll use the SMTP approach or return data
    // In production, integrate with Resend/SendGrid here
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `${emailResults.length} registration(s) approved for "${eventTitle}"`,
        approvedUsers: emailResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
