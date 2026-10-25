// Cloudflare Pages Function: POST /api/submit-lead
// Receives the Book-a-Call lead form, validates server-side, creates a
// Lead in Zoho CRM via a self-client OAuth refresh-token exchange.
//
// Required environment variables (set in Cloudflare Pages → Settings →
// Environment variables, never committed to this file):
//   ZOHO_CLIENT_ID
//   ZOHO_CLIENT_SECRET
//   ZOHO_REFRESH_TOKEN
//   ZOHO_ACCOUNTS_DOMAIN   (e.g. https://accounts.zoho.com)
//   ZOHO_API_DOMAIN        (e.g. https://www.zohoapis.com)

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getAccessToken(env) {
  const params = new URLSearchParams({
    refresh_token: env.ZOHO_REFRESH_TOKEN,
    client_id: env.ZOHO_CLIENT_ID,
    client_secret: env.ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });

  const response = await fetch(`${env.ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token?${params.toString()}`, {
    method: 'POST'
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Zoho token exchange failed: ' + JSON.stringify(data));
  }
  return data.access_token;
}

async function createZohoLead(env, accessToken, lead) {
  const [firstName, ...rest] = lead.name.trim().split(' ');
  const lastName = rest.length ? rest.join(' ') : firstName;

  const revenueLine = lead.newAgent
    ? 'New agent — no production yet'
    : (lead.revenue ? lead.revenue : 'Not provided');

  const payload = {
    data: [
      {
        First_Name: firstName,
        Last_Name: lastName,
        Email: lead.email,
        Phone: lead.phone,
        Company: lead.brokerage || 'Not provided',
        Lead_Source: 'Website',
        Description: `Book-a-Call submission from freedompartnersgroup.com.\nCurrent brokerage: ${lead.brokerage || 'Not provided'}\nRevenue — past 12 months: ${revenueLine}`
      }
    ]
  };

  const response = await fetch(`${env.ZOHO_API_DOMAIN}/crm/v6/Leads`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  const result = data.data && data.data[0];
  if (!result || result.status !== 'success') {
    throw new Error('Zoho lead creation failed: ' + JSON.stringify(data));
  }
  return result;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { name, phone, email, brokerage, revenue, newAgent } = body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return Response.json({ ok: false, error: 'Invalid name' }, { status: 400 });
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    return Response.json({ ok: false, error: 'Invalid phone number' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return Response.json({ ok: false, error: 'Invalid email' }, { status: 400 });
  }
  if (!brokerage || typeof brokerage !== 'string' || brokerage.trim().length < 1) {
    return Response.json({ ok: false, error: 'Invalid brokerage' }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken(env);
    await createZohoLead(env, accessToken, { name, phone, email, brokerage, revenue, newAgent: !!newAgent });
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: 'Lead capture failed, try again shortly' }, { status: 502 });
  }
}

export async function onRequestGet() {
  return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
}
