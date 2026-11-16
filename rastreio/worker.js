// Rastreio de visualização da prévia (Cloudflare Worker + KV).
// Bindings necessários: KV namespace com o nome VIEWS, e um Secret chamado TOKEN.
// Não guarda IP nem dados pessoais: só o horário de cada abertura e se foi no celular.

const ALLOW = ['https://gabrielmachado01gg.github.io', 'http://localhost:8765'];
// Robôs de pré-visualização (WhatsApp, Facebook, etc.) não contam como visualização.
const BOT = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|slack|telegram|discord|skype|embedly|linkedin|pinterest|curl|wget|python|axios|node-fetch/i;

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '';
    const cors = ALLOW.includes(origin)
      ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' }
      : {};
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const p = url.pathname;
    if (p.startsWith('/p/')) return visit(req, env, p.slice(3));

    if (p.startsWith('/api/')) {
      if (!env.TOKEN || req.headers.get('Authorization') !== 'Bearer ' + env.TOKEN) return json({ error: 'unauthorized' }, 401, cors);

      if (p === '/api/ping') return json({ ok: true }, 200, cors);

      if (p === '/api/links' && req.method === 'POST') {
        let body; try { body = await req.json(); } catch { return json({ error: 'json inválido' }, 400, cors); }
        const slug = String(body.slug || ''), target = String(body.url || '');
        if (!/^[a-z0-9]{6,16}$/.test(slug)) return json({ error: 'slug inválido' }, 400, cors);
        if (!/^https:\/\//i.test(target)) return json({ error: 'o endereço da prévia precisa começar com https://' }, 400, cors);
        await env.VIEWS.put('link:' + slug, JSON.stringify({ url: target }));
        return json({ ok: true }, 200, cors);
      }

      if (p === '/api/views') {
        const list = await env.VIEWS.list({ prefix: 'v:' });
        const out = {};
        await Promise.all(list.keys.map(async k => { out[k.name.slice(2)] = (await env.VIEWS.get(k.name, 'json')) || []; }));
        return json(out, 200, cors);
      }
    }
    return new Response('Rastreio ativo.', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
};

async function visit(req, env, slug) {
  const rec = await env.VIEWS.get('link:' + slug, 'json');
  if (!rec) return new Response('Link não encontrado.', { status: 404 });
  const ua = req.headers.get('User-Agent') || '';

  if (BOT.test(ua) || req.method === 'HEAD') {
    // Cartão simples para a pré-visualização do link no WhatsApp, sem contar visita.
    return new Response('<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Prévia do seu site</title>' +
      '<meta property="og:title" content="Prévia do seu site"><meta property="og:description" content="Toque para ver como o site poderia ficar.">',
      { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }

  const key = 'v:' + slug;
  const arr = (await env.VIEWS.get(key, 'json')) || [];
  const now = Date.now(), last = arr[arr.length - 1];
  if (!last || now - last.t > 30000) { // ignora recargas em menos de 30 segundos
    arr.push({ t: now, m: /Mobile|Android|iPhone/i.test(ua) ? 1 : 0 });
    await env.VIEWS.put(key, JSON.stringify(arr.slice(-50)));
  }
  return new Response(null, { status: 302, headers: { Location: rec.url, 'cache-control': 'no-store' } });
}
