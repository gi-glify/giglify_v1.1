import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

export interface DateRange {
  from: string;
  to: string;
}

const MAX_RANGE_DAYS = 31;

export function parseDateRange(body: Record<string, unknown>): DateRange {
  const from = typeof body.dateFrom === "string" ? body.dateFrom : typeof body.date_from === "string" ? body.date_from : "";
  const to = typeof body.dateTo === "string" ? body.dateTo : typeof body.date_to === "string" ? body.date_to : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new HttpError("dateFrom and dateTo must be YYYY-MM-DD values", 400, "invalid_date_range");
  }
  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    throw new HttpError("dateTo must be after dateFrom", 400, "invalid_date_range");
  }
  if ((toMs - fromMs) / (24 * 60 * 60 * 1000) > MAX_RANGE_DAYS) {
    throw new HttpError(`Date ranges cannot exceed ${MAX_RANGE_DAYS} days`, 400, "date_range_too_long");
  }
  return { from, to };
}

async function countQuery(db: SupabaseClient, table: string, dateColumn: string, range: DateRange, filters: Array<{ column: string; value: string | string[] }> = []): Promise<number> {
  let query = db.from(table).select("id", { count: "exact", head: true }).gte(dateColumn, `${range.from}T00:00:00Z`).lt(dateColumn, `${range.to}T00:00:00Z`);
  for (const filter of filters) query = Array.isArray(filter.value) ? query.in(filter.column, filter.value) : query.eq(filter.column, filter.value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export function countRows(db: SupabaseClient, table: string, dateColumn: string, range: DateRange, filters: Array<{ column: string; value: string | string[] }> = []) {
  return countQuery(db, table, dateColumn, range, filters);
}

export async function sumRows(db: SupabaseClient, table: string, field: string, dateColumn: string, range: DateRange, filters: Array<{ column: string; value: string | string[] }> = []): Promise<number> {
  let query = db.from(table).select(field).gte(dateColumn, `${range.from}T00:00:00Z`).lt(dateColumn, `${range.to}T00:00:00Z`);
  for (const filter of filters) query = Array.isArray(filter.value) ? query.in(filter.column, filter.value) : query.eq(filter.column, filter.value);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reduce((total: number, row: Record<string, unknown>) => total + Number(row[field] ?? 0), 0);
}

export async function fetchRows(db: SupabaseClient, table: string, fields: string, dateColumn: string, range: DateRange) {
  const { data, error } = await db.from(table).select(fields).gte(dateColumn, `${range.from}T00:00:00Z`).lt(dateColumn, `${range.to}T00:00:00Z`);
  if (error) throw error;
  return data ?? [];
}

export function dayKey(value: string): string {
  return value.slice(0, 10);
}

export function groupByDay<T extends Record<string, unknown>>(rows: T[], dateField: string, valueField: string): Array<{ date: string; value: number }> {
  const grouped = new Map<string, number>();
  for (const row of rows) {
    const date = typeof row[dateField] === "string" ? dayKey(row[dateField] as string) : "unknown";
    if (date === "unknown") continue;
    grouped.set(date, (grouped.get(date) ?? 0) + Number(row[valueField] ?? 0));
  }
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
}

export function groupCountByDay<T extends Record<string, unknown>>(rows: T[], dateField: string): Array<{ date: string; value: number }> {
  const grouped = new Map<string, number>();
  for (const row of rows) {
    const date = typeof row[dateField] === "string" ? dayKey(row[dateField] as string) : "unknown";
    if (date === "unknown") continue;
    grouped.set(date, (grouped.get(date) ?? 0) + 1);
  }
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
}
