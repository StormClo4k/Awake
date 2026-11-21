/* Awakening — biblioteca de treinos.
   Gera treinos por grupo muscular × local (academia/casa) × nível × estilo, e sessões de cardio.
   Exercício: [nome, nívelMín, nívelMáx, dica, 't' (por tempo)]. Níveis: 0 iniciante, 1 intermediário, 2 avançado. */
(function () {
  'use strict';
  var LEVELS = ['Iniciante', 'Intermediário', 'Avançado'];
  var PLACES = { gym: 'Academia', home: 'Casa' };
  var STYLES = {
    forca: { name: 'Força', desc: 'Cargas altas, poucas repetições e descansos longos. Foco em ficar mais forte.', met: 5 },
    hiper: { name: 'Hipertrofia', desc: 'Volume moderado e descansos médios. Foco em ganho de massa muscular.', met: 5 },
    resist: { name: 'Resistência', desc: 'Muitas repetições, descanso curto e ritmo de circuito. Mais gasto calórico e fôlego.', met: 6 }
  };
  var GROUPS = [
    { id: 'peito-triceps', name: 'Peito e tríceps', glyph: '⚔' },
    { id: 'costas-biceps', name: 'Costas e bíceps', glyph: '⛬' },
    { id: 'pernas', name: 'Pernas', glyph: '♞' },
    { id: 'gluteos', name: 'Glúteos e posteriores', glyph: '◒' },
    { id: 'ombros', name: 'Ombros e trapézio', glyph: '▲' },
    { id: 'bracos', name: 'Braços', glyph: '✊' },
    { id: 'core', name: 'Abdômen e core', glyph: '◎' },
    { id: 'corpo', name: 'Corpo inteiro', glyph: '✦' },
    { id: 'cardio', name: 'Cardio', glyph: '♥' },
    { id: 'mobilidade', name: 'Mobilidade e alongamento', glyph: '∿' }
  ];

  /* ------------------------------ academia ------------------------------ */
  var G = {};
  G.gym = {
    'peito-triceps': { parts: [[
      ['Supino reto com barra', 1, 2, 'Escápulas juntas, barra toca o peito e sobe firme.'],
      ['Supino na máquina (chest press)', 0, 0, 'Ajuste o banco para a pegada ficar na altura do meio do peito.'],
      ['Supino reto com halteres', 0, 1, 'Cotovelos a 45°, desça controlando e una os halteres em cima.'],
      ['Supino inclinado com barra', 2, 2, 'Banco a 30°; a barra desce na parte alta do peito.'],
      ['Supino inclinado com halteres', 0, 2, 'Banco a 30°; foco na parte superior do peito.'],
      ['Crucifixo na máquina (peck deck)', 0, 1, 'Cotovelos levemente flexionados; aperte o peito ao fechar.'],
      ['Crossover na polia alta', 1, 2, 'Tronco levemente inclinado; una as mãos à frente do quadril.'],
      ['Mergulho em paralelas (ênfase no peito)', 1, 2, 'Incline o tronco à frente e desça até 90° nos cotovelos.'],
      ['Crucifixo inclinado com halteres', 2, 2, 'Arco amplo, cotovelos semiflexionados, sem descer demais.']
    ], [
      ['Tríceps na polia com corda', 0, 2, 'Cotovelos colados ao corpo; abra a corda embaixo.'],
      ['Tríceps francês com halter', 0, 1, 'Cotovelos apontando para cima; desça atrás da cabeça.'],
      ['Tríceps testa com barra W', 1, 2, 'Só os antebraços se movem; barra desce até a testa.'],
      ['Supino fechado', 2, 2, 'Mãos na largura dos ombros; cotovelos próximos do corpo.'],
      ['Tríceps coice com halter', 0, 1, 'Tronco inclinado, braço colado; estenda totalmente.']
    ]] },
    'costas-biceps': { parts: [[
      ['Puxada frontal na polia', 0, 1, 'Puxe a barra até o peito, levando os cotovelos para baixo.'],
      ['Barra fixa', 2, 2, 'Suba até o queixo passar da barra, sem balançar.'],
      ['Remada baixa na polia', 0, 2, 'Peito aberto; puxe até o abdômen e aperte as costas.'],
      ['Remada curvada com barra', 1, 2, 'Tronco a ~45°, coluna neutra; leve a barra ao umbigo.'],
      ['Remada unilateral com halter', 0, 2, 'Apoie no banco; puxe o cotovelo em direção ao quadril.'],
      ['Remada cavalinho (T-bar)', 1, 2, 'Quadril para trás, costas retas; puxe com os cotovelos.'],
      ['Pulldown com braços retos', 1, 2, 'Braços quase estendidos; desça a barra até as coxas.'],
      ['Remada na máquina', 0, 0, 'Peito apoiado; puxe e junte as escápulas.']
    ], [
      ['Rosca direta com barra', 0, 2, 'Cotovelos fixos ao lado do corpo; sem balançar o tronco.'],
      ['Rosca martelo com halteres', 0, 2, 'Pegada neutra; suba sem mexer o ombro.'],
      ['Rosca alternada com halteres', 0, 1, 'Gire o punho ao subir; desça devagar.'],
      ['Rosca Scott', 1, 2, 'Braços apoiados; não estenda totalmente embaixo.'],
      ['Rosca concentrada', 2, 2, 'Cotovelo apoiado na coxa; contração forte no topo.']
    ]] },
    pernas: { parts: [[
      ['Agachamento livre com barra', 1, 2, 'Pés na largura dos ombros; desça com a coluna neutra e joelhos alinhados.'],
      ['Agachamento goblet com halter', 0, 0, 'Halter junto ao peito; desça mantendo o tronco ereto.'],
      ['Leg press 45°', 0, 1, 'Pés na largura dos ombros; não trave os joelhos em cima.'],
      ['Agachamento hack', 2, 2, 'Costas apoiadas; desça até 90° ou mais, com controle.'],
      ['Stiff com barra', 1, 2, 'Joelhos levemente flexionados; leve o quadril para trás.'],
      ['Agachamento búlgaro', 2, 2, 'Pé de trás no banco; desça reto e empurre com a perna da frente.'],
      ['Cadeira extensora', 0, 2, 'Estenda sem travar; segure 1 s no topo.'],
      ['Mesa flexora', 0, 2, 'Quadril colado ao banco; flexione e desça devagar.'],
      ['Elevação pélvica (hip thrust)', 1, 2, 'Queixo para o peito; suba o quadril e aperte o glúteo.'],
      ['Panturrilha em pé na máquina', 0, 2, 'Amplitude completa: calcanhar baixo, ponta do pé alta.'],
      ['Avanço com halteres', 0, 1, 'Passo longo; joelho de trás quase toca o chão.'],
      ['Cadeira abdutora', 0, 1, 'Abra as pernas sem tirar o quadril do banco.']
    ]] },
    gluteos: { parts: [[
      ['Elevação pélvica (hip thrust)', 0, 2, 'Queixo para o peito; suba o quadril e aperte o glúteo por 1 s.'],
      ['Agachamento sumô com halter', 0, 1, 'Pés abertos, pontas para fora; desça com o tronco ereto.'],
      ['Stiff com barra', 1, 2, 'Joelhos levemente flexionados; quadril para trás, costas neutras.'],
      ['Agachamento búlgaro', 1, 2, 'Pé de trás no banco; incline um pouco o tronco para focar o glúteo.'],
      ['Mesa flexora', 0, 2, 'Quadril colado ao banco; flexione e desça devagar.'],
      ['Glúteo na polia (kickback)', 0, 2, 'Chute para trás sem arquear a lombar; aperte no topo.'],
      ['Cadeira abdutora', 0, 2, 'Incline o tronco à frente para ativar mais o glúteo.'],
      ['Levantamento terra romeno', 1, 2, 'Barra rente às pernas; sinta o alongamento atrás da coxa.'],
      ['Passada (avanço caminhando)', 0, 2, 'Passos longos; empurre com o calcanhar da frente.']
    ]] },
    ombros: { parts: [[
      ['Desenvolvimento na máquina', 0, 0, 'Costas apoiadas; empurre sem arquear a lombar.'],
      ['Desenvolvimento com halteres', 0, 1, 'Cotovelos um pouco à frente; empurre até quase estender.'],
      ['Desenvolvimento militar com barra', 1, 2, 'Abdômen firme; passe a barra rente ao rosto.'],
      ['Arnold press', 2, 2, 'Gire as palmas ao subir; controle a descida.'],
      ['Elevação lateral com halteres', 0, 2, 'Suba até a altura dos ombros, cotovelos levemente flexionados.'],
      ['Crucifixo inverso na máquina', 0, 2, 'Abra os braços levando os cotovelos para trás.'],
      ['Face pull na polia', 1, 2, 'Puxe a corda até o rosto, abrindo os cotovelos.'],
      ['Elevação lateral na polia', 2, 2, 'Tensão constante; suba com o cotovelo guiando.'],
      ['Encolhimento com halteres', 0, 2, 'Suba os ombros em direção às orelhas, sem girar.'],
      ['Remada alta com barra', 1, 2, 'Cotovelos acima das mãos; suba até o peito.']
    ]] },
    bracos: { parts: [[
      ['Rosca direta com barra', 0, 2, 'Cotovelos fixos; sem balançar o tronco.'],
      ['Rosca martelo com halteres', 0, 2, 'Pegada neutra; suba sem mexer o ombro.'],
      ['Rosca Scott', 1, 2, 'Braços apoiados; controle a descida.'],
      ['Rosca alternada com halteres', 0, 1, 'Gire o punho ao subir.'],
      ['Rosca na polia baixa', 1, 2, 'Tensão contínua; cotovelos fixos.'],
      ['Rosca concentrada', 2, 2, 'Cotovelo apoiado na coxa; pico de contração.']
    ], [
      ['Tríceps na polia com corda', 0, 2, 'Cotovelos colados; abra a corda embaixo.'],
      ['Tríceps testa com barra W', 1, 2, 'Só os antebraços se movem.'],
      ['Tríceps francês com halter', 0, 2, 'Cotovelos para cima; desça atrás da cabeça.'],
      ['Mergulho em paralelas (ênfase no tríceps)', 2, 2, 'Tronco reto e cotovelos para trás.'],
      ['Tríceps coice com halter', 0, 1, 'Braço colado ao corpo; estenda totalmente.']
    ]] },
    core: { parts: [[
      ['Prancha', 0, 2, 'Corpo em linha reta; abdômen e glúteos contraídos.', 't'],
      ['Abdominal crunch no solo', 0, 1, 'Suba só as escápulas; lombar apoiada.'],
      ['Elevação de pernas deitado', 0, 1, 'Lombar colada ao chão; desça devagar.'],
      ['Abdominal na polia (ajoelhado)', 1, 2, 'Flexione o tronco levando os cotovelos aos joelhos.'],
      ['Prancha lateral', 0, 2, 'Quadril alto; corpo em linha reta.', 't'],
      ['Elevação de pernas na barra fixa', 2, 2, 'Sem balançar; leve as pernas até a altura do quadril ou mais.'],
      ['Roda abdominal', 2, 2, 'Avance até onde mantém a lombar neutra.'],
      ['Russian twist com anilha', 1, 2, 'Pés elevados; gire o tronco, não só os braços.'],
      ['Dead bug', 0, 1, 'Lombar no chão; alterne braço e perna oposta.'],
      ['Hollow hold', 2, 2, 'Lombar colada; braços e pernas estendidos próximos do chão.', 't'],
      ['Mountain climbers', 1, 2, 'Quadril baixo; alterne os joelhos rápido.', 't']
    ]] },
    corpo: { parts: [[
      ['Agachamento goblet com halter', 0, 0, 'Halter junto ao peito; tronco ereto.'],
      ['Agachamento livre com barra', 1, 2, 'Coluna neutra; desça até pelo menos 90°.'],
      ['Supino reto com halteres', 0, 2, 'Cotovelos a 45°; controle a descida.'],
      ['Puxada frontal na polia', 0, 1, 'Cotovelos para baixo; peito aberto.'],
      ['Stiff com halteres', 1, 2, 'Quadril para trás; costas retas.'],
      ['Desenvolvimento com halteres', 0, 2, 'Empurre sem arquear a lombar.'],
      ['Remada unilateral com halter', 0, 2, 'Puxe o cotovelo ao quadril.'],
      ['Prancha', 0, 2, 'Corpo em linha reta.', 't'],
      ['Avanço com halteres', 0, 1, 'Passo longo; tronco ereto.'],
      ['Barra fixa', 2, 2, 'Sem balançar; queixo acima da barra.'],
      ['Mergulho em paralelas', 2, 2, 'Desça até 90° nos cotovelos.'],
      ['Leg press 45°', 0, 0, 'Não trave os joelhos.']
    ]] }
  };

  /* ------------------------------ casa ------------------------------ */
  G.home = {
    'peito-triceps': { parts: [[
      ['Flexão inclinada (mãos no sofá ou banco)', 0, 0, 'Corpo em linha reta; desça o peito até a borda.'],
      ['Flexão de joelhos', 0, 0, 'Joelhos no chão, quadril alinhado; peito quase toca o chão.'],
      ['Supino no chão com halteres, garrafas ou mochila', 0, 1, 'Cotovelos a 45°; empurre acima do peito.'],
      ['Flexão tradicional', 1, 1, 'Mãos sob os ombros, abdômen firme.'],
      ['Flexão com pés elevados', 1, 2, 'Pés no sofá; foca a parte superior do peito.'],
      ['Flexão arqueiro', 2, 2, 'Mãos bem abertas; desça para um lado e alterne.'],
      ['Crucifixo no chão com halteres', 0, 2, 'Cotovelos semiflexionados; abra até tocar o chão.'],
      ['Flexão explosiva (com palmas)', 2, 2, 'Empurre forte para soltar as mãos do chão.']
    ], [
      ['Mergulho no banco ou cadeira', 0, 1, 'Cotovelos para trás; desça até 90°.'],
      ['Flexão diamante', 1, 2, 'Mãos juntas sob o peito; cotovelos rentes ao corpo.'],
      ['Tríceps francês com halter ou mochila', 0, 2, 'Cotovelos para cima; desça atrás da cabeça.'],
      ['Mergulho no banco com pés elevados', 2, 2, 'Pés em outro apoio; amplitude completa.'],
      ['Tríceps coice com halter ou garrafa', 0, 1, 'Braço colado ao corpo; estenda totalmente.']
    ]] },
    'costas-biceps': { parts: [[
      ['Remada curvada com halteres ou mochila', 0, 2, 'Coluna neutra; puxe os cotovelos para trás.'],
      ['Remada unilateral com halter', 0, 2, 'Apoie a mão no sofá; puxe o cotovelo ao quadril.'],
      ['Remada com elástico', 0, 1, 'Peito aberto; junte as escápulas no final.'],
      ['Barra fixa (porta ou parque)', 2, 2, 'Sem balançar; queixo acima da barra.'],
      ['Remada invertida sob a mesa', 1, 2, 'Corpo reto; puxe o peito até a borda da mesa.'],
      ['Superman', 0, 1, 'Suba braços e pernas do chão; segure 1 s.'],
      ['Remada em prancha (renegade row)', 2, 2, 'Quadril estável; alterne a remada.'],
      ['Pullover com halter no chão', 1, 2, 'Braços semiestendidos; leve o halter atrás da cabeça.']
    ], [
      ['Rosca direta com halteres, garrafas ou mochila', 0, 2, 'Cotovelos fixos; sem balançar o tronco.'],
      ['Rosca martelo', 0, 2, 'Pegada neutra; suba sem mexer o ombro.'],
      ['Rosca concentrada', 0, 2, 'Cotovelo apoiado na coxa; contração forte no topo.'],
      ['Rosca com elástico', 0, 1, 'Pise no elástico; tensão do início ao fim.'],
      ['Barra fixa com pegada supinada', 2, 2, 'Palmas para você; suba controlando.']
    ]] },
    pernas: { parts: [[
      ['Agachamento livre', 0, 0, 'Pés na largura dos ombros; desça com o tronco ereto.'],
      ['Agachamento com mochila no peito', 1, 1, 'Mochila pesada junto ao peito; desça até 90°.'],
      ['Afundo alternado', 0, 1, 'Passo longo; joelho de trás quase toca o chão.'],
      ['Agachamento búlgaro (pé no sofá)', 1, 2, 'Desça reto; empurre com a perna da frente.'],
      ['Agachamento com salto', 2, 2, 'Aterrisse suave, joelhos alinhados.'],
      ['Agachamento pistol assistido', 2, 2, 'Segure em um apoio; desça numa perna só.'],
      ['Agachamento sumô', 0, 2, 'Pés abertos, pontas para fora; foco em coxa interna e glúteo.'],
      ['Stiff unilateral', 1, 2, 'Quadril para trás; perna solta estendida atrás.'],
      ['Stiff com halteres ou mochila', 0, 1, 'Joelhos levemente flexionados; costas retas.'],
      ['Elevação pélvica no chão', 0, 0, 'Suba o quadril apertando o glúteo.'],
      ['Elevação pélvica unilateral', 1, 2, 'Uma perna estendida; suba sem girar o quadril.'],
      ['Cadeira invisível (parede)', 0, 2, 'Costas na parede, coxas a 90°.', 't'],
      ['Panturrilha em pé no degrau', 0, 2, 'Amplitude completa; suba na ponta dos pés.'],
      ['Step-up no banco', 0, 2, 'Suba empurrando com a perna da frente.']
    ]] },
    gluteos: { parts: [[
      ['Elevação pélvica no chão', 0, 1, 'Suba o quadril apertando o glúteo por 1 s.'],
      ['Elevação pélvica unilateral', 1, 2, 'Uma perna estendida; suba sem girar o quadril.'],
      ['Agachamento sumô', 0, 2, 'Pés abertos; tronco ereto.'],
      ['Stiff unilateral', 1, 2, 'Quadril para trás; perna solta alinhada ao tronco.'],
      ['Glúteo de quatro apoios (kickback)', 0, 2, 'Chute para cima sem arquear a lombar.'],
      ['Abdução de quadril deitado', 0, 2, 'Deitado de lado, suba a perna de cima com o pé paralelo.'],
      ['Agachamento búlgaro (pé no sofá)', 1, 2, 'Incline levemente o tronco para focar o glúteo.'],
      ['Bom-dia (good morning) com mochila', 1, 2, 'Quadril para trás; costas neutras.'],
      ['Passada lateral', 0, 1, 'Passo para o lado e sente para trás.']
    ]] },
    ombros: { parts: [[
      ['Desenvolvimento com halteres ou mochila', 0, 1, 'Empurre sem arquear a lombar.'],
      ['Flexão pike', 1, 1, 'Quadril alto em V; desça a cabeça entre as mãos.'],
      ['Flexão pike com pés elevados', 2, 2, 'Pés no sofá; mais carga nos ombros.'],
      ['Flexão invertida na parede (handstand)', 2, 2, 'Pés na parede; desça com controle ou use apoio.'],
      ['Elevação lateral com halteres ou garrafas', 0, 2, 'Suba até a altura dos ombros.'],
      ['Crucifixo inverso curvado', 0, 2, 'Tronco inclinado; abra os braços levando os cotovelos para trás.'],
      ['Face pull com elástico', 0, 2, 'Puxe o elástico em direção ao rosto.'],
      ['Encolhimento com halteres ou mochila', 0, 2, 'Suba os ombros em direção às orelhas.'],
      ['Elevação frontal com halteres', 0, 0, 'Suba até a altura dos ombros, sem balançar.'],
      ['Prancha com toque no ombro', 1, 2, 'Quadril estável; alterne as mãos.']
    ]] },
    bracos: { parts: [[
      ['Rosca direta com halteres, garrafas ou mochila', 0, 2, 'Cotovelos fixos; sem balançar.'],
      ['Rosca martelo', 0, 2, 'Pegada neutra.'],
      ['Rosca concentrada', 0, 2, 'Cotovelo apoiado na coxa.'],
      ['Rosca com elástico', 0, 1, 'Tensão do início ao fim.'],
      ['Rosca 21 (7 parciais + 7 parciais + 7 completas)', 2, 2, 'Três amplitudes na mesma série.'],
      ['Barra fixa com pegada supinada', 2, 2, 'Palmas para você; suba controlando.']
    ], [
      ['Mergulho no banco ou cadeira', 0, 1, 'Cotovelos para trás; desça até 90°.'],
      ['Flexão diamante', 1, 2, 'Mãos juntas; cotovelos rentes ao corpo.'],
      ['Tríceps francês com halter ou mochila', 0, 2, 'Cotovelos para cima.'],
      ['Mergulho no banco com pés elevados', 2, 2, 'Amplitude completa.'],
      ['Tríceps coice com halter ou garrafa', 0, 1, 'Braço colado ao corpo.']
    ]] },
    core: { parts: [[
      ['Prancha', 0, 2, 'Corpo em linha reta; abdômen e glúteos contraídos.', 't'],
      ['Abdominal crunch no chão', 0, 1, 'Suba só as escápulas; lombar apoiada.'],
      ['Elevação de pernas deitado', 0, 1, 'Lombar colada ao chão.'],
      ['Prancha lateral', 0, 2, 'Quadril alto; corpo em linha reta.', 't'],
      ['Dead bug', 0, 1, 'Lombar no chão; alterne braço e perna oposta.'],
      ['Bird dog', 0, 1, 'Estenda braço e perna opostos sem girar o quadril.'],
      ['Russian twist', 1, 2, 'Pés elevados; gire o tronco.'],
      ['Mountain climbers', 1, 2, 'Quadril baixo; alterne os joelhos rápido.', 't'],
      ['Hollow hold', 2, 2, 'Lombar colada; braços e pernas estendidos.', 't'],
      ['Abdominal bicicleta', 1, 2, 'Cotovelo ao joelho oposto, devagar.'],
      ['Prancha com toque no ombro', 2, 2, 'Quadril estável; alterne as mãos.']
    ]] },
    corpo: { parts: [[
      ['Agachamento livre', 0, 0, 'Tronco ereto; desça até 90°.'],
      ['Flexão adaptada (joelhos ou mãos elevadas)', 0, 0, 'Corpo alinhado; amplitude completa.'],
      ['Remada com mochila ou halteres', 0, 1, 'Coluna neutra; cotovelos para trás.'],
      ['Afundo alternado', 0, 1, 'Passo longo; tronco ereto.'],
      ['Prancha', 0, 0, 'Corpo em linha reta.', 't'],
      ['Burpee sem flexão', 0, 0, 'Agache, jogue os pés para trás e volte em pé.'],
      ['Flexão tradicional', 1, 2, 'Mãos sob os ombros, abdômen firme.'],
      ['Agachamento com salto', 1, 2, 'Aterrisse suave.'],
      ['Remada invertida sob a mesa', 1, 2, 'Corpo reto; puxe o peito à borda.'],
      ['Agachamento búlgaro (pé no sofá)', 1, 2, 'Desça reto; empurre com a perna da frente.'],
      ['Burpee completo', 1, 2, 'Com flexão e salto no final.'],
      ['Prancha com toque no ombro', 1, 2, 'Quadril estável.'],
      ['Flexão pike', 2, 2, 'Quadril alto em V.'],
      ['Mountain climbers', 0, 2, 'Quadril baixo; alterne os joelhos rápido.', 't']
    ]] }
  };

  /* mobilidade (sem equipamento, igual para os dois locais) */
  var MOB = [
    ['Gato-vaca (cat-cow)', 'Alterne arredondar e arquear a coluna, respirando fundo.'],
    ['Rotação torácica (quatro apoios)', 'Mão atrás da cabeça; gire o tronco abrindo o cotovelo.'],
    ['Alongamento de peitoral na porta', 'Antebraço no batente; avance o corpo até sentir abrir o peito.'],
    ['Alongamento de ombro (braço cruzado)', 'Puxe o braço contra o peito, sem elevar o ombro.'],
    ['Alongamento de quadríceps em pé', 'Calcanhar ao glúteo; joelhos juntos.'],
    ['Alongamento de posteriores sentado', 'Perna estendida; incline o tronco com a coluna longa.'],
    ['Alongamento de glúteo (figura 4)', 'Tornozelo sobre o joelho oposto; puxe a coxa em direção ao peito.'],
    ['Alongamento de panturrilha na parede', 'Calcanhar no chão, perna de trás estendida.'],
    ['Alongamento de flexores do quadril', 'Em avanço baixo, empurre o quadril à frente.'],
    ['Postura da criança', 'Sente sobre os calcanhares e estenda os braços à frente.'],
    ['Torção deitada', 'Joelhos para um lado, ombros no chão; respire.']
  ];

  /* ------------------------------ cardio ------------------------------ */
  var C = [
    // academia
    { id: 'esteira-inclinada', place: 'gym', tag: 'Contínuo', name: 'Esteira: caminhada inclinada', mins: [20, 30, 40], met: 5.5, dist: true,
      how: ['Inclinação 4–6% e 4,5–5,5 km/h. Ritmo em que dá para conversar.', 'Inclinação 6–10% e 5,5–6,5 km/h. Sem segurar no corrimão.', 'Inclinação 10–12% e 6–6,5 km/h. Sem segurar no corrimão.'] },
    { id: 'esteira-corrida', place: 'gym', tag: 'Contínuo', name: 'Esteira: corrida', mins: [15, 25, 40], met: 8.5, dist: true,
      how: ['Alterne 1 min de trote leve e 2 min de caminhada, repetindo até completar o tempo.', 'Corrida contínua em ritmo confortável (dá para falar frases curtas).', 'Corrida contínua em ritmo moderado; nos últimos 5 min suba 0,5–1 km/h.'] },
    { id: 'esteira-intervalado', place: 'gym', tag: 'Intervalado', name: 'Esteira: intervalado 1:1', mins: [15, 20, 25], met: 9, dist: true,
      how: ['Alterne 1 min de trote com 1 min de caminhada. 5 min de aquecimento antes.', 'Alterne 1 min forte (esforço 8/10) e 1 min leve. 5 min de aquecimento antes.', 'Alterne 1 min forte (9/10) e 1 min leve, com 5 tiros de 30 s ao final. 5 min de aquecimento antes.'] },
    { id: 'bike-continua', place: 'gym', tag: 'Contínuo', name: 'Bicicleta ergométrica contínua', mins: [20, 30, 45], met: 6.8, dist: true,
      how: ['Carga leve; 70–80 rpm; esforço 4–5/10.', 'Carga moderada; 80–90 rpm; esforço 5–6/10.', 'Carga moderada a alta; 85–95 rpm; esforço 6–7/10.'] },
    { id: 'bike-hiit', place: 'gym', tag: 'HIIT', name: 'Bicicleta: HIIT 30/30', mins: [12, 16, 20], met: 9.5,
      how: ['30 s forte (7/10) e 60 s leve, repetindo. 3 min de aquecimento e 3 min de volta à calma.', '30 s forte (8/10) e 30 s leve, repetindo. 3 min de aquecimento e 3 min de volta à calma.', '30 s all-out (9/10) e 30 s leve, repetindo. 3 min de aquecimento e 3 min de volta à calma.'] },
    { id: 'eliptico', place: 'gym', tag: 'Contínuo', name: 'Elíptico (baixo impacto)', mins: [20, 30, 40], met: 5.5,
      how: ['Resistência baixa; ritmo confortável.', 'Resistência média; alterne 2 min mais forte e 3 min leve.', 'Resistência média/alta; alterne 1 min forte e 2 min leve.'] },
    { id: 'remo', place: 'gym', tag: 'Intervalado', name: 'Remo ergométrico', mins: [10, 20, 30], met: 7, dist: true,
      how: ['Séries de 2 min de remada leve com 1 min de descanso. Foque na técnica (pernas, tronco, braços).', 'Séries de 3 min de remada moderada com 1 min de descanso.', 'Séries de 4 min de remada forte com 1 min de descanso.'] },
    { id: 'escada', place: 'gym', tag: 'Contínuo', name: 'Simulador de escada', mins: [10, 20, 30], met: 8.8,
      how: ['Ritmo leve, sem apoiar o peso nos braços.', 'Ritmo moderado, sem apoiar o peso nos braços.', 'Ritmo forte; alterne 2 min rápido e 2 min moderado.'] },
    { id: 'circuito-cardio-gym', place: 'gym', tag: 'Circuito', name: 'Circuito de cardio (esteira, bike, remo, elíptico)', mins: [20, 28, 36], met: 7,
      how: ['2 voltas: 3 min em cada aparelho, trocando sem descanso.', '2 voltas: 3,5 min em cada aparelho, trocando sem descanso.', '3 voltas: 3 min em cada aparelho, trocando sem descanso.'] },
    // casa
    { id: 'rua-caminhada-corrida', place: 'home', tag: 'Contínuo', name: 'Caminhada ou corrida na rua', mins: [20, 30, 40], met: 7, dist: true,
      how: ['Caminhada rápida; a cada 5 min troque 1 min por trote leve.', 'Alterne 3 min de trote e 1 min de caminhada.', 'Corrida contínua em ritmo moderado.'] },
    { id: 'corda', place: 'home', tag: 'Intervalado', name: 'Pular corda intervalado', mins: [10, 15, 20], met: 11,
      how: ['30 s pulando e 30 s de descanso (se não tiver corda, imite o movimento).', '45 s pulando e 15 s de descanso.', '1 min pulando e 15 s de descanso, com variações (alternado, corrida no lugar).'] },
    { id: 'tabata', place: 'home', tag: 'HIIT', name: 'Tabata sem equipamento', mins: [12, 16, 20], met: 9,
      how: ['20 s de esforço e 40 s de descanso: agachamento, polichinelo, corrida no lugar, prancha.', '20 s de esforço e 10 s de descanso: agachamento com salto, mountain climber, polichinelo, burpee sem flexão.', '20 s de esforço máximo e 10 s de descanso: burpee completo, agachamento com salto, mountain climber, skater.'] },
    { id: 'baixo-impacto', place: 'home', tag: 'Baixo impacto', name: 'Circuito baixo impacto (sem pulos)', mins: [15, 22, 30], met: 5,
      how: ['Marcha no lugar, step lateral, agachamento e elevação de joelhos: 40 s cada, 20 s de pausa.', 'Os mesmos movimentos, 45 s cada, 15 s de pausa, com braços ativos.', 'Os mesmos movimentos, 50 s cada, 10 s de pausa, com mochila leve.'] },
    { id: 'emom', place: 'home', tag: 'Intervalado', name: 'EMOM: polichinelo e agachamento', mins: [10, 15, 20], met: 8,
      how: ['A cada minuto, alterne: 20 polichinelos e 10 agachamentos; descanse o que sobrar.', 'A cada minuto, alterne: 30 polichinelos e 15 agachamentos.', 'A cada minuto, alterne: 12 burpees e 20 agachamentos com salto.'] },
    { id: 'boxe', place: 'home', tag: 'Intervalado', name: 'Boxe de sombra', mins: [12, 18, 24], met: 7,
      how: ['Rounds de 2 min com 1 min de descanso: jab, direto e esquiva.', 'Rounds de 3 min com 1 min de descanso: combinações de 3–4 golpes.', 'Rounds de 3 min com 45 s de descanso: combinações e deslocamento constante.'] },
    { id: 'escada-predio', place: 'home', tag: 'Contínuo', name: 'Subir e descer escadas', mins: [10, 15, 20], met: 8,
      how: ['Suba em ritmo leve e desça caminhando.', 'Suba em ritmo moderado, desça caminhando; sem pausas longas.', 'Suba de dois em dois degraus em parte do trajeto; desça com controle.'] },
    { id: 'danca', place: 'home', tag: 'Contínuo', name: 'Dança ou aeróbico livre', mins: [20, 30, 45], met: 5.5,
      how: ['Coloque músicas animadas e mantenha o corpo em movimento.', 'Mantenha o ritmo; alterne 1 música intensa e 1 leve.', 'Alterne 2 músicas intensas e 1 leve.'] }
  ];

  /* ------------------------------ utilidades ------------------------------ */
  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  var ISO = /rosca|extensora|flexora|crucifixo|eleva[cç][aã]o lateral|eleva[cç][aã]o frontal|tr[ií]ceps|polia|panturrilha|abdutora|abdu[cç][aã]o|encolhimento|face pull|peck|crossover|pullover|coice|kickback|inverso|abdominal|franc[eê]s|bicicleta|russian|superman/i;
  var SCHEME = {
    forca: { sets: [3, 4, 4], reps: ['6-8', '5-6', '3-5'], rest: [90, 120, 150], isoReps: ['8-10', '8-10', '6-8'], isoRest: 75 },
    hiper: { sets: [3, 3, 4], reps: ['10-12', '8-12', '8-12'], rest: [75, 75, 90], isoReps: ['12-15', '10-15', '10-15'], isoRest: 60 },
    resist: { sets: [2, 3, 3], reps: ['15', '15-20', '15-20'], rest: [45, 40, 30], isoReps: ['15-20', '15-20', '20'], isoRest: 30 }
  };
  var HOME_FORCA_REPS = ['8-10', '8-10', '6-8'];
  var TIMED = [30, 45, 60];
  var COUNT = [5, 6, 7];

  function pick(list, level, n) {
    var ok = list.filter(function (e) { return e[1] <= level && level <= e[2]; });
    if (ok.length < n) list.forEach(function (e) { if (ok.length < n && ok.indexOf(e) < 0 && e[1] <= level) ok.push(e); });
    return ok.slice(0, n);
  }
  function parseLow(reps) { var m = /\d+/.exec(String(reps)); return m ? Number(m[0]) : 10; }

  function build(group, place, level, style) {
    if (group === 'cardio') return null;
    var g = GROUPS.filter(function (x) { return x.id === group; })[0]; if (!g) return null;
    level = Math.max(0, Math.min(2, level | 0));
    if (group === 'mobilidade') {
      var exs = MOB.slice(0, [8, 9, 11][level]).map(function (m) {
        return { id: slug(m[0]), name: m[0], cue: m[1], timed: true, sets: level === 0 ? 1 : 2, secs: 30, rest: 10, iso: true };
      });
      return finish({ key: [group, place, level, 'mob'].join('.'), name: 'Mobilidade e alongamento', group: group, place: place, level: level, style: 'mob', kind: 'mobility', exs: exs, met: 2.5 });
    }
    style = SCHEME[style] ? style : 'hiper';
    var pool = (G[place] || G.gym)[group]; if (!pool) return null;
    var n = COUNT[level], chosen;
    if (pool.parts.length === 2) {
      var a = Math.ceil(n * 0.55); chosen = pick(pool.parts[0], level, a).concat(pick(pool.parts[1], level, n - a));
    } else chosen = pick(pool.parts[0], level, n);
    var sc = SCHEME[style];
    var list = chosen.map(function (e) {
      var timed = e[4] === 't', iso = ISO.test(e[0]);
      var reps = iso ? sc.isoReps[level] : (place === 'home' && style === 'forca' ? HOME_FORCA_REPS[level] : sc.reps[level]);
      return { id: slug(e[0]), name: e[0], cue: e[3], timed: timed, iso: iso, sets: sc.sets[level] - (iso && style === 'forca' ? 1 : 0),
        reps: timed ? null : reps, secs: timed ? TIMED[level] * (style === 'forca' ? 1.2 : style === 'resist' ? 0.8 : 1) | 0 : null, rest: iso ? sc.isoRest : sc.rest[level] };
    });
    return finish({ key: [group, place, level, style].join('.'), name: g.name + ' · ' + STYLES[style].name, group: group, place: place, level: level, style: style, kind: 'strength', exs: list, met: STYLES[style].met });
  }
  function finish(w) {
    var sec = 5 * 60;
    w.exs.forEach(function (e) { sec += e.sets * ((e.timed ? e.secs : 40) + e.rest); });
    w.mins = Math.max(10, Math.round(sec / 60 / 5) * 5);
    return w;
  }
  function cardioList(place) { return C.filter(function (c) { return c.place === place; }); }
  function cardio(id, level) {
    var c = C.filter(function (x) { return x.id === id; })[0]; if (!c) return null;
    level = Math.max(0, Math.min(2, level | 0));
    return { key: 'cardio.' + id + '.' + level, name: c.name, group: 'cardio', place: c.place, level: level, style: slug(c.tag), tag: c.tag, kind: 'cardio', exs: [], mins: c.mins[level], how: c.how[level], met: c.met, dist: !!c.dist };
  }
  function nameOf(exId) { // nome legível a partir de qualquer id (para o histórico)
    return null;
  }

  window.Treinos = {
    LEVELS: LEVELS, PLACES: PLACES, STYLES: STYLES, GROUPS: GROUPS, build: build, cardioList: cardioList, cardio: cardio, parseLow: parseLow, slug: slug, nameOf: nameOf,
    WARMUP: 'Aquecimento (5 min): caminhada leve, bicicleta ou polichinelos; depois 1 ou 2 séries leves do primeiro exercício.',
    COOLDOWN: 'Volta à calma: 3–5 min de caminhada leve e alongamento dos músculos trabalhados.',
    LEVEL_TIPS: ['Priorize a técnica: use cargas leves e pare 2–3 repetições antes da falha.', 'Aumente a carga quando completar todas as séries no topo das repetições, parando a ~1–2 repetições da falha.', 'Varie a carga semana a semana, alterne semanas pesadas e leves, e descanse bem entre as sessões do mesmo músculo.']
  };
})();
