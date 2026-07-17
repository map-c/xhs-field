import { FieldExecuteCode } from 'dingtalk-docs-cool-app';
import {
  API_VERSION,
  SERVICE_AUTHORIZATION_ID,
  SERVICE_BASE_URL,
} from './service-config';

export type HumanizeIntensity = 'light' | 'balanced' | 'strong';

export interface FieldFormData {
  sourceText: unknown;
  intensity?: unknown;
}

export interface FieldFetchContext {
  fetch(
    url: string,
    options?: Record<string, unknown>,
    authorizationId?: string,
  ): Promise<{
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
  }>;
}

interface ApiSuccessResponse {
  ok: true;
  requestId: string;
  data: { value: string };
}

type FieldExecutionResult =
  | { code: FieldExecuteCode.Success; data: string }
  | {
      code: Exclude<FieldExecuteCode, FieldExecuteCode.Success>;
      msg?: string;
      errorMessage?: string;
    };

export async function executeXhsHumanizeField(
  context: FieldFetchContext,
  formData: FieldFormData,
): Promise<FieldExecutionResult> {
  const sourceText = normalizeSourceText(formData.sourceText);
  if (!sourceText || sourceText.length < 50 || sourceText.length > 8_000) {
    return {
      code: FieldExecuteCode.InvalidArgument,
      errorMessage: 'invalidSourceText',
      msg: `sourceText must contain 50 to 8000 characters; received ${describeSourceText(formData.sourceText)}; formData=${describeValueShape(formData)}`,
    };
  }

  const intensity = normalizeIntensity(formData.intensity);
  if (!intensity) {
    return {
      code: FieldExecuteCode.InvalidArgument,
      errorMessage: 'invalidIntensity',
      msg: `intensity must be light, balanced, or strong; received ${describeValueShape(formData.intensity)}`,
    };
  }

  try {
    const response = await context.fetch(
      `${SERVICE_BASE_URL}/v1/tools/xhs-humanize-rewrite`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          version: API_VERSION,
          input: { text: sourceText },
          options: { language: 'zh-CN', intensity },
        }),
      },
      SERVICE_AUTHORIZATION_ID,
    );
    const payload = await readJson(response);

    if (response.ok && isSuccessResponse(payload)) {
      return { code: FieldExecuteCode.Success, data: payload.data.value };
    }

    return mapApiError(response.status, payload);
  } catch (error) {
    return {
      code: FieldExecuteCode.Error,
      errorMessage: 'serviceUnavailable',
      msg: error instanceof Error ? error.message : 'unknown field error',
    };
  }
}

function normalizeSourceText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (isRecord(value) && typeof value.markdown === 'string') {
    return value.markdown.trim();
  }

  return undefined;
}

function normalizeIntensity(value: unknown): HumanizeIntensity | undefined {
  if (value === undefined || value === null || value === '') {
    return 'balanced';
  }

  return value === 'light' || value === 'balanced' || value === 'strong'
    ? value
    : undefined;
}

function describeSourceText(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return `array(length=${value.length}, first=${describeValueShape(first)})`;
  }
  return describeValueShape(value);
}

function describeValueShape(value: unknown): string {
  if (!isRecord(value)) {
    return typeof value;
  }

  const entries = Object.entries(value)
    .slice(0, 10)
    .map(([key, item]) => `${key}:${Array.isArray(item) ? 'array' : typeof item}`);
  return `object(${entries.join(',')})`;
}

async function readJson(response: {
  json(): Promise<unknown>;
}): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function isSuccessResponse(value: unknown): value is ApiSuccessResponse {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data)) {
    return false;
  }
  return (
    typeof value.requestId === 'string' &&
    typeof value.data.value === 'string' &&
    value.data.value.length > 0
  );
}

function mapApiError(
  status: number,
  payload: unknown,
): FieldExecutionResult {
  const apiError = isRecord(payload) ? payload : undefined;
  const error = isRecord(apiError?.error) ? apiError.error : undefined;
  const code = typeof error?.code === 'string' ? error.code : undefined;
  const requestId =
    typeof apiError?.requestId === 'string' ? apiError.requestId : undefined;
  const msg = `service status=${status}, code=${code ?? 'UNKNOWN'}, requestId=${requestId ?? 'unknown'}`;

  if (status === 400 || code === 'INVALID_INPUT') {
    return {
      code: FieldExecuteCode.InvalidArgument,
      errorMessage: 'invalidSourceText',
      msg,
    };
  }
  if (status === 401 || status === 403 || code === 'UNAUTHORIZED') {
    return {
      code: FieldExecuteCode.AuthorizationError,
      errorMessage: 'serviceUnauthorized',
      msg,
    };
  }
  if (status === 429 || code === 'RATE_LIMITED') {
    return {
      code: FieldExecuteCode.RateLimit,
      errorMessage: 'serviceRateLimited',
      msg,
    };
  }
  if (status === 402 || code === 'QUOTA_EXHAUSTED') {
    return {
      code: FieldExecuteCode.QuotaExhausted,
      errorMessage: 'serviceQuotaExhausted',
      msg,
    };
  }
  if (status === 504 || code === 'MODEL_TIMEOUT') {
    return {
      code: FieldExecuteCode.Error,
      errorMessage: 'serviceTimeout',
      msg,
    };
  }
  if (code === 'INVALID_MODEL_OUTPUT') {
    return {
      code: FieldExecuteCode.Error,
      errorMessage: 'invalidModelOutput',
      msg,
    };
  }
  if (status === 502 || status === 503 || code === 'MODEL_UNAVAILABLE') {
    return {
      code: FieldExecuteCode.Error,
      errorMessage: 'modelUnavailable',
      msg,
    };
  }
  return {
    code: FieldExecuteCode.Error,
    errorMessage: 'serviceUnavailable',
    msg,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
