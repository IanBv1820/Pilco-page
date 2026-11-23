const COOKIE = "pp_cargador", DIAS = 30;
const enc = new TextEncoder();

async function firma(clave, msg){
  const k = await crypto.subtle.importKey("raw", enc.encode(clave), {name: "HMAC", hash: "SHA-256"}, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, enc.encode(msg));
  return [...new Uint8Array(s)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function igual(a, b){ if(a.length !== b.length) return false; let x = 0; for(let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; }

export function json(data, status = 200, extra = {}){
  return new Response(JSON.stringify(data), {status, headers: {"content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra}});
}
export async function crearSesion(env){
  const hasta = Date.now() + DIAS * 864e5, msg = "v1." + hasta;
  const v = msg + "." + await firma(env.CLAVE_CARGADOR, msg);
  return COOKIE + "=" + v + "; Path=/; Max-Age=" + DIAS * 86400 + "; HttpOnly; Secure; SameSite=Strict";
}
export function cerrarSesion(){ return COOKIE + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict"; }
export async function sesionValida(req, env){
  if(!env.CLAVE_CARGADOR) return false;
  const c = (req.headers.get("cookie") || "").split(/;\s*/).find(x => x.startsWith(COOKIE + "="));
  if(!c) return false;
  const v = c.slice(COOKIE.length + 1), i = v.lastIndexOf(".");
  if(i < 0) return false;
  const msg = v.slice(0, i), hasta = +msg.split(".")[1];
  if(!(hasta > Date.now())) return false;
  return igual(v.slice(i + 1), await firma(env.CLAVE_CARGADOR, msg));
}
export async function claveCorrecta(env, clave){
  if(!env.CLAVE_CARGADOR || typeof clave !== "string") return false;
  const [a, b] = await Promise.all([firma("x", clave), firma("x", env.CLAVE_CARGADOR)]);
  return igual(a, b);
}

/* crea la tabla la primera vez (así no hay que correr SQL a mano en Cloudflare) */
let listo = false;
export async function asegurarTabla(db){
  if(listo) return;
  await db.prepare("CREATE TABLE IF NOT EXISTS fams (id TEXT PRIMARY KEY, doc TEXT NOT NULL, pub TEXT, orden INTEGER, publicado TEXT)").run();
  listo = true;
}
