import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "targetUserId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is SUPER_ADMIN
    const { data: callerAdmin } = await supabaseAdmin
      .from("user_roles")
      .select("id, roles!inner(name)")
      .eq("user_id", user.id)
      .eq("roles.name", "SUPER_ADMIN")
      .single();

    if (!callerAdmin) {
      return new Response(JSON.stringify({ error: "You are not a Super Admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get SUPER_ADMIN role id
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", "SUPER_ADMIN")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "SUPER_ADMIN role not found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomic: assign to target, then remove from caller — both with service role
    const { error: assignError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: targetUserId, role_id: roleData.id, assigned_by: user.id },
        { onConflict: "user_id,role_id" }
      );

    if (assignError) {
      console.error("Assign error:", assignError);
      return new Response(JSON.stringify({ error: "Failed to assign role to target" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: removeError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", user.id)
      .eq("role_id", roleData.id);

    if (removeError) {
      // Rollback: remove from target
      console.error("Remove error, rolling back:", removeError);
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId)
        .eq("role_id", roleData.id);

      return new Response(JSON.stringify({ error: "Transfer failed, rolled back" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
