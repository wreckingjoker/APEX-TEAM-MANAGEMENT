export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Suppress the zlib.bytesRead DeprecationWarning from googleapis transitive deps.
    // Intercepting process.emitWarning prevents it reaching Node.js stderr and
    // Next.js's dev-mode browser console forwarder.
    const _emitWarning = process.emitWarning.bind(process);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).emitWarning = (warning: string | Error, ...args: unknown[]) => {
      const msg = typeof warning === "string" ? warning : warning?.message ?? "";
      if (msg.includes("zlib.bytesRead")) return;
      return (_emitWarning as (...a: unknown[]) => void)(warning, ...args);
    };
  }
}
