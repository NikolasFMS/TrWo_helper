import { getRandomWords, BOSSES, CURSES, CATEGORIES, CATEGORY_INFO } from './words.js';
import { audio } from './audio.js';

const STORAGE_KEY = 'trapwords_state';

const INITIAL_STATE = {
  lang: 'ru',
  screen: 'MENU',
  teams: {
    team1: { id: 'team1', name: '', position: 0 },
    team2: { id: 'team2', name: '', position: 0 },
  },
  players: [
    { id: 0, name: '', position: 0 },
    { id: 1, name: '', position: 0 },
    { id: 2, name: '', position: 0 },
  ],
  pathLength: 5,
  trapsPerRoom: [3, 4, 5, 6, 7],
  currentRound: 1,
  words: { team1: '', team2: '' },
  traps: { team1: [], team2: [] },
  results: { team1: null, team2: null },
  usedWords: [],
  winner: null,
  settings: {
    timerDuration: 45,
    categories: ['base'],
    customWords: [],
    dungeonMode: 'recommended',
    monsterMode: 'normal',
    curseMode: 'standard',
    paperTraps: false,
  },
  curses: {},
  boss: BOSSES.ru[0],
  bossPosition: 4,
  bossMoved: false,
  stats: [],
  showResetModal: false,
};

function initIcons() {
  const symbols = {
    skull: '☠', play: '▶', 'book-open': '▤', settings: '⚙', 'arrow-right': '→',
    zap: 'ϟ', shield: '⬟', 'refresh-cw': '↻', eye: '◉', 'eye-off': '⊘',
    check: '✓', clock: '◷', pause: 'Ⅱ', ghost: '♟', trophy: '♜',
    'refresh-ccw': '↶', 'alert-triangle': '⚠', 'rotate-ccw': '↶'
  };
  document.querySelectorAll('[data-lucide]').forEach(icon => {
    icon.textContent = symbols[icon.getAttribute('data-lucide')] || '•';
    icon.setAttribute('aria-hidden', 'true');
  });
}

function confetti({ particleCount = 100, colors = ['#4f46e5', '#10b981', '#f43f5e', '#fbbf24'] } = {}) {
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  for (let i = 0; i < particleCount; i += 1) {
    const piece = document.createElement('i');
    piece.style.setProperty('--piece-color', colors[i % colors.length]);
    piece.style.setProperty('--piece-x', `${Math.random() * 100}vw`);
    piece.style.setProperty('--piece-delay', `${Math.random() * 0.7}s`);
    piece.style.setProperty('--piece-turn', `${Math.random() * 720 - 360}deg`);
    layer.append(piece);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 3500);
}

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.traps && parsed.traps.team1 && typeof parsed.traps.team1[0] === 'string') {
        return INITIAL_STATE;
      }
      return parsed;
    } catch (e) { }
  }
  return INITIAL_STATE;
};

