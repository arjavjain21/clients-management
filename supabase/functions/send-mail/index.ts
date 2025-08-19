// deno-lint-ignore-file
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "noreply@example.com";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, text } = await req.json();
    
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "RESEND_API_KEY missing" }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${RESEND_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        from: EMAIL_FROM, 
        to: [to], 
        subject, 
        text 
      })
    });
    
    const body = await response.json();
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: body?.message ?? "send failed" }), 
        { 
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ ok: true, id: body?.id }), 
      { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message ?? "unknown" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});