import { json } from "../../../lib/sesion.js";
/* POST [{id, doc, pub, orden, publicado}]: carga inicial del catálogo (solo si la base está vacía) */
export async function onRequestPost({request, env}){
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM fams").first("n");
  if(n > 0) return json({error: "La base ya tiene productos"}, 409);
  let rows; try{ rows = await request.json(); }catch(e){ return json({error: "Archivo inválido"}, 400); }
  if(!Array.isArray(rows) || !rows.length || rows.some(r => !r || !/^[A-Za-z0-9_-]{1,80}$/.test(r.id) || typeof r.doc !== "object")) return json({error: "Archivo inválido"}, 400);
  const st = env.DB.prepare("INSERT INTO fams (id, doc, pub, orden, publicado) VALUES (?1, ?2, ?3, ?4, ?5)");
  await env.DB.batch(rows.map((r, i) => st.bind(r.id, JSON.stringify(r.doc), r.pub ? JSON.stringify(r.pub) : null, r.orden || i + 1, r.publicado || new Date().toISOString())));
  return json({ok: true, n: rows.length});
}
