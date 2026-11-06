// Parent Digest sender. Deploy: supabase functions deploy send-digest
// Secrets: RESEND_API_KEY, DIGEST_FROM_EMAIL (verified in Resend)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return json({ error: "Not signed in" }, 401);
    }

    const body = await req.json();
    const { studentId, html, entryIds = [], mode = "manual", edited = false, id } = body || {};
    if (!studentId || !html) {
      return json({ error: "studentId and html are required" }, 400);
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, name, guardian_email, guardian_name, parent_digest_enabled, owner_id")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      return json({ error: "Student not found" }, 404);
    }
    if (student.owner_id !== user.id) {
      return json({ error: "Forbidden" }, 403);
    }
    if (student.parent_digest_enabled === false) {
      return json({ error: "Parent digest is turned off for this student" }, 400);
    }
    if (!student.guardian_email) {
      return json({ error: "Add a guardian email first" }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("DIGEST_FROM_EMAIL");
    const missing = [
      !apiKey ? "RESEND_API_KEY" : null,
      !from ? "DIGEST_FROM_EMAIL" : null,
    ].filter(Boolean);
    if (missing.length) {
      return json(
        {
          error: `Email is not configured. Missing Edge Function secret(s): ${missing.join(
            ", "
          )}. Add them at Project Settings → Edge Functions → Secrets (not Vault), then redeploy send-digest.`,
        },
        503
      );
    }

    const firstName = (student.name || "your child").split(/\s+/)[0];
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [student.guardian_email],
        subject: `This week with ${firstName}: celebrations & notes`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: `Resend failed: ${detail}` }, 502);
    }

    const sendRow = {
      id: id || crypto.randomUUID(),
      owner_id: user.id,
      student_id: studentId,
      entry_ids: entryIds,
      mode,
      html,
      edited: !!edited,
      sent_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from("digest_sends")
      .insert(sendRow)
      .select()
      .single();

    if (insertError) {
      return json({ error: insertError.message }, 500);
    }

    return json({ send: inserted });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Send failed" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
