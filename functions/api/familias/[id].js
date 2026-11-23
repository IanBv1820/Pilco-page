import { json } from "../../../lib/sesion.js";
/* PUT {doc, pub}: guarda una familia y su versión para la página · DELETE: la borra */
export async function onRequestPut({request, env, params}){
  const id = String(params.id || "");
  if(!/^[A-Za-z0-9_-]{1,80}$/.test(id)) return json({error: "id inválido"}, 400);
  let b; try{ b = await request.json(); }catch(e){ return json({error: "JSON inválido"}, 400); }
  if(!b || typeof b.doc !== "object" || !b.doc) return json({error: "Falta doc"}, 400);
  const doc = JSON.stringify(b.doc), pub = b.pub ? JSON.stringify(Object.assign({}, b.pub, {id})) : null;
  if(doc.length > 500000) return json({error: "Familia demasiado grande"}, 413);
  const ahora = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO fams (id, doc, pub, orden, publicado) VALUES (?1, ?2, ?3, (SELECT COALESCE(MAX(orden), 0) + 1 FROM fams), ?4) " +
    "ON CONFLICT(id) DO UPDATE SET doc = excluded.doc, pub = excluded.pub, publicado = excluded.publicado"
  ).bind(id, doc, pub, ahora).run();
  return json({ok: true, publicado: ahora});
}
export async function onRequestDelete({env, params}){
  await env.DB.prepare("DELETE FROM fams WHERE id = ?1").bind(String(params.id || "")).run();
  return json({ok: true});
}
