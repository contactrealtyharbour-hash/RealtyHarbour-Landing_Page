// POST /api/lead  — receives every form on the landing page and forwards the lead.
//
// Configure in Vercel → Project → Settings → Environment Variables (any or all):
//   LEAD_WEBHOOK_URL   a URL that receives the lead as JSON (Google Apps Script, Zapier, Make, your CRM)
//   RESEND_API_KEY     + LEAD_TO_EMAIL (comma-separated) to email each lead via resend.com
//   LEAD_FROM_EMAIL    optional sender for Resend (defaults to onboarding@resend.dev until you verify a domain)
// Every lead is also written to the function log (Vercel → Deployments → Logs) so nothing is lost meanwhile.

const DIGITS = /\D/g;
const MOBILE = /^[6-9]\d{9}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function parseCookies(header) {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 1) continue;
    const k = part.slice(0, i).trim();
    let v = part.slice(i + 1).trim();
    try { v = decodeURIComponent(v); } catch (_) { /* keep raw */ }
    out[k] = v;
  }
  return out;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const b = req.body || {};

  if (b.company) return res.redirect(303, "/thank-you"); // honeypot: bots fill the hidden field

  const name = String(b.fname || "").trim();
  const mobile = String(b.mobile || "").replace(DIGITS, "");
  const email = String(b.email || "").trim();
  if (!name || !MOBILE.test(mobile) || !EMAIL.test(email)) {
    return res.status(400).send("Please go back and check your name, 10-digit mobile number and email.");
  }

  const cookies = parseCookies(req.headers.cookie);
  const lead = {
    name,
    mobile,
    email,
    source: String(b.source || ""),
    page: req.headers.referer || "",
    attribution: Object.fromEntries(Object.entries(cookies).filter(([k]) => /^(utm_|gclid|fbclid|srd|cstm_ppc_)/.test(k))),
    ip: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim(),
    userAgent: req.headers["user-agent"] || "",
    receivedAt: new Date().toISOString(),
  };
  console.log("LEAD", JSON.stringify(lead));

  const jobs = [];
  if (process.env.LEAD_WEBHOOK_URL) {
    jobs.push(fetch(process.env.LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
    }));
  }
  if (process.env.RESEND_API_KEY && process.env.LEAD_TO_EMAIL) {
    const text = Object.entries(lead)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join("\n");
    jobs.push(fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || "Realty Harbour <onboarding@resend.dev>",
        to: process.env.LEAD_TO_EMAIL.split(",").map((s) => s.trim()),
        subject: `New lead: ${name} (${mobile}) via ${lead.source || "website"}`,
        text,
      }),
    }));
  }
  const results = await Promise.allSettled(jobs);
  for (const r of results) {
    if (r.status === "rejected") console.error("LEAD forward failed", r.reason);
    else if (!r.value.ok) console.error("LEAD forward responded", r.value.status, await r.value.text().catch(() => ""));
  }

  return res.redirect(303, "/thank-you");
};
