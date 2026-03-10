import { NextResponse } from "next/server";
import { z } from "zod";

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "INVALID_MBTI"
  | "INVALID_QUERY"
  | "MISSING_API_KEY"
  | "INVALID_RESPONSE"
  | "INVALID_JSON"
  | "UPSTREAM_ERROR"
  | "PROVIDER_VALIDATION_FAILED";

type LegacyFields = Record<string, unknown>;

type ResponseOptions = {
  headers?: HeadersInit;
  status?: number;
};

type SuccessOptions = ResponseOptions & {
  legacy?: LegacyFields;
};

type FailureOptions = ResponseOptions & {
  details?: unknown;
  legacy?: LegacyFields;
};

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: unknown };

export async function parseJsonWithSchema<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<ParseResult<z.infer<T>>> {
  try {
    const raw = await request.json();
    const data = schema.parse(raw);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error };
  }
}

function splitLegacyFields(legacy?: LegacyFields) {
  if (!legacy) {
    return {
      safeLegacy: undefined as LegacyFields | undefined,
      legacyError: undefined as unknown,
    };
  }

  if (!("error" in legacy)) {
    return { safeLegacy: legacy, legacyError: undefined as unknown };
  }

  const { error, ...rest } = legacy;

  return {
    safeLegacy: Object.keys(rest).length > 0 ? rest : undefined,
    legacyError: error,
  };
}

export function success<T>(data: T, options: SuccessOptions = {}) {
  const payload: Record<string, unknown> = {
    ok: true,
    data,
    ...(options.legacy ?? {}),
  };

  return NextResponse.json(payload, {
    status: options.status,
    headers: options.headers,
  });
}

export function failure(
  code: ApiErrorCode | string,
  message: string,
  status: number,
  options: FailureOptions = {},
) {
  const { safeLegacy, legacyError } = splitLegacyFields(options.legacy);

  const errorPayload: Record<string, unknown> = { code, message };
  if (options.details !== undefined) {
    errorPayload.details = options.details;
  }

  const payload: Record<string, unknown> = {
    ok: false,
    ...(safeLegacy ?? {}),
    error: errorPayload,
  };

  if (legacyError !== undefined) {
    payload.legacyError = legacyError;
  }

  return NextResponse.json(payload, {
    status,
    headers: options.headers,
  });
}
