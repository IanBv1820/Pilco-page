/* ───────── Configuración ─────────
   Escribe aquí el WhatsApp del negocio con código de país, solo dígitos
   (ej. "5215512345678"). Si se deja vacío, WhatsApp pedirá elegir el contacto. */
const WHATSAPP_NUMBER = "";

const CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "vasos", label: "Vasos" },
  { id: "platos", label: "Platos" },
  { id: "cubiertos", label: "Cubiertos" },
  { id: "contenedores", label: "Contenedores" },
  { id: "bolsas", label: "Bolsas" },
];

const PRODUCTS = [
  { id: "v1", cat: "vasos", name: "Vaso PP 7 oz", mat: "PP", pack: "Caja ×1000" },
  { id: "v2", cat: "vasos", name: "Vaso cristal PET 12 oz", mat: "PET", pack: "Caja ×1000" },
  { id: "v3", cat: "vasos", name: "Vaso PET 16 oz con tapa domo", mat: "PET", pack: "Caja ×500" },
  { id: "v4", cat: "vasos", name: "Vaso compostable 10 oz", mat: "PLA", pack: "Caja ×1000" },
  { id: "p1", cat: "platos", name: "Plato hondo 6\"", mat: "PS", pack: "Caja ×500" },
  { id: "p2", cat: "platos", name: "Plato llano 9\"", mat: "PP", pack: "Caja ×500" },
  { id: "p3", cat: "platos", name: "Plato con 3 divisiones 10\"", mat: "PP", pack: "Caja ×400" },
  { id: "c1", cat: "cubiertos", name: "Tenedor mediano", mat: "PS", pack: "Caja ×1000" },
  { id: "c2", cat: "cubiertos", name: "Cuchara sopera", mat: "PS", pack: "Caja ×1000" },
  { id: "c3", cat: "cubiertos", name: "Cuchillo reforzado", mat: "PP", pack: "Caja ×1000" },
  { id: "c4", cat: "cubiertos", name: "Kit cubiertos con servilleta", mat: "PP", pack: "Caja ×250" },
  { id: "k1", cat: "contenedores", name: "Contenedor bisagra 8×8\"", mat: "PP", pack: "Caja ×200" },
  { id: "k2", cat: "contenedores", name: "Envase redondo 16 oz con tapa", mat: "PP", pack: "Caja ×500" },
  { id: "k3", cat: "contenedores", name: "Bandeja cristal para repostería", mat: "PET", pack: "Caja ×300" },
  { id: "k4", cat: "contenedores", name: "Portacomida 3 divisiones", mat: "PP", pack: "Caja ×150" },
  { id: "b1", cat: "bolsas", name: "Bolsa tipo camiseta mediana", mat: "PEAD", pack: "Bulto ×25 kg" },
  { id: "b2", cat: "bolsas", name: "Bolsa en rollo natural", mat: "PEAD", pack: "Rollo ×1 kg" },
  { id: "b3", cat: "bolsas", name: "Bolsa hermética con cierre", mat: "PEBD", pack: "Caja ×1000" },
];

const MATERIALS = [
  { id: "PP", code: 5, name: "Polipropileno", desc: "Resistente al calor y a las grasas. Es el material de los envases para llevar comida caliente y el único de la lista apto para recalentar en microondas.", heat: 0.9, clear: 0.45, rigid: 0.7, use: "Sopas, guisados, comida para llevar" },
  { id: "PET", code: 1, name: "Tereftalato de polietileno", desc: "Transparencia tipo cristal que deja ver el producto. Rígido y ligero; pensado para alimentos y bebidas fríos. El plástico que más se recicla.", heat: 0.3, clear: 1, rigid: 0.75, use: "Bebidas frías, ensaladas, repostería" },
  { id: "PS", code: 6, name: "Poliestireno", desc: "Rígido, ligero y económico. Mantiene su forma en cubiertos y platos, pero no debe usarse en microondas ni con líquidos muy calientes.", heat: 0.4, clear: 0.6, rigid: 0.9, use: "Cubiertos, platos, eventos" },
  { id: "PLA", code: 7, name: "Ácido poliláctico", desc: "Bioplástico de origen vegetal, compostable en instalaciones industriales. Luce como PET, pero es solo para uso en frío.", heat: 0.2, clear: 0.9, rigid: 0.6, use: "Bebidas frías, marcas con enfoque sustentable" },
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ───────── Estado de cotización ───────── */
const STORE_KEY = "pilco-cotizacion";
let cart = {};
try { cart = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { cart = {}; }
const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch { /* sin almacenamiento */ } };
const byId = (id) => PRODUCTS.find((p) => p.id === id);

/* ───────── Toast ───────── */
const toastEl = $("#toast");
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

/* ───────── Catálogo ───────── */
const grid = $("#grid");
const filters = $("#filters");

filters.innerHTML = CATEGORIES.map((c, i) =>
  `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${i === 0}">${c.label}</button>`).join("");

grid.innerHTML = PRODUCTS.map((p, i) => `
  <article class="card reveal" data-cat="${p.cat}" style="--i:${i % 4}; view-transition-name: card-${p.id}">
    <div class="card-art"><svg aria-hidden="true"><use href="#i-${p.cat}"/></svg></div>
    <p class="card-meta"><span>${p.mat}</span><span>${p.pack}</span></p>
    <h3>${p.name}</h3>
    <button class="add" type="button" data-id="${p.id}"><span class="add-label">Agregar</span><span class="pm" aria-hidden="true">+</span></button>
  </article>`).join("");

function applyFilter(cat) {
  $$(".chip", filters).forEach((b) => b.setAttribute("aria-pressed", b.dataset.cat === cat));
  $$(".card", grid).forEach((c) => {
    c.hidden = cat !== "todos" && c.dataset.cat !== cat;
    c.classList.add("in");
  });
}
filters.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn || btn.getAttribute("aria-pressed") === "true") return;
  if (document.startViewTransition && !reduceMotion) document.startViewTransition(() => applyFilter(btn.dataset.cat));
  else applyFilter(btn.dataset.cat);
});

grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add");
  if (!btn) return;
  const p = byId(btn.dataset.id);
  cart[p.id] = (cart[p.id] || 0) + 1;
  save(); renderCart(true);
  toast(`Agregado: ${p.name}`);
});

if (finePointer) {
  grid.addEventListener("pointermove", (e) => {
    const art = e.target.closest(".card")?.querySelector(".card-art");
    if (!art) return;
    const r = art.getBoundingClientRect();
    art.style.setProperty("--mx", `${e.clientX - r.left}px`);
    art.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
}

/* ───────── Cotización ───────── */
const itemsEl = $("#quoteItems");
const emptyEl = $("#quoteEmpty");
const navCount = $("#navCount");
const totalEl = $("#quoteTotal");
const formMsg = $("#formMsg");

function renderCart(bump) {
  const ids = Object.keys(cart).filter((id) => byId(id) && cart[id] > 0);
  const units = ids.reduce((n, id) => n + cart[id], 0);
  const existing = new Set($$(".qi", itemsEl).map((li) => li.dataset.id));

  $$(".qi", itemsEl).forEach((li) => { if (!ids.includes(li.dataset.id)) li.remove(); });
  ids.forEach((id) => {
    const p = byId(id);
    if (!existing.has(id)) {
      itemsEl.insertAdjacentHTML("beforeend", `
        <li class="qi" data-id="${id}">
          <span class="qi-name">${p.name}<small>${p.mat} · ${p.pack}</small></span>
          <span class="stepper">
            <button type="button" data-act="dec" aria-label="Quitar una unidad de ${p.name}">−</button>
            <output aria-label="Cantidad"></output>
            <button type="button" data-act="inc" aria-label="Agregar una unidad de ${p.name}">+</button>
          </span>
          <button class="qi-del" type="button" data-act="del" aria-label="Eliminar ${p.name}">×</button>
        </li>`);
    }
    $(`.qi[data-id="${id}"] output`, itemsEl).textContent = cart[id];
  });

  emptyEl.hidden = ids.length > 0;
  totalEl.textContent = ids.length ? `${units} ${units === 1 ? "unidad" : "unidades"}` : "";
  navCount.textContent = units;
  if (bump && !reduceMotion) { navCount.classList.remove("bump"); void navCount.offsetWidth; navCount.classList.add("bump"); }
  if (ids.length) { formMsg.textContent = ""; }

  $$(".add", grid).forEach((b) => {
    const n = cart[b.dataset.id] || 0;
    b.classList.toggle("added", n > 0);
    $(".add-label", b).textContent = n > 0 ? `En cotización · ${n}` : "Agregar";
  });
}

itemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.closest(".qi").dataset.id;
  if (btn.dataset.act === "inc") cart[id]++;
  if (btn.dataset.act === "dec") cart[id]--;
  if (btn.dataset.act === "del" || cart[id] <= 0) delete cart[id];
  save(); renderCart(true);
});

function buildMessage() {
  const f = new FormData($("#quoteForm"));
  const lines = Object.keys(cart).filter(byId).map((id) => {
    const p = byId(id);
    return `• ${cart[id]} × ${p.name} (${p.mat}, ${p.pack})`;
  });
  if (!lines.length) return null;
  const extra = [
    f.get("name")?.trim() && `Nombre: ${f.get("name").trim()}`,
    f.get("city")?.trim() && `Ciudad: ${f.get("city").trim()}`,
    f.get("notes")?.trim() && `Notas: ${f.get("notes").trim()}`,
  ].filter(Boolean);
  return ["Hola, quiero cotizar:", ...lines, ...(extra.length ? ["", ...extra] : [])].join("\n");
}
function needItems() {
  formMsg.classList.remove("ok");
  formMsg.textContent = "Agrega al menos un producto del catálogo para armar tu cotización.";
}

