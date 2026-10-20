// Next.js llama a register() una vez al arrancar el servidor y espera a que
// termine antes de atender peticiones.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { actualizarBaseDatos } = await import("@/lib/actualizarBaseDatos");
  await actualizarBaseDatos();
}
