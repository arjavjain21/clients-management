// deno-lint-ignore-file
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Missing authorization header');
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Verify the JWT with Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('Authenticated user:', user.email);

    const { to, subject, text } = await req.json();

    // Input validation
    if (!to || !subject || !text) {
      console.log('Missing required fields');
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields: to, subject, text' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(to)) {
      console.log('Invalid email format:', to);
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid email format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Validate input lengths
    if (subject.length > 500) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Subject too long (max 500 characters)' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    if (text.length > 50000) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Text too long (max 50000 characters)' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    // Try Brevo first if configured fully
    let response: Response | null = null;
    if (BREVO_API_KEY && BREVO_SENDER_EMAIL) {
      console.log('Sending email via Brevo to:', to);
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
      console.log('Sending email via Resend to:', to);
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
      console.log('No email provider configured');
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
      console.log('Email send failed:', body);
      return new Response(
        JSON.stringify({ ok: false, error: body?.message ?? "send failed" }), 
        { 
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    console.log('Email sent successfully:', body);
    return new Response(
      JSON.stringify({ ok: true, id: body?.messageId || body?.id || body?.message }), 
      { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (e: any) {
    console.error('Error in send-mail function:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message ?? "unknown" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});
