import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id?: string;
  type: 'order' | 'payment' | 'vendor' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  broadcast?: boolean; // Send to all users
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, type, title, message, data = {}, broadcast = false }: NotificationRequest = await req.json();

    if (broadcast) {
      // Send notification to all users
      const { data: users, error: usersError } = await supabaseClient.auth.admin.listUsers();
      
      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      const notifications = users.users.map(user => ({
        user_id: user.id,
        type,
        title,
        message,
        data,
      }));

      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        throw new Error(`Failed to send broadcast notifications: ${insertError.message}`);
      }

      console.log(`Broadcast notification sent to ${users.users.length} users`);
    } else {
      // Send notification to specific user
      if (!user_id) {
        throw new Error("user_id is required for non-broadcast notifications");
      }

      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id,
          type,
          title,
          message,
          data,
        });

      if (insertError) {
        throw new Error(`Failed to send notification: ${insertError.message}`);
      }

      console.log(`Notification sent to user: ${user_id}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});