const DEFAULT_ODOO_CONFIG = {
  url: "http://127.0.0.1:8069",
  db: "influencer_link_db",
  username: "admin",
  password: "admin",
};

function getOdooConfig() {
  const configuredUrl = process.env.ODOO_URL ?? DEFAULT_ODOO_CONFIG.url;

  return {
    url: configuredUrl.replace("localhost", "127.0.0.1").replace(/\/$/, ""),
    db: process.env.ODOO_DB ?? DEFAULT_ODOO_CONFIG.db,
    username: process.env.ODOO_USERNAME ?? DEFAULT_ODOO_CONFIG.username,
    password: process.env.ODOO_PASSWORD ?? DEFAULT_ODOO_CONFIG.password,
  };
}

async function callOdoo(config, params) {
  const response = await fetch(new URL("/jsonrpc", config.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params,
      id: Date.now(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Odoo returned HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (payload.error) {
    throw new Error(payload.error.message);
  }

  return payload.result;
}

export async function fetchOdooData(model, fields = []) {
  const config = getOdooConfig();
  const uid = await callOdoo(config, {
    service: "common",
    method: "login",
    args: [config.db, config.username, config.password],
  });

  return callOdoo(config, {
    service: "object",
    method: "execute_kw",
    args: [
      config.db,
      uid,
      config.password,
      model,
      "search_read",
      [[]],
      { fields },
    ],
  });
}
