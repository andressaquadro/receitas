# Publicar as receitas para o celular

O computador é o **caderno**: é nele que você cria, edita e exclui receitas. O celular é a **vitrine**: abre o mesmo app em modo **somente leitura**, sempre com a última versão publicada.

O caminho é este:

```
computador (arquivo local)  →  botão Publicar  →  GitHub  →  celular (somente leitura)
```

Não tem conta de banco de dados, não tem mensalidade e não tem sincronização para configurar. Só um botão.

---

## O que você precisa (uma vez só)

- Uma conta gratuita no [GitHub](https://github.com).
- O app aberto no computador (o `index.html`).
- Cerca de 10 minutos.

---

## Passo 1 — Criar o repositório

1. Abra <https://github.com/new>.
2. Em **Repository name**, escreva `receitas`.
3. Deixe marcado **Public**.
4. Clique em **Create repository**.
5. Na tela seguinte, clique em **uploading an existing file**.
6. Arraste **todos os arquivos e a pasta `assets`** do projeto para a página.
7. Clique em **Commit changes**.

> O repositório precisa ser público porque o GitHub Pages gratuito não publica repositórios privados.

## Passo 2 — Ligar o site (GitHub Pages)

1. No repositório, abra **Settings** → **Pages**.
2. Em **Source**, escolha **Deploy from a branch**.
3. Em **Branch**, escolha `main` e a pasta `/ (root)`.
4. Clique em **Save**.
5. Espere de 1 a 2 minutos. A página mostra o endereço, parecido com:

   `https://seu-usuario.github.io/receitas/`

Guarde esse endereço: é o que você vai abrir no celular.

## Passo 3 — Criar o token de acesso

O token é a "chave" que permite ao app enviar o arquivo de receitas para o seu repositório. Ele fica guardado **só no seu computador**.

1. Abra <https://github.com/settings/personal-access-tokens/new>.
2. Em **Token name**, escreva `receita facil`.
3. Em **Expiration**, escolha o prazo que preferir (por exemplo, 1 ano).
4. Em **Repository access**, marque **Only select repositories** e escolha o repositório `receitas`.
5. Em **Permissions** → **Repository permissions**, procure **Contents** e marque **Read and write**.
6. Clique em **Generate token** e **copie** o código que começa com `github_pat_...`.

> O GitHub mostra o token uma única vez. Se perder, é só gerar outro.

## Passo 4 — Publicar pelo app

1. No computador, abra o `index.html` com dois cliques.
2. Clique em **Publicar**, no topo (ou no aviso **Ainda não publicado**, na lateral).
3. Preencha:
   - **Repositório do GitHub:** `seu-usuario/receitas`
   - **Token de acesso:** o código `github_pat_...`
4. Clique em **Publicar agora**.

Se deu certo, aparece a mensagem **Publicado!** e o endereço do site. O arquivo `receitas.json` foi criado no repositório.

## Passo 5 — Instalar no celular

1. Abra o endereço `https://seu-usuario.github.io/receitas/` no celular.
2. No **iPhone** (Safari): toque em **Compartilhar** → **Adicionar à Tela de Início**.
3. No **Android** (Chrome): toque nos três pontinhos → **Instalar app**.

O app abre em tela cheia, funciona sem internet e mostra o selo **somente leitura**. Mais detalhes em **`COMO_INSTALAR_NO_CELULAR.md`**.

---

## No dia a dia

1. Adicione ou edite receitas normalmente no computador.
2. Clique em **Publicar**.
3. No celular, toque em **Atualizar** (ou feche e abra o app).

O celular guarda a última versão para continuar funcionando sem internet. Quando volta a ter conexão, ele busca as novidades sozinho ao abrir.

---

## Se algo der errado

| Mensagem | O que fazer |
| --- | --- |
| Repositório não encontrado | Confira se escreveu `usuario/receitas` corretamente e se o token tem acesso a esse repositório. |
| Token sem permissão | Gere outro token e marque **Contents → Read and write**. |
| Token inválido ou expirado | Gere um token novo em **Alterar configuração**. |
| Endereço do celular mostra erro 404 | O GitHub Pages ainda não terminou de publicar. Espere alguns minutos e recarregue. |
| Celular mostra receitas antigas | Confira se a publicação no computador deu certo e toque em **Atualizar** no celular. |
| Nenhuma receita publicada ainda | O `receitas.json` ainda não existe. Publique pelo computador. |

## Modo manual (sem token)

Se preferir não criar o token:

1. No app, clique em **Publicar** → **Alterar configuração** → **Baixar receitas.json**.
2. No GitHub, abra o repositório → **Add file** → **Upload files**.
3. Envie o `receitas.json` por cima do antigo e clique em **Commit changes**.

Funciona igual, só exige esse envio manual a cada mudança.

## Privacidade

O repositório é público: quem tiver o endereço consegue ver as receitas publicadas. Para um caderno de família isso costuma ser tranquilo, mas evite publicar informações pessoais ou receitas que não podem circular.

## Backup continua valendo

O **Backup .md** no computador continua sendo a sua cópia de segurança. O GitHub guarda o histórico de cada publicação, então também é possível recuperar uma versão anterior do `receitas.json` por lá.
