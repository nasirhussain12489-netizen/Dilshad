export type SettingRecord = {
  settingKey?: string | null;
  settingValue?: string | null;
};

export function safeObjectEntries(
  value: Record<string, unknown> | null | undefined
): [string, unknown][] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>);
}

export function normalizeSettingsMap(
  records?: SettingRecord[] | null
): Record<string, string> {
  const map: Record<string, string> = {};

  if (!Array.isArray(records)) {
    return map;
  }

  for (const record of records) {
    if (!record || typeof record !== 'object') {
      continue;
    }

    const key = typeof record.settingKey === 'string' ? record.settingKey.trim() : '';
    if (!key) {
      continue;
    }

    map[key] = record.settingValue == null ? '' : String(record.settingValue);
  }

  return map;
}
