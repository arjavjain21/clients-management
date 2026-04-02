// deno-lint-ignore-file
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.10";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "465");
const SMTP_SECURE = SMTP_PORT === 465; // true for port 465 (SSL)
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? SMTP_USER;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { to, subject, text, cc } = await req.json();

    // Input validation
    if (!to || !subject || !text) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields: to, subject, text" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!EMAIL_REGEX.test(to)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate CC emails
    if (cc && Array.isArray(cc)) {
      for (const email of cc) {
        if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid CC email format" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
    }

    if (subject.length > 500) {
      return new Response(JSON.stringify({ ok: false, error: "Subject too long" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (text.length > 50000) {
      return new Response(JSON.stringify({ ok: false, error: "Text too long" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!SMTP_USER || !SMTP_PASS) {
      return new Response(JSON.stringify({ ok: false, error: "SMTP not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: SMTP_FROM,
      to,
      subject,
      text,
    };
    if (cc && Array.isArray(cc) && cc.length > 0) {
      mailOptions.cc = cc.join(", ");
    }

    await new Promise<void>((resolve, reject) => {
      transporter.sendMail(mailOptions, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log("Email sent successfully via SMTP");
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("Error sending email:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
