import { supabase } from "@/integrations/supabase/client";

export async function sendAssignmentEmail({ 
  to, 
  subject, 
  text 
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const { data, error } = await supabase.functions.invoke("send-mail", { 
    body: { to, subject, text } 
  });
  if (error) throw error;
  return data;
}