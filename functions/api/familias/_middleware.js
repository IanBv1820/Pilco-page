import { json, sesionValida, asegurarTabla } from "../../../lib/sesion.js";
/* todo /api/familias pide sesión */
export async function onRequest(ctx){
  if(!ctx.env.DB) return json({error: "Falta la base de datos (DB) en Cloudflare"}, 500);
  if(!(await sesionValida(ctx.request, ctx.env))) return json({error: "Inicia sesión"}, 401);
  await asegurarTabla(ctx.env.DB);
  return ctx.next();
}