$("#quoteForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = buildMessage();
  if (!msg) return needItems();
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});
$("#copyBtn").addEventListener("click", async () => {
  const msg = buildMessage();
  if (!msg) return needItems();
  try {
    await navigator.clipboard.writeText(msg);
    toast("Pedido copiado al portapapeles");
  } catch {
    formMsg.classList.remove("ok");
    formMsg.textContent = "No pudimos copiar automáticamente. Usa «Enviar por WhatsApp» para compartir tu pedido.";
  }
});

/* ───────── Materiales (tabs) ───────── */
const matTabs = $("#matTabs");
const matPanel = $("#matPanel");
matTabs.innerHTML = MATERIALS.map((m, i) =>
  `<button class="tab" role="tab" type="button" id="tab-${m.id}" aria-controls="matPanel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${m.id}<small>Código ${m.code}</small></button>`).join("");

function showMaterial(i, animate) {
  const m = MATERIALS[i];
  $$(".tab", matTabs).forEach((t, j) => { t.setAttribute("aria-selected", j === i); t.tabIndex = j === i ? 0 : -1; });
  matPanel.setAttribute("aria-labelledby", `tab-${m.id}`);
  $("#matNum").textContent = m.code;
  $("#matName").textContent = m.name;
  $("#matDesc").textContent = m.desc;
  $("#matUse").textContent = m.use;
  const meters = $("#matMeters");
  if (!meters.children.length) {
    meters.innerHTML = ["Resistencia al calor", "Transparencia", "Rigidez"].map((t) => `<div><dt>${t}</dt><dd><span></span></dd></div>`).join("");
  }
  [m.heat, m.clear, m.rigid].forEach((v, k) => meters.children[k].querySelector("span").style.setProperty("--v", v));
  if (animate && !reduceMotion) { matPanel.classList.remove("swap"); void matPanel.offsetWidth; matPanel.classList.add("swap"); }
}
matTabs.addEventListener("click", (e) => {
  const t = e.target.closest(".tab");
  if (t) showMaterial($$(".tab", matTabs).indexOf(t), true);
});
matTabs.addEventListener("keydown", (e) => {
  const tabs = $$(".tab", matTabs);
  const i = tabs.indexOf(document.activeElement);
  const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (i < 0 || !dir) return;
  e.preventDefault();
  const n = (i + dir + tabs.length) % tabs.length;
  tabs[n].focus(); showMaterial(n, true);
});

/* ───────── Scroll: nav, progreso, riel ───────── */
const nav = $("#nav");
const bar = $("#progressBar");
const steps = $("#steps");
const railFill = $("#railFill");
const navLinks = $("#navLinks");
const menuBtn = $("#menuBtn");
let lastY = 0, ticking = false;

function onScroll() {
  const y = scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  nav.classList.toggle("scrolled", y > 12);
  const menuOpen = navLinks.classList.contains("open");
  nav.classList.toggle("hidden", !menuOpen && y > 400 && y > lastY);
  lastY = y;

  const r = steps.getBoundingClientRect();
  const p = (innerHeight * 0.6 - r.top) / r.height;
  railFill.style.transform = `scaleY(${Math.min(1, Math.max(0, p))})`;
  ticking = false;
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener("resize", onScroll);

/* ───────── Menú móvil ───────── */
function setMenu(open) {
  navLinks.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}
menuBtn.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
navLinks.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && navLinks.classList.contains("open")) { setMenu(false); menuBtn.focus(); } });

/* ───────── Parallax del hero ───────── */
const heroArt = $("#heroArt");
if (finePointer && !reduceMotion) {
  const layers = $$(".px", heroArt);
  $(".hero").addEventListener("pointermove", (e) => {
    const r = heroArt.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
    const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
    layers.forEach((l) => {
      const d = +l.dataset.depth;
      l.style.setProperty("--px", `${(-dx * d).toFixed(1)}px`);
      l.style.setProperty("--py", `${(-dy * d).toFixed(1)}px`);
    });
  });
}

/* ───────── Reveal al hacer scroll ───────── */
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$(".reveal").forEach((el) => io.observe(el));
} else {
  $$(".reveal").forEach((el) => el.classList.add("in"));
}

/* ───────── Inicio ───────── */
$("#year").textContent = new Date().getFullYear();
showMaterial(0, false);
renderCart(false);
onScroll();
