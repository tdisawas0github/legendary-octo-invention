import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "gateway.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      api_key TEXT DEFAULT '',
      provider_type TEXT NOT NULL DEFAULT 'openai',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      context_length INTEGER DEFAULT 4096,
      max_output INTEGER DEFAULT 4096,
      supports_vision INTEGER DEFAULT 0,
      supports_tools INTEGER DEFAULT 0,
      supports_streaming INTEGER DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      cost_per_1k_input REAL DEFAULT 0,
      cost_per_1k_output REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY,
      model_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      error_message TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key_hash TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      rate_limit INTEGER DEFAULT 60,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider_id);
    CREATE INDEX IF NOT EXISTS idx_request_logs_model ON request_logs(model_id);
    CREATE INDEX IF NOT EXISTS idx_request_logs_created ON request_logs(created_at);
  `);
}

// --- Provider operations ---
export interface Provider {
  id: string;
  name: string;
  base_url: string;
  api_key: string;
  provider_type: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export function getAllProviders(): Provider[] {
  return getDb().prepare("SELECT * FROM providers ORDER BY created_at DESC").all() as Provider[];
}

export function getProvider(id: string): Provider | undefined {
  return getDb().prepare("SELECT * FROM providers WHERE id = ?").get(id) as Provider | undefined;
}

export function createProvider(data: Omit<Provider, "id" | "created_at" | "updated_at">): Provider {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      "INSERT INTO providers (id, name, base_url, api_key, provider_type, is_active) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(id, data.name, data.base_url, data.api_key, data.provider_type, data.is_active ?? 1);
  return getProvider(id)!;
}

export function updateProvider(
  id: string,
  data: Partial<Omit<Provider, "id" | "created_at" | "updated_at">>
): Provider | undefined {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  getDb().prepare(`UPDATE providers SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getProvider(id);
}

export function deleteProvider(id: string): boolean {
  const result = getDb().prepare("DELETE FROM providers WHERE id = ?").run(id);
  return result.changes > 0;
}

// --- Model operations ---
export interface Model {
  id: string;
  provider_id: string;
  model_id: string;
  display_name: string;
  description: string;
  context_length: number;
  max_output: number;
  supports_vision: number;
  supports_tools: number;
  supports_streaming: number;
  is_active: number;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  created_at: string;
  updated_at: string;
}

export interface ModelWithProvider extends Model {
  provider_name: string;
  provider_type: string;
  base_url: string;
  api_key: string;
}

export function getAllModels(): ModelWithProvider[] {
  return getDb()
    .prepare(
      `SELECT m.*, p.name as provider_name, p.provider_type, p.base_url, p.api_key
       FROM models m
       JOIN providers p ON m.provider_id = p.id
       ORDER BY m.created_at DESC`
    )
    .all() as ModelWithProvider[];
}

export function getActiveModels(): ModelWithProvider[] {
  return getDb()
    .prepare(
      `SELECT m.*, p.name as provider_name, p.provider_type, p.base_url, p.api_key
       FROM models m
       JOIN providers p ON m.provider_id = p.id
       WHERE m.is_active = 1 AND p.is_active = 1
       ORDER BY m.display_name ASC`
    )
    .all() as ModelWithProvider[];
}

export function getModel(id: string): ModelWithProvider | undefined {
  return getDb()
    .prepare(
      `SELECT m.*, p.name as provider_name, p.provider_type, p.base_url, p.api_key
       FROM models m
       JOIN providers p ON m.provider_id = p.id
       WHERE m.id = ?`
    )
    .get(id) as ModelWithProvider | undefined;
}

export function getModelByModelId(modelId: string): ModelWithProvider | undefined {
  return getDb()
    .prepare(
      `SELECT m.*, p.name as provider_name, p.provider_type, p.base_url, p.api_key
       FROM models m
       JOIN providers p ON m.provider_id = p.id
       WHERE m.model_id = ? AND m.is_active = 1 AND p.is_active = 1
       LIMIT 1`
    )
    .get(modelId) as ModelWithProvider | undefined;
}

