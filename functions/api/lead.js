// POST /api/lead on Cloudflare Pages (same behaviour as api/lead.js on Vercel).
//
// Configure in Cloudflare → Workers & Pages → realty-harbour → Settings → Variables and Secrets:
//   LEAD_WEBHOOK_URL   a URL that receives the lead as JSON (Google Apps Script, Zapier, Make, your CRM)
//   RESEND_API_KEY     + LEAD_TO_EMAIL (comma-separated) to email each lead via resend.com
//   LEAD_FROM_EMAIL    optional sender for Resend (defaults to onboarding@resend.dev until you verify a domain)
// Every lead is also written to the function log (Pages → Deployments → Logs / Real-time logs).

const MOBILE = /^[6-9]\d{9}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function parseCookies(header) {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 1) continue;
    let v = part.slice(i + 1).trim();
    try { v = decodeURIComponent(v); } catch (_) { /* keep raw */ }
    out[part.slice(0, i).trim()] = v;
  }
  return out;
}

export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  const f = (k) => String(form.get(k) || "").trim();
  const thanks = () => Response.redirect(new URL("/thank-you", request.url).toString(), 303);

  if (f("company")) return thanks(); // honeypot: bots fill the hidden field

  const name = f("fname");
  const mobile = f("mobile").replace(/\D/g, "");
  const email = f("email");
  if (!name || !MOBILE.test(mobile) || !EMAIL.test(email)) {
    return new Response("Please go back and check your name, 10-digit mobile number and email.", { status: 400 });
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  const lead = {
    name,
    mobile,
    email,
    source: f("source"),
    page: request.headers.get("referer") || "",
    attribution: Object.fromEntries(Object.entries(cookies).filter(([k]) => /^(utm_|gclid|fbclid|srd|cstm_ppc_)/.test(k))),
    ip: request.headers.get("cf-connecting-ip") || "",
    userAgent: request.headers.get("user-agent") || "",
    receivedAt: new Date().toISOString(),
  };
  console.log("LEAD", JSON.stringify(lead));

  const jobs = [];
  if (env.LEAD_WEBHOOK_URL) {
    jobs.push(fetch(env.LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
    }));
  }
  if (env.RESEND_API_KEY && env.LEAD_TO_EMAIL) {
    const text = Object.entries(lead)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join("\n");
    jobs.push(fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: env.LEAD_FROM_EMAIL || "Realty Harbour <onboarding@resend.dev>",
        to: env.LEAD_TO_EMAIL.split(",").map((s) => s.trim()),
        subject: `New lead: ${name} (${mobile}) via ${lead.source || "website"}`,
        text,
      }),
    }));
  }
  for (const r of await Promise.allSettled(jobs)) {
    if (r.status === "rejected") console.error("LEAD forward failed", r.reason);
    else if (!r.value.ok) console.error("LEAD forward responded", r.value.status, await r.value.text().catch(() => ""));
  }

  return thanks();
}

export const onRequestGet = () => new Response("Method not allowed", { status: 405 });
