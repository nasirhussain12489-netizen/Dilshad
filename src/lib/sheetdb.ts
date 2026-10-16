export type SheetDBRecord = Record<string, any>;

export function getSheetDBConfig(): { apiUrl: string; apiKey: string } | null {
  const apiUrl = String(process.env.SHEETDB_API_URL || '').trim();
  const apiKey = String(process.env.SHEETDB_API_KEY || '').trim();

  if (!apiUrl || !apiKey || apiUrl.includes('YOUR_SHEETDB_API_URL') || apiKey.includes('YOUR_SHEETDB_API_KEY')) {
    return null;
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    apiKey,
  };
}

function buildSheetDBUrl(baseUrl: string, table: string, id?: string | number) {
  const url = new URL(baseUrl.replace(/\/+$/, ''));
  if (table) {
    url.searchParams.set('sheet', table);
  }
  if (id !== undefined && id !== null) {
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/${String(id)}`;
  }
  return url.toString();
}

async function sheetdbRequest<T>(
  table: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  payload?: SheetDBRecord,
  id?: string | number
): Promise<T | null> {
  const config = getSheetDBConfig();
  if (!config) {
    return null;
  }

  const url = new URL(buildSheetDBUrl(config.apiUrl, table, id));
  url.searchParams.set('api_key', config.apiKey);

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SheetDB request failed for ${table}: ${response.status} ${text}`);
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  const json = JSON.parse(text);
  if (Array.isArray(json)) {
    return json as T;
  }

  if (json && typeof json === 'object' && Array.isArray((json as any).data)) {
    return (json as any).data as T;
  }

  return json as T;
}

export async function getAll(table: string): Promise<SheetDBRecord[]> {
  try {
    const result = await sheetdbRequest<SheetDBRecord[]>(table, 'GET');
    if (!result) return [];
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    console.warn(`SheetDB getAll failed for ${table}:`, error);
    return [];
  }
}

export async function getById(table: string, id: string | number): Promise<SheetDBRecord | null> {
  try {
    const result = await sheetdbRequest<SheetDBRecord | SheetDBRecord[]>(table, 'GET', undefined, id);
    if (!result) return null;
    if (Array.isArray(result)) return result[0] || null;
    return result;
  } catch (error) {
    console.warn(`SheetDB getById failed for ${table}:${id}:`, error);
    return null;
  }
}

export async function createRecord(table: string, record: SheetDBRecord): Promise<SheetDBRecord | null> {
  try {
    const result = await sheetdbRequest<SheetDBRecord | SheetDBRecord[]>(table, 'POST', record);
    if (!result) return null;
    if (Array.isArray(result)) return result[0] || null;
    return result;
  } catch (error) {
    console.warn(`SheetDB createRecord failed for ${table}:`, error);
    return null;
  }
}

export async function updateRecord(
  table: string,
  id: string | number,
  record: SheetDBRecord
): Promise<SheetDBRecord | null> {
  try {
    const result = await sheetdbRequest<SheetDBRecord | SheetDBRecord[]>(table, 'PUT', record, id);
    if (!result) return null;
    if (Array.isArray(result)) return result[0] || null;
    return result;
  } catch (error) {
    console.warn(`SheetDB updateRecord failed for ${table}:${id}:`, error);
    return null;
  }
}

export async function deleteRecord(table: string, id: string | number): Promise<boolean> {
  try {
    const result = await sheetdbRequest<SheetDBRecord | SheetDBRecord[]>(table, 'DELETE', undefined, id);
    return result !== null;
  } catch (error) {
    console.warn(`SheetDB deleteRecord failed for ${table}:${id}:`, error);
    return false;
  }
}

export async function findByField(
  table: string,
  field: string,
  value: string | number | boolean | null
): Promise<SheetDBRecord[]> {
  try {
    const rows = await getAll(table);
    const normalized = String(value ?? '').trim();
    return rows.filter((row) => String(row?.[field] ?? '') === normalized);
  } catch (error) {
    console.warn(`SheetDB findByField failed for ${table}.${field}:`, error);
    return [];
  }
}
