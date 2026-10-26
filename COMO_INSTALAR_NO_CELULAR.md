# Receita Fácil no celular (iPhone e Android)

O app é **instalável** (tecnologia chamada PWA): ganha ícone na tela inicial, abre em tela cheia, sem barra de navegador, e continua funcionando **sem internet**.

Não é preciso passar pela App Store nem pela Play Store, e o mesmo arquivo serve para iPhone e Android.

> **Importante:** o celular é **somente leitura**. Quem cria, edita e exclui receitas é o computador. As receitas chegam ao celular pelo botão **Publicar**. Veja o passo a passo completo em **`PUBLICAR_NO_CELULAR.md`**.

---

## Passo 1 — Publicar o app (só uma vez)

Para instalar no celular, o app precisa estar em um endereço `https://`. O caminho mais direto é o **GitHub Pages**, que é gratuito:

1. Crie um repositório público no GitHub e envie a pasta do projeto.
2. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. O endereço fica `https://seu-usuario.github.io/nome-do-repositorio/`.

O guia detalhado (com o token e o botão **Publicar**) está em **`PUBLICAR_NO_CELULAR.md`**.

> O botão **Publicar** envia as receitas para o GitHub. Em outra hospedagem, seria preciso enviar o arquivo `receitas.json` manualmente a cada mudança — por isso o GitHub Pages é o caminho recomendado.

---

## Passo 2 — Instalar no iPhone

1. Abra o endereço no **Safari** (precisa ser o Safari, não o Chrome).
2. Toque no botão **Compartilhar** (quadrado com uma flecha para cima).
3. Escolha **Adicionar à Tela de Início** e confirme em **Adicionar**.
4. Abra pelo ícone que apareceu. Pronto: o app abre em tela cheia.

O app mostra essa dica sozinho na primeira visita, com um botão para fechar.

## Passo 3 — Instalar no Android

1. Abra o endereço no **Chrome**.
2. Toque nos três pontinhos (⋮) e escolha **Instalar app** (ou **Adicionar à tela inicial**).
3. Confirme. O ícone aparece junto com os outros apps.

---

## Onde ficam as receitas

- **No computador:** as receitas ficam salvas no navegador. O **Backup .md** é a sua garantia.
- **No celular:** o app guarda a última versão publicada para abrir sem internet. Ao abrir com conexão, ele busca as novidades sozinho — e o botão **Atualizar** força a busca.
- O celular não altera nada: nem cria, nem edita, nem exclui. Isso evita bagunça na coleção.

---

## Atualizações

Quando você publica novas receitas no computador, o celular as recebe ao abrir o app ou ao tocar em **Atualizar**. Os arquivos do próprio app (visual, ícones) são atualizados automaticamente na próxima vez que ele for aberto com internet.
