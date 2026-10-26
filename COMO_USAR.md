# Receita Fácil — versão para o computador e para o celular

## Como abrir no computador

1. Baixe e extraia o arquivo ZIP inteiro para uma pasta.
2. Mantenha `index.html`, `styles.css`, `app.js`, `publicar.js`, `manifest.webmanifest`, `sw.js` e a pasta `assets` juntos na mesma pasta.
3. Abra o arquivo **`index.html`** com dois cliques.
4. O sistema abrirá no navegador, sem precisar instalar nada.

É no computador que você **cria, edita e exclui** receitas.

## Como abrir no celular

O celular abre o mesmo app em **modo somente leitura**, com as receitas publicadas pelo computador. Ele é instalável no iPhone e no Android (ícone na tela inicial e funcionamento sem internet). O passo a passo completo está em **`PUBLICAR_NO_CELULAR.md`**.

Resumo: crie um repositório no GitHub, ligue o **GitHub Pages**, publique pelo botão **Publicar** e abra o endereço `https://` no celular.

## Como usar no computador

Toque em **Nova receita** (ou no botão **+**) e informe o nome e um ingrediente por linha. O modo de preparo é opcional.

Use **Backup .md** para guardar uma cópia editável da coleção. Para restaurar ou levar as receitas para outro computador, use **Importar .md**.

Use **Exportar PDF** para abrir a folha de impressão e escolha **Salvar como PDF**. A folha organiza as receitas em duas colunas.

## Como as receitas chegam ao celular

Clique em **Publicar**, no topo. O app envia um arquivo `receitas.json` para o seu repositório no GitHub, e o celular passa a ver as receitas atualizadas.

- O celular **não cria, não edita e não exclui** nada.
- Depois de publicar, toque em **Atualizar** no celular (ou feche e abra o app).
- O celular guarda a última versão para abrir mesmo sem internet.

Detalhes e solução de problemas em **`PUBLICAR_NO_CELULAR.md`**.

## Importante sobre o backup

O salvamento automático é local, no aparelho. Se você limpar os dados do navegador do computador, as receitas não voltam sozinhas — restaure pelo arquivo `.md` com **Importar .md**. Por isso, vale baixar regularmente o **Backup .md**.

O GitHub guarda o histórico de cada publicação, então o `receitas.json` também serve como cópia de segurança.

## Arquivos do projeto

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | Tela do app |
| `styles.css` | Visual (computador e celular) |
| `app.js` | Funcionamento, salvamento e backups |
| `publicar.js` | Envio das receitas ao GitHub e modo somente leitura |
| `manifest.webmanifest` | Nome, ícone e cor do app instalado |
| `sw.js` | Permite abrir o app sem internet |
| `assets/icons/` | Ícones do app |
| `PUBLICAR_NO_CELULAR.md` | Passo a passo para publicar e usar no celular |
| `COMO_INSTALAR_NO_CELULAR.md` | Como instalar o app no iPhone e no Android |

O arquivo `manus-routes.json` é usado apenas pelo ambiente online e não é necessário para abrir o sistema localmente.
