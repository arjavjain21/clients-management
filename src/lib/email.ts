import { supabase } from "@/integrations/supabase/client";

export async function sendAssignmentEmail({
  to,
  subject,
  text,
  cc,
}: {
  to: string;
  subject: string;
  text: string;
  cc?: string[];
}) {
  const body: Record<string, unknown> = { to, subject, text };
  if (cc && cc.length > 0) body.cc = cc;
  const { data, error } = await supabase.functions.invoke("send-mail", { body });
  if (error) throw error;
  return data;
}
