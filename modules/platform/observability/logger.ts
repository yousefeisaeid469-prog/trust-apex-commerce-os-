export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, string | number | boolean | null | undefined>;

const REDACT = /(authorization|cookie|password|token|secret|api[-_]?key|signature)/i;
function sanitize(context: LogContext = {}) {
  return Object.fromEntries(Object.entries(context).map(([k,v]) => [k, REDACT.test(k) ? "[REDACTED]" : v]));
}

export function log(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = { ts: new Date().toISOString(), level, message, ...sanitize(context) };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line); else if (level === "warn") console.warn(line); else console.log(line);
}
export const logger = { debug:(m:string,c?:LogContext)=>log("debug",m,c), info:(m:string,c?:LogContext)=>log("info",m,c), warn:(m:string,c?:LogContext)=>log("warn",m,c), error:(m:string,c?:LogContext)=>log("error",m,c) };
