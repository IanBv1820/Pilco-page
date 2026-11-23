import { json } from "../../../lib/sesion.js";
/* GET: todas las familias del cargador (completas, con mayorista: solo con sesión) */
export async function onRequestGet({env}){
  const { results } = await env.DB.prepare("SELECT id, doc FROM fams ORDER BY orden, id").all();
  return json(results.map(r => Object.assign(JSON.parse(r.doc), {id: r.id})));
}
