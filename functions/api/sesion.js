import { json, crearSesion, cerrarSesion, sesionValida, claveCorrecta } from "../../lib/sesion.js";

/* GET: ¿hay sesión? · POST {clave}: entrar · DELETE: salir */
export async function onRequestGet({request, env}){
  return json({ok: await sesionValida(request, env), configurado: !!(env.CLAVE_CARGADOR && env.DB)});
}
export async function onRequestPost({request, env}){
  let body = {}; try{ body = await request.json(); }catch(e){}
  if(!(await claveCorrecta(env, body.clave))){
    await new Promise(r => setTimeout(r, 800));
    return json({ok: false, error: "Clave incorrecta"}, 401);
  }
  return json({ok: true}, 200, {"set-cookie": await crearSesion(env)});
}
export async function onRequestDelete(){
  return json({ok: true}, 200, {"set-cookie": cerrarSesion()});
}
