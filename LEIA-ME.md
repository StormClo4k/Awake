# Awakening — versão HTML/JS (v0.3)

Sem build, sem dependências: abra `index.html` no navegador ou publique a pasta inteira em qualquer hospedagem estática.

## GitHub Pages
1. Envie **todo o conteúdo desta pasta** para a raiz de um repositório (inclusive `manifest.webmanifest`, `sw.js` e a pasta `assets`).
2. Em **Settings → Pages**, escolha **Deploy from a branch → main → / (root)**.
3. O site abre em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`. Funciona em subpasta, pois todos os caminhos são relativos.

## Novidades da v0.3
**Proteção do progresso**
- Exportar e importar backup em arquivo `.json`, por código de texto ou por link de restauração. A importação recusa progresso adulterado (usa `verifyState`).
- Lembrete de backup (configurável) e cópias automáticas diárias (as 6 últimas) dentro do navegador.

**Uso diário**
- Tela de **Estatísticas**: XP por dia (7/30/90 dias), calendário de atividade, XP por atributo, média por dia da semana, sequência e recorde.
- **Editar missões**, **modelos** prontos, **dias fixos** (ex.: seg/qua/sex) e **dias de descanso** (até 2 por semana) que protegem a sequência.
- **Desfazer** conclusões de hoje (botão no aviso, na lista “Concluídas hoje” e tecla `U`).
- **Sessão de foco** (15/25/45/60 min) dentro da missão: ao terminar, conclui a missão registrando as horas.
- **Diário** do dia com humor.

**Jogo**
- **Loja de recompensas**: 1 moeda a cada 10 XP concluídos; você define as recompensas e os preços.
- **Chefe semanal**: cada missão concluída causa dano igual ao seu XP.
- **Temporadas de 30 dias** com 3 marcos (pagam moedas) e insígnia ao fechar a meta.
- **8 novas conquistas** (22 no total), **títulos** e **molduras** de perfil, **tema de cor** que segue o seu rank.
- **Placar de amigos por código** (sem servidor).

**Extras**
- **Cartão do personagem** em imagem (baixar ou compartilhar).
- **Importar hábitos** de CSV, de calendário `.ics` ou de uma lista de texto.
- **PWA**: instalável na tela inicial e funciona offline (`manifest.webmanifest` + `sw.js`).
- **Lembrete diário** por notificação e **atalhos de teclado** (`?` mostra a lista).

## Limites conhecidos
- Sem servidor, notificações só chegam com o app aberto ou instalado e recém-usado.
- O placar de amigos mostra “fotos” do XP semanal na hora em que cada código foi gerado.
- O progresso fica no `localStorage` (chave `awakening-game-v1`, mesmo formato da versão do app, com campos novos opcionais).

## Arquivos
- `domain.js` — motor do jogo. `app.js` — telas principais. `features.js` — recursos extras.
- `styles.css`, `sw.js`, `manifest.webmanifest`, `assets/` (ilustrações em `assets/forms/`, ícones do app).
