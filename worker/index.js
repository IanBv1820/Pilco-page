/* Worker de la página: sirve los archivos estáticos y además
   - "/" sale con el catálogo en vivo del cargador (/admin); si la base falla, sale la copia de index.html
   - /api/sesion y /api/familias para el cargador (con clave) */
import { json, crearSesion, cerrarSesion, sesionValida, claveCorrecta, asegurarTabla } from "../lib/sesion.js";

const INI = "/* CATALOGO-INICIO", FIN = "/* CATALOGO-FIN */";

function fecha(iso){
  const d = new Date(new Date(iso).getTime() - 5 * 3600e3); /* hora de Ecuador */
  const p = n => String(n).padStart(2, "0");
  return p(d.getUTCDate()) + "/" + p(d.getUTCMonth() + 1) + "/" + d.getUTCFullYear();
}

async function inicio(request, env){
  const res = await env.ASSETS.fetch(request);
  if(!env.DB || !res.ok || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  try{
    const { results } = await env.DB.prepare("SELECT pub, publicado FROM fams WHERE pub IS NOT NULL ORDER BY orden, id").all();
    if(!results || !results.length) return res;
    const html = await res.text();
    const a = html.indexOf(INI), b = html.indexOf(FIN);
    if(a < 0 || b < a) return new Response(html, res);
    let max = "";
    results.forEach(r => { if(r.publicado && r.publicado > max) max = r.publicado; });
    const bloque = INI + " — en vivo desde el cargador (/admin). */\n  var CATALOGO_FECHA = " + JSON.stringify(max ? fecha(max) : "") +
      ";\n  var CATALOGO = [\n    " + results.map(r => r.pub.replace(/<\//g, "<\\/")).join(",\n    ") + "\n  ];\n  ";
    const out = new Response(html.slice(0, a) + bloque + html.slice(b), res);
    out.headers.set("cache-control", "no-cache");
    out.headers.delete("etag");
    return out;
  }catch(e){
    return res;
  }
}

async function sesion(request, env){
  if(request.method === "GET") return json({ok: await sesionValida(request, env), configurado: !!(env.CLAVE_CARGADOR && env.DB)});
  if(request.method === "DELETE") return json({ok: true}, 200, {"set-cookie": cerrarSesion()});
  if(request.method === "POST"){
    let body = {}; try{ body = await request.json(); }catch(e){}
    if(!(await claveCorrecta(env, body.clave))){
      await new Promise(r => setTimeout(r, 800));
      return json({ok: false, error: "Clave incorrecta"}, 401);
    }
    return json({ok: true}, 200, {"set-cookie": await crearSesion(env)});
  }
  return json({error: "Método no permitido"}, 405);
}

async function familias(request, env, resto){
  if(!env.DB) return json({error: "Falta la base de datos (DB) en Cloudflare"}, 500);
  if(!(await sesionValida(request, env))) return json({error: "Inicia sesión"}, 401);
  await asegurarTabla(env.DB);
  const m = request.method;

  if(resto === "" && m === "GET"){
    const { results } = await env.DB.prepare("SELECT id, doc FROM fams ORDER BY orden, id").all();
    return json(results.map(r => Object.assign(JSON.parse(r.doc), {id: r.id})));
  }

  if(resto === "importar" && m === "POST"){
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM fams").first("n");
    if(n > 0) return json({error: "La base ya tiene productos"}, 409);
    let rows; try{ rows = await request.json(); }catch(e){ return json({error: "Archivo inválido"}, 400); }
    if(!Array.isArray(rows) || !rows.length || rows.some(r => !r || !/^[A-Za-z0-9_-]{1,80}$/.test(r.id) || typeof r.doc !== "object")) return json({error: "Archivo inválido"}, 400);
    const st = env.DB.prepare("INSERT INTO fams (id, doc, pub, orden, publicado) VALUES (?1, ?2, ?3, ?4, ?5)");
    await env.DB.batch(rows.map((r, i) => st.bind(r.id, JSON.stringify(r.doc), r.pub ? JSON.stringify(r.pub) : null, r.orden || i + 1, r.publicado || new Date().toISOString())));
    return json({ok: true, n: rows.length});
  }

  const id = decodeURIComponent(resto);
  if(!/^[A-Za-z0-9_-]{1,80}$/.test(id)) return json({error: "No encontrado"}, 404);
  if(m === "PUT"){
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
  if(m === "DELETE"){
    await env.DB.prepare("DELETE FROM fams WHERE id = ?1").bind(id).run();
    return json({ok: true});
  }
  return json({error: "Método no permitido"}, 405);
}

export default {
  async fetch(request, env){
    const url = new URL(request.url), p = url.pathname;
    try{
      if(p === "/" || p === "/index.html") return request.method === "GET" ? await inicio(request, env) : env.ASSETS.fetch(request);
      if(p === "/api/sesion") return await sesion(request, env);
      if(p === "/api/familias" || p.startsWith("/api/familias/")) return await familias(request, env, p.slice("/api/familias".length).replace(/^\//, ""));
    }catch(e){
      return json({error: "Error del servidor"}, 500);
    }
    return env.ASSETS.fetch(request);
  }
};
