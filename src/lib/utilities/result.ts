/**
 * A consistent success/failure shape for service functions and the Server
 * Actions that call them. Keeping errors as data (not thrown exceptions)
 * means a Server Action can return a typed, field-aware error to a form
 * without a try/catch at every call site, and without ever leaking a raw
 * exception message (which might contain internal detail) to the client.
 */
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(error: string, fieldErrors?: Record<string, string>): ServiceResult<T> {
  return { ok: false, error, fieldErrors };
}
