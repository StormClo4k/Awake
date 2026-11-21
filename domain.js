"use strict";
var Domain = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/domain/index.ts
  var index_exports = {};
  __export(index_exports, {
    ACHIEVEMENTS: () => ACHIEVEMENTS,
    ATTRIBUTES: () => ATTRIBUTES,
    ATTRIBUTE_IDS: () => ATTRIBUTE_IDS,
    MAX_ATTRIBUTE_LEVEL: () => MAX_ATTRIBUTE_LEVEL,
    MAX_LEVEL: () => MAX_LEVEL,
    MAX_MISSION_XP: () => MAX_MISSION_XP,
    MIN_MISSION_XP: () => MIN_MISSION_XP,
    RANKS: () => RANKS,
    RARITY_COLOR: () => RARITY_COLOR,
    RARITY_LABEL: () => RARITY_LABEL,
    REWARD_PRESETS: () => REWARD_PRESETS,
    achievementById: () => achievementById,
    achievementProgress: () => achievementProgress,
    addDays: () => addDays,
    addMission: () => addMission,
    addProgress: () => addProgress,
    attributeProgress: () => attributeProgress,
    attributeXpToNext: () => attributeXpToNext,
    buildMission: () => buildMission,
    checkRank: () => checkRank,
    completeMission: () => completeMission,
    createInitialState: () => createInitialState,
    dailyMissions: () => dailyMissions,
    dayKey: () => dayKey,
    dayNumber: () => dayNumber,
    deriveStats: () => deriveStats,
    emptyAttributeXp: () => emptyAttributeXp,
    evaluateRankIndex: () => evaluateRankIndex,
    expireMissions: () => expireMissions,
    isAchieved: () => isAchieved,
    isMissionDone: () => isMissionDone,
    isMissionExpired: () => isMissionExpired,
    lastDays: () => lastDays,
    levelFromXp: () => levelFromXp,
    levelProgress: () => levelProgress,
    maybeSpawnEmergency: () => maybeSpawnEmergency,
    missionProgress: () => missionProgress,
    missionRatio: () => missionRatio,
    newId: () => newId,
    nextAchievement: () => nextAchievement,
    nextRank: () => nextRank,
    pendingDaily: () => pendingDaily,
    pendingMissions: () => pendingMissions,
    periodKey: () => periodKey,
    playerLevel: () => playerLevel,
    rankById: () => rankById,
    removeMission: () => removeMission,
    splitXp: () => splitXp,
    suggestedXp: () => suggestedXp,
    totalXpForLevel: () => totalXpForLevel,
    validateMissionInput: () => validateMissionInput,
    verifyState: () => verifyState,
    weekKey: () => weekKey,
    xpByDay: () => xpByDay,
    xpToNextLevel: () => xpToNextLevel,
    xpToday: () => xpToday,
    SEASON_PLANS: () => SEASON_PLANS,
    SEASON_TIERS: () => SEASON_TIERS,
    SEASON_DAYS_GOAL: () => SEASON_DAYS_GOAL,
    addReward: () => addReward,
    availableTitles: () => availableTitles,
    bossHp: () => bossHp,
    buyReward: () => buyReward,
    coinBalance: () => coinBalance,
    coinsForXp: () => coinsForXp,
    currentTitle: () => currentTitle,
    isMissionScheduled: () => isMissionScheduled,
    maybeSpawnBoss: () => maybeSpawnBoss,
    normalizeState: () => normalizeState,
    removeReward: () => removeReward,
    saveJournal: () => saveJournal,
    seasonProgress: () => seasonProgress,
    setFrame: () => setFrame,
    setTitle: () => setTitle,
    startSeason: () => startSeason,
    streaks: () => streaks,
    toggleRestDay: () => toggleRestDay,
    undoCompletion: () => undoCompletion,
    updateMission: () => updateMission,
    updateSeason: () => updateSeason,
    ATTRIBUTE_RANK_LEVELS: () => ATTRIBUTE_RANK_LEVELS,
    addGoal: () => addGoal,
    attributeRank: () => attributeRank,
    attributeXpForLevel: () => attributeXpForLevel,
    goalProgress: () => goalProgress,
    isMissionLocked: () => isMissionLocked,
    parseDay: () => parseDay,
    removeGoal: () => removeGoal,
    reviewDue: () => reviewDue,
    saveReview: () => saveReview,
    toggleSubtask: () => toggleSubtask,
    updateGoals: () => updateGoals,
    weekSummary: () => weekSummary,
    completeWorkout: () => completeWorkout,
    workoutBonus: () => workoutBonus,
    liftKey: () => liftKey,
    maybeSpawnTrainingBoss: () => maybeSpawnTrainingBoss
  });

  // src/domain/achievements.ts
  var RARITY_COLOR = {
    common: "#8A94A6",
    uncommon: "#5CC8A1",
    rare: "#4DA3FF",
    epic: "#A78BFA",
    legendary: "#FFD166"
  };
  var RARITY_LABEL = {
    common: "Comum",
    uncommon: "Incomum",
    rare: "Rara",
    epic: "\xC9pica",
    legendary: "Lend\xE1ria"
  };
  var ACHIEVEMENTS = [
    { id: "primeiro-despertar", name: "Primeiro Despertar", description: "Conclua sua primeira miss\xE3o.", rarity: "common", icon: "\u263C", rewardXp: 25, metric: "missionsCompleted", target: 1 },
    { id: "discipulo", name: "Disc\xEDpulo", description: "Evolua por 7 dias seguidos.", rarity: "uncommon", icon: "\u26EC", rewardXp: 100, metric: "bestStreak", target: 7 },
    { id: "nivel-10", name: "Em Ascens\xE3o", description: "Alcance o n\xEDvel 10.", rarity: "uncommon", icon: "\u25B2", rewardXp: 150, metric: "level", target: 10 },
    { id: "cacador-metas", name: "Ca\xE7ador de Metas", description: "Conclua 50 objetivos.", rarity: "rare", icon: "\u25CE", rewardXp: 250, metric: "missionsCompleted", target: 50 },
    { id: "incansavel", name: "Incans\xE1vel", description: "Complete 30 dias de atividades.", rarity: "rare", icon: "\u221E", rewardXp: 300, metric: "activeDays", target: 30 },
    { id: "guerreiro", name: "Guerreiro", description: "Complete 50 treinos.", rarity: "rare", icon: "\u2694", rewardXp: 300, metric: "trainings", target: 50 },
    { id: "nivel-25", name: "Veterano", description: "Alcance o n\xEDvel 25.", rarity: "rare", icon: "\u25B2\u25B2", rewardXp: 400, metric: "level", target: 25 },
    { id: "intelectual", name: "Intelectual", description: "Acumule 100 horas de estudo.", rarity: "epic", icon: "\u2727", rewardXp: 500, metric: "studyHours", target: 100 },
    { id: "maratonista", name: "Maratonista", description: "Evolua por 30 dias seguidos.", rarity: "epic", icon: "\u26A1", rewardXp: 600, metric: "bestStreak", target: 30 },
    { id: "ritual", name: "Ritual", description: "Complete 100 dias de atividades.", rarity: "epic", icon: "\u262F", rewardXp: 700, metric: "activeDays", target: 100 },
    { id: "centuriao", name: "Centuri\xE3o", description: "Conclua 200 miss\xF5es.", rarity: "epic", icon: "\u269C", rewardXp: 800, metric: "missionsCompleted", target: 200 },
    { id: "nivel-50", name: "Meio Caminho", description: "Alcance o n\xEDvel 50.", rarity: "epic", icon: "\u25C6", rewardXp: 1e3, metric: "level", target: 50 },
    { id: "ascensao", name: "Ascens\xE3o", description: "Alcance o Rank S.", rarity: "epic", icon: "\u2739", rewardXp: 1e3, metric: "rankIndex", target: 5 },
    { id: "monarca", name: "Monarca", description: "Alcance o ranking m\xE1ximo.", rarity: "legendary", icon: "\u265B", rewardXp: 5e3, metric: "rankIndex", target: 8 },
    { id: "recompensado", name: "Merecido", description: "Resgate sua primeira recompensa na loja.", rarity: "common", icon: "\u25C8", rewardXp: 30, metric: "purchases", target: 1 },
    { id: "cacador-chefes", name: "Ca\xE7ador de Chefes", description: "Derrote seu primeiro chefe semanal.", rarity: "uncommon", icon: "\u2620", rewardXp: 150, metric: "bossesDefeated", target: 1 },
    { id: "diarista", name: "Diarista", description: "Escreva 7 anota\xE7\xF5es no di\xE1rio.", rarity: "uncommon", icon: "\u270E", rewardXp: 100, metric: "journalCount", target: 7 },
    { id: "volta-por-cima", name: "Volta por Cima", description: "Retome a evolu\xE7\xE3o depois de 7 dias parado.", rarity: "rare", icon: "\u21BA", rewardXp: 200, metric: "comebacks", target: 1 },
    { id: "foco-profundo", name: "Foco Profundo", description: "Complete 10 sess\xF5es de foco.", rarity: "rare", icon: "\u25C9", rewardXp: 300, metric: "focusSessions", target: 10 },
    { id: "semana-perfeita", name: "Semana Perfeita", description: "Evolua nos 7 dias de uma mesma semana.", rarity: "epic", icon: "\u2606", rewardXp: 500, metric: "perfectWeeks", target: 1 },
    { id: "equilibrio", name: "Equil\xEDbrio", description: "Todos os atributos no n\xEDvel 10.", rarity: "epic", icon: "\u2726", rewardXp: 700, metric: "minAttributeLevel", target: 10 },
    { id: "exterminador", name: "Exterminador", description: "Derrote 10 chefes semanais.", rarity: "epic", icon: "\u2716", rewardXp: 900, metric: "bossesDefeated", target: 10 },
    { id: "meta-cumprida", name: "Meta Cumprida", description: "Alcance uma meta de atributo que voc\xEA definiu.", rarity: "uncommon", icon: "\u2691", rewardXp: 150, metric: "goalsDone", target: 1 },
    { id: "revisor", name: "Revisor", description: "Fa\xE7a 4 revis\xF5es semanais.", rarity: "uncommon", icon: "\u2630", rewardXp: 150, metric: "reviewsCount", target: 4 },
    { id: "corrente", name: "Corrente", description: "Conclua 3 miss\xF5es que dependiam de outra.", rarity: "rare", icon: "\u26D3", rewardXp: 200, metric: "chainSteps", target: 3 },
    { id: "mestre-atributo", name: "Mestre de Atributo", description: "Alcance o Rank S em qualquer atributo.", rarity: "epic", icon: "\u272A", rewardXp: 600, metric: "bestAttributeRank", target: 5 },
    { id: "treino-registrado", name: "Treino Registrado", description: "Termine seu primeiro treino pela aba Treino.", rarity: "common", icon: "\u25B6", rewardXp: 40, metric: "workoutsTotal", target: 1 },
    { id: "mes-de-ferro", name: "M\xEAs de Ferro", description: "Fa\xE7a 10 treinos no mesmo m\xEAs.", rarity: "rare", icon: "\u2692", rewardXp: 250, metric: "workoutsInMonth", target: 10 },
    { id: "mes-inabalavel", name: "M\xEAs Inabal\xE1vel", description: "Fa\xE7a 20 treinos no mesmo m\xEAs.", rarity: "epic", icon: "\u2655", rewardXp: 600, metric: "workoutsInMonth", target: 20 },
    { id: "supino-60", name: "Supino 60", description: "Levante 60 kg no supino.", rarity: "uncommon", icon: "\u2694", rewardXp: 150, metric: "benchKg", target: 60 },
    { id: "supino-100", name: "100 kg no Supino", description: "Levante 100 kg no supino.", rarity: "epic", icon: "\u2694", rewardXp: 500, metric: "benchKg", target: 100 },
    { id: "agachamento-100", name: "100 kg no Agachamento", description: "Agache com 100 kg.", rarity: "rare", icon: "\u265E", rewardXp: 350, metric: "squatKg", target: 100 },
    { id: "terra-120", name: "Terra Pesado", description: "Levante 120 kg no levantamento terra.", rarity: "rare", icon: "\u2B22", rewardXp: 350, metric: "deadliftKg", target: 120 },
    { id: "toneladas-10", name: "Dez Toneladas", description: "Acumule 10 toneladas de volume levantado.", rarity: "uncommon", icon: "\u2696", rewardXp: 150, metric: "liftedTons", target: 10 },
    { id: "toneladas-100", name: "Cem Toneladas", description: "Acumule 100 toneladas de volume levantado.", rarity: "rare", icon: "\u2696", rewardXp: 400, metric: "liftedTons", target: 100 },
    { id: "cardio-10h", name: "F\xF4lego de A\xE7o", description: "Acumule 10 horas de cardio.", rarity: "uncommon", icon: "\u2665", rewardXp: 150, metric: "cardioHours", target: 10 },
    { id: "cardio-50h", name: "Cora\xE7\xE3o de Tit\xE3", description: "Acumule 50 horas de cardio.", rarity: "epic", icon: "\u2665", rewardXp: 600, metric: "cardioHours", target: 50 },
    { id: "quebra-recordes", name: "Quebra-Recordes", description: "Bata 10 recordes de carga nos treinos.", rarity: "rare", icon: "\u2605", rewardXp: 300, metric: "workoutPRs", target: 10 },
    { id: "quebra-tita", name: "Quebra-Tit\xE3", description: "Derrote um chefe de treino.", rarity: "uncommon", icon: "\u2620", rewardXp: 200, metric: "trainingBossesDefeated", target: 1 }
  ];
  var achievementById = (id) => ACHIEVEMENTS.find((a) => a.id === id);
  var achievementProgress = (a, stats) => ({
    current: Math.min(stats[a.metric], a.target),
    target: a.target
  });
  var isAchieved = (a, stats) => stats[a.metric] >= a.target;

  // src/domain/attributes.ts
  var ATTRIBUTE_IDS = [
    "forca",
    "inteligencia",
    "disciplina",
    "vitalidade",
    "foco",
    "carisma"
  ];
  var ATTRIBUTES = {
    forca: {
      id: "forca",
      name: "For\xE7a",
      short: "FOR",
      description: "Exerc\xEDcios f\xEDsicos, muscula\xE7\xE3o e condicionamento.",
      color: "#FF5A5F",
      glyph: "\u2694"
    },
    inteligencia: {
      id: "inteligencia",
      name: "Intelig\xEAncia",
      short: "INT",
      description: "Estudos, programa\xE7\xE3o, cursos e aprendizado.",
      color: "#4DA3FF",
      glyph: "\u2727"
    },
    disciplina: {
      id: "disciplina",
      name: "Disciplina",
      short: "DIS",
      description: "Cumprimento de h\xE1bitos e compromissos.",
      color: "#A78BFA",
      glyph: "\u26EC"
    },
    vitalidade: {
      id: "vitalidade",
      name: "Vitalidade",
      short: "VIT",
      description: "Sono, alimenta\xE7\xE3o e cuidados pessoais.",
      color: "#34D399",
      glyph: "\u271A"
    },
    foco: {
      id: "foco",
      name: "Foco",
      short: "FOC",
      description: "Concentra\xE7\xE3o, leitura e execu\xE7\xE3o de tarefas.",
      color: "#FBBF24",
      glyph: "\u25CE"
    },
    carisma: {
      id: "carisma",
      name: "Carisma",
      short: "CAR",
      description: "Comunica\xE7\xE3o, socializa\xE7\xE3o e desenvolvimento interpessoal.",
      color: "#F472B6",
      glyph: "\u2756"
    }
  };
  var emptyAttributeXp = () => ({
    forca: 0,
    inteligencia: 0,
    disciplina: 0,
    vitalidade: 0,
    foco: 0,
    carisma: 0
  });

  // src/domain/dates.ts
  var pad = (n) => String(n).padStart(2, "0");
  function dayKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function weekKey(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const offset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - offset);
    return dayKey(d);
  }
  function dayNumber(key) {
    const [y, m, d] = key.split("-").map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / 864e5);
  }
  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
  function lastDays(end, count) {
    const out = [];
    for (let i = count - 1; i >= 0; i--) out.push(dayKey(addDays(end, -i)));
    return out;
  }

  // src/domain/ranks.ts
  var req = (r) => ({
    minLevel: 1,
    minActiveDays: 0,
    minAchievements: 0,
    minAttributeLevel: 1,
    requiredAchievements: [],
    ...r
  });
  var RANKS = [
    {
      id: "E",
      name: "Rank E",
      title: "Despertar",
      color: "#8A94A6",
      emblem: "E",
      description: "O sistema reconheceu voc\xEA. A jornada come\xE7a agora.",
      requirements: req({})
    },
    {
      id: "D",
      name: "Rank D",
      title: "Iniciante",
      color: "#5CC8A1",
      emblem: "D",
      description: "Os primeiros h\xE1bitos tomam forma. Voc\xEA j\xE1 n\xE3o \xE9 o mesmo.",
      requirements: req({ minLevel: 5, minActiveDays: 3 })
    },
    {
      id: "C",
      name: "Rank C",
      title: "Combatente",
      color: "#4DA3FF",
      emblem: "C",
      description: "Const\xE2ncia come\xE7a a virar identidade.",
      requirements: req({ minLevel: 12, minActiveDays: 14, minAchievements: 1 })
    },
    {
      id: "B",
      name: "Rank B",
      title: "Elite",
      color: "#A78BFA",
      emblem: "B",
      description: "Poucos chegam at\xE9 aqui sem desistir.",
      requirements: req({ minLevel: 22, minActiveDays: 45, minAchievements: 3, minAttributeLevel: 3 })
    },
    {
      id: "A",
      name: "Rank A",
      title: "Especialista",
      color: "#F59E0B",
      emblem: "A",
      description: "Dom\xEDnio t\xE9cnico e disciplina em equil\xEDbrio.",
      requirements: req({ minLevel: 35, minActiveDays: 100, minAchievements: 5, minAttributeLevel: 6 })
    },
    {
      id: "S",
      name: "Rank S",
      title: "Supremo",
      color: "#EF4444",
      emblem: "S",
      description: "Seu nome \xE9 respeitado dentro do sistema.",
      requirements: req({
        minLevel: 50,
        minActiveDays: 180,
        minAchievements: 6,
        minAttributeLevel: 10,
        requiredAchievements: ["incansavel"]
      })
    },
    {
      id: "SS",
      name: "Rank SS",
      title: "Lend\xE1rio",
      color: "#EC4899",
      emblem: "SS",
      description: "Uma lenda constru\xEDda um dia de cada vez.",
      requirements: req({ minLevel: 70, minActiveDays: 365, minAchievements: 8, minAttributeLevel: 20 })
    },
    {
      id: "SSS",
      name: "Rank SSS",
      title: "Transcendente",
      color: "#22D3EE",
      emblem: "SSS",
      description: "Voc\xEA ultrapassou o que achava poss\xEDvel.",
      requirements: req({ minLevel: 90, minActiveDays: 600, minAchievements: 10, minAttributeLevel: 30 })
    },
    {
      id: "MONARCA",
      name: "MONARCA",
      title: "O \xE1pice da evolu\xE7\xE3o",
      color: "#FFD166",
      emblem: "\u265B",
      description: "O trono \xE9 de quem nunca parou de evoluir.",
      requirements: req({
        minLevel: 100,
        minActiveDays: 900,
        minAchievements: 12,
        minAttributeLevel: 40,
        requiredAchievements: ["ascensao"]
      })
    }
  ];
  var rankById = (id) => RANKS.find((r) => r.id === id);
  function checkRank(rank, stats, unlockedIds) {
    const r = rank.requirements;
    const checks = [
      { label: "N\xEDvel", current: stats.level, target: r.minLevel, met: stats.level >= r.minLevel },
      {
        label: "Dias de evolu\xE7\xE3o",
        current: stats.activeDays,
        target: r.minActiveDays,
        met: stats.activeDays >= r.minActiveDays
      }
    ];
    if (r.minAchievements > 0) {
      checks.push({
        label: "Conquistas",
        current: stats.unlockedCount,
        target: r.minAchievements,
        met: stats.unlockedCount >= r.minAchievements
      });
    }
    if (r.minAttributeLevel > 1) {
      checks.push({
        label: "Todos os atributos no n\xEDvel",
        current: stats.minAttributeLevel,
        target: r.minAttributeLevel,
        met: stats.minAttributeLevel >= r.minAttributeLevel
      });
    }
    for (const id of r.requiredAchievements) {
      const met = unlockedIds.includes(id);
      checks.push({ label: `Conquista: ${id}`, current: met ? 1 : 0, target: 1, met });
    }
    return checks;
  }
  function evaluateRankIndex(stats, unlockedIds) {
    let idx = 0;
    for (let i = 1; i < RANKS.length; i++) {
      if (checkRank(RANKS[i], stats, unlockedIds).every((c) => c.met)) idx = i;
      else break;
    }
    return idx;
  }

  // src/domain/xp.ts
  var MAX_LEVEL = 100;
  function xpToNextLevel(level) {
    return Math.round(60 + 10 * Math.pow(level, 1.4));
  }
  var THRESHOLDS = (() => {
    const t = [0, 0];
    for (let l = 1; l < MAX_LEVEL; l++) t.push(t[l] + xpToNextLevel(l));
    return t;
  })();
  function totalXpForLevel(level) {
    return THRESHOLDS[Math.min(Math.max(level, 1), MAX_LEVEL)];
  }
  function levelProgress(totalXp) {
    const xp = Math.max(0, Math.floor(totalXp));
    let level = 1;
    while (level < MAX_LEVEL && xp >= THRESHOLDS[level + 1]) level++;
    if (level >= MAX_LEVEL) {
      return { level: MAX_LEVEL, xpIntoLevel: 0, xpForNext: 0, ratio: 1, isMax: true };
    }
    const xpIntoLevel = xp - THRESHOLDS[level];
    const xpForNext = xpToNextLevel(level);
    return { level, xpIntoLevel, xpForNext, ratio: xpIntoLevel / xpForNext, isMax: false };
  }
  var levelFromXp = (totalXp) => levelProgress(totalXp).level;
  var MAX_ATTRIBUTE_LEVEL = 50;
  function attributeXpToNext(level) {
    return Math.round(40 + 8 * Math.pow(level, 1.4));
  }
  var ATTR_THRESHOLDS = (() => {
    const t = [0, 0];
    for (let l = 1; l < MAX_ATTRIBUTE_LEVEL; l++) t.push(t[l] + attributeXpToNext(l));
    return t;
  })();
  function attributeProgress(xp) {
    const v = Math.max(0, Math.floor(xp));
    let level = 1;
    while (level < MAX_ATTRIBUTE_LEVEL && v >= ATTR_THRESHOLDS[level + 1]) level++;
    if (level >= MAX_ATTRIBUTE_LEVEL) {
      return { level, xpIntoLevel: 0, xpForNext: 0, ratio: 1, isMax: true };
    }
    const xpIntoLevel = v - ATTR_THRESHOLDS[level];
    const xpForNext = attributeXpToNext(level);
    return { level, xpIntoLevel, xpForNext, ratio: xpIntoLevel / xpForNext, isMax: false };
  }
  function splitXp(xp, attributes) {
    const out = {};
    if (attributes.length === 0) return out;
    const base = Math.floor(xp / attributes.length);
    const rest = xp - base * attributes.length;
    attributes.forEach((a, i) => {
      var _a;
      out[a] = ((_a = out[a]) != null ? _a : 0) + base + (i === 0 ? rest : 0);
    });
    return out;
  }
  var REWARD_PRESETS = {
    simpleTask: 10,
    dailyHabit: 20,
    studyHour: 50,
    fullWorkout: 60,
    weeklyMission: 200,
    specialMission: 500,
    bigAchievement: 1e3
  };
  var BASE_XP = {
    daily: REWARD_PRESETS.dailyHabit,
    weekly: REWARD_PRESETS.weeklyMission,
    special: REWARD_PRESETS.specialMission,
    emergency: 120
  };
  var DIFFICULTY_MULTIPLIER = {
    E: 0.5,
    D: 0.75,
    C: 1,
    B: 1.5,
    A: 2,
    S: 3
  };
  function suggestedXp(type, difficulty) {
    return Math.round(BASE_XP[type] * DIFFICULTY_MULTIPLIER[difficulty] / 5) * 5;
  }
  var MIN_MISSION_XP = 1;
  var MAX_MISSION_XP = 2e3;

  // src/domain/stats.ts
  function streaks(dayKeys, today, restDays) {
    if (dayKeys.length === 0) return { current: 0, best: 0 };
    const active = new Set(dayKeys.map(dayNumber));
    const rest = new Set((restDays || []).map(dayNumber));
    const nums = [...active].sort((a, b) => a - b);
    const first = nums[0];
    const last = nums[nums.length - 1];
    let best = 0;
    let run = 0;
    for (let n = first; n <= last; n++) {
      if (active.has(n)) {
        run++;
        if (run > best) best = run;
      } else if (!rest.has(n)) run = 0;
    }
    const todayNum = dayNumber(today);
    let current = 0;
    for (let n = todayNum; n >= first; n--) {
      if (active.has(n)) current++;
      else if (rest.has(n)) continue;
      else if (n === todayNum) continue;
      else break;
    }
    return { current, best };
  }
  function deriveStats(state, now = /* @__PURE__ */ new Date()) {
    const completions = state.completions;
    const days = completions.map((c) => c.day);
    const restDays = state.restDays || [];
    const { current, best } = streaks(days, dayKey(now), restDays);
    const attributeLevels = {};
    for (const id of ATTRIBUTE_IDS) attributeLevels[id] = attributeProgress(state.attributeXp[id]).level;
    const trainings = completions.filter((c) => c.attributes.includes("forca") && c.kind !== "workout" && c.bossKind !== "training").length + completions.filter((c) => c.kind === "workout" && c.wtype === "strength" && !c.linked).length;
    const wk = completions.filter((c) => c.kind === "workout");
    const perMonth = {};
    for (const c of wk) perMonth[c.day.slice(0, 7)] = (perMonth[c.day.slice(0, 7)] || 0) + 1;
    const bestLift = (k) => wk.reduce((mx, c) => Math.max(mx, c.lifts && c.lifts[k] || 0), 0);
    const studyMinutes = completions.filter((c) => c.attributes.includes("inteligencia")).reduce((sum, c) => sum + (c.durationMin || 0), 0);
    const uniq = [...new Set(days)].sort();
    const restN = new Set(restDays.map(dayNumber));
    let comebacks = 0;
    for (let i = 1; i < uniq.length; i++) {
      const a = dayNumber(uniq[i - 1]);
      const b = dayNumber(uniq[i]);
      let gap = 0;
      for (let n = a + 1; n < b; n++) if (!restN.has(n)) gap++;
      if (gap >= 7) comebacks++;
    }
    const byWeek = /* @__PURE__ */ new Map();
    for (const d of uniq) {
      const [y, m, dd] = d.split("-").map(Number);
      const wk = weekKey(new Date(y, m - 1, dd));
      byWeek.set(wk, (byWeek.get(wk) || 0) + 1);
    }
    const perfectWeeks = [...byWeek.values()].filter((n) => n >= 7).length;
    return {
      level: levelFromXp(state.totalXp),
      totalXp: state.totalXp,
      activeDays: new Set(days).size,
      currentStreak: current,
      bestStreak: best,
      missionsCompleted: completions.filter((c) => c.kind !== "workout").length,
      trainings,
      studyHours: Math.floor(studyMinutes / 60),
      unlockedCount: Object.keys(state.unlocked).length,
      rankIndex: state.rankIndex,
      minAttributeLevel: Math.min(...ATTRIBUTE_IDS.map((id) => attributeLevels[id])),
      attributeLevels,
      comebacks,
      perfectWeeks,
      bossesDefeated: completions.filter((c) => c.kind === "boss").length,
      trainingBossesDefeated: completions.filter((c) => c.kind === "boss" && c.bossKind === "training").length,
      workoutsTotal: wk.length,
      workoutsInMonth: Math.max(0, ...Object.values(perMonth)),
      liftedTons: Math.floor(wk.filter((c) => c.wtype === "strength").reduce((sum, c) => sum + (c.volume || 0), 0) / 1e3),
      cardioHours: Math.floor(wk.filter((c) => c.wtype === "cardio").reduce((sum, c) => sum + (c.durationMin || 0), 0) / 60),
      workoutPRs: wk.reduce((sum, c) => sum + (c.prs || 0), 0),
      benchKg: bestLift("supino"),
      squatKg: bestLift("agachamento"),
      deadliftKg: bestLift("terra"),
      purchases: (state.purchases || []).length,
      journalCount: (state.journal || []).filter((j) => j.text).length,
      focusSessions: completions.filter((c) => c.focus).length,
      goalsDone: (state.goals || []).filter((g) => g.doneAt).length,
      reviewsCount: (state.reviews || []).length,
      chainSteps: completions.filter((c) => c.chain).length,
      bestAttributeRank: Math.max(...ATTRIBUTE_IDS.map((id) => attributeRank(attributeLevels[id]).index))
    };
  }

  // src/domain/engine.ts
  var newId = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  function periodKey(type, now) {
    if (type === "daily") return dayKey(now);
    if (type === "weekly" || type === "boss") return weekKey(now);
    return "once";
  }
  function missionProgress(m, now) {
    return m.progress.periodKey === periodKey(m.type, now) ? m.progress.current : 0;
  }
  function isMissionDone(m, now) {
    return m.status === "completed" || missionProgress(m, now) >= m.target;
  }
  function isMissionExpired(m, now) {
    return m.status === "expired" || !!m.deadline && !isMissionDone(m, now) && new Date(m.deadline) < now;
  }
  function validateMissionInput(input) {
    if (!input.name.trim()) return "D\xEA um nome \xE0 miss\xE3o.";
    if (input.attributes.length === 0) return "Escolha ao menos um atributo.";
    if (input.xp !== void 0 && (input.xp < MIN_MISSION_XP || input.xp > MAX_MISSION_XP)) {
      return `O XP deve ficar entre ${MIN_MISSION_XP} e ${MAX_MISSION_XP}.`;
    }
    if (input.target !== void 0 && (input.target < 1 || input.target > 100)) {
      return "A meta deve ficar entre 1 e 100 etapas.";
    }
    if (input.subtasks !== void 0 && (!Array.isArray(input.subtasks) || input.subtasks.length > 12 || input.subtasks.some((t) => !String(t).trim() || String(t).trim().length > 60))) {
      return "Subtarefas inv\xE1lidas (at\xE9 12, com at\xE9 60 caracteres cada).";
    }
    if (input.days !== void 0 && (!Array.isArray(input.days) || input.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6))) {
      return "Dias da semana inv\xE1lidos.";
    }
    return null;
  }
  function buildMission(input, now) {
    var _a, _b, _c;
    const error = validateMissionInput(input);
    if (error) throw new Error(error);
    const subtasks = Array.isArray(input.subtasks) && input.subtasks.length ? input.subtasks.map((t) => ({ id: newId("t"), text: String(t).trim() })) : void 0;
    return {
      id: newId("m"),
      name: input.name.trim(),
      description: ((_a = input.description) != null ? _a : "").trim(),
      type: input.type,
      difficulty: input.difficulty,
      xp: Math.round((_b = input.xp) != null ? _b : suggestedXp(input.type, input.difficulty)),
      attributes: [...new Set(input.attributes)],
      deadline: input.deadline,
      days: input.type === "daily" && Array.isArray(input.days) && input.days.length > 0 && input.days.length < 7 ? [...new Set(input.days)].sort() : void 0,
      target: subtasks ? subtasks.length : Math.round((_c = input.target) != null ? _c : 1),
      subtasks,
      requires: input.requires || void 0,
      progress: { current: 0, periodKey: periodKey(input.type, now) },
      status: "active",
      durationMin: input.durationMin,
      createdAt: now.toISOString()
    };
  }
  function addMission(state, input, now = /* @__PURE__ */ new Date()) {
    if (input.requires && !state.missions.some((m) => m.id === input.requires)) throw new Error("A miss\xE3o da qual esta depende n\xE3o existe.");
    return { ...state, missions: [...state.missions, buildMission(input, now)] };
  }
  function removeMission(state, missionId) {
    return { ...state, missions: state.missions.filter((m) => m.id !== missionId) };
  }
  function expireMissions(state, now = /* @__PURE__ */ new Date()) {
    let changed = false;
    const missions = state.missions.map((m) => {
      if (m.status === "active" && m.deadline && !isMissionDone(m, now) && new Date(m.deadline) < now) {
        changed = true;
        return { ...m, status: "expired" };
      }
      return m;
    });
    return changed ? { ...state, missions } : state;
  }
  function grantReward(state, mission, now, opts = {}) {
    var _a;
    const split = splitXp(mission.xp, mission.attributes);
    const attributeXp = { ...state.attributeXp };
    for (const id of ATTRIBUTE_IDS) attributeXp[id] += (_a = split[id]) != null ? _a : 0;
    const completion = {
      id: newId("c"),
      missionId: mission.id,
      missionName: mission.name,
      at: now.toISOString(),
      day: dayKey(now),
      xp: mission.xp,
      attributes: mission.attributes,
      durationMin: opts.focusMin != null ? opts.focusMin : mission.durationMin,
      kind: mission.type,
      chain: mission.requires ? true : void 0,
      focus: opts.focus ? true : void 0,
      bossKind: mission.bossKind
    };
    return {
      ...state,
      totalXp: state.totalXp + mission.xp,
      attributeXp,
      completions: [...state.completions, completion]
    };
  }
  function addProgress(state, missionId, amount = 1, now = /* @__PURE__ */ new Date(), opts = {}) {
    const mission = state.missions.find((m) => m.id === missionId);
    if (!mission || mission.type === "boss" || mission.status !== "active" || isMissionDone(mission, now)) {
      return { state, events: [] };
    }
    if (!isMissionScheduled(mission, now) || isMissionLocked(state, mission, now)) return { state, events: [] };
    if (mission.deadline && new Date(mission.deadline) < now) return { state, events: [] };
    const key = periodKey(mission.type, now);
    const same = mission.progress.periodKey === key;
    const previous = same ? mission.progress.current : 0;
    const current = Math.min(mission.target, previous + Math.max(1, Math.floor(amount)));
    const completed = current >= mission.target;
    const updated = {
      ...mission,
      progress: { current, periodKey: key, done: same ? mission.progress.done : void 0 },
      status: completed && key === "once" ? "completed" : mission.status
    };
    const draft = {
      ...state,
      missions: state.missions.map((m) => m.id === missionId ? updated : m)
    };
    if (!completed) return { state: draft, events: [] };
    const rewarded = grantReward(draft, mission, now, opts);
    const comp = rewarded.completions[rewarded.completions.length - 1];
    const events = [{ type: "xp", amount: mission.xp, missionName: mission.name, completionId: comp.id }];
    const freed = state.missions.filter((m) => m.requires === mission.id && m.status === "active").map((m) => m.name);
    if (freed.length) events.push({ type: "unlock", names: freed });
    const hit = damageBoss(rewarded, mission.xp, now, events);
    return settle(state, hit, now, events);
  }
  function completeMission(state, missionId, now = /* @__PURE__ */ new Date(), opts = {}) {
    const mission = state.missions.find((m) => m.id === missionId);
    if (!mission) return { state, events: [] };
    let st = state;
    if (mission.subtasks && mission.subtasks.length) {
      const key = periodKey(mission.type, now);
      const ids = mission.subtasks.map((t) => t.id);
      st = {
        ...state,
        missions: state.missions.map((m) => m.id === missionId ? { ...m, progress: { current: Math.max(0, ids.length - 1), periodKey: key, done: ids.slice(0, -1) } } : m)
      };
      return addProgress(st, missionId, 1, now, opts);
    }
    return addProgress(st, missionId, mission.target - missionProgress(mission, now), now, opts);
  }
  function settle(before, draft, now, events) {
    let state = draft;
    const at = now.toISOString();
    const history = [];
    const achievementEvents = [];
    for (let i = 0; i < 10; i++) {
      let changed = false;
      const stats = deriveStats(state, now);
      for (const a of ACHIEVEMENTS) {
        if (!state.unlocked[a.id] && isAchieved(a, stats)) {
          state = {
            ...state,
            unlocked: { ...state.unlocked, [a.id]: at },
            totalXp: state.totalXp + a.rewardXp
          };
          history.push({ id: newId("h"), at, type: "achievement", achievementId: a.id });
          achievementEvents.push({ type: "achievement", id: a.id, name: a.name, rewardXp: a.rewardXp });
          changed = true;
        }
      }
      const rank = Math.max(
        state.rankIndex,
        evaluateRankIndex(deriveStats(state, now), Object.keys(state.unlocked))
      );
      if (rank !== state.rankIndex) {
        state = { ...state, rankIndex: rank };
        changed = true;
      }
      if (!changed) break;
    }
    for (const id of ATTRIBUTE_IDS) {
      const from = attributeProgress(before.attributeXp[id]).level;
      const to = attributeProgress(state.attributeXp[id]).level;
      if (to > from) {
        events.push({ type: "attributeUp", attribute: id, from, to });
        history.push({ id: newId("h"), at, type: "attributeUp", attribute: id, from, to });
      }
    }
    events.push(...achievementEvents);
    const levelBefore = levelFromXp(before.totalXp);
    const levelAfter = levelFromXp(state.totalXp);
    if (levelAfter > levelBefore) {
      events.push({ type: "levelUp", from: levelBefore, to: levelAfter });
      history.push({ id: newId("h"), at, type: "levelUp", from: levelBefore, to: levelAfter });
    }
    if (state.rankIndex > before.rankIndex) {
      const from = RANKS[before.rankIndex].id;
      const to = RANKS[state.rankIndex].id;
      events.push({ type: "rankUp", from, to });
      history.push({ id: newId("h"), at, type: "rankUp", from, to });
    }
    return { state: { ...state, history: [...state.history, ...history].slice(-300) }, events };
  }

  // ---- v0.5.4: treino vira XP de verdade
  var WORKOUT_MIN_MINUTES = 5;
  var WORKOUT_DAILY_CAP = 3;
  var TRAINING_BOSS_NAMES = ["Colosso de Ferro", "Golem de A\u00E7o", "Tit\u00E3 das Anilhas", "Hidra do Suor", "Behemoth da Barra", "Minotauro da Esteira", "Gigante do Cansa\u00E7o", "Ogro da Meia-Carga"];
  function liftKey(name) {
    const n = String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    if (/^supino/.test(n)) return "supino";
    if (/^agachamento (livre|hack)/.test(n)) return "agachamento";
    if (/^levantamento terra/.test(n)) return "terra";
    return null;
  }
  function workoutBonus(w) {
    const mins = Math.max(0, Number(w.mins) || 0);
    const vol = Math.max(0, Number(w.volume) || 0);
    let base, dmg;
    if (w.type === "cardio") {
      base = Math.min(100, Math.max(10, Math.round(mins * 1.2)));
      dmg = Math.round(mins * 150);
    } else if (w.type === "mobility") {
      base = Math.min(40, Math.max(5, Math.round(mins * 0.8)));
      dmg = Math.round(mins * 40);
    } else {
      const eff = Math.max(vol, mins * 60);
      base = Math.min(110, 10 + Math.round(eff / 250));
      dmg = Math.round(eff);
    }
    const prs = Math.min(5, Math.max(0, Math.floor(Number(w.prs) || 0)));
    return { base, prs, prXp: prs * 15, xp: base + prs * 15, dmg };
  }
  var WK_GENERAL = /trein|academia|exerc|muscula/i;
  var WK_CARDIO = /corrida|correr|cardio|caminhada|esteira|bike|pedal|nata/i;
  var WK_FLEX = /alonga|mobilidade|yoga|flexib/i;
  function pickWorkoutMissions(state, w, now) {
    const ok = (m) => (m.type === "daily" || m.type === "weekly" || m.type === "special") && m.status === "active" && !isMissionDone(m, now) && isMissionScheduled(m, now) && !isMissionLocked(state, m, now) && !(m.deadline && new Date(m.deadline) < now) && !(m.subtasks && m.subtasks.length);
    const match = (m) => w.type === "cardio" ? WK_GENERAL.test(m.name) || WK_CARDIO.test(m.name) : w.type === "mobility" ? WK_FLEX.test(m.name) : WK_GENERAL.test(m.name);
    const list = state.missions.filter((m) => ok(m) && match(m));
    const attr = w.type === "strength" ? "forca" : "vitalidade";
    const best = (arr) => arr.find((m) => m.attributes.includes(attr)) || arr[0];
    return [best(list.filter((m) => m.type !== "weekly")), best(list.filter((m) => m.type === "weekly"))].filter(Boolean);
  }
  function trainingBossHp(state, now) {
    const since = dayKey(addDays(now, -13));
    const dmg14 = state.completions.filter((c) => c.kind === "workout" && c.day >= since).reduce((sum, c) => sum + (c.tDmg || 0), 0);
    return Math.round(Math.max(18e3, Math.min(12e4, dmg14 / 2 * 1.1)) / 500) * 500;
  }
  function maybeSpawnTrainingBoss(state, now = /* @__PURE__ */ new Date(), force = false) {
    const key = weekKey(now);
    if (!force) {
      const since = dayKey(addDays(now, -28));
      if (!state.completions.some((c) => c.kind === "workout" && c.day >= since)) return state;
    }
    if (state.missions.some((m) => m.type === "boss" && m.bossKind === "training" && m.progress.periodKey === key)) return state;
    const hp = trainingBossHp(state, now);
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    const boss = {
      id: newId("m"),
      name: "Chefe: " + TRAINING_BOSS_NAMES[Math.floor(dayNumber(key) / 7) % TRAINING_BOSS_NAMES.length],
      description: "Cause " + hp.toLocaleString("pt-BR") + " de dano nesta semana treinando. Treino de peso: 1 de dano por kg levantado. Cardio: 150 por minuto. Alongamento: 40 por minuto.",
      type: "boss",
      bossKind: "training",
      difficulty: "A",
      xp: Math.max(80, Math.min(500, Math.round(hp / 100 / 10) * 10)),
      attributes: ["forca", "vitalidade"],
      deadline: addDays(monday, 7).toISOString(),
      target: hp,
      progress: { current: 0, periodKey: key },
      status: "active",
      createdAt: now.toISOString()
    };
    return { ...state, missions: [...state.missions, boss] };
  }
  function completeWorkout(state, w, now = /* @__PURE__ */ new Date()) {
    if (!w || !w.id || state.completions.some((c) => c.workoutId === w.id)) return { state, events: [] };
    if ((Number(w.mins) || 0) < WORKOUT_MIN_MINUTES) return { state, events: [] };
    const today = dayKey(now);
    if (state.completions.filter((c) => c.kind === "workout" && c.day === today).length >= WORKOUT_DAILY_CAP) {
      return { state, events: [{ type: "workoutCap", cap: WORKOUT_DAILY_CAP }] };
    }
    const events = [];
    let st = state;
    const linkedNames = [];
    let linkedForca = false;
    for (const m of pickWorkoutMissions(st, w, now)) {
      const r = m.type === "weekly" ? addProgress(st, m.id, 1, now) : completeMission(st, m.id, now);
      if (r.state === st) continue;
      st = r.state;
      events.push(...r.events);
      const done = r.events.some((e) => e.type === "xp");
      linkedNames.push(m.type === "weekly" && !done ? m.name + " (+1)" : m.name);
      if (done && m.attributes.includes("forca")) linkedForca = true;
    }
    const bonus = workoutBonus(w);
    const attrs = w.type === "strength" ? ["forca"] : ["vitalidade"];
    st = maybeSpawnTrainingBoss(st, now, true);
    const split = splitXp(bonus.xp, attrs);
    const attributeXp = { ...st.attributeXp };
    for (const id of ATTRIBUTE_IDS) attributeXp[id] += split[id] != null ? split[id] : 0;
    const lifts = {};
    for (const k of Object.keys(w.lifts || {})) {
      const kg = Math.min(600, Math.max(0, Number(w.lifts[k]) || 0));
      if (kg > 0 && (k === "supino" || k === "agachamento" || k === "terra")) lifts[k] = kg;
    }
    const comp = {
      id: newId("c"),
      missionId: "workout:" + w.id,
      missionName: String(w.name || "Treino").slice(0, 60) + " \u00B7 b\u00F4nus",
      at: now.toISOString(),
      day: today,
      xp: bonus.xp,
      attributes: attrs,
      durationMin: Math.round(Number(w.mins) || 0),
      kind: "workout",
      workoutId: w.id,
      wtype: w.type,
      volume: Math.round(Math.max(0, Number(w.volume) || 0)),
      prs: bonus.prs,
      base: bonus.base,
      prXp: bonus.prXp,
      lifts,
      linked: linkedForca ? true : void 0,
      linkedNames,
      tDmg: bonus.dmg
    };
    st = { ...st, totalXp: st.totalXp + bonus.xp, attributeXp, completions: [...st.completions, comp] };
    events.push({ type: "workout", name: w.name, xp: bonus.xp, base: bonus.base, prXp: bonus.prXp, prs: bonus.prs, attribute: attrs[0], volume: comp.volume, mins: comp.durationMin, dmg: bonus.dmg, completionId: comp.id });
    st = damageBoss(st, bonus.xp, now, events);
    st = damageBoss(st, bonus.dmg, now, events, "training");
    return settle(state, st, now, events);
  }
  function starterMissions(now) {
    const m = (input) => buildMission(input, now);
    return [
      m({ name: "Estudar por 1 hora", description: "Uma hora de estudo focado, sem distra\xE7\xF5es.", type: "daily", difficulty: "C", xp: REWARD_PRESETS.studyHour, attributes: ["inteligencia", "foco"], durationMin: 60 }),
      m({ name: "Treinar", description: "Treino completo: muscula\xE7\xE3o, corrida ou esporte.", type: "daily", difficulty: "C", xp: REWARD_PRESETS.fullWorkout, attributes: ["forca", "vitalidade"] }),
      m({ name: "Ler 20 p\xE1ginas", description: "Leitura com aten\xE7\xE3o plena.", type: "daily", difficulty: "D", xp: 30, attributes: ["foco", "inteligencia"] }),
      m({ name: "Acordar no hor\xE1rio definido", description: "Levante sem adiar o alarme.", type: "daily", difficulty: "D", xp: REWARD_PRESETS.dailyHabit, attributes: ["disciplina", "vitalidade"] }),
      m({ name: "Organizar o ambiente", description: "Deixe seu espa\xE7o pronto para evoluir.", type: "daily", difficulty: "E", xp: REWARD_PRESETS.simpleTask, attributes: ["disciplina"] }),
      m({ name: "Conversar com algu\xE9m", description: "Puxe papo com um colega, amigo ou algu\xE9m novo. Escute de verdade.", type: "daily", difficulty: "D", xp: 30, attributes: ["carisma"] }),
      m({ name: "Treinar 4 vezes", description: "Complete quatro treinos nesta semana.", type: "weekly", difficulty: "C", xp: REWARD_PRESETS.weeklyMission, attributes: ["forca", "disciplina"], target: 4 }),
      m({ name: "Completar 5 sess\xF5es de estudo", description: "Cinco sess\xF5es de estudo ao longo da semana.", type: "weekly", difficulty: "C", xp: REWARD_PRESETS.weeklyMission, attributes: ["inteligencia", "foco"], target: 5 }),
      m({ name: "Fortalecer 3 conex\xF5es", description: "Ligue, visite ou marque um encontro com tr\xEAs pessoas nesta semana.", type: "weekly", difficulty: "C", xp: REWARD_PRESETS.weeklyMission, attributes: ["carisma", "disciplina"], target: 3 }),
      m({ name: "Concluir um projeto pessoal", description: "Um objetivo grande, dividido em passos. Defina o seu.", type: "special", difficulty: "B", xp: REWARD_PRESETS.specialMission, attributes: ["inteligencia", "disciplina"] })
    ];
  }
  function createInitialState(name, now = /* @__PURE__ */ new Date()) {
    return {
      version: 1,
      player: { name: name.trim() || "Jogador", avatar: "sigil-1", createdAt: now.toISOString() },
      totalXp: 0,
      attributeXp: emptyAttributeXp(),
      rankIndex: 0,
      missions: starterMissions(now),
      completions: [],
      unlocked: {},
      history: [],
      restDays: [],
      journal: [],
      rewards: STARTER_REWARDS.map((r) => ({ id: newId("r"), ...r })),
      purchases: [],
      friends: [],
      seasonCoins: 0,
      season: null,
      seasonHistory: [],
      seasonBadges: [],
      goals: [],
      reviews: [],
      bonusCoins: 0
    };
  }
  var EMERGENCY_TEMPLATES = [
    { name: "Alerta: caminhada rel\xE2mpago", description: "Saia e caminhe por 15 minutos nas pr\xF3ximas 24 horas.", difficulty: "D", xp: 90, attributes: ["vitalidade", "forca"] },
    { name: "Alerta: foco total", description: "Fa\xE7a 25 minutos de trabalho profundo, sem celular.", difficulty: "C", xp: 110, attributes: ["foco", "disciplina"], durationMin: 25 },
    { name: "Alerta: leitura expressa", description: "Leia 10 p\xE1ginas de um livro que voc\xEA escolheu.", difficulty: "D", xp: 80, attributes: ["foco", "inteligencia"] },
    { name: "Alerta: conex\xE3o", description: "Envie uma mensagem sincera a algu\xE9m que voc\xEA valoriza.", difficulty: "D", xp: 80, attributes: ["carisma"] },
    { name: "Alerta: elogio sincero", description: "Fa\xE7a um elogio genu\xEDno a algu\xE9m nas pr\xF3ximas 24 horas.", difficulty: "E", xp: 70, attributes: ["carisma"] },
    { name: "Alerta: ligar para algu\xE9m", description: "Ligue (de voz ou v\xEDdeo) para um amigo ou familiar que voc\xEA n\xE3o ouve h\xE1 tempos.", difficulty: "D", xp: 90, attributes: ["carisma", "vitalidade"] },
    { name: "Alerta: dizer obrigado", description: "Agrade\xE7a por escrito ou pessoalmente a algu\xE9m que te ajudou, com um motivo espec\xEDfico.", difficulty: "E", xp: 70, attributes: ["carisma"] },
    { name: "Alerta: sair da zona de conforto", description: "Inicie uma conversa com algu\xE9m que voc\xEA ainda n\xE3o conhece bem.", difficulty: "C", xp: 110, attributes: ["carisma", "disciplina"] },
    { name: "Alerta: reset de ambiente", description: "Organize sua mesa ou seu quarto por 10 minutos.", difficulty: "E", xp: 70, attributes: ["disciplina", "vitalidade"] }
  ];
  var EMERGENCY_COOLDOWN_HOURS = 72;
  function maybeSpawnEmergency(state, now = /* @__PURE__ */ new Date(), rng = Math.random) {
    if (state.completions.length < 3) return state;
    if (state.missions.some((m) => m.type === "emergency" && m.status === "active" && !isMissionDone(m, now))) {
      return state;
    }
    if (state.lastEmergencyAt) {
      const hours = (now.getTime() - new Date(state.lastEmergencyAt).getTime()) / 36e5;
      if (hours < EMERGENCY_COOLDOWN_HOURS) return state;
    }
    if (rng() > 0.6) return state;
    const t = EMERGENCY_TEMPLATES[Math.floor(rng() * EMERGENCY_TEMPLATES.length) % EMERGENCY_TEMPLATES.length];
    const mission = buildMission(
      { ...t, type: "emergency", deadline: addDays(now, 1).toISOString() },
      now
    );
    return { ...state, missions: [...state.missions, mission], lastEmergencyAt: now.toISOString() };
  }
  function verifyState(state, now = /* @__PURE__ */ new Date()) {
    var _a;
    const problems = [];
    const achievementXp = Object.keys(state.unlocked).reduce(
      (sum, id) => {
        var _a2, _b;
        return sum + ((_b = (_a2 = achievementById(id)) == null ? void 0 : _a2.rewardXp) != null ? _b : 0);
      },
      0
    );
    const expectedXp = state.completions.reduce((s, c) => s + c.xp, 0) + achievementXp;
    if (expectedXp !== state.totalXp) {
      problems.push(`XP total inconsistente: esperado ${expectedXp}, encontrado ${state.totalXp}.`);
    }
    const expectedAttr = emptyAttributeXp();
    for (const c of state.completions) {
      const split = splitXp(c.xp, c.attributes);
      for (const id of ATTRIBUTE_IDS) expectedAttr[id] += (_a = split[id]) != null ? _a : 0;
    }
    for (const id of ATTRIBUTE_IDS) {
      if (expectedAttr[id] !== state.attributeXp[id]) {
        problems.push(`XP de ${id} inconsistente: esperado ${expectedAttr[id]}, encontrado ${state.attributeXp[id]}.`);
      }
    }
    const eligible = evaluateRankIndex(deriveStats(state, now), Object.keys(state.unlocked));
    if (state.rankIndex > eligible) problems.push("Rank acima do que os requisitos permitem.");
    if (coinBalance(state) < 0) problems.push("Saldo de moedas negativo.");
    return { ok: problems.length === 0, problems };
  }


  // src/domain/extras.ts
  var STARTER_REWARDS = [
    { name: "Um episódio da minha série", cost: 30 },
    { name: "Sobremesa favorita", cost: 40 },
    { name: "Noite de jogo sem culpa", cost: 80 },
    { name: "Um dia de folga completo", cost: 150 }
  ];
  function normalizeState(s2) {
    if (!s2 || typeof s2 !== "object") return s2;
    const p = s2.player || {};
    return {
      ...s2,
      missions: s2.missions || [],
      completions: s2.completions || [],
      unlocked: s2.unlocked || {},
      history: s2.history || [],
      restDays: s2.restDays || [],
      journal: s2.journal || [],
      rewards: s2.rewards || [],
      purchases: s2.purchases || [],
      friends: s2.friends || [],
      seasonCoins: s2.seasonCoins || 0,
      season: s2.season || null,
      seasonHistory: s2.seasonHistory || [],
      seasonBadges: s2.seasonBadges || [],
      goals: s2.goals || [],
      reviews: s2.reviews || [],
      bonusCoins: s2.bonusCoins || 0,
      player: { ...p, title: p.title || null, frame: p.frame != null ? p.frame : null }
    };
  }
  function isMissionScheduled(m, now) {
    return m.type === "daily" && m.days && m.days.length ? m.days.includes(now.getDay()) : true;
  }
  var coinsForXp = (xp) => Math.max(1, Math.round(xp / 10));
  function coinBalance(state) {
    const earned = state.completions.reduce((sum, c) => sum + coinsForXp(c.xp), 0) + (state.seasonCoins || 0) + (state.bonusCoins || 0);
    const spent = (state.purchases || []).reduce((sum, p) => sum + p.cost, 0);
    return earned - spent;
  }
  function updateMission(state, missionId, patch, now = /* @__PURE__ */ new Date()) {
    const m = state.missions.find((x) => x.id === missionId);
    if (!m) return { state, error: "Missão não encontrada." };
    if (m.type === "boss") return { state, error: "Chefes não podem ser editados." };
    const has = (k) => Object.prototype.hasOwnProperty.call(patch, k);
    const input = {
      name: has("name") ? patch.name : m.name,
      description: has("description") ? patch.description : m.description,
      type: m.type,
      difficulty: has("difficulty") ? patch.difficulty : m.difficulty,
      xp: has("xp") ? patch.xp : m.xp,
      attributes: has("attributes") ? patch.attributes : m.attributes,
      target: has("target") ? patch.target : m.target,
      durationMin: has("durationMin") ? patch.durationMin : m.durationMin,
      days: has("days") ? patch.days : m.days,
      subtasks: has("subtasks") ? patch.subtasks : void 0
    };
    const error = validateMissionInput(input);
    if (error) return { state, error };
    let subtasks = m.subtasks;
    if (has("subtasks")) {
      const pool = (m.subtasks || []).slice();
      subtasks = patch.subtasks.length ? patch.subtasks.map((t) => {
        const text = String(t).trim();
        const i = pool.findIndex((x) => x.text === text);
        if (i >= 0) return pool.splice(i, 1)[0];
        return { id: newId("t"), text };
      }) : void 0;
    }
    const newTarget = subtasks ? subtasks.length : Math.round(input.target);
    const changedSubs = has("subtasks") && JSON.stringify((subtasks || []).map((t) => t.id)) !== JSON.stringify((m.subtasks || []).map((t) => t.id));
    if ((newTarget !== m.target || changedSubs) && missionProgress(m, now) > 0) {
      return { state, error: "N\u00E3o d\u00E1 para mudar a meta ou as subtarefas com etapas j\u00E1 feitas neste per\u00EDodo." };
    }
    let requires = m.requires;
    if (has("requires")) {
      requires = patch.requires || void 0;
      if (requires) {
        if (requires === m.id) return { state, error: "Uma miss\u00E3o n\u00E3o pode depender dela mesma." };
        if (!state.missions.some((x) => x.id === requires)) return { state, error: "A miss\u00E3o da qual esta depende n\u00E3o existe." };
        let cur = state.missions.find((x) => x.id === requires);
        for (let i = 0; cur && cur.requires && i < 50; i++) {
          if (cur.requires === m.id) return { state, error: "Isso criaria um ciclo de depend\u00EAncias." };
          cur = state.missions.find((x) => x.id === cur.requires);
        }
      }
    }
    const updated = {
      ...m,
      name: input.name.trim(),
      description: (input.description || "").trim(),
      difficulty: input.difficulty,
      xp: Math.round(input.xp),
      attributes: [...new Set(input.attributes)],
      target: newTarget,
      subtasks,
      requires,
      progress: changedSubs || newTarget !== m.target ? { current: 0, periodKey: m.progress.periodKey } : m.progress,
      durationMin: input.durationMin || void 0,
      days: m.type === "daily" && Array.isArray(input.days) && input.days.length > 0 && input.days.length < 7 ? [...new Set(input.days)].sort() : void 0,
      deadline: has("deadline") ? patch.deadline : m.deadline
    };
    return { state: { ...state, missions: state.missions.map((x) => x.id === missionId ? updated : x) } };
  }
  function dropCompletion(s2, c) {
    var _a;
    const split = splitXp(c.xp, c.attributes);
    const attributeXp = { ...s2.attributeXp };
    for (const id of ATTRIBUTE_IDS) attributeXp[id] -= (_a = split[id]) != null ? _a : 0;
    return { ...s2, totalXp: s2.totalXp - c.xp, attributeXp, completions: s2.completions.filter((x) => x.id !== c.id) };
  }
  function undoCompletion(state, completionId, now = /* @__PURE__ */ new Date()) {
    const c = state.completions.find((x) => x.id === completionId);
    if (!c) return { state, error: "Conclusão não encontrada." };
    if (c.day !== dayKey(now)) return { state, error: "Só dá para desfazer conclusões de hoje." };
    if (c.kind === "boss") return { state, error: "A recompensa de um chefe não pode ser desfeita." };
    let s2 = dropCompletion(state, c);
    const at = new Date(c.at);
    const wk = weekKey(at);
    let revertedBoss = null;
    s2 = {
      ...s2,
      missions: s2.missions.map((m) => {
        if (m.id === c.missionId) {
          if (m.progress.periodKey !== periodKey(m.type, at)) return m;
          return {
            ...m,
            progress: { current: Math.max(0, m.target - 1), periodKey: m.progress.periodKey, done: m.progress.done ? m.progress.done.slice(0, -1) : void 0 },
            status: m.status === "completed" ? "active" : m.status
          };
        }
        if (m.type === "boss" && m.progress.periodKey === wk && m.createdAt <= c.at) {
          const dmg = m.bossKind === "training" ? c.kind === "workout" ? c.tDmg || 0 : 0 : c.xp;
          const cur = Math.max(0, m.progress.current - dmg);
          if (m.status === "completed" && cur < m.target) {
            revertedBoss = m;
            return { ...m, progress: { current: cur, periodKey: wk }, status: "active" };
          }
          return { ...m, progress: { current: cur, periodKey: wk } };
        }
        return m;
      })
    };
    if (revertedBoss) {
      const bc = s2.completions.find((x) => x.missionId === revertedBoss.id && x.kind === "boss");
      if (bc) s2 = dropCompletion(s2, bc);
    }
    const revoked = [];
    for (let i = 0; i < 10; i++) {
      const stats = deriveStats(s2, now);
      let changed = false;
      for (const id of Object.keys(s2.unlocked)) {
        const a = achievementById(id);
        if (a && s2.unlocked[id] >= c.at && !isAchieved(a, stats)) {
          const unlocked = { ...s2.unlocked };
          delete unlocked[id];
          s2 = { ...s2, unlocked, totalXp: s2.totalXp - a.rewardXp };
          revoked.push(id);
          changed = true;
        }
      }
      if (!changed) break;
    }
    s2 = {
      ...s2,
      history: s2.history.filter((h) => h.at !== c.at && !(h.type === "achievement" && revoked.includes(h.achievementId)))
    };
    const eligible = evaluateRankIndex(deriveStats(s2, now), Object.keys(s2.unlocked));
    if (s2.rankIndex > eligible) return { state, error: "Essa conclusão fez você subir de rank e não pode ser desfeita." };
    if (coinBalance(s2) < 0) return { state, error: "Você já gastou as moedas ganhas nessa conclusão." };
    return { state: s2, events: [] };
  }
  function toggleRestDay(state, now = /* @__PURE__ */ new Date()) {
    const key = dayKey(now);
    const rest = state.restDays || [];
    if (rest.includes(key)) return { state: { ...state, restDays: rest.filter((d) => d !== key) }, events: [] };
    if (state.completions.some((c) => c.day === key)) {
      return { state, error: "Você já evoluiu hoje, não precisa descansar." };
    }
    const wk = weekKey(now);
    const inWeek = rest.filter((d) => {
      const [y, m, dd] = d.split("-").map(Number);
      return weekKey(new Date(y, m - 1, dd)) === wk;
    });
    if (inWeek.length >= 2) return { state, error: "Máximo de 2 dias de descanso por semana." };
    return { state: { ...state, restDays: [...rest, key].slice(-400) }, events: [] };
  }
  function addReward(state, input) {
    const name = (input.name || "").trim().slice(0, 60);
    const cost = Math.round(Number(input.cost));
    if (!name) return { state, error: "Dê um nome à recompensa." };
    if (!(cost >= 1 && cost <= 99999)) return { state, error: "O custo deve ficar entre 1 e 99999 moedas." };
    return { state: { ...state, rewards: [...state.rewards || [], { id: newId("r"), name, cost }] }, events: [] };
  }
  function removeReward(state, rewardId) {
    return { state: { ...state, rewards: (state.rewards || []).filter((r) => r.id !== rewardId) }, events: [] };
  }
  function buyReward(state, rewardId, now = /* @__PURE__ */ new Date()) {
    const r = (state.rewards || []).find((x) => x.id === rewardId);
    if (!r) return { state, events: [], error: "Recompensa não encontrada." };
    if (coinBalance(state) < r.cost) return { state, events: [], error: "Moedas insuficientes." };
    const draft = {
      ...state,
      purchases: [...state.purchases || [], { id: newId("p"), rewardId: r.id, name: r.name, cost: r.cost, at: now.toISOString() }]
    };
    return settle(state, draft, now, [{ type: "purchase", name: r.name, cost: r.cost }]);
  }
  function saveJournal(state, input, now = /* @__PURE__ */ new Date()) {
    const day = dayKey(now);
    const text = (input.text || "").trim().slice(0, 280);
    const mood = input.mood >= 1 && input.mood <= 5 ? input.mood : void 0;
    const journal = (state.journal || []).filter((j) => j.day !== day);
    if (text || mood) journal.push({ day, text, mood, at: now.toISOString() });
    return settle(state, { ...state, journal: journal.slice(-400) }, now, []);
  }
  var BOSS_NAMES = [
    "Guardião da Preguiça",
    "Golem da Procrastinação",
    "Sentinela do Sono Eterno",
    "Hidra das Distrações",
    "Cavaleiro da Dúvida",
    "Titã da Inércia",
    "Espectro do Adiamento",
    "Serpente do Cansaço"
  ];
  function bossHp(state, now) {
    const since = dayKey(addDays(now, -13));
    const xp14 = state.completions.filter((c) => c.day >= since && c.kind !== "boss").reduce((sum, c) => sum + c.xp, 0);
    return Math.round(Math.max(400, Math.min(4e3, xp14 / 2 * 0.9)) / 10) * 10;
  }
  function maybeSpawnBoss(state, now = /* @__PURE__ */ new Date()) {
    if (state.completions.length < 3) return state;
    const key = weekKey(now);
    const cutoff = dayKey(addDays(now, -28));
    const missions = state.missions.filter((m) => !(m.type === "boss" && m.progress.periodKey < cutoff));
    const pruned = missions.length !== state.missions.length;
    if (missions.some((m) => m.type === "boss" && m.bossKind !== "training" && m.progress.periodKey === key)) return pruned ? { ...state, missions } : state;
    const hp = bossHp(state, now);
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    const boss = {
      id: newId("m"),
      name: "Chefe: " + BOSS_NAMES[Math.floor(dayNumber(key) / 7) % BOSS_NAMES.length],
      description: "Cause " + hp + " de dano nesta semana. Cada missão concluída causa dano igual ao seu XP.",
      type: "boss",
      difficulty: "A",
      xp: Math.round(hp * 0.4 / 10) * 10,
      attributes: [...ATTRIBUTE_IDS],
      deadline: addDays(monday, 7).toISOString(),
      target: hp,
      progress: { current: 0, periodKey: key },
      status: "active",
      createdAt: now.toISOString()
    };
    return { ...state, missions: [...missions, boss] };
  }
  function damageBoss(state, xp, now, events, kind = "xp") {
    const key = weekKey(now);
    if (!(xp > 0)) return state;
    const idx = state.missions.findIndex(
      (m) => m.type === "boss" && (kind === "training" ? m.bossKind === "training" : m.bossKind !== "training") && m.status === "active" && m.progress.periodKey === key && (!m.deadline || new Date(m.deadline) >= now)
    );
    if (idx < 0) return state;
    const b = state.missions[idx];
    const current = Math.min(b.target, b.progress.current + xp);
    const defeated = current >= b.target;
    const updated = { ...b, progress: { current, periodKey: key }, status: defeated ? "completed" : "active" };
    let next = { ...state, missions: state.missions.map((m, i) => i === idx ? updated : m) };
    events.push({ type: "bossHit", name: b.name, damage: current - b.progress.current, left: b.target - current, kind });
    if (defeated) {
      next = grantReward(next, updated, now, {});
      events.push({ type: "boss", name: b.name, amount: b.xp });
    }
    return next;
  }
  var SEASON_PLANS = {
    leve: { label: "Leve", goalXp: 1500 },
    normal: { label: "Normal", goalXp: 3e3 },
    intensa: { label: "Intensa", goalXp: 5e3 }
  };
  var SEASON_DAYS = 30;
  var SEASON_DAYS_GOAL = 20;
  var SEASON_TIERS = [{ at: 1 / 3, coins: 50 }, { at: 2 / 3, coins: 100 }, { at: 1, coins: 200 }];
  function startSeason(state, input, now = /* @__PURE__ */ new Date()) {
    if (state.season) return { state, error: "Já existe uma temporada em andamento." };
    const plan = SEASON_PLANS[input.plan] ? input.plan : "normal";
    const season = {
      id: newId("s"),
      name: (input.name || "").trim().slice(0, 32) || "Temporada " + ((state.seasonHistory || []).length + 1),
      plan,
      goalXp: SEASON_PLANS[plan].goalXp,
      startDay: dayKey(now),
      endDay: dayKey(addDays(now, SEASON_DAYS - 1)),
      claimed: []
    };
    return { state: { ...state, season }, events: [] };
  }
  function seasonProgress(state, now = /* @__PURE__ */ new Date()) {
    const s2 = state.season;
    if (!s2) return null;
    const inRange = state.completions.filter((c) => c.day >= s2.startDay && c.day <= s2.endDay);
    const xp = inRange.reduce((sum, c) => sum + c.xp, 0);
    const activeDays = new Set(inRange.map((c) => c.day)).size;
    const daysLeft = Math.max(0, dayNumber(s2.endDay) - dayNumber(dayKey(now)));
    const tiers = SEASON_TIERS.map((t, i) => {
      const need = Math.round(s2.goalXp * t.at);
      return { xp: need, coins: t.coins, reached: xp >= need, claimed: s2.claimed.includes(i) };
    });
    return { season: s2, xp, activeDays, daysLeft, tiers };
  }
  function updateSeason(state, now = /* @__PURE__ */ new Date()) {
    const events = [];
    if (!state.season) return { state, events };
    let st = state;
    let s2 = state.season;
    const p = seasonProgress(st, now);
    const claimed = [...s2.claimed];
    let coins = 0;
    p.tiers.forEach((t, i) => {
      if (t.reached && !claimed.includes(i)) {
        claimed.push(i);
        coins += t.coins;
        events.push({ type: "seasonTier", name: s2.name, tier: i + 1, coins: t.coins });
      }
    });
    if (claimed.length !== s2.claimed.length) {
      s2 = { ...s2, claimed };
      st = { ...st, season: s2, seasonCoins: (st.seasonCoins || 0) + coins };
    }
    if (dayKey(now) > s2.endDay) {
      const ok = p.xp >= s2.goalXp && p.activeDays >= SEASON_DAYS_GOAL;
      const entry = { ...s2, xp: p.xp, activeDays: p.activeDays, success: ok, finishedAt: now.toISOString() };
      st = {
        ...st,
        season: null,
        seasonHistory: [...st.seasonHistory || [], entry],
        seasonBadges: ok ? [...st.seasonBadges || [], { id: s2.id, name: s2.name, at: now.toISOString() }] : st.seasonBadges || []
      };
      events.push({ type: "seasonEnd", name: s2.name, success: ok });
    }
    return { state: st, events };
  }
  function availableTitles(state) {
    const out = [];
    RANKS.forEach((r, i) => {
      if (i <= state.rankIndex) out.push({ id: "rank:" + r.id, label: r.name + " · " + r.title, color: r.color });
    });
    ACHIEVEMENTS.forEach((a) => {
      if (state.unlocked[a.id]) out.push({ id: "ach:" + a.id, label: a.name, color: RARITY_COLOR[a.rarity] });
    });
    (state.seasonBadges || []).forEach((b) => out.push({ id: "badge:" + b.id, label: "Insígnia: " + b.name, color: "#FFD166" }));
    ATTRIBUTE_IDS.forEach((id) => {
      const r = attributeRank(attributeProgress(state.attributeXp[id]).level);
      if (r.index >= 2) out.push({ id: "attr:" + id, label: ATTRIBUTES[id].name + " \u00B7 " + r.rank.name, color: ATTRIBUTES[id].color });
    });
    return out;
  }
  function currentTitle(state) {
    const id = state.player && state.player.title;
    if (!id) return null;
    return availableTitles(state).find((t) => t.id === id) || null;
  }
  function setTitle(state, id) {
    if (id && !availableTitles(state).some((t) => t.id === id)) return state;
    return { ...state, player: { ...state.player, title: id || null } };
  }
  function setFrame(state, idx) {
    if (idx !== null && !(idx >= 0 && idx <= state.rankIndex)) return state;
    return { ...state, player: { ...state.player, frame: idx } };
  }


  // src/domain/extras2.ts
  var ATTRIBUTE_RANK_LEVELS = [1, 3, 6, 10, 16, 22, 30, 40, 50];
  function attributeRank(level) {
    let index = 0;
    ATTRIBUTE_RANK_LEVELS.forEach((l, i) => {
      if (level >= l) index = i;
    });
    const next = ATTRIBUTE_RANK_LEVELS[index + 1];
    return { index, rank: RANKS[index], nextLevel: next || null };
  }
  function attributeXpForLevel(level) {
    return ATTR_THRESHOLDS[Math.min(Math.max(level, 1), MAX_ATTRIBUTE_LEVEL)];
  }
  function parseDay(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function isMissionLocked(state, m, now) {
    if (!m.requires) return false;
    const pre = state.missions.find((x) => x.id === m.requires);
    if (!pre) return false;
    if (pre.status === "expired" || isMissionExpired(pre, now)) return false;
    return !isMissionDone(pre, now);
  }
  function toggleSubtask(state, missionId, subId, now = /* @__PURE__ */ new Date(), opts = {}) {
    const m = state.missions.find((x) => x.id === missionId);
    if (!m || !m.subtasks || !m.subtasks.some((t) => t.id === subId)) return { state, events: [] };
    if (m.status !== "active" || isMissionDone(m, now) || !isMissionScheduled(m, now) || isMissionLocked(state, m, now)) return { state, events: [] };
    if (m.deadline && new Date(m.deadline) < now) return { state, events: [] };
    const key = periodKey(m.type, now);
    const done = m.progress.periodKey === key ? (m.progress.done || []).filter((id) => m.subtasks.some((t) => t.id === id)) : [];
    const has = done.includes(subId);
    const setProgress = (progress) => ({ ...state, missions: state.missions.map((x) => x.id === missionId ? { ...x, progress } : x) });
    if (has) {
      const rest = done.filter((x) => x !== subId);
      return { state: setProgress({ current: rest.length, periodKey: key, done: rest }), events: [] };
    }
    return addProgress(setProgress({ current: done.length, periodKey: key, done: [...done, subId] }), missionId, 1, now, opts);
  }
  function addGoal(state, input, now = /* @__PURE__ */ new Date()) {
    const goals = state.goals || [];
    if (goals.filter((g) => !g.doneAt).length >= 10) return { state, error: "No máximo 10 metas ativas ao mesmo tempo." };
    if (!ATTRIBUTE_IDS.includes(input.attribute)) return { state, error: "Escolha um atributo." };
    const target = Math.round(Number(input.targetLevel));
    const current = attributeProgress(state.attributeXp[input.attribute]).level;
    if (!(target > current)) return { state, error: "A meta precisa ficar acima do nível atual (Nv. " + current + ")." };
    if (target > MAX_ATTRIBUTE_LEVEL) return { state, error: "O nível máximo de atributo é " + MAX_ATTRIBUTE_LEVEL + "." };
    const days = Number(input.days) > 0 ? Math.min(730, Math.round(Number(input.days))) : 0;
    const goal = {
      id: newId("g"),
      attribute: input.attribute,
      targetLevel: target,
      startXp: state.attributeXp[input.attribute],
      startDay: dayKey(now),
      endDay: days ? dayKey(addDays(now, days)) : null,
      createdAt: now.toISOString()
    };
    return { state: { ...state, goals: [...goals, goal] }, events: [] };
  }
  function removeGoal(state, goalId) {
    return { state: { ...state, goals: (state.goals || []).filter((g) => g.id !== goalId) }, events: [] };
  }
  function goalProgress(state, goal, now = /* @__PURE__ */ new Date()) {
    const xpNow = state.attributeXp[goal.attribute];
    const need = attributeXpForLevel(goal.targetLevel);
    const level = attributeProgress(xpNow).level;
    const span = Math.max(1, need - goal.startXp);
    const ratio = Math.max(0, Math.min(1, (xpNow - goal.startXp) / span));
    const today = dayKey(now);
    const daysLeft = goal.endDay ? dayNumber(goal.endDay) - dayNumber(today) : null;
    const remainingXp = Math.max(0, need - xpNow);
    const status = goal.doneAt ? "done" : level >= goal.targetLevel ? "reached" : goal.endDay && today > goal.endDay ? "late" : "active";
    return {
      level,
      ratio,
      remainingXp,
      daysLeft,
      status,
      perDay: daysLeft !== null && daysLeft > 0 && remainingXp > 0 ? Math.ceil(remainingXp / daysLeft) : null
    };
  }
  function updateGoals(state, now = /* @__PURE__ */ new Date()) {
    const events = [];
    const goals = state.goals || [];
    if (!goals.length) return { state, events };
    let coins = 0;
    const next = goals.map((g) => {
      if (g.doneAt || attributeProgress(state.attributeXp[g.attribute]).level < g.targetLevel) return g;
      const reward = Math.min(500, g.targetLevel * 10);
      coins += reward;
      events.push({ type: "goalDone", attribute: g.attribute, level: g.targetLevel, coins: reward });
      return { ...g, doneAt: now.toISOString() };
    });
    if (!events.length) return { state, events };
    return { state: { ...state, goals: next, bonusCoins: (state.bonusCoins || 0) + coins }, events };
  }
  function weekSummary(state, mondayKey, now = /* @__PURE__ */ new Date()) {
    var _a;
    const start = parseDay(mondayKey);
    const days = Array.from({ length: 7 }, (_, i) => dayKey(addDays(start, i)));
    const prevStart = addDays(start, -7);
    const prevDays = Array.from({ length: 7 }, (_, i) => dayKey(addDays(prevStart, i)));
    const comps = state.completions.filter((c) => days.includes(c.day));
    const prevXp = state.completions.filter((c) => prevDays.includes(c.day)).reduce((sum, c) => sum + c.xp, 0);
    const perDay = days.map((d) => ({ day: d, xp: comps.filter((c) => c.day === d).reduce((sum, c) => sum + c.xp, 0) }));
    const attrXp = emptyAttributeXp();
    for (const c of comps) {
      const split = splitXp(c.xp, c.attributes);
      for (const id of ATTRIBUTE_IDS) attrXp[id] += (_a = split[id]) != null ? _a : 0;
    }
    const endIso = addDays(start, 7).toISOString();
    const startIso = start.toISOString();
    const inWeek = (h) => h.at >= startIso && h.at < endIso;
    const boss = state.missions.find((m) => m.type === "boss" && m.bossKind !== "training" && m.progress.periodKey === mondayKey);
    const moods = (state.journal || []).filter((j) => days.includes(j.day) && j.mood).map((j) => j.mood);
    const best = perDay.reduce((a, d) => d.xp > a.xp ? d : a, { day: "", xp: 0 });
    return {
      weekKey: mondayKey,
      days,
      xp: comps.reduce((sum, c) => sum + c.xp, 0),
      prevXp,
      perDay,
      activeDays: new Set(comps.map((c) => c.day)).size,
      restDays: (state.restDays || []).filter((d) => days.includes(d)).length,
      missions: comps.filter((c) => c.kind !== "workout").length,
      bestDay: best.xp > 0 ? best : null,
      attrXp,
      boss: boss ? { name: boss.name, status: boss.status === "completed" ? "defeated" : "escaped" } : null,
      levelUps: state.history.filter((h) => h.type === "levelUp" && inWeek(h)).length,
      achievements: state.history.filter((h) => h.type === "achievement" && inWeek(h)).map((h) => h.achievementId),
      rankUps: state.history.filter((h) => h.type === "rankUp" && inWeek(h)).map((h) => h.to),
      mood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null
    };
  }
  function lastWeekKey(now) {
    return dayKey(addDays(parseDay(weekKey(now)), -7));
  }
  function reviewDue(state, now = /* @__PURE__ */ new Date()) {
    const thisWeek = weekKey(now);
    const last = lastWeekKey(now);
    if ((state.reviews || []).some((r) => r.weekKey === last)) return null;
    return state.completions.some((c) => c.day >= last && c.day < thisWeek) ? last : null;
  }
  function saveReview(state, input, now = /* @__PURE__ */ new Date()) {
    const key = input.weekKey;
    const thisWeek = weekKey(now);
    const oldest = dayKey(addDays(parseDay(thisWeek), -28));
    if (!(key < thisWeek && key >= oldest)) return { state, error: "Só dá para revisar as últimas 4 semanas concluídas." };
    const clean = (t) => String(t || "").trim().slice(0, 280);
    const entry = { weekKey: key, wins: clean(input.wins), blocks: clean(input.blocks), adjust: clean(input.adjust), at: now.toISOString() };
    if (!entry.wins && !entry.blocks && !entry.adjust) return { state, error: "Escreva ao menos uma linha na revisão." };
    const existing = (state.reviews || []).some((r) => r.weekKey === key);
    const reviews = (state.reviews || []).filter((r) => r.weekKey !== key).concat([entry]).sort((a, b) => a.weekKey < b.weekKey ? -1 : 1);
    const draft = { ...state, reviews, bonusCoins: (state.bonusCoins || 0) + (existing ? 0 : 15) };
    return settle(state, draft, now, [{ type: "review", coins: existing ? 0 : 15 }]);
  }

  // src/domain/selectors.ts
  var xpToday = (state, now = /* @__PURE__ */ new Date()) => {
    const today = dayKey(now);
    return state.completions.filter((c) => c.day === today).reduce((s, c) => s + c.xp, 0);
  };
  function xpByDay(state, now = /* @__PURE__ */ new Date(), count = 7) {
    var _a;
    const totals = /* @__PURE__ */ new Map();
    for (const c of state.completions) totals.set(c.day, ((_a = totals.get(c.day)) != null ? _a : 0) + c.xp);
    return lastDays(now, count).map((day) => {
      var _a2;
      return { day, xp: (_a2 = totals.get(day)) != null ? _a2 : 0 };
    });
  }
  var dailyMissions = (state) => state.missions.filter((m) => m.type === "daily");
  function pendingMissions(state, now = /* @__PURE__ */ new Date()) {
    return state.missions.filter(
      (m) => m.status === "active" && !isMissionDone(m, now) && !isMissionExpired(m, now) && isMissionScheduled(m, now) && !isMissionLocked(state, m, now)
    );
  }
  function pendingDaily(state, now = /* @__PURE__ */ new Date()) {
    return pendingMissions(state, now).filter((m) => m.type === "daily");
  }
  function missionRatio(m, now = /* @__PURE__ */ new Date()) {
    return Math.min(1, missionProgress(m, now) / m.target);
  }
  function nextAchievement(state, now = /* @__PURE__ */ new Date()) {
    const stats = deriveStats(state, now);
    const candidates = ACHIEVEMENTS.filter((a) => !state.unlocked[a.id]).map((def) => ({
      def,
      ...achievementProgress(def, stats)
    }));
    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => b.current / b.target - a.current / a.target)[0];
  }
  function nextRank(state, now = /* @__PURE__ */ new Date()) {
    const next = RANKS[state.rankIndex + 1];
    if (!next) return null;
    return { rank: next, checks: checkRank(next, deriveStats(state, now), Object.keys(state.unlocked)) };
  }
  var playerLevel = (state) => levelProgress(state.totalXp);
  return __toCommonJS(index_exports);
})();
