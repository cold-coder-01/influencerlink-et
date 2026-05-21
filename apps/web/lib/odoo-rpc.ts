type JsonRpcResponse<T> = {
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export type OdooConfig = {
  url: string;
  db: string;
  username: string;
  password: string;
};

const DEFAULT_ODOO_CONFIG: OdooConfig = {
  url: "http://127.0.0.1:8069",
  db: "influencer_link_db",
  username: "admin",
  password: "admin",
};

const REQUEST_TIMEOUT_MS = 10000;

export function getOdooConfig(): OdooConfig {
  const configuredUrl = process.env.ODOO_URL ?? DEFAULT_ODOO_CONFIG.url;

  return {
    url: configuredUrl.replace("localhost", "127.0.0.1").replace(/\/$/, ""),
    db: process.env.ODOO_DB ?? DEFAULT_ODOO_CONFIG.db,
    username: process.env.ODOO_USERNAME ?? DEFAULT_ODOO_CONFIG.username,
    password: process.env.ODOO_PASSWORD ?? DEFAULT_ODOO_CONFIG.password,
  };
}

export async function callOdoo<T>(
  params: Record<string, unknown>,
  config = getOdooConfig(),
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`Odoo returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as JsonRpcResponse<T>;

  if (payload.error) {
    throw new Error(payload.error.message);
  }

  if (typeof payload.result === "undefined") {
    throw new Error("Odoo returned an empty RPC result.");
  }

  return payload.result;
}

export async function authenticateOdoo(
  username: string,
  password: string,
  context: Record<string, unknown> = {},
  config = getOdooConfig(),
): Promise<number | false> {
  return callOdoo<number | false>(
    {
      service: "common",
      method: "authenticate",
      args: [config.db, username, password, context],
    },
    config,
  );
}

export async function executeKw<T>(
  uid: number,
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
  config = getOdooConfig(),
): Promise<T> {
  return callOdoo<T>(
    {
      service: "object",
      method: "execute_kw",
      args: [
        config.db,
        uid,
        config.password,
        model,
        method,
        args,
        kwargs,
      ],
    },
    config,
  );
}

export async function authenticateServiceUser(
  config = getOdooConfig(),
): Promise<number> {
  const uid = await authenticateOdoo(
    config.username,
    config.password,
    {},
    config,
  );

  if (!uid) {
    throw new Error("Odoo service user authentication failed.");
  }

  return uid;
}
