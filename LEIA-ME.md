# Awakening — versão HTML/JS (v0.5)

Sem build, sem dependências: abra `index.html` no navegador ou publique a pasta inteira em qualquer hospedagem estática.

## GitHub Pages
1. Envie **todo o conteúdo desta pasta** para a raiz de um repositório (inclusive `manifest.webmanifest`, `sw.js` e a pasta `assets`).
2. Em **Settings → Pages**, escolha **Deploy from a branch → main → / (root)**.
3. O site abre em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`. Funciona em subpasta, pois todos os caminhos são relativos.

## Novidades da v0.5: aba Treino
- **Perfil corporal**: na primeira vez, o app pergunta peso, altura, idade (opcional), sexo (opcional), objetivo, nível, local (academia ou casa) e dias por semana. Calcula IMC, faixa de peso, gasto basal e meta de água.
- **Treinos prontos**: 10 grupos (peito e tríceps, costas e bíceps, pernas, glúteos, ombros, braços, core, corpo inteiro, cardio, mobilidade) para academia e casa, em 3 níveis (iniciante, intermediário, avançado) e 3 estilos (força, hipertrofia, resistência). O cardio tem 17 sessões (esteira, bike, HIIT, corda, tabata, boxe de sombra etc.).
- **Durante o treino**: cronômetro, carga e repetições por série (já preenchidas com a última vez), timer de descanso com aviso sonoro/vibração, adicionar ou tirar séries. A sessão em andamento sobrevive a recarregar a página.
- **Antes e depois**: energia e sono antes; esforço (1–10), humor, duração, peso do dia, distância e FC no cardio, anotações depois. O app estima as calorias (MET × peso × tempo) e avisa recordes de carga.
- **Progresso**: totais, treinos por semana, grupos treinados, gráfico por exercício, histórico com detalhes e exportação em CSV. **Corpo**: gráfico de peso e medidas (cintura, quadril, peito, braço, coxa, % de gordura).
- **Verificador de IMC** (aba Treino > IMC): mostra seu IMC numa escala colorida da OMS, se está bom ou não, a faixa de peso normal para sua altura, quanto falta para entrar nela e permite simular outros valores sem mexer no perfil.
- Ao terminar, se houver uma missão de treino pendente, o app oferece concluí-la.
- Os dados ficam na chave `awakening-workout-v1` e entram no backup. Atalho `4` abre a aba.
- As cargas e séries são sugestões gerais, não orientação profissional.

## Novidades da v0.4
- **Metas por atributo**: escolha um atributo, o nível alvo e um prazo opcional (Perfil). O app mostra o XP que falta e quanto render por dia; ao cumprir, vêm moedas.
- **Revisão semanal**: ao começar a semana aparece um aviso no Painel. A tela `#/review` resume a semana anterior (XP, dias ativos, XP por atributo, chefe, conquistas) e guarda três anotações. Vale 15 moedas na primeira vez; dá para revisar as últimas 4 semanas.
- **Subtarefas**: uma missão pode ter até 12 itens. Cada item marcado é uma etapa e o XP vem ao concluir todos. Desfazer uma conclusão devolve só o último item.
- **Missões em cadeia**: no formulário, "Depende de" deixa uma missão bloqueada até a outra ser concluída (🔓 aviso ao liberar).
- **Ranks por atributo**: cada atributo tem rank E→MONARCA conforme o nível (1, 3, 6, 10, 16, 22, 30, 40, 50), com título liberável (ex.: "Inteligência · Rank B").
- **Modo claro** (Escuro, Claro, Seguir o sistema) e **animações reduzidas** em Ajustes. Com o sistema pedindo menos movimento, já começa reduzido.
- 4 conquistas novas (26 no total). Saves antigos continuam funcionando.

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
