# Awakening — versão HTML/JS

Sem build, sem dependências: abra `index.html` no navegador (duplo clique) ou publique a pasta inteira em qualquer hospedagem estática.

## GitHub Pages
1. Envie o conteúdo desta pasta para a raiz de um repositório (os arquivos `index.html`, `app.js`, `domain.js`, `styles.css` e a pasta `assets`).
2. Em **Settings → Pages**, escolha **Deploy from a branch → main → / (root)**.
3. O site abre em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Arquivos
- `domain.js` — motor do jogo (XP, níveis, ranks, missões, conquistas), o mesmo da versão do app, empacotado para o navegador.
- `app.js` — interface (telas, personagem, modais). `styles.css` — visual de "sistema".
- `assets/forms/` — as 9 ilustrações do personagem (`form-0` = E … `form-8` = MONARCA).

O progresso fica no `localStorage` do navegador (chave `awakening-game-v1`, mesmo formato da versão do app).
As fontes (Orbitron e Rajdhani) vêm do Google Fonts; sem internet o app usa a fonte do sistema.