export function createModel(
  data: Omit<Model, "id" | "created_at" | "updated_at">
): Model {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      `INSERT INTO models (id, provider_id, model_id, display_name, description, context_length, max_output,
       supports_vision, supports_tools, supports_streaming, is_active, cost_per_1k_input, cost_per_1k_output)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      data.provider_id,
      data.model_id,
      data.display_name,
      data.description,
      data.context_length,
      data.max_output,
      data.supports_vision,
      data.supports_tools,
      data.supports_streaming,
      data.is_active,
      data.cost_per_1k_input,
      data.cost_per_1k_output
    );
  return getDb().prepare("SELECT * FROM models WHERE id = ?").get(id) as Model;
}

export function updateModel(
  id: string,
  data: Partial<Omit<Model, "id" | "created_at" | "updated_at">>
): Model | undefined {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  getDb().prepare(`UPDATE models SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getDb().prepare("SELECT * FROM models WHERE id = ?").get(id) as Model | undefined;
}

export function deleteModel(id: string): boolean {
  const result = getDb().prepare("DELETE FROM models WHERE id = ?").run(id);
  return result.changes > 0;
}

// --- Request log operations ---
export interface RequestLog {
  id: string;
  model_id: string;
  provider_id: string;
  status: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  error_message: string;
  created_at: string;
}

export function createRequestLog(
  data: Omit<RequestLog, "id" | "created_at">
): RequestLog {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      `INSERT INTO request_logs (id, model_id, provider_id, status, input_tokens, output_tokens, latency_ms, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, data.model_id, data.provider_id, data.status, data.input_tokens, data.output_tokens, data.latency_ms, data.error_message);
  return getDb().prepare("SELECT * FROM request_logs WHERE id = ?").get(id) as RequestLog;
}

export function updateRequestLog(
  id: string,
  data: Partial<Omit<RequestLog, "id" | "created_at">>
): void {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);
  getDb().prepare(`UPDATE request_logs SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function getRequestLogs(limit = 50, offset = 0): (RequestLog & { model_name: string; provider_name: string })[] {
  return getDb()
    .prepare(
      `SELECT rl.*, m.display_name as model_name, p.name as provider_name
       FROM request_logs rl
       LEFT JOIN models m ON rl.model_id = m.id
       LEFT JOIN providers p ON rl.provider_id = p.id
       ORDER BY rl.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as (RequestLog & { model_name: string; provider_name: string })[];
}

export function getRequestLogCount(): number {
  const row = getDb().prepare("SELECT COUNT(*) as count FROM request_logs").get() as { count: number };
  return row.count;
}

export function getStats() {
  const totalRequests = (getDb().prepare("SELECT COUNT(*) as count FROM request_logs").get() as { count: number }).count;
  const successfulRequests = (getDb().prepare("SELECT COUNT(*) as count FROM request_logs WHERE status = 'success'").get() as { count: number }).count;
  const failedRequests = (getDb().prepare("SELECT COUNT(*) as count FROM request_logs WHERE status = 'error'").get() as { count: number }).count;
  const totalInputTokens = (getDb().prepare("SELECT COALESCE(SUM(input_tokens), 0) as total FROM request_logs").get() as { total: number }).total;
  const totalOutputTokens = (getDb().prepare("SELECT COALESCE(SUM(output_tokens), 0) as total FROM request_logs").get() as { total: number }).total;
  const avgLatency = (getDb().prepare("SELECT COALESCE(AVG(latency_ms), 0) as avg FROM request_logs WHERE status = 'success'").get() as { avg: number }).avg;
  const totalModels = (getDb().prepare("SELECT COUNT(*) as count FROM models").get() as { count: number }).count;
  const activeModels = (getDb().prepare("SELECT COUNT(*) as count FROM models WHERE is_active = 1").get() as { count: number }).count;
  const totalProviders = (getDb().prepare("SELECT COUNT(*) as count FROM providers").get() as { count: number }).count;

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    totalInputTokens,
    totalOutputTokens,
    avgLatency: Math.round(avgLatency),
    totalModels,
    activeModels,
    totalProviders,
  };
}
