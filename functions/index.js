/* Inicio ("/"): sirve index.html con el catálogo en vivo del cargador (/admin).
   Si la base no está o falla, sale la copia que va dentro de index.html. */
const INI = "/* CATALOGO-INICIO", FIN = "/* CATALOGO-FIN */";

function fecha(iso){
  const d = new Date(new Date(iso).getTime() - 5 * 3600e3); /* hora de Ecuador */
  const p = n => String(n).padStart(2, "0");
  return p(d.getUTCDate()) + "/" + p(d.getUTCMonth() + 1) + "/" + d.getUTCFullYear();
}

export async function onRequestGet(ctx){
  const res = await ctx.next();
  const db = ctx.env.DB;
  if(!db || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  try{
    const { results } = await db.prepare("SELECT pub, publicado FROM fams WHERE pub IS NOT NULL ORDER BY orden, id").all();
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
    return out;
  }catch(e){
    return res; /* algo falló: se queda la copia de respaldo */
  }
}
