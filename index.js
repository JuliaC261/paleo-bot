// Paleo Bot — versão para Cloudflare Workers (comandos slash via HTTP)

const SITIOS = {
  "Formação Morrison": ["Torvosaurus t.", "Brachiosaurus", "Dryosaurus", "Camarasaurus", "Apatosaurus"],
  "Formação Huincul": ["Argentinossauro Huinculensis"],
  "Formação Kayenta": ["Dilofossauro"],
};

const COMANDOS = [
  { name: "fossil", description: "Escave fósseis em um sítio paleontológico", type: 1 },
];

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

const hexToBytes = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map((b) => parseInt(b, 16)));

async function assinaturaValida(request, body, publicKey) {
  const sig = request.headers.get("x-signature-ed25519");
  const ts = request.headers.get("x-signature-timestamp");
  if (!sig || !ts) return false;
  try {
    const key = await crypto.subtle.importKey("raw", hexToBytes(publicKey), { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify("Ed25519", key, hexToBytes(sig), new TextEncoder().encode(ts + body));
  } catch {
    return false;
  }
}

function menuSitios() {
  return {
    type: 4, // responde com mensagem
    data: {
      content: "**Escolha um sítio paleontológico para escavar:**",
      components: [{
        type: 1,
        components: [{
          type: 3, // menu de seleção
          custom_id: "escolher_sitio",
          placeholder: "Escolha um sítio",
          options: Object.keys(SITIOS).map((s) => ({ label: s, value: s })),
        }],
      }],
    },
  };
}

function escavar(sitio) {
  const numero = Math.floor(Math.random() * 6); // 0 a 5
  const lista = SITIOS[sitio];
  const fossil = lista[Math.floor(Math.random() * lista.length)];
  const mensagem = numero === 0
    ? "Infelizmente, você não conseguiu escavar nenhum fóssil dessa vez."
    : `Você escavou **${numero}** fósseis de **${fossil}**`;
  return {
    type: 7, // edita a mensagem original
    data: {
      content: "",
      embeds: [{
        description: `Sítio Paleontológico: ${sitio}\n${mensagem}`,
        color: numero === 0 ? 0xe74c3c : 0xbbc167,
      }],
      components: [], // remove o menu
    },
  };
}

async function registrarComandos(env) {
  const r = await fetch(`https://discord.com/api/v10/applications/${env.DISCORD_APPLICATION_ID}/commands`, {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bot ${env.DISCORD_TOKEN}` },
    body: JSON.stringify(COMANDOS),
  });
  return new Response(r.ok ? "Comandos registrados! ✅" : `Erro ${r.status}: ${await r.text()}`, { status: r.status });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/register") return registrarComandos(env);
    if (request.method === "GET") return new Response("Paleo Bot online 🦕");
    if (request.method !== "POST") return new Response("Método não permitido", { status: 405 });

    const body = await request.text();
    if (!(await assinaturaValida(request, body, env.DISCORD_PUBLIC_KEY))) {
      return new Response("Assinatura inválida", { status: 401 });
    }

    const i = JSON.parse(body);
    if (i.type === 1) return json({ type: 1 }); // PING do Discord
    if (i.type === 2 && i.data.name === "fossil") return json(menuSitios());
    if (i.type === 3 && i.data.custom_id === "escolher_sitio") return json(escavar(i.data.values[0]));

    return json({ error: "Interação desconhecida" }, 400);
  },
};
