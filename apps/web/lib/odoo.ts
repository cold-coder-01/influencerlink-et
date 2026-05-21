type JsonRpcResponse<T> = {
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export type OdooIndustry = {
  id: number;
  name: string;
  icon: string | false;
  industry_weight: number;
};

type OdooConfig = {
  url: string;
  db: string;
  username: string;
  password: string;
};

const fallbackIndustries: OdooIndustry[] = [
  { id: 1, name: "Beverage", icon: "cup", industry_weight: 1.2 },
  { id: 2, name: "Textile", icon: "sparkle", industry_weight: 1.35 },
  { id: 3, name: "Real Estate", icon: "building", industry_weight: 1.5 },
  { id: 4, name: "Craft", icon: "palette", industry_weight: 1.1 },
  { id: 5, name: "Agri-Tech", icon: "leaf", industry_weight: 1.25 },
];

function getOdooConfig(): OdooConfig | null {
  const { ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD } = process.env;

  if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_PASSWORD) {
    return null;
  }

  return {
    url: ODOO_URL.replace(/\/$/, ""),
    db: ODOO_DB,
    username: ODOO_USERNAME,
    password: ODOO_PASSWORD,
  };
}

async function jsonRpc<T>(
  url: string,
  params: Record<string, unknown>,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  const response = await fetch(`${url}/jsonrpc`, {
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
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    throw new Error(`Odoo JSON-RPC failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as JsonRpcResponse<T>;

  if (payload.error) {
    throw new Error(payload.error.message);
  }

  if (typeof payload.result === "undefined") {
    throw new Error("Odoo JSON-RPC returned no result.");
  }

  return payload.result;
}

async function authenticate(config: OdooConfig): Promise<number> {
  return jsonRpc<number>(config.url, {
    service: "common",
    method: "login",
    args: [config.db, config.username, config.password],
  });
}

async function executeKw<T>(
  config: OdooConfig,
  uid: number,
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  return jsonRpc<T>(config.url, {
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
  });
}

export async function fetchIndustries(): Promise<OdooIndustry[]> {
  const config = getOdooConfig();

  if (!config) {
    return fallbackIndustries;
  }

  try {
    const uid = await authenticate(config);

    return executeKw<OdooIndustry[]>(
      config,
      uid,
      "influencer.industry",
      "search_read",
      [[["active", "=", true]]],
      {
        fields: ["name", "icon", "industry_weight"],
        order: "name asc",
      },
    );
  } catch (error) {
    console.error("Falling back to local industries:", error);
    return fallbackIndustries;
  }
}