const i18n = {
  ru: {
    nameGame: "Опасные Слова",
    subtitle: "Слова-ловушки",
    resume: "Продолжить игру",
    newGame: "Новая игра",
    startGame: "Начать игру",
    gameModeLabel: "Режим игры",
    modeTeams: "Команды",
    modeTrio: "Трио",
    player: "Игрок",
    rules: "Правила игры",
    rulesTitle: "Правила игры",
    rulesP1: "Опасные слова — это командная игра на объяснение слов, где вы не знаете, какие слова вам нельзя произносить.",
    rulesH0: "Подготовка к игре",
    rulesPrep: [
      "Разделитесь на две команды и сядьте по разные стороны стола.",
      "Выложите 5 жетонов комнат в порядке возрастания их сложности (в приложении это путь по подземелью).",
      "Поставьте фигурки обеих команд в первую комнату.",
      "Выложите 2 случайные карты проклятий рядом со второй и четвертой комнатами (в приложении они помечаются иконкой молнии).",
      "Выберите 1 монстра и поставьте его в последнюю комнату.",
      "Выберите по одному игроку в каждой команде, которые первыми будут объяснять слова.",
      "Игра длится максимум 8 раундов. Если за это время никто не победил — побеждает Монстр."
    ],
    rulesH1: "1. Установка ловушек",
    rulesT1: "В начале раунда каждая команда видит секретное слово соперников и придумывает для него слова-ловушки. Чем дальше вы продвинулись по подземелью, тем больше ловушек вам могут поставить.",
    rulesH2: "2. Объяснение слова",
    rulesT2: "Капитан команды берет телефон, смотрит свое секретное слово и передает телефон соперникам. Затем он начинает объяснять слово своей команде.",
    rulesL1: "Нельзя называть само слово и его однокоренные.",
    rulesL2: "Нельзя называть ловушки, которые придумали соперники (капитан их не знает!).",
    rulesL3: "Время на объяснение ограничено.",
    rulesH3: "3. Итоги раунда",
    rulesT3: "Если команда угадывает слово и капитан не попал ни в одну ловушку — команда продвигается вперед. Если капитан произнес ловушку или время вышло — команда остается на месте.",
    rulesH4: "4. Проклятия и Монстры",
    rulesT4: "В некоторых комнатах действуют <strong>Проклятия</strong>, усложняющие объяснение. В конце пути вас ждет <strong>Монстр</strong> со своим особым правилом. Если обе команды проваливают раунд, Монстр делает шаг навстречу!",
    gotIt: "Понятно",
    setupTitle: "Настройка игры",
    team1: "Команда 1",
    team2: "Команда 2",
    settings: "Настройки партии",
    pathLen: "Длина пути (комнат)",
    timePerTurn: "Время на ход (сек)",
    dicts: "Словари",
    monsterDifficulty: "Сложность Монстра",
    monsterNormal: "Обычный",
    monsterExpert: "Опытный (*)",
    monsterRandom: "Случайно",
    dungeonType: "Тип Подземелья",
    dungeonRecommended: "Базовое (3-7)",
    dungeonExpert: "Опытное (2-10)",
    dungeonRandom: "Случайное",
    curseType: "Проклятия",
    curseStandard: "Стандарт (2)",
    curseChaos: "Хаос (Больше)",
    catBase: "Базовый",
    catGeek: "Гик-культура",
    catAdult: "18+ (Вечеринка)",
    catCustom: "Свои слова",
    customWords: "Свои слова (через запятую)",
    customPlaceholder: "Слово 1, Слово 2...",
    next: "Далее",
    round: "Раунд",
    mapSubtitle: "Карта подземелья",
    startRound: "Начать раунд",
    passPhone: "Передайте телефон",
    toTeam: "команде",
    youWillSetTraps: "Вы будете устанавливать ловушки для команды",
    weAreReady: "Мы готовы",
    wordOfTeam: "Слово команды",
    word: "Слово:",
    enterTraps: "Введите {count} слов-ловушек.",
    superTrapHint: "Вы можете сделать одну ловушку Супер-ловушкой!",
    trapPlaceholder: "Ловушка",
    setTraps: "Установить ловушки",
    paperTraps: "Записывать ловушки на бумаге",
    paperTrapsEnabled: "Включено",
    paperTrapsDisabled: "Выключено",
    paperTrapsHint: "Команды по очереди записывают ловушки на бумаге, не вводя их в приложение.",
    paperRoundTitle: "Запись ловушек на бумаге",
    paperForTeam: "Ловушки для команды",
    paperTrapCount: "ловушек",
    paperSuperTrap: "В комнате с Минотавром отметьте одну ловушку как супер-ловушку.",
    paperJudgeHint: "Судья сверяется с ловушками, записанными на бумаге.",
    paperContinue: "Мы записали ловушки",
    turnOfTeam: "Ход команды",
    passToCaptain: "Передайте телефон <strong>Капитану</strong>.",
    memorizedCaptain: "Капитан, запомните слово!",
    givePhone: "Запомнили слово? Отдайте телефон противоположной команде. Пускай соперники нажмут кнопку для старта!",
    showWord: "Показать слово",
    yourWord: "Ваше слово:",
    boss: "Босс:",
    curse: "Проклятие:",
    memorized: "Соперники, нажмите для старта!",
    explaining: "Объясняет:",
    judging: "Судит:",
    trapsCount: "Ловушки",
    pause: "Пауза",
    resumeTimer: "Продолжить",
    startTimer: "Старт таймера",
    guessed: "Угадали!",
    normalTrap: "Обычная ловушка",
    superTrap: "Супер-ловушка!",
    caught: "Попались!",
    timeUp: "Время вышло",
    roundResults: "Итоги раунда",
    success: "Успех (+1 шаг)",
    trapHit: "Попались в ловушку",
    superTrapHit: "Супер-ловушка (-1 шаг)",
    monsterApproaches: "Монстр приближается!",
    monsterStep: "Обе команды не справились. Монстр делает шаг навстречу.",
    battleContinues: "Битва продолжается!",
    bothFailedBoss: "Обе команды не справились с Монстром.",
    nextRound: "Следующий раунд",
    gameOver: "Игра окончена",
    winner: "Победитель:",
    monsterWin: "Победа Монстра!",
    tie: "Ничья!",
    tieWin: "Победила дружба!",
    stats: "Статистика",
    wordsGuessed: "Угадано",
    trapsHit: "Ловушки",
    playAgain: "Играть снова",
    finalPositions: "Финальные позиции",
    finish: "Финиш",
    room: "Комната",
    team: "Команда",
    toggleVisibility: "Показать/Скрыть",
    makeSuperTrap: "Сделать супер-ловушкой",
    reroll: "Заменить",
    resetTitle: "Сбросить игру?",
    resetWarning: "Весь текущий прогресс будет потерян. Вы уверены, что хотите начать заново?",
    confirmReset: "Да, сбросить",
    cancelReset: "Отмена"
  },
  en: {
    nameGame: "Trapwords",
    subtitle: "Trap words",
    resume: "Resume Game",
    newGame: "New Game",
    startGame: "Start Game",
    gameModeLabel: "Game Mode",
    modeTeams: "Teams",
    modeTrio: "Trio",
    player: "Player",
    rules: "Rules",
    rulesTitle: "Game Rules",
    rulesP1: "Trapwords is a team game where you don't know which words you can't say.",
    rulesH0: "Preparation",
    rulesPrep: [
      "Divide into two teams and sit on opposite sides.",
      "Lay out 5 room tiles in increasing order of difficulty (dungeon path in the app).",
      "Place both teams' figures in the first room.",
      "Place 2 random curse cards near the 2nd and 4th rooms (lightning icon in the app).",
      "Choose 1 monster and place it in the last room.",
      "Choose one player from each team to be the first explainers.",
      "The game lasts a maximum of 8 rounds. If no team has won by then, the Monster wins."
    ],
    rulesH1: "1. Setting Traps",
    rulesT1: "At the start of a round, each team sees the opponents' secret word and comes up with trap words for it. The further you are in the dungeon, the more traps they can set.",
    rulesH2: "2. Explaining the Word",
    rulesT2: "The Captain takes the phone, looks at the secret word, and hands the phone to the opponents. Then they start explaining the word to their team.",
    rulesL1: "You cannot say the word itself or its root words.",
    rulesL2: "You cannot say the trap words set by the opponents (the Captain doesn't know them!).",
    rulesL3: "Time is limited.",
    rulesH3: "3. Round Results",
    rulesT3: "If the team guesses the word and the Captain didn't hit any traps, the team moves forward. If a trap is triggered or time runs out, the team stays in place.",
    rulesH4: "4. Curses and Monsters",
    rulesT4: "Some rooms have <strong>Curses</strong> that make explaining harder. At the end of the path, a <strong>Monster</strong> awaits with a special rule. If both teams fail, the Monster takes a step forward!",
    gotIt: "Got it",
    setupTitle: "Game Setup",
    team1: "Team 1",
    team2: "Team 2",
    settings: "Match Settings",
    pathLen: "Path Length (rooms)",
    timePerTurn: "Time per turn (sec)",
    dicts: "Dictionaries",
    monsterDifficulty: "Monster Difficulty",
    monsterNormal: "Normal",
    monsterExpert: "Expert (*)",
    monsterRandom: "Random",
    dungeonType: "Dungeon Type",
    dungeonRecommended: "Basic (3-7)",
    dungeonExpert: "Expert (2-10)",
    dungeonRandom: "Random",
    curseType: "Curses",
    curseStandard: "Standard (2)",
    curseChaos: "Chaos (More)",
    catBase: "Base",
    catGeek: "Geek Culture",
    catAdult: "18+ (Party)",
    catCustom: "Custom Words",
    customWords: "Custom words (comma separated)",
    customPlaceholder: "Word 1, Word 2...",
    next: "Next",
    round: "Round",
    mapSubtitle: "Dungeon Map",
    startRound: "Start Round",
    passPhone: "Pass the phone",
    toTeam: "to team",
    youWillSetTraps: "You will set traps for team",
    weAreReady: "We are ready",
    wordOfTeam: "Word of team",
    word: "Word:",
    enterTraps: "Enter {count} trap words.",
    superTrapHint: "You can make one trap a Super-trap!",
    trapPlaceholder: "Trap",
    setTraps: "Set Traps",
    paperTraps: "Write traps on paper",
    paperTrapsEnabled: "Enabled",
    paperTrapsDisabled: "Disabled",
    paperTrapsHint: "Teams take turns writing traps on paper without entering them in the app.",
    paperRoundTitle: "Write traps on paper",
    paperForTeam: "Traps for team",
    paperTrapCount: "traps",
    paperSuperTrap: "In the Minotaur room, mark one trap as a super trap.",
    paperJudgeHint: "The judge checks against the traps written on paper.",
    paperContinue: "We have written the traps",
    turnOfTeam: "Turn of team",
    passToCaptain: "Pass the phone to the <strong>Captain</strong>.",
    memorizedCaptain: "Captain, memorize the word!",
    givePhone: "Captain, did you remember the word? Then pass the phone to the other team!",
    showWord: "Show Word",
    yourWord: "Your word:",
    boss: "Boss:",
    curse: "Curse:",
    memorized: "Start Round",
    explaining: "Explaining:",
    judging: "Judging:",
    trapsCount: "Traps",
    pause: "Pause",
    resumeTimer: "Resume",
    startTimer: "Start Timer",
    guessed: "Guessed!",
    normalTrap: "Normal Trap",
    superTrap: "Super Trap!",
    caught: "Caught!",
    timeUp: "Time's up",
    roundResults: "Round Results",
    success: "Success (+1 step)",
    trapHit: "Hit a trap",
    superTrapHit: "Super trap (-1 step)",
    monsterApproaches: "Monster approaches!",
    monsterStep: "Both teams failed. Monster takes a step forward.",
    battleContinues: "Battle continues!",
    bothFailedBoss: "Both teams failed against the Monster.",
    nextRound: "Next Round",
    gameOver: "Game Over",
    winner: "Winner:",
    monsterWin: "Monster Wins!",
    tie: "Tie!",
    tieWin: "Friendship wins!",
    stats: "Statistics",
    wordsGuessed: "Guessed",
    trapsHit: "Traps",
    playAgain: "Play Again",
    finalPositions: "Final Positions",
    finish: "Finish",
    room: "Room",
    team: "Team",
    toggleVisibility: "Toggle Visibility",
    makeSuperTrap: "Make Super Trap",
    reroll: "Replace",
    resetTitle: "Reset Game?",
    resetWarning: "All current progress will be lost. Are you sure you want to start over?",
    confirmReset: "Yes, reset",
    cancelReset: "Cancel"
  }
};

let state = loadState();
let timerInterval = null;
let isPaused = false;
let timeLeft = 0;
let transientState = {};

function saveTransientState() {
  if (state.screen === 'SETUP') {
    transientState.t1 = document.getElementById('t1-name')?.value;
    transientState.t2 = document.getElementById('t2-name')?.value;
    transientState.p0 = document.getElementById('p0-name')?.value;
    transientState.p1 = document.getElementById('p1-name')?.value;
    transientState.p2 = document.getElementById('p2-name')?.value;
    transientState.custom = document.getElementById('custom-words')?.value;
  } else if (state.screen === 'TRAP_SETTING_1' || state.screen === 'TRAP_SETTING_2') {
    transientState.isInputVisible = !document.getElementById('ts-input')?.classList.contains('hidden');
    transientState.inputs = Array.from(document.querySelectorAll('.trap-input')).map(inp => inp.value);
    const superBtns = document.querySelectorAll('.btn-super');
    transientState.superIndex = Array.from(superBtns).findIndex(b => b.classList.contains('bg-purple-600'));
  } else if (state.screen === 'TURN_PREP_1' || state.screen === 'TURN_PREP_2') {
    transientState.isWordVisible = !document.getElementById('prep-shown')?.classList.contains('hidden');
  } else if (state.screen === 'TURN_PLAY_1' || state.screen === 'TURN_PLAY_2') {
    transientState.isTimerStarted = !document.getElementById('actions-container')?.classList.contains('hidden');
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateState(updates) {
  if (updates.screen && updates.screen !== state.screen) {
    transientState = {};
  } else {
    saveTransientState();
  }
  state = { ...state, ...updates };
  saveState();
  render();
}

function clearGameTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function triggerShake() {
  const container = document.getElementById('main-container');
  if (container) {
    container.classList.add('animate-shake');
    setTimeout(() => container.classList.remove('animate-shake'), 400);
  }
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) { }
  }
}

