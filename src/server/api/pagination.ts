import { NextResponse } from "next/server";
import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Query parameters shared by every list endpoint. Extend it for filters. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export type PaginationParams = z.output<typeof paginationQuerySchema>;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedBody<T> = { data: T[]; pagination: PaginationMeta };

/** Converts page parameters to Prisma's `skip` and `take`. */
export function toSkipTake({ page, pageSize }: PaginationParams) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function buildPaginationMeta(
  { page, pageSize }: PaginationParams,
  total: number,
): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

export function paginated<T>(
  items: T[],
  params: PaginationParams,
  total: number,
) {
  return NextResponse.json<PaginatedBody<T>>({
    data: items,
    pagination: buildPaginationMeta(params, total),
  });
}
