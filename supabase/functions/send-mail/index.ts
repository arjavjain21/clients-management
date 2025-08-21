// deno-lint-ignore-file
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Prefer Brevo (Sendinblue) if configured; fall back to Resend
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") ?? "";
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") ?? "Operations";

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
    
    // Try Brevo first if configured fully
    let response: Response | null = null;
    if (BREVO_API_KEY && BREVO_SENDER_EMAIL) {
      response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
          to: [{ email: to }],
          subject,
          textContent: text,
        }),
      });
    } else if (RESEND_API_KEY) {
      // Fallback to Resend if Brevo isn't configured
      response = await fetch("https://api.resend.com/emails", {
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
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: "No email provider configured (set BREVO_* or RESEND_*)" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
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
      JSON.stringify({ ok: true, id: body?.messageId || body?.id || body?.message }), 
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