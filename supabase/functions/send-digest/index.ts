// Parent Digest sender. Deploy: supabase functions deploy send-digest
// Secrets: RESEND_API_KEY, DIGEST_FROM_EMAIL (verified in Resend)
// Requires the build_parent_digest migration. The function never sends client HTML.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DigestPayload = {
  html: string;
  entry_ids: string[];
  student_id: string;
  owner_id: string;
  school_id: string;
  guardian_email: string;
  student_name: string;
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

    const body = await req.json().catch(() => null);
    const studentId = body?.studentId;
    const entryIds = body?.entryIds;
    const mode = body?.mode === "auto" ? "auto" : "manual";
    const edited = !!body?.edited;
    const id = typeof body?.id === "string" && body.id ? body.id : crypto.randomUUID();

    if (!studentId || !Array.isArray(entryIds)) {
      return json({ error: "studentId and entryIds are required" }, 400);
    }

    const { data, error } = await supabase.rpc("build_parent_digest", {
      target_student: studentId,
      entry_ids: entryIds,
      personal_note: textField(body?.personalNote),
      intro: textField(body?.intro),
      home_connection: textField(body?.homeConnection),
      footer: textField(body?.footer),
    });

    if (error || !data) {
      const message = error?.message || "Could not build the parent digest";
      const status = /not allowed|not signed in/i.test(message) ? 403 : 400;
      return json({ error: message }, status);
    }

    const digest = data as DigestPayload;
    if (
      digest.student_id !== studentId ||
      !digest.guardian_email ||
      !digest.html ||
      !digest.owner_id ||
      !Array.isArray(digest.entry_ids)
    ) {
      return json({ error: "Digest builder returned an incomplete payload" }, 500);
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

    const firstName = (digest.student_name || "your child").split(/\s+/)[0];
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [digest.guardian_email],
        subject: `This week with ${firstName}: celebrations & notes`,
        html: digest.html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: `Resend failed: ${detail}` }, 502);
    }

    const sendRow = {
      id,
      owner_id: digest.owner_id,
      student_id: digest.student_id,
      entry_ids: digest.entry_ids,
      mode,
      html: digest.html,
      edited,
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

function textField(value: unknown) {
  return typeof value === "string" ? value.slice(0, 4000) : "";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
