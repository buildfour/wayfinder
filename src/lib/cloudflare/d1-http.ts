/**
 * Cloudflare D1 HTTP API client (official REST API).
 * @see https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/
 */

export interface D1QueryResult<T = Record<string, unknown>> {
  success: boolean;
  results: T[];
  meta?: { changes?: number; last_row_id?: number };
  error?: string;
}

function getConfig() {
  const env = process.env;
  const accountId = env.CF_ACCOUNT_ID || env["cloudflare-account-id"];
  const databaseId = env.CF_D1_DATABASE_ID;
  const apiToken =
    env.CLOUDFLARE_API_TOKEN || env.cloudflare || env.cloudflare2;
  if (!accountId || !databaseId || !apiToken) {
    return null;
  }
  return { accountId, databaseId, apiToken };
}

export function isD1Configured(): boolean {
  return getConfig() !== null;
}

export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<D1QueryResult<T>> {
  const cfg = getConfig();
  if (!cfg) {
    return { success: false, results: [], error: "D1 not configured" };
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cfg.accountId}/d1/database/${cfg.databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  const json = (await res.json()) as {
    success: boolean;
    errors?: Array<{ message: string }>;
    result?: Array<{ results: T[]; meta?: D1QueryResult["meta"] }>;
  };

  if (!json.success || !json.result?.[0]) {
    return {
      success: false,
      results: [],
      error: json.errors?.[0]?.message ?? `D1 query failed (${res.status})`,
    };
  }

  return {
    success: true,
    results: json.result[0].results ?? [],
    meta: json.result[0].meta,
  };
}

export async function d1Execute(sql: string, params: unknown[] = []): Promise<boolean> {
  const result = await d1Query(sql, params);
  return result.success;
}

export async function d1QueryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await d1Query<T>(sql, params);
  return result.results[0] ?? null;
}

export async function d1QueryAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await d1Query<T>(sql, params);
  return result.results;
}
