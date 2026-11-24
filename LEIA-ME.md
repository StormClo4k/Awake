# Awakening — versão HTML/JS (v0.7.3)

## v0.7.3: efeitos extras no nível
- Brilho que varre o hexágono, 3 pontos de luz orbitando, partículas subindo pela tela, número que "pulsa" a cada contagem e estouro com onda de choque ao chegar no novo nível. Cache `awakening-v14`.

## v0.7.2: aviso de subida de nível redesenhado
- Hexágono grande com o nível (contagem animada do número antigo ao novo), raios de luz girando, brilho na cor do rank, clarão na tela, 30 faíscas e dois anéis de onda. Em subida de rank, o emblema animado do novo rank aparece abaixo. Respeita animações reduzidas. Cache `awakening-v12`.

## v0.7.1: sem ilustrações de personagem
- Os personagens ilustrados por rank **não são mais usados**. A aba **Perfil** mostra a mesma foto que a pessoa coloca no Painel (com botão para trocar ou remover) e, ao subir de nível ou de rank, o aviso mostra só texto e efeitos, sem foto nem personagem.
- Na Hierarquia, cada rank aparece apenas pelo emblema. O cartão do personagem para compartilhar usa a foto do jogador (se houver).
- A pasta `assets/forms/` foi removida. Cache do PWA: `awakening-v11`.


Sem build, sem dependências: abra `index.html` no navegador ou publique a pasta inteira em qualquer hospedagem estática.

## Novidades da v0.7: painel Status com foto e emblema animado por rank
- **Foto do jogador**: no Painel, toque em "Adicionar foto" (ou no botão de câmera) e escolha uma imagem. Ela é recortada em 3:4, reduzida (~40 KB) e guardada **só neste navegador, fora do backup**. O botão ✕ remove a foto; "Apagar progresso" também apaga a foto.
- **Painel Status redesenhado**: emblema do rank e título à esquerda, foto à direita com a etiqueta de nível, três cartões rápidos (sequência, XP de hoje, atributo mais forte) e barra de XP.
- **Cada rank com cor e efeito próprios** (novo arquivo `rankfx.js`): E Brasa · D Broto · C Aço · B Órbita · A Chama · S Raio · SS Aurora · SSS Holograma · MONARCA Coroa de luz. A moldura da foto ganha mais presença nos ranks altos (contorno duplo a partir do S).
- Respeita **animações reduzidas** (Ajustes ou preferência do sistema) e os modos claro e escuro.
- Cache do PWA atualizado para `awakening-v10` (inclui `rankfx.js`).