function getTrapCount(targetTeam) {
  let count = state.trapsPerRoom[Math.min(targetTeam.position, state.pathLength - 1)];
  if (targetTeam.position >= state.bossPosition) {
    if (state.boss.id.startsWith('dragon')) count += 2;
    if (state.boss.id === 'vampire_hard') count += 2;
    if (state.boss.id === 'demon_easy') count = Math.floor(count * 1.5);
    if (state.boss.id === 'demon_hard') count *= 2;
  }
  return count;
}

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  clearGameTimer();

  const t = i18n[state.lang || 'ru'];
  let content = '';
  let setupListeners = () => { };

  switch (state.screen) {
    case 'MENU': {
      const hasSavedGame = state.currentRound > 1 || state.screen !== 'MENU';
      content = `
        <div class="flex-1 flex flex-col items-center justify-center space-y-12">
          <div class="text-center space-y-4">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-indigo-600/20 text-indigo-400 mb-4 shadow-[0_0_40px_rgba(79,70,229,0.2)]">
              <i data-lucide="skull" class="w-12 h-12"></i>
            </div>
            <h1 class="text-5xl font-black tracking-tighter bg-gradient-to-br from-white to-indigo-400 bg-clip-text text-transparent">${t.nameGame}</h1>
            <p class="text-slate-400 text-lg">${t.subtitle}</p>
          </div>
          <div class="w-full space-y-4">
            ${hasSavedGame ? `
              <button id="btn-resume" class="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center text-lg">
                <i data-lucide="play" class="w-6 h-6 mr-2"></i> ${t.resume}
              </button>
            ` : ''}
            <button id="btn-start" class="w-full h-14 ${hasSavedGame ? 'border border-slate-700 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-200'} rounded-xl font-medium transition-colors flex items-center justify-center text-lg">
              ${hasSavedGame ? t.newGame : `<i data-lucide="play" class="w-6 h-6 mr-2"></i> ${t.startGame}`}
            </button>
            <button id="btn-rules" class="w-full h-14 border border-slate-700 text-white hover:bg-slate-800 rounded-xl font-medium transition-colors flex items-center justify-center text-lg">
              <i data-lucide="book-open" class="w-5 h-5 mr-2"></i> ${t.rules}
            </button>
          </div>
        </div>
      `;
      setupListeners = () => {
        // Кнопка "Продолжить игру"
        const btnResume = document.getElementById('btn-resume');
        if (btnResume) {
          btnResume.addEventListener('click', () => {
            // Если есть сохраненная игра — просто переходим на карту
            updateState({ screen: 'MAP' });
          });
        }

        // Кнопка "Новая игра" / "Начать игру"
        const btnStart = document.getElementById('btn-start');
        if (btnStart) {
          btnStart.addEventListener('click', () => {
            const hasSavedGame = state.currentRound > 1 || state.screen !== 'MENU';
            if (hasSavedGame) {
              updateState({ showResetModal: true });
            } else {
              // Сбрасываем игру и переходим в SETUP
              localStorage.removeItem(STORAGE_KEY);
              state = { ...INITIAL_STATE, lang: state.lang }; // сохраняем язык
              updateState({ screen: 'SETUP' });
            }
          });
        }

        // Кнопка "Правила"
        const btnRules = document.getElementById('btn-rules');
        if (btnRules) {
          btnRules.addEventListener('click', () => {
            updateState({ screen: 'RULES' });
          });
        }
      };
      break;
    }

    case 'RULES': {
      content = `
        <div class="flex-1 flex flex-col">
          <h2 class="text-2xl font-bold mb-6 text-center">${t.rulesTitle}</h2>
          <div class="flex-1 overflow-y-auto space-y-6 text-slate-300 pr-2 pb-4">
            <p><strong>Trapwords</strong> — ${t.rulesP1.replace('Trapwords — ', '')}</p>
            <div class="space-y-2">
              <h3 class="text-white font-bold text-lg">${t.rulesH0}</h3>
              <ul class="list-decimal pl-5 space-y-1 text-sm">
                ${t.rulesPrep.map(step => `<li>${step}</li>`).join('')}
              </ul>
            </div>
            <div class="space-y-2">
              <h3 class="text-white font-bold text-lg">${t.rulesH1}</h3>
              <p>${t.rulesT1}</p>
            </div>
            <div class="space-y-2">
              <h3 class="text-white font-bold text-lg">${t.rulesH2}</h3>
              <p>${t.rulesT2}</p>
              <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>${t.rulesL1}</li>
                <li>${t.rulesL2}</li>
                <li>${t.rulesL3}</li>
              </ul>
            </div>
            <div class="space-y-2">
              <h3 class="text-white font-bold text-lg">${t.rulesH3}</h3>
              <p>${t.rulesT3}</p>
            </div>
            <div class="space-y-2">
              <h3 class="text-white font-bold text-lg">${t.rulesH4}</h3>
              <p>${t.rulesT4}</p>
            </div>
          </div>
          <button id="btn-rules-back" class="w-full h-14 mt-4 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-medium transition-colors">
            ${t.gotIt}
          </button>
        </div>
      `;
      setupListeners = () => {
        document.getElementById('btn-rules-back')?.addEventListener('click', () => {
          updateState({ screen: 'MENU' });
        });
      };
      break;
    }

    case 'SETUP': {
      content = `
        <div class="flex-1 flex flex-col">
          <h2 class="text-2xl font-bold mb-6 text-center">${t.setupTitle}</h2>
          <div class="space-y-6 flex-1 overflow-y-auto pb-4 pr-2">
            
            <div class="space-y-4">
              <div class="space-y-2">
                <label class="text-sm font-medium text-indigo-300">${t.team1}</label>
                <input id="t1-name" value="${transientState.t1 !== undefined ? transientState.t1 : (state.teams.team1.name || t.team1)}" 
                       class="w-full h-12 rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-white focus:border-indigo-500 outline-none">
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-indigo-300">${t.team2}</label>
                <input id="t2-name" value="${transientState.t2 !== undefined ? transientState.t2 : (state.teams.team2.name || t.team2)}" 
                       class="w-full h-12 rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-white focus:border-indigo-500 outline-none">
              </div>
            </div>
            
            <div class="space-y-4 pt-4 border-t border-slate-800">
              <label class="text-sm font-medium text-indigo-300 flex items-center gap-2">
                <i data-lucide="settings" class="w-4 h-4"></i> ${t.settings}
              </label>
              
              <div class="space-y-2">
                <span class="text-xs text-slate-400">${t.monsterDifficulty}</span>
                <div class="flex gap-2" id="monster-btns">
                  ${['normal', 'expert', 'random'].map(mode => `
                    <button class="flex-1 h-10 rounded-xl border text-xs ${state.settings.monsterMode === mode ? 'bg-white text-slate-900 border-white' : 'border-slate-700 text-white'} transition-colors" data-val="${mode}">${t['monster' + mode.charAt(0).toUpperCase() + mode.slice(1)]}</button>
                  `).join('')}
                </div>
              </div>

              <div class="space-y-2">
                <span class="text-xs text-slate-400">${t.dungeonType}</span>
                <div class="flex gap-2" id="dungeon-btns">
                  ${['recommended', 'expert', 'random'].map(mode => `
                    <button class="flex-1 h-10 rounded-xl border text-xs ${state.settings.dungeonMode === mode ? 'bg-white text-slate-900 border-white' : 'border-slate-700 text-white'} transition-colors" data-val="${mode}">${t['dungeon' + mode.charAt(0).toUpperCase() + mode.slice(1)]}</button>
                  `).join('')}
                </div>
              </div>

              <div class="space-y-2">
                <span class="text-xs text-slate-400">${t.curseType}</span>
                <div class="flex gap-2" id="curse-btns">
                  ${['standard', 'chaos'].map(mode => `
                    <button class="flex-1 h-10 rounded-xl border text-xs ${state.settings.curseMode === mode ? 'bg-white text-slate-900 border-white' : 'border-slate-700 text-white'} transition-colors" data-val="${mode}">${t['curse' + mode.charAt(0).toUpperCase() + mode.slice(1)]}</button>
                  `).join('')}
                </div>
              </div>

              <div class="space-y-2">
                <span class="text-xs text-slate-400">${t.timePerTurn}</span>
                <div class="flex gap-2" id="timer-btns">
                  ${[30, 45, 60].map(time => `
                    <button class="flex-1 h-10 rounded-xl border ${state.settings.timerDuration === time ? 'bg-white text-slate-900 border-white' : 'border-slate-700 text-white'} transition-colors" data-val="${time}">${time}</button>
                  `).join('')}
                </div>
              </div>

              <div class="space-y-2">
                <button id="paper-traps-toggle" type="button" aria-pressed="${state.settings.paperTraps}" class="paper-mode-toggle ${state.settings.paperTraps ? 'is-enabled' : 'is-disabled'}">
                  <span>${t.paperTraps}</span>
                  <span class="paper-mode-status">${state.settings.paperTraps ? t.paperTrapsEnabled : t.paperTrapsDisabled}</span>
                </button>
                <p class="text-xs text-slate-400">${t.paperTrapsHint}</p>
              </div>
            </div>

            <div class="space-y-4 pt-4 border-t border-slate-800">
              <label class="text-sm font-medium text-indigo-300 flex items-center gap-2">
                <i data-lucide="book-open" class="w-4 h-4"></i> ${t.dicts}
              </label>
              <div class="grid grid-cols-2 gap-2" id="cat-btns">
                  ${Array.from(new Set([
        ...Object.keys(CATEGORIES.ru || {}),
        ...Object.keys(CATEGORIES.en || {})
      ]))
          .filter(cat => cat !== 'custom') // ← убираем дубликат
          .concat(['custom'])
          .map(cat => {
            let labelStr = cat;
            if (cat === 'custom') {
              labelStr = t.catCustom;
            } else if (CATEGORY_INFO[cat]) {
              labelStr = CATEGORY_INFO[cat][state.lang] || CATEGORY_INFO[cat].ru || cat;
            } else {
              labelStr = cat.charAt(0).toUpperCase() + cat.slice(1);
            }
            const isActive = state.settings.categories.includes(cat);
            return `<button class="h-10 px-3 rounded-xl border text-left text-sm ${isActive ? 'bg-white text-slate-900 border-white' : 'border-slate-700 text-white'} transition-colors" data-cat="${cat}">${labelStr}</button>`;
          }).join('')}
              </div>
              <div id="custom-words-container" class="space-y-2 mt-2 ${state.settings.categories.includes('custom') ? '' : 'hidden'}">
                <span class="text-xs text-slate-400">${t.customWords}</span>
                <textarea id="custom-words" class="w-full h-24 rounded-xl border border-indigo-300/30 bg-indigo-950/50 p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="${t.customPlaceholder}">${transientState.custom !== undefined ? transientState.custom : state.settings.customWords.join(', ')}</textarea>
              </div>
            </div>
          </div>
          <button id="btn-setup-next" class="w-full h-14 mt-4 shrink-0 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center">
            ${t.next} <i data-lucide="arrow-right" class="w-5 h-5 ml-2"></i>
          </button>
        </div>
      `;

      setupListeners = () => {
        document.getElementById('mode-btns')?.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (btn) {
            saveTransientState();
            updateState({ gameMode: btn.dataset.val });
          }
        });

        document.getElementById('monster-btns')?.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (btn) updateState({ settings: { ...state.settings, monsterMode: btn.dataset.val } });
        });

        document.getElementById('dungeon-btns')?.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (btn) updateState({ settings: { ...state.settings, dungeonMode: btn.dataset.val } });
        });

        document.getElementById('curse-btns')?.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (btn) updateState({ settings: { ...state.settings, curseMode: btn.dataset.val } });
        });

        document.getElementById('timer-btns')?.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (btn) {
            updateState({ settings: { ...state.settings, timerDuration: parseInt(btn.dataset.val) } });
          }
        });

        document.getElementById('paper-traps-toggle')?.addEventListener('click', () => {
          updateState({ settings: { ...state.settings, paperTraps: !state.settings.paperTraps } });
        });

        document.getElementById('cat-btns')?.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (btn) {
            const cat = btn.dataset.cat;
            let newCats = [...state.settings.categories];
            if (newCats.includes(cat)) {
              if (newCats.length > 1) {
                newCats = newCats.filter(c => c !== cat);
              }
            } else {
              newCats.push(cat);
            }
            updateState({ settings: { ...state.settings, categories: newCats } });
          }
        });

        document.getElementById('btn-setup-next')?.addEventListener('click', () => {
          const t = i18n[state.lang || 'ru'];

          let teams = { ...state.teams };
          teams.team1.name = document.getElementById('t1-name')?.value?.trim() || t.team1;
          teams.team2.name = document.getElementById('t2-name')?.value?.trim() || t.team2;

          const customWordsStr = document.getElementById('custom-words')?.value || '';
          const parsedCustom = customWordsStr.split(',').map(w => w.trim()).filter(w => w.length > 0);

          let trapsPerRoom = [3, 4, 5, 6, 7];
          let roomsForCurses = [1, 3];

          if (state.settings.dungeonMode === 'expert') {
            trapsPerRoom = [2, 4, 6, 8, 10];
            roomsForCurses = [0, 1, 2, 3];
          } else if (state.settings.dungeonMode === 'random') {
            const randPath = Math.floor(Math.random() * 3) * 2 + 3; // 3, 5, or 7
            trapsPerRoom = Array.from({ length: randPath }, () => Math.floor(Math.random() * 5) + 3);
            const numCurses = Math.min(randPath - 1, Math.floor(randPath / 2) + (state.settings.curseMode === 'chaos' ? 1 : 0));
            roomsForCurses = Array.from({ length: randPath - 1 }, (_, i) => i).sort(() => 0.5 - Math.random()).slice(0, numCurses);
          } else {
            if (state.settings.curseMode === 'chaos') roomsForCurses = [1, 2, 3];
          }

          const curses = {};
          const langCurses = CURSES[state.lang || 'ru'] || CURSES['ru'];
          const shuffledCurses = [...langCurses].sort(() => 0.5 - Math.random());
          roomsForCurses.forEach((room, i) => {
            curses[room] = shuffledCurses[i % shuffledCurses.length];
          });

          const langBosses = BOSSES[state.lang || 'ru'] || BOSSES['ru'];
          let monsterMode = state.settings.monsterMode;
          if (monsterMode === 'random') monsterMode = Math.random() > 0.5 ? 'expert' : 'normal';

          let filteredBosses = langBosses;
          if (monsterMode === 'normal') filteredBosses = langBosses.filter(b => !b.isExpert);
          else if (monsterMode === 'expert') filteredBosses = langBosses.filter(b => b.isExpert);

          const boss = filteredBosses[Math.floor(Math.random() * filteredBosses.length)];
          const bossPosition = trapsPerRoom.length - 1;

          if (boss.id.startsWith('mummy')) {
            curses[bossPosition] = shuffledCurses[Math.floor(Math.random() * shuffledCurses.length)];
          }

          updateState({
            pathLength: trapsPerRoom.length,
            teams,
            trapsPerRoom,
            settings: { ...state.settings, customWords: parsedCustom },
            curses,
            boss,
            bossPosition,
            bossMoved: false,
            screen: 'MAP',
            currentRound: 1,
            stats: [],
            usedWords: []
          });
        });
      };
      break;
    }

    case 'MAP': {
      content = `
        <div class="flex-1 flex flex-col">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold">${t.round} ${state.currentRound}</h2>
            <p class="text-slate-400">${t.mapSubtitle}</p>
          </div>
          <div class="flex-1 flex flex-col justify-center relative py-8">
            <div class="absolute left-1/2 top-8 bottom-8 w-1 bg-slate-800 -translate-x-1/2 rounded-full"></div>
            ${Array.from({ length: state.pathLength }).map((_, i) => {
        const isBoss = i === state.bossPosition;
        const hasCurse = !!state.curses[i];

        return `
                <div class="relative flex items-center justify-center h-20">
                  <div class="absolute left-4 w-1/3 flex flex-col items-end pr-4 gap-1">
                    ${state.teams.team1.position === i ?
            `<div class="bg-blue-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg shadow-blue-500/20 z-20">${state.teams.team1.name}</div>` : ''}
                  </div>
                  <div class="z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center bg-slate-900 ${isBoss ? 'border-rose-500 text-rose-500' : hasCurse ? 'border-purple-500 text-purple-500' : 'border-slate-700 text-slate-500'}">
                    ${isBoss ? '<i data-lucide="skull" class="w-5 h-5"></i>' : hasCurse ? '<i data-lucide="zap" class="w-5 h-5"></i>' : `<span class="font-bold">${i + 1}</span>`}
                  </div>
                  <div class="absolute right-4 w-1/3 flex flex-col items-start pl-4 gap-1">
                    ${state.teams.team2.position === i ?
            `<div class="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg shadow-emerald-500/20 z-20">${state.teams.team2.name}</div>` : ''}
                  </div>
                </div>
              `;
      }).join('')}
          </div>
          <button id="btn-start-round" class="w-full h-14 mt-4 shrink-0 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center" >${t.startRound}</button>
        </div>
      `;
      setupListeners = () => {
        document.getElementById('btn-start-round')?.addEventListener('click', () => {
          const newWords = getRandomWords(2, state.usedWords, state.settings.categories, state.settings.customWords);
          updateState({
            words: { team1: newWords[0], team2: newWords[1] },
            usedWords: [...state.usedWords, newWords[0].ru, newWords[1].ru],
            traps: { team1: [], team2: [] },
            results: { team1: null, team2: null },
            screen: state.settings.paperTraps ? 'PAPER_TRAPS_1' : 'TRAP_SETTING_1',
          });
        });
      };
      break;
    }

    case 'PAPER_TRAPS_1':
    case 'PAPER_REVEAL_1':
    case 'PAPER_TRAPS_2':
    case 'PAPER_REVEAL_2': {
      const isTeam1 = state.screen.endsWith('_1');
      const isRevealed = state.screen.startsWith('PAPER_REVEAL');
      const setterTeam = isTeam1 ? state.teams.team1 : state.teams.team2;
      const targetTeam = isTeam1 ? state.teams.team2 : state.teams.team1;
      const wordObj = isTeam1 ? state.words.team2 : state.words.team1;
      const word = wordObj[state.lang || 'ru'] || wordObj.ru || wordObj;
      const trapCount = getTrapCount(targetTeam);
      const isMinotaur = targetTeam.position >= state.bossPosition && state.boss.id === 'minotaur';

      content = isRevealed ? `
        <div class="flex-1 flex flex-col">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold mb-2">${t.paperRoundTitle}</h2>
            <p class="text-sm text-slate-400">${t.paperTrapsHint}</p>
          </div>
          <section class="flex-1 flex flex-col items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-5 text-center">
            <p class="text-sm text-indigo-300 mb-2">${t.paperForTeam} ${targetTeam.name}</p>
            <h3 class="text-3xl font-black uppercase tracking-wider text-white mb-4">${word}</h3>
            <p class="text-white font-bold">${trapCount} ${t.paperTrapCount}</p>
            ${isMinotaur ? `<p class="mt-3 text-sm text-purple-300">${t.paperSuperTrap}</p>` : ''}
          </section>
          <button id="btn-paper-traps-done" class="w-full h-14 mt-4 shrink-0 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-medium transition-colors">${t.paperContinue}</button>
        </div>
      ` : `
        <div class="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <i data-lucide="shield" class="w-16 h-16 text-indigo-500"></i>
          <div>
            <h2 class="text-3xl font-bold mb-2">${t.passPhone}</h2>
            <p class="text-xl text-indigo-300">${t.toTeam} <span class="font-bold text-white">${setterTeam.name}</span></p>
          </div>
          <p class="text-slate-400">${t.paperTrapsHint}</p>
          <button id="btn-paper-pass-ready" class="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">${t.weAreReady}</button>
        </div>
      `;

      setupListeners = () => {
        document.getElementById('btn-paper-pass-ready')?.addEventListener('click', () => {
          updateState({ screen: isTeam1 ? 'PAPER_REVEAL_1' : 'PAPER_REVEAL_2' });
        });
        document.getElementById('btn-paper-traps-done')?.addEventListener('click', () => {
          updateState({ screen: isTeam1 ? 'PAPER_TRAPS_2' : 'TURN_PREP_1' });
        });
      };
      break;
    }

    case 'TRAP_SETTING_1':
    case 'TRAP_SETTING_2': {
      const isTeam1 = state.screen === 'TRAP_SETTING_1';
      const setterTeam = isTeam1 ? state.teams.team2 : state.teams.team1;
      const targetTeam = isTeam1 ? state.teams.team1 : state.teams.team2;
      const wordObj = isTeam1 ? state.words.team1 : state.words.team2;
      const word = wordObj[state.lang || 'ru'] || wordObj.ru || wordObj;
      const isBoss = targetTeam.position >= state.bossPosition;
      const trapCount = getTrapCount(targetTeam);
      const isMinotaur = isBoss && state.boss.id === 'minotaur';

      content = `
        <div id="ts-pass" class="flex-1 flex flex-col items-center justify-center text-center space-y-8 ${transientState.isInputVisible ? 'hidden' : ''}">
          <i data-lucide="shield" class="w-16 h-16 text-indigo-500"></i>
          <div>
            <h2 class="text-3xl font-bold mb-2">${t.passPhone}</h2>
            <p class="text-xl text-indigo-300">${t.toTeam} <span class="font-bold text-white">${setterTeam.name}</span></p>
          </div>
          <p class="text-slate-400">${t.youWillSetTraps} ${targetTeam.name}.</p>
          <button id="btn-pass-ready" class="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">${t.weAreReady}</button>
        </div>

        <div id="ts-input" class="flex-1 flex-col ${transientState.isInputVisible ? 'flex' : 'hidden'}">
          <div class="text-center mb-6">
            <p class="text-slate-400 mb-1">${t.wordOfTeam} ${targetTeam.name}:</p>
            <div class="flex items-center justify-center gap-2">
              <h2 class="text-4xl font-black text-white tracking-wider uppercase">${word}</h2>
              <button id="btn-reroll-word" class="p-2 text-indigo-400 hover:text-indigo-300 transition-colors" title="${t.reroll}">
                <i data-lucide="refresh-cw" class="w-6 h-6"></i>
              </button>
            </div>
          </div>
          <p class="text-center text-indigo-300 mb-6">
            ${t.enterTraps.replace('{count}', trapCount)} ${isMinotaur ? `<br><span class="text-purple-400 font-bold">${t.superTrapHint}</span>` : ''}
          </p>
          <div class="space-y-3 flex-1 overflow-y-auto pb-4" id="trap-inputs-container">
            ${Array(trapCount).fill(0).map((_, i) => `
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <input type="text" class="trap-input w-full h-12 rounded-xl border border-slate-700 bg-slate-900/50 px-4 pr-12 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="${t.trapPlaceholder} ${i + 1}" data-index="${i}" value="${transientState.inputs?.[i] || ''}">
                  <button class="btn-toggle-visibility absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors" title="${t.toggleVisibility}">
                    <i data-lucide="eye" class="w-5 h-5"></i>
                  </button>
                </div>
                ${isMinotaur ? `
                  <button class="btn-super shrink-0 px-3 rounded-xl border ${transientState.superIndex === i ? 'border-purple-500 bg-purple-600 text-white' : 'border-slate-700 text-slate-500'} transition-colors" data-index="${i}" title="${t.makeSuperTrap}">
                    <i data-lucide="zap" class="w-5 h-5"></i>
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>
          <button id="btn-save-traps" class="w-full h-14 bg-slate-800 text-slate-500 rounded-xl font-medium transition-colors cursor-not-allowed" disabled>${t.setTraps}</button>
        </div>
      `;

      setupListeners = () => {
        document.getElementById('btn-pass-ready')?.addEventListener('click', () => {
          document.getElementById('ts-pass')?.classList.add('hidden');
          document.getElementById('ts-input')?.classList.remove('hidden');
          document.getElementById('ts-input')?.classList.add('flex');
        });

        document.getElementById('btn-reroll-word')?.addEventListener('click', () => {
          const newWords = getRandomWords(1, state.usedWords, state.settings.categories, state.settings.customWords);
          const newWord = newWords[0];
          const words = { ...state.words };
          if (isTeam1) words.team1 = newWord; else words.team2 = newWord;
          updateState({
            words,
            usedWords: [...state.usedWords, newWord.ru]
          });
        });

        const inputs = document.querySelectorAll('.trap-input');
        const superBtns = document.querySelectorAll('.btn-super');
        const toggleBtns = document.querySelectorAll('.btn-toggle-visibility');
        const saveBtn = document.getElementById('btn-save-traps');
        let superIndex = transientState.superIndex !== undefined ? transientState.superIndex : -1;

        toggleBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const input = e.currentTarget.previousElementSibling;
            const icon = e.currentTarget.querySelector('i');
            if (input.type === 'password') {
              input.type = 'text';
              icon.setAttribute('data-lucide', 'eye-off');
            } else {
              input.type = 'password';
              icon.setAttribute('data-lucide', 'eye');
            }
            initIcons();
          });
        });

        const checkValidity = () => {
          const allFilled = Array.from(inputs).every(inp => inp.value.trim().length > 0);
          saveBtn.disabled = !allFilled;
          saveBtn.className = `w-full h-14 rounded-xl font-medium transition-colors ${allFilled ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`;
        };
        if (transientState.isInputVisible) checkValidity();

        inputs.forEach((inp, i) => {
          inp.addEventListener('input', checkValidity);
          inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && i < inputs.length - 1) {
              inputs[i + 1].focus();
            }
          });
        });

        superBtns.forEach((btn, i) => {
          btn.addEventListener('click', () => {
            superIndex = i;
            superBtns.forEach((b, j) => {
              if (j === i) {
                b.className = 'btn-super shrink-0 px-3 rounded-xl border border-purple-500 bg-purple-600 text-white transition-colors';
              } else {
                b.className = 'btn-super shrink-0 px-3 rounded-xl border border-slate-700 text-slate-500 transition-colors';
              }
            });
          });
        });

        saveBtn.addEventListener('click', () => {
          const traps = Array.from(inputs).map((inp, i) => ({
            word: inp.value.trim().toUpperCase(),
            isSuper: i === superIndex
          })).filter(t => t.word.length > 0);

          if (isTeam1) {
            updateState({ traps: { ...state.traps, team1: traps }, screen: 'TRAP_SETTING_2' });
          } else {
            updateState({ traps: { ...state.traps, team2: traps }, screen: 'TURN_PREP_1' });
          }
        });
      };
      break;
    }

    case 'TURN_PREP_1':
    case 'TURN_PREP_2': {
      const isTeam1 = state.screen === 'TURN_PREP_1';
      const activeTeam = isTeam1 ? state.teams.team1 : state.teams.team2;
      const wordObj = isTeam1 ? state.words.team1 : state.words.team2;
      const word = wordObj[state.lang || 'ru'] || wordObj.ru || wordObj;
      const isBoss = activeTeam.position >= state.bossPosition;
      const curseObj = state.curses[activeTeam.position];
      const curse = curseObj ? (CURSES[state.lang || 'ru'].find(c => c.id === curseObj.id) || curseObj) : null;
      const boss = state.boss ? (BOSSES[state.lang || 'ru'].find(b => b.id === state.boss.id) || state.boss) : null;

      content = `
        <div class="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <i data-lucide="eye" class="w-16 h-16 text-amber-500"></i>
          <div>
            <h2 class="text-3xl font-bold mb-2">${t.turnOfTeam}</h2>
            <p class="text-xl text-amber-300 font-bold">${activeTeam.name}</p>
          </div>
          
          <!-- ДИНАМИЧЕСКИЕ ПОДСКАЗКИ -->
          <p id="text-pass-captain" class="text-slate-400 ${transientState.isWordVisible ? 'hidden' : ''}">${t.passToCaptain}</p>
          <p id="text-memorize-captain" class="text-xl text-amber-400 font-semibold ${transientState.isWordVisible ? '' : 'hidden'}">${t.memorizedCaptain}</p>
          
          <!-- ЭКРАН 1: Кнопка показа -->
          <div id="prep-hidden" class="w-full ${transientState.isWordVisible ? 'hidden' : ''}">
            <button id="btn-show" class="w-full h-14 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">
              ${t.showWord}
            </button>
          </div>

          <!-- ЭКРАН 2: Контент со словом -->
          <div id="prep-shown" class="w-full space-y-6 ${transientState.isWordVisible ? '' : 'hidden'}">
            <div class="p-8 bg-slate-800 rounded-2xl border border-slate-700">
              <p class="text-slate-400 mb-2">${t.yourWord}</p>
              <h3 class="text-4xl font-black uppercase tracking-widest text-white">${word}</h3>
            </div>
            ${isBoss && boss ? `
              <div class="p-4 bg-rose-950/50 border border-rose-500/30 rounded-xl text-rose-200">
                <div class="flex items-center justify-center gap-2 font-bold text-rose-400 mb-1">
                  <i data-lucide="skull" class="w-4 h-4"></i> ${t.boss} ${boss.name}
                  <button id="btn-reroll-boss" class="p-1 text-rose-400 hover:text-rose-300 transition-colors" title="${t.reroll}">
                    <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                  </button>
                </div>
                <p class="text-sm">${boss.description}</p>
              </div>
            ` : ''}
            ${!isBoss && curse ? `
              <div class="p-4 bg-purple-950/50 border border-purple-500/30 rounded-xl text-purple-200">
                <div class="flex items-center justify-center gap-2 font-bold text-purple-400 mb-1">
                  <i data-lucide="zap" class="w-4 h-4"></i> ${t.curse} ${curse.name}
                  <button id="btn-reroll-curse" class="p-1 text-purple-400 hover:text-purple-300 transition-colors" title="${t.reroll}">
                    <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                  </button>
                </div>
                <p class="text-sm">${curse.description}</p>
              </div>
            ` : ''}
            <p class="text-slate-400 mb-2">${t.givePhone}</p>

            <button id="btn-ready" class="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors">
              ${t.memorized}
            </button>
          </div>
        </div>
      `;

      setupListeners = () => {
        document.getElementById('btn-show')?.addEventListener('click', () => {
          // 1. Переключаем видимость основных блоков экрана
          document.getElementById('prep-hidden')?.classList.add('hidden');
          document.getElementById('prep-shown')?.classList.remove('hidden');

          // 2. Меняем верхний текст подсказки для Капитана
          document.getElementById('text-pass-captain')?.classList.add('hidden');
          document.getElementById('text-memorize-captain')?.classList.remove('hidden');

          // Сохраняем состояние видимости
          transientState.isWordVisible = true;

          initIcons();
        });

        document.getElementById('btn-reroll-boss')?.addEventListener('click', () => {
          const langBosses = BOSSES[state.lang || 'ru'] || BOSSES['ru'];
          let monsterMode = state.settings.monsterMode;
          if (monsterMode === 'random') monsterMode = Math.random() > 0.5 ? 'expert' : 'normal';
          let filteredBosses = langBosses;
          if (monsterMode === 'normal') filteredBosses = langBosses.filter(b => !b.isExpert);
          else if (monsterMode === 'expert') filteredBosses = langBosses.filter(b => b.isExpert);
          
          if (state.boss && filteredBosses.length > 1) {
            filteredBosses = filteredBosses.filter(b => b.id !== state.boss.id);
          }
          const newBoss = filteredBosses[Math.floor(Math.random() * filteredBosses.length)];
          updateState({ boss: newBoss });
        });

        document.getElementById('btn-reroll-curse')?.addEventListener('click', () => {
          const langCurses = CURSES[state.lang || 'ru'] || CURSES['ru'];
          let filteredCurses = langCurses;
          const currentCurse = state.curses[activeTeam.position];
          if (currentCurse && filteredCurses.length > 1) {
            filteredCurses = filteredCurses.filter(c => c.id !== currentCurse.id);
          }
          const newCurse = filteredCurses[Math.floor(Math.random() * filteredCurses.length)];
          const curses = { ...state.curses };
          curses[activeTeam.position] = newCurse;
          updateState({ curses });
        });

        document.getElementById('btn-ready')?.addEventListener('click', () => {
          // При переходе на экран самой игры сбрасываем видимость слова для следующего раунда
          transientState.isWordVisible = false;
          updateState({ screen: isTeam1 ? 'TURN_PLAY_1' : 'TURN_PLAY_2' });
        });
      };
      break;
    }


    case 'TURN_PLAY_1':
    case 'TURN_PLAY_2': {
      const isTeam1 = state.screen === 'TURN_PLAY_1';
      const activeTeam = isTeam1 ? state.teams.team1 : state.teams.team2;
      const judgeTeam = isTeam1 ? state.teams.team2 : state.teams.team1;
      const wordObj = isTeam1 ? state.words.team1 : state.words.team2;
      const word = wordObj[state.lang || 'ru'] || wordObj.ru || wordObj;
      const traps = isTeam1 ? state.traps.team1 : state.traps.team2;

      const isBoss = activeTeam.position >= state.bossPosition;
      const curseObj = state.curses[activeTeam.position];
      const curse = curseObj ? (CURSES[state.lang || 'ru'].find(c => c.id === curseObj.id) || curseObj) : null;
      const boss = state.boss ? (BOSSES[state.lang || 'ru'].find(b => b.id === state.boss.id) || state.boss) : null;
      const initialTime = state.settings.timerDuration - (isBoss && state.boss.id.startsWith('troll') ? 15 : 0);
      if (transientState.isTimerStarted === undefined) {
        timeLeft = initialTime;
        isPaused = false;
      }
      const hasSuperTrap = state.settings.paperTraps
        ? isBoss && state.boss.id === 'minotaur'
        : traps.some(t => t.isSuper);

      content = `
        <div class="flex-1 flex flex-col">
          <div class="text-center mb-4">
            <p class="text-slate-400 text-sm">${t.explaining} <span class="text-white font-bold">${activeTeam.name}</span></p>
            <p class="text-slate-400 text-sm">${t.judging} <span class="text-white font-bold">${judgeTeam.name}</span></p>
          </div>

          <div class="flex-1 flex flex-col items-center justify-center space-y-4">
            <div class="text-center">
              <p class="text-slate-400 mb-1">${t.word}</p>
              <h2 class="text-4xl font-black text-white uppercase tracking-wider">${word}</h2>
            </div>

            ${isBoss && boss ? `
              <div class="w-full p-3 bg-rose-950/50 border border-rose-500/30 rounded-xl text-rose-200 text-center">
                <div class="flex items-center justify-center gap-2 font-bold text-rose-400 mb-1 text-sm">
                  <i data-lucide="skull" class="w-4 h-4"></i> ${t.boss} ${boss.name}
                </div>
                <p class="text-xs">${boss.description}</p>
              </div>
            ` : ''}
            ${!isBoss && curse ? `
              <div class="w-full p-3 bg-purple-950/50 border border-purple-500/30 rounded-xl text-purple-200 text-center">
                <div class="flex items-center justify-center gap-2 font-bold text-purple-400 mb-1 text-sm">
                  <i data-lucide="zap" class="w-4 h-4"></i> ${t.curse} ${curse.name}
                </div>
                <p class="text-xs">${curse.description}</p>
              </div>
            ` : ''}

            ${state.settings.paperTraps ? `
              <div class="w-full p-4 bg-slate-800/50 rounded-2xl border border-slate-700 text-center text-sm text-slate-300">
                ${t.paperJudgeHint}
              </div>
            ` : `
            <div class="w-full p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
              <p class="text-rose-400 font-bold mb-4 text-center flex items-center justify-center gap-2">
                <i data-lucide="skull" class="w-4 h-4"></i> ${t.trapsCount} (${traps.length})
              </p>
              <div class="flex flex-wrap gap-2 justify-center">
                ${traps.map(tr => `
                  <span class="px-3 py-1.5 rounded-lg border text-lg ${tr.isSuper ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' : 'bg-rose-500/20 text-rose-200 border-rose-500/30'}">
                    ${tr.word} ${tr.isSuper ? '<i data-lucide="zap" class="w-3 h-3 inline ml-1"></i>' : ''}
                  </span>
                `).join('')}
              </div>
            </div>
            `}

            <div class="text-center relative">
              <div id="timer-display" class="text-7xl font-black tabular-nums text-white ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : ''}">
                00:${timeLeft.toString().padStart(2, '0')}
              </div>
              <div id="pause-badge" class="${isPaused ? '' : 'hidden'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500 font-bold text-2xl uppercase tracking-widest bg-slate-900/80 px-4 py-1 rounded-lg">
                ${t.pause}
              </div>
            </div>
          </div>

          <div id="start-container" class="mt-4 ${transientState.isTimerStarted ? 'hidden' : ''}">
            <button id="btn-start-timer" class="w-full h-16 text-xl bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center">
              <i data-lucide="play" class="w-6 h-6 mr-2"></i> ${t.startTimer}
            </button>
          </div>

          <div id="actions-container" class="grid grid-cols-2 gap-4 mt-4 ${transientState.isTimerStarted ? '' : 'hidden'}">
            <button id="btn-guessed" class="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              <i data-lucide="check" class="w-6 h-6"></i>
              <span class="text-sm">${t.guessed}</span>
            </button>
            
            ${hasSuperTrap ? `
              <div class="flex flex-col gap-2">
                <button id="btn-trap" class="flex-1 rounded-xl border border-rose-500/50 text-rose-400 hover:bg-rose-500/20 transition-colors text-sm">
                  ${t.normalTrap}
                </button>
                <button id="btn-super-trap" class="flex-1 rounded-xl border border-purple-500/50 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm">
                  ${t.superTrap}
                </button>
              </div>
            ` : `
              <button id="btn-trap" class="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border border-rose-500/50 text-rose-400 hover:bg-rose-500/20 transition-colors">
                <i data-lucide="skull" class="w-6 h-6"></i>
                <span class="text-sm">${t.caught}</span>
              </button>
            `}

            <button id="btn-timeup" class="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors">
              <i data-lucide="clock" class="w-6 h-6"></i>
              <span class="text-sm">${t.timeUp}</span>
            </button>

            <button id="btn-pause" class="h-16 flex flex-col items-center justify-center gap-1 rounded-xl border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
              <i data-lucide="${isPaused ? 'play' : 'pause'}" class="w-6 h-6" id="pause-icon"></i>
              <span class="text-sm" id="pause-text">${isPaused ? t.resumeTimer : t.pause}</span>
            </button>
          </div>
        </div>
      `;

      setupListeners = () => {
        const updateTimerUI = () => {
          const display = document.getElementById('timer-display');
          if (display) {
            display.textContent = `00:${timeLeft.toString().padStart(2, '0')}`;
            if (timeLeft <= 10) {
              display.className = 'text-7xl font-black tabular-nums text-rose-500 animate-pulse';
            } else {
              display.className = 'text-7xl font-black tabular-nums text-white';
            }
          }
        };

        document.getElementById('btn-start-timer')?.addEventListener('click', () => {
          document.getElementById('start-container')?.classList.add('hidden');
          document.getElementById('actions-container')?.classList.remove('hidden');

          if (!timerInterval) {
            timerInterval = window.setInterval(() => {
              if (!isPaused && timeLeft > 0) {
                timeLeft--;
                updateTimerUI();

                if (timeLeft <= 10 && timeLeft > 0) {
                  audio.playTick(); 
                  vibrate(50);
                }

                if (timeLeft === 0) {
                  vibrate([200, 100, 200]);
                  audio.playTimeUp();
                  clearGameTimer();
                }
              }

            }, 1000);
          }
        });

        document.getElementById('btn-pause')?.addEventListener('click', () => {
          isPaused = !isPaused;
          const pBadge = document.getElementById('pause-badge');
          const pIcon = document.getElementById('pause-icon');
          const pText = document.getElementById('pause-text');

          if (isPaused) {
            pBadge?.classList.remove('hidden');
            pIcon?.setAttribute('data-lucide', 'play');
            if (pText) pText.textContent = t.resumeTimer;
          } else {
            pBadge?.classList.add('hidden');
            pIcon?.setAttribute('data-lucide', 'pause');
            if (pText) pText.textContent = t.pause;
          }
          initIcons();
        });

        const handleResult = (res) => {
          clearGameTimer();
          if (res === 'GUESSED') audio.playSuccess();
          if (res === 'TRAP' || res === 'SUPER_TRAP') {
            audio.playTrap();
            triggerShake();
          }
          if (res === 'TIME_UP') audio.playTimeUp();

          if (isTeam1) {
            updateState({
              results: { ...state.results, team1: res },
              stats: [...state.stats, { round: state.currentRound, team: 'team1', word, result: res, traps, timeLeft }],
              screen: 'TURN_PREP_2'
            });
          } else {
            const newResults = { ...state.results, team2: res };
            const t1Success = newResults.team1 === 'GUESSED';
            const t2Success = newResults.team2 === 'GUESSED';

            let newPos1 = state.teams.team1.position + (t1Success ? 1 : 0);
            let newPos2 = state.teams.team2.position + (t2Success ? 1 : 0);

            if (newResults.team1 === 'SUPER_TRAP') newPos1 = Math.max(0, newPos1 - 1);
            if (newResults.team2 === 'SUPER_TRAP') newPos2 = Math.max(0, newPos2 - 1);

            let newBossPos = state.bossPosition;
            let bossMoved = false;
            const leadingTeamPos = Math.max(state.teams.team1.position, state.teams.team2.position);

            if (!t1Success && !t2Success) {
              if (newBossPos > leadingTeamPos) {
                newBossPos = Math.max(0, newBossPos - 1);
                bossMoved = true;
              }
            }

            // Win condition: started round at/past boss AND succeeded
            const team1Won = state.teams.team1.position >= state.bossPosition && t1Success;
            const team2Won = state.teams.team2.position >= state.bossPosition && t2Success;

            let winner = null;
            if (team1Won && team2Won) winner = 'TIE';
            else if (team1Won) winner = 'team1';
            else if (team2Won) winner = 'team2';
            else if (state.currentRound >= 8) winner = 'MONSTER';

            updateState({
              results: newResults,
              teams: {
                team1: { ...state.teams.team1, position: newPos1 },
                team2: { ...state.teams.team2, position: newPos2 },
              },
              bossPosition: newBossPos,
              bossMoved,
              stats: [...state.stats, { round: state.currentRound, team: 'team2', word, result: res, traps, timeLeft }],
              screen: winner ? 'GAME_OVER' : 'ROUND_END',
              winner,
            });
          }
        };

        document.getElementById('btn-guessed')?.addEventListener('click', () => handleResult('GUESSED'));
        document.getElementById('btn-trap')?.addEventListener('click', () => handleResult('TRAP'));
        document.getElementById('btn-super-trap')?.addEventListener('click', () => handleResult('SUPER_TRAP'));
        document.getElementById('btn-timeup')?.addEventListener('click', () => handleResult('TIME_UP'));
      };
      break;
    }

    case 'ROUND_END': {
      const bothFailed = state.results.team1 !== 'GUESSED' && state.results.team2 !== 'GUESSED';

      const getResultHTML = (res) => {
        if (res === 'GUESSED') return `<span class="text-emerald-400 font-bold">${t.success}</span>`;
        if (res === 'TRAP') return `<span class="text-rose-400 font-bold">${t.trapHit}</span>`;
        if (res === 'SUPER_TRAP') return `<span class="text-purple-400 font-bold">${t.superTrapHit}</span>`;
        if (res === 'TIME_UP') return `<span class="text-slate-400 font-bold">${t.timeUp}</span>`;
        return '';
      };

      content = `
        <div class="flex-1 flex flex-col items-center justify-center">
          <h2 class="text-3xl font-bold mb-6">${t.roundResults} ${state.currentRound}</h2>
          <div class="w-full space-y-4 mb-8">
            <div class="p-6 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col items-center text-center">
              <h3 class="text-xl font-bold text-white mb-2">${state.teams.team1.name}</h3>
              <p class="text-slate-400 mb-2">${t.word} <span class="text-white font-bold">${state.words.team1[state.lang || 'ru'] || state.words.team1.ru || state.words.team1}</span></p>
              <div class="text-lg">${getResultHTML(state.results.team1)}</div>
            </div>
            <div class="p-6 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col items-center text-center">
              <h3 class="text-xl font-bold text-white mb-2">${state.teams.team2.name}</h3>
              <p class="text-slate-400 mb-2">${t.word} <span class="text-white font-bold">${state.words.team2[state.lang || 'ru'] || state.words.team2.ru || state.words.team2}</span></p>
              <div class="text-lg">${getResultHTML(state.results.team2)}</div>
            </div>
          </div>
          ${state.bossMoved ? `
            <div class="w-full p-4 bg-rose-950/50 border border-rose-500/30 rounded-xl text-rose-200 text-center mb-8 animate-pulse">
              <div class="flex items-center justify-center gap-2 font-bold text-rose-400 mb-1">
                <i data-lucide="ghost" class="w-5 h-5"></i> ${t.monsterApproaches}
              </div>
              <p class="text-sm">${t.monsterStep}</p>
            </div>
          ` : ''}
          ${bothFailed && !state.bossMoved ? `
            <div class="w-full p-4 bg-rose-950/50 border border-rose-500/30 rounded-xl text-rose-200 text-center mb-8 animate-pulse">
              <div class="flex items-center justify-center gap-2 font-bold text-rose-400 mb-1">
                <i data-lucide="skull" class="w-5 h-5"></i> ${t.battleContinues}
              </div>
              <p class="text-sm">${t.bothFailedBoss}</p>
            </div>
          ` : ''}
          <button id="btn-next-round" class="w-full h-14 mt-auto bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center">
            ${t.nextRound} <i data-lucide="arrow-right" class="w-5 h-5 ml-2"></i>
          </button>
        </div>
      `;
      setupListeners = () => {
        if (bothFailed) {
          setTimeout(() => {
            triggerShake();
            audio.playTrap();
          }, 100);
        }
        document.getElementById('btn-next-round')?.addEventListener('click', () => {
          updateState({ currentRound: state.currentRound + 1, screen: 'MAP' });
        });
      };
      break;
    }

    case 'GAME_OVER': {
      const isMonsterWin = state.winner === 'MONSTER';
      const winnerName = state.winner === 'TIE' ? t.tie : (isMonsterWin ? t.monsterWin : state.teams[state.winner].name);
      const t1Stats = state.stats.filter(s => s.team === 'team1');
      const t2Stats = state.stats.filter(s => s.team === 'team2');
      const t1Guessed = t1Stats.filter(s => s.result === 'GUESSED').length;
      const t2Guessed = t2Stats.filter(s => s.result === 'GUESSED').length;
      const t1Traps = t1Stats.filter(s => s.result === 'TRAP' || s.result === 'SUPER_TRAP').length;
      const t2Traps = t2Stats.filter(s => s.result === 'TRAP' || s.result === 'SUPER_TRAP').length;

      content = `
        <div class="flex-1 flex flex-col items-center justify-center text-center">
          <i data-lucide="${isMonsterWin ? 'skull' : 'trophy'}" class="w-16 h-16 ${isMonsterWin ? 'text-rose-500' : 'text-amber-400'} mb-6"></i>
          <div class="mb-8">
            <h2 class="text-4xl font-black mb-2 text-white">${t.gameOver}</h2>
            <p class="text-2xl ${isMonsterWin ? 'text-rose-400' : 'text-amber-300'} font-bold">${state.winner === 'TIE' ? t.tieWin : (isMonsterWin ? winnerName : `${t.winner} ${winnerName}`)}</p>
          </div>
          <div class="w-full space-y-4 mb-8 flex-1 overflow-y-auto pr-2">
            <div class="p-5 bg-slate-800 rounded-2xl border border-slate-700">
              <h3 class="text-lg font-bold mb-4 text-slate-300">${t.finalPositions}</h3>
              <div class="flex justify-between items-center mb-2">
                <span>${state.teams.team1.name}</span>
                <span class="font-bold text-white">${state.teams.team1.position >= state.bossPosition ? t.finish : `${t.room} ${state.teams.team1.position + 1}`}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>${state.teams.team2.name}</span>
                <span class="font-bold text-white">${state.teams.team2.position >= state.bossPosition ? t.finish : `${t.room} ${state.teams.team2.position + 1}`}</span>
              </div>
            </div>
            <div class="p-5 bg-slate-800 rounded-2xl border border-slate-700">
              <h3 class="text-lg font-bold mb-4 text-slate-300">${t.stats}</h3>
              <div class="grid grid-cols-3 gap-2 text-sm mb-2 text-slate-400">
                <div class="text-left">${t.team}</div>
                <div class="text-center">${t.wordsGuessed}</div>
                <div class="text-right">${t.trapsHit}</div>
              </div>
              <div class="grid grid-cols-3 gap-2 text-sm mb-2 items-center">
                <div class="text-left font-bold text-white truncate pr-2">${state.teams.team1.name}</div>
                <div class="text-center text-emerald-400">${t1Guessed}</div>
                <div class="text-right text-rose-400">${t1Traps}</div>
              </div>
              <div class="grid grid-cols-3 gap-2 text-sm items-center">
                <div class="text-left font-bold text-white truncate pr-2">${state.teams.team2.name}</div>
                <div class="text-center text-emerald-400">${t2Guessed}</div>
                <div class="text-right text-rose-400">${t2Traps}</div>
              </div>
            </div>
          </div>
          <button id="btn-restart" class="w-full h-14 shrink-0 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center">
            <i data-lucide="refresh-ccw" class="w-5 h-5 mr-2"></i> ${t.playAgain}
          </button>
        </div>
      `;
      setupListeners = () => {
        if (state.winner && state.winner !== 'TIE') {
          setTimeout(() => {
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#4f46e5', '#10b981', '#f43f5e', '#fbbf24'] });
            audio.playSuccess();
          }, 100);
        }
        document.getElementById('btn-restart')?.addEventListener('click', () => {
          localStorage.removeItem(STORAGE_KEY);
          state = loadState();
          render();
        });
      };
      break;
    }
  }

  const modalHtml = state.showResetModal ? `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-shake">
        <div class="flex items-center gap-4 mb-4 text-rose-400">
          <div class="p-3 bg-rose-500/20 rounded-2xl">
            <i data-lucide="alert-triangle" class="w-6 h-6"></i>
          </div>
          <h3 class="text-xl font-bold text-white">${t.resetTitle}</h3>
        </div>
        <p class="text-slate-400 mb-8 leading-relaxed">${t.resetWarning}</p>
        <div class="grid grid-cols-2 gap-3">
          <button id="modal-cancel" class="h-12 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors">
            ${t.cancelReset}
          </button>
          <button id="modal-confirm" class="h-12 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors">
            ${t.confirmReset}
          </button>
        </div>
      </div>
    </div>
  ` : '';

  app.innerHTML = `
    <div id="main-container" class="max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-900/20 bg-slate-900/50 border-x border-slate-800/50">
      <div class="absolute top-4 left-4 right-4 z-50 flex justify-between items-center">
        ${state.screen !== 'MENU' ? `
          <button id="btn-reset-global" class="bg-slate-800/80 backdrop-blur text-white p-2 rounded-lg border border-slate-700 hover:bg-rose-900/40 hover:border-rose-500/50 transition-colors">
            <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
          </button>
        ` : '<div></div>'}
        <button id="btn-lang-toggle" class="bg-slate-800/80 backdrop-blur text-white px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-700 hover:bg-slate-700 transition-colors">
          ${state.lang === 'ru' ? 'EN' : 'RU'}
        </button>
      </div>
      <div class="flex-1 flex flex-col p-6 pt-16 animate-fade-in">
        ${content}
      </div>
      ${modalHtml}
    </div>
  `;

  initIcons();
  setupListeners();

  // === Модальное окно сброса ===
  document.getElementById('modal-cancel')?.addEventListener('click', () => {
    updateState({ showResetModal: false });
  });

  document.getElementById('modal-confirm')?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    state = { ...INITIAL_STATE, lang: state.lang };
    updateState({ screen: 'MENU', showResetModal: false });
  });

  // === Глобальная кнопка сброса ===
  document.getElementById('btn-reset-global')?.addEventListener('click', () => {
    updateState({ showResetModal: true });
  });

  // === Переключение языка ===
  document.getElementById('btn-lang-toggle')?.addEventListener('click', () => {
    const newLang = state.lang === 'ru' ? 'en' : 'ru';

    // Обновляем названия команд, если они всё ещё дефолтные
    let teams = { ...state.teams };

    if (teams.team1.name === 'Команда 1' || teams.team1.name === 'Team 1') {
      teams.team1.name = i18n[newLang].team1;
    }
    if (teams.team2.name === 'Команда 2' || teams.team2.name === 'Team 2') {
      teams.team2.name = i18n[newLang].team2;
    }

    updateState({
      lang: newLang,
      teams
    });
  });
}

// Global click listener for sounds and audio init
document.addEventListener('click', (e) => {
  audio.init();
  const target = e.target.closest('button, .clickable, input[type="checkbox"], input[type="radio"]');
  if (target) {
    audio.playClick();
  }
}, true);

// Initial render
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render, { once: true });
} else {
  render();
}
