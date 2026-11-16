# Rastreio automático das prévias (Cloudflare, grátis)

Cada loja recebe um link próprio. Quando a pessoa abre, o painel marca "Visualizou" sozinho.
Os nomes dos menus da Cloudflare podem mudar um pouco; o caminho é sempre o mesmo.

## 1. Criar o Worker
1. Painel da Cloudflare > **Workers & Pages** > **Create** > **Create Worker**.
2. Nome: `rastreio`. Clique em **Deploy**.
3. Clique em **Edit code**, apague tudo e cole o conteúdo de `worker.js`. Clique em **Deploy**.

## 2. Criar o armazenamento (KV)
1. Menu **Storage & databases** > **KV** > **Create a namespace**. Nome: `visualizacoes`.
2. Volte ao Worker `rastreio` > **Settings** > **Bindings** > **Add** > **KV namespace**.
3. Em **Variable name** escreva exatamente `VIEWS` e escolha o namespace `visualizacoes`. Salve.

## 3. Criar a senha
1. No Worker > **Settings** > **Variables and Secrets** > **Add**.
2. Tipo **Secret**, nome exatamente `TOKEN`, valor: uma senha longa que só você sabe (30 letras e números). Salve e faça **Deploy**.

## 4. Guardar o endereço
Na tela do Worker aparece o endereço, algo como `https://rastreio.SEU-NOME.workers.dev`. Copie.

## 5. Hospedar as prévias (Cloudflare Pages)
1. **Workers & Pages** > **Create** > aba **Pages** > **Upload assets**.
2. Nome do projeto: `previas`. Envie a pasta do arquivo `previas-cloudflare.zip` já descompactada.
3. O endereço fica `https://previas.pages.dev` (ou parecido). A prévia fica em `/nome-do-arquivo.html`.
   O nome do arquivo é difícil de adivinhar de propósito, e a página pede aos buscadores para não indexar.

## 6. Ligar no painel
1. Painel > **Rastreio automático da prévia**: cole o endereço do Worker e a senha. Toque em **Salvar e testar**.
2. Em cada loja, toque em **Gerar link da prévia** e cole o endereço da prévia dela (passo 5).
   O link rastreado é copiado. Use ele na mensagem (a mensagem "Enviando a prévia" já traz `{link}`).
3. Quando a pessoa abrir, a loja vira **Visualizou** e mostra "viu 1x • data e hora".

## O que é e o que não é contado
- Conta: abertura real do link por uma pessoa. Recargas em menos de 30 segundos contam uma vez só.
- Não conta: robôs de pré-visualização (WhatsApp, Facebook, etc.).
- Guarda só o horário e se foi no celular. Não guarda IP nem nome.
- Se a pessoa abrir o link por outro aparelho, ou encaminhar a mensagem, conta como outra abertura.
- Não diz se leu a mensagem, só se abriu o link da prévia. Responder continua sendo um toque manual.