## GitHub Pages
1. Envie **todo o conteúdo desta pasta** para a raiz de um repositório (inclusive `manifest.webmanifest`, `sw.js` e a pasta `assets`).
2. Em **Settings → Pages**, escolha **Deploy from a branch → main → / (root)**.
3. O site abre em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`. Funciona em subpasta, pois todos os caminhos são relativos.

## Novidades da v0.6: mais recursos na aba Treino
- **Meus treinos**: crie seu próprio treino escolhendo entre ~100 exercícios (busca e filtro por grupo), definindo séries, repetições e descanso, e reordenando. Toque em "Personalizar" em qualquer treino pronto para editar uma cópia. Eles também entram no plano semanal.
- **Plano semanal** (sub-aba Plano): o app distribui os treinos nos dias da semana conforme seus dias de treino (respeitando o descanso entre músculos parecidos). Troque qualquer dia, veja o que já foi feito (✓) e o Início passa a mostrar o treino de hoje.
- **Progressão automática de carga**: se na última vez você completou todas as séries no topo das repetições, o app sugere subir a carga (+2,5 ou +5 kg; +1 ou +2 kg em isoladores) e já preenche o campo. Se ficou abaixo do mínimo duas vezes seguidas, sugere reduzir ~10%.
- **Recuperação e semana leve**: o Início mostra há quantos dias cada grupo foi treinado (descanso de ~48 h). Depois de 5 semanas seguidas treinando, ou com esforço 9–10 nos últimos treinos, o app sugere uma semana leve (uma série a menos, cargas ~15% menores).
- **Fotos de progresso** (aba Corpo): adicione fotos (reduzidas e guardadas só neste navegador, **fora do backup**) e compare duas lado a lado, com o peso da data.
- **Ferramentas**: calculadora de 1RM (com tabela de cargas por porcentagem) e de anilhas por lado da barra.
- **GPS no cardio**: nos cardios com distância (esteira, corrida, remo, bike), ative o GPS para medir distância e ritmo ao ar livre. Mantenha a tela aberta: navegadores pausam o GPS com a tela bloqueada.
- Correção: variáveis de cor do tema escuro que se referenciavam a si mesmas.

## Novidades da v0.5.4: treino vira XP de verdade
- **Treino conclui a missão sozinho**: ao salvar um treino, o app conclui a missão de treino pendente do dia (ex.: "Treinar", "Academia") e soma +1 na missão semanal de treino (ex.: "Treinar 4 vezes"). Não há mais pergunta. Cardio também conclui missões de caminhada, corrida e cardio.
- **Bônus de treino** (um registro "· bônus" na lista de conclusões, que dá para desfazer no mesmo dia):
  - **Treino de peso → Força.** Base de 10 XP + 1 XP a cada 250 kg de volume levantado (máx. 110). Sem carga registrada, vale o tempo (60 kg por minuto).
  - **Cardio → Vitalidade.** 1,2 XP por minuto (mín. 10, máx. 100). **Alongamento → Vitalidade**, 0,8 XP por minuto (máx. 40).
  - **Recorde de carga**: +15 XP por recorde (máx. 5 por treino).
  - Treinos com menos de 5 minutos não rendem XP, e só os 3 primeiros treinos do dia rendem XP (todos ficam no histórico).
- **Chefe de treino semanal**: além do chefe normal, aparece um chefe de treino (para quem treinou nas últimas 4 semanas ou ao terminar o primeiro treino). Vida mínima de 18.000, ajustada pelo que você treinou nas 2 semanas anteriores. Dano: 1 por kg levantado, 150 por minuto de cardio, 40 por minuto de alongamento. Missões comuns não ferem esse chefe. O chefe normal continua ferido pelo XP de tudo, inclusive do bônus de treino.
- **14 conquistas novas** (39 no total): Treino Registrado, Mês de Ferro (10 treinos no mês), Mês Inabalável (20), Supino 60, 100 kg no Supino, 100 kg no Agachamento, Terra Pesado (120 kg), Dez e Cem Toneladas, Fôlego de Aço (10 h de cardio), Coração de Titã (50 h), Quebra-Recordes e Quebra-Titã. Supino, agachamento e terra são reconhecidos pelo nome do exercício (supino, agachamento livre/hack, levantamento terra).
- Treinos feitos antes da v0.5.4 ficam no histórico, mas não geram XP nem contam para as conquistas.

## Novidades da v0.5.3: mais missões de Carisma
- **8 modelos novos** no formulário de missão (conversar, ligar, elogiar, agradecer, falar em público, escuta ativa, networking, encontro social).
- **2 missões de Carisma** (uma diária, uma semanal): jogos novos já vêm com elas e perfis antigos as recebem automaticamente uma única vez, sem alterar XP nem progresso. Se você apagar, não voltam.
- **4 alertas de emergência** novos de Carisma (agora 4 de 9 envolvem o atributo).
- O importador de hábitos reconhece mais palavras de Carisma (conversa, ligar, elogio, apresentação etc.).

## Novidades da v0.5: aba Treino
- **Perfil corporal**: na primeira vez, o app pergunta peso, altura, idade (opcional), sexo (opcional), objetivo, nível, local (academia ou casa) e dias por semana. Calcula IMC, faixa de peso, gasto basal e meta de água.
- **Treinos prontos**: 10 grupos (peito e tríceps, costas e bíceps, pernas, glúteos, ombros, braços, core, corpo inteiro, cardio, mobilidade) para academia e casa, em 3 níveis (iniciante, intermediário, avançado) e 3 estilos (força, hipertrofia, resistência). O cardio tem 17 sessões (esteira, bike, HIIT, corda, tabata, boxe de sombra etc.).
- **Durante o treino**: cronômetro, carga e repetições por série (já preenchidas com a última vez), timer de descanso com aviso sonoro/vibração, adicionar ou tirar séries. A sessão em andamento sobrevive a recarregar a página.
- **Antes e depois**: energia e sono antes; esforço (1–10), humor, duração, peso do dia, distância e FC no cardio, anotações depois. O app estima as calorias (MET × peso × tempo) e avisa recordes de carga.
- **Progresso**: totais, treinos por semana, grupos treinados, gráfico por exercício, histórico com detalhes e exportação em CSV. **Corpo**: gráfico de peso e medidas (cintura, quadril, peito, braço, coxa, % de gordura).
- **Verificador de IMC** (aba Treino > IMC): mostra seu IMC numa escala colorida da OMS, se está bom ou não, a faixa de peso normal para sua altura, quanto falta para entrar nela e permite simular outros valores sem mexer no perfil.
- Ao terminar, o app conclui sozinho a missão de treino pendente (veja a v0.5.4).
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
- `styles.css`, `sw.js`, `manifest.webmanifest`, `assets/` (ícones do app).
