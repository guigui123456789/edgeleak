// EdgeLeak — Module GTO (5 niveaux progressifs + quiz animé + révision)
// Le module est intégré dans app.html. Il utilise window.gtoQuiz comme namespace global.

(function(){

  // ── HAND HELPERS ──
  const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
  function allHands(){
    const out = [];
    for (let i=0; i<13; i++) for (let j=0; j<13; j++){
      if (i===j) out.push(RANKS[i]+RANKS[j]);
      else if (i<j) out.push(RANKS[i]+RANKS[j]+'s');
      else out.push(RANKS[j]+RANKS[i]+'o');
    }
    return [...new Set(out)];
  }
  const ALL_HANDS = allHands();
  function randomHand(){ return ALL_HANDS[Math.floor(Math.random() * ALL_HANDS.length)]; }
  function randomFrom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

  // Convert hand string to two visible cards (e.g. "AKs" -> A♠ K♠, "AKo" -> A♠ K♥, "AA" -> A♠ A♥)
  function handToCards(hand){
    const r1 = hand[0], r2 = hand[1];
    if (hand.length === 2) return [{r:r1,s:'spades'}, {r:r2,s:'hearts'}];
    if (hand.endsWith('s')) return [{r:r1,s:'spades'}, {r:r2,s:'spades'}];
    return [{r:r1,s:'spades'}, {r:r2,s:'hearts'}];
  }
  const SUIT_GLYPH = { spades:'♠', hearts:'♥', diamonds:'♦', clubs:'♣' };
  const SUIT_RED = { hearts:true, diamonds:true };

  // ── LEVEL DEFINITIONS ──
  // Each level has: id, title, concept, longExplanation, rangeData, quizFn(question generator)

  const LEVELS = [
    {
      id: 1,
      title: 'Les mains de base',
      concept: 'Certaines mains se jouent toujours, peu importe la position.',
      explanation: 'Ce sont les "mains premium" : paires hautes (AA, KK, QQ, JJ, TT, 99, 88), gros As (AK, AQ), et les rares connecteurs hauts assortis (KQs). Avant de t\'occuper de la position, apprends à les reconnaître. Si tu hésites avec une autre main, fold.',
      coreRange: ['AA','KK','QQ','JJ','TT','99','88','AKs','AKo','AQs','AQo','KQs'],
      actions: [
        { key: 'open', label: 'Open', color: 'green' },
        { key: 'fold', label: 'Fold', color: 'red' }
      ],
      quizFn: function(){
        const hand = randomHand();
        const inRange = this.coreRange.includes(hand);
        return {
          hand, position: 'CO', heroSeat: 5,
          context: 'Action sur toi.',
          actorSeat: null,
          correct: inRange ? 'open' : 'fold',
          explanation: inRange
            ? `${hand} fait partie des mains premium — tu open toujours.`
            : `${hand} n'est pas une main premium — au début, fold sans regret.`
        };
      }
    },
    {
      id: 2,
      title: 'La position, ça change tout',
      concept: 'En position (BTN/CO), tu joues plus de mains. Hors position (UTG/HJ), tu restes serré.',
      explanation: 'Plus tu parles tard dans la main, plus tu as d\'information sur tes adversaires. C\'est un avantage énorme. En late position (BTN, CO), élargis ta range. En early position (UTG, HJ), reste serré : tu joueras tout le reste de la main avec un déficit d\'information.',
      tightRange: ['AA','KK','QQ','JJ','TT','99','88','AKs','AQs','AJs','AKo','AQo','KQs'],
      wideRange: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','AKs','AQs','AJs','ATs','A9s','A5s','A4s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','87s','76s','65s','AKo','AQo','AJo','ATo','KQo','KJo','QJo'],
      actions: [
        { key: 'open', label: 'Open', color: 'green' },
        { key: 'fold', label: 'Fold', color: 'red' }
      ],
      quizFn: function(){
        const hand = randomHand();
        const isLate = Math.random() < 0.5;
        const position = isLate ? randomFrom(['CO','BTN']) : randomFrom(['UTG','HJ']);
        const heroSeat = ({UTG:1,HJ:2,CO:5,BTN:4})[position];
        const range = isLate ? this.wideRange : this.tightRange;
        const inRange = range.includes(hand);
        return {
          hand, position, heroSeat,
          context: `Tu es ${position}. Action sur toi.`,
          actorSeat: null,
          correct: inRange ? 'open' : 'fold',
          explanation: inRange
            ? `En ${position} avec ${hand}, tu peux open. ${isLate ? 'Position tardive = range large.' : 'Cette main passe même en early.'}`
            : `${hand} en ${position} ? Fold. ${isLate ? 'Trop faible même en late.' : 'En early position, reste serré.'}`
        };
      }
    },
    {
      id: 3,
      title: 'Les 6 positions',
      concept: 'Chaque position a sa range. Plus tu es tard, plus tu joues de mains.',
      explanation: 'UTG ≈ 13% (très tight), HJ ≈ 16%, CO ≈ 22%, BTN ≈ 40% (très large), SB ≈ 35%. En BB tu défends différemment (call ou 3-bet selon le contexte).',
      ranges: {
        UTG: ['AA','KK','QQ','JJ','TT','99','88','77','AKs','AQs','AJs','ATs','KQs','KJs','QJs','JTs','AKo','AQo'],
        HJ: ['AA','KK','QQ','JJ','TT','99','88','77','66','AKs','AQs','AJs','ATs','A9s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','AKo','AQo','AJo'],
        CO: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','AKs','AQs','AJs','ATs','A9s','A8s','A5s','A4s','KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','T8s','98s','87s','76s','AKo','AQo','AJo','ATo','KQo','KJo','QJo'],
        BTN: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','K9s','K8s','K7s','K6s','QJs','QTs','Q9s','Q8s','JTs','J9s','J8s','T9s','T8s','98s','97s','87s','86s','76s','75s','65s','54s','AKo','AQo','AJo','ATo','A9o','A8o','KQo','KJo','KTo','QJo','QTo','JTo','T9o'],
        SB: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','K9s','K8s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','76s','AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo'],
      },
      actions: [
        { key: 'open', label: 'Open', color: 'green' },
        { key: 'fold', label: 'Fold', color: 'red' }
      ],
      quizFn: function(){
        const positions = ['UTG','HJ','CO','BTN','SB'];
        const position = randomFrom(positions);
        const hand = randomHand();
        const heroSeat = ({UTG:1,HJ:2,CO:5,BTN:4,SB:6})[position];
        const inRange = this.ranges[position].includes(hand);
        const pcts = {UTG:13,HJ:16,CO:22,BTN:40,SB:35};
        return {
          hand, position, heroSeat,
          context: `Tu es ${position}. Action sur toi.`,
          actorSeat: null,
          correct: inRange ? 'open' : 'fold',
          explanation: inRange
            ? `${hand} fait partie de la range ${position} (~${pcts[position]}% des mains).`
            : `${hand} hors de la range ${position} (~${pcts[position]}%). Fold sans regret.`
        };
      }
    },
    {
      id: 4,
      title: 'Open, Call ou 3-bet ?',
      concept: 'Quelqu\'un a déjà open. Tu as 3 options : Fold, Call, ou 3-bet.',
      explanation: '3-bet = relancer une main premium (AA-JJ, AK, paires polarisées). Call = jouer une main décente avec implicites (paires moyennes, suited connectors hauts). Fold = tout le reste, surtout vs early position.',
      threeBet: ['AA','KK','QQ','JJ','AKs','AKo','AQs','A5s','A4s'],
      call: ['TT','99','88','77','AQo','AJs','ATs','KQs','KJs','QJs','JTs','T9s','98s'],
      actions: [
        { key: '3bet', label: '3-Bet', color: 'blue' },
        { key: 'call', label: 'Call', color: 'gold' },
        { key: 'fold', label: 'Fold', color: 'red' }
      ],
      quizFn: function(){
        const hand = randomHand();
        // Random opener position before hero
        const opener = randomFrom(['UTG','HJ','CO']);
        const heroPos = randomFrom(['BTN','SB']);
        const heroSeat = ({BTN:4,SB:6})[heroPos];
        const actorSeat = ({UTG:1,HJ:2,CO:5})[opener];
        let correct, explanation;
        if (this.threeBet.includes(hand)) {
          correct = '3bet';
          explanation = `${hand} est dans la range de 3-bet. Punir l'open.`;
        } else if (this.call.includes(hand)) {
          correct = 'call';
          explanation = `${hand} se cale en call. Trop faible pour 3-bet, trop bonne pour fold.`;
        } else {
          correct = 'fold';
          explanation = `${hand} face à un open : fold. Pas assez d'équité.`;
        }
        return {
          hand, position: heroPos, heroSeat, actorSeat,
          context: `${opener} open 2.5bb. À toi en ${heroPos}.`,
          correct, explanation
        };
      }
    },
    {
      id: 5,
      title: 'Jouer short stack',
      concept: 'À 20bb ou moins, on ne peut plus open-fold. C\'est push or fold.',
      explanation: 'Avec un stack court, tu n\'as pas la profondeur pour jouer post-flop. La règle : si tu joues, tu pousses tout (all-in). Sinon tu fold. La range de push s\'élargit selon ta position.',
      pushRanges: {
        UTG: ['AA','KK','QQ','JJ','TT','99','88','77','AKs','AQs','AJs','ATs','A9s','KQs','KJs','AKo','AQo'],
        HJ: ['AA','KK','QQ','JJ','TT','99','88','77','66','AKs','AQs','AJs','ATs','A9s','A8s','A7s','KQs','KJs','KTs','QJs','AKo','AQo','AJo'],
        CO: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','K9s','QJs','QTs','JTs','AKo','AQo','AJo','ATo','KQo'],
        BTN: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','K9s','K8s','K7s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','76s','AKo','AQo','AJo','ATo','A9o','A8o','KQo','KJo','QJo','JTo'],
        SB: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KQs','KJs','KTs','K9s','K8s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo'],
      },
      actions: [
        { key: 'push', label: 'Push (All-in)', color: 'red' },
        { key: 'fold', label: 'Fold', color: 'gray' }
      ],
      quizFn: function(){
        const positions = ['UTG','HJ','CO','BTN','SB'];
        const position = randomFrom(positions);
        const hand = randomHand();
        const heroSeat = ({UTG:1,HJ:2,CO:5,BTN:4,SB:6})[position];
        const inRange = this.pushRanges[position].includes(hand);
        return {
          hand, position, heroSeat,
          context: `Stack 20bb. Tu es ${position}. Action sur toi.`,
          actorSeat: null,
          correct: inRange ? 'push' : 'fold',
          stackBB: 20,
          explanation: inRange
            ? `${hand} en ${position} short stack : push tout. Pas le temps d'avoir peur.`
            : `${hand} en ${position} à 20bb : fold. Pas assez d'équité pour risquer ton tournoi.`
        };
      }
    }
  ];

  // ── PLAYER NAMES (fictional) ──
  const VILLAIN_NAMES = ['Léo','Marie','Tom','Sara','Jean','Yuki','Marc','Eva','Paul','Nina'];
  function pickVillains(n, exclude){
    const pool = VILLAIN_NAMES.filter(v => v !== exclude);
    const out = [];
    while (out.length < n && pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(i,1)[0]);
    }
    return out;
  }

  // ── TABLE RENDERER ──
  // 6-max table. Hero is always seat 0 (bottom). Other 5 seats clockwise.
  // Seat positions (x%, y%) on a 600x400 viewBox
  const SEAT_POS = [
    { x: 300, y: 350, label: 'HERO' },  // 0 = HERO (bottom)
    { x: 60,  y: 240, label: 'UTG' },   // 1
    { x: 90,  y: 100, label: 'HJ' },    // 2
    { x: 300, y: 50,  label: 'MP' },    // 3 (used as "MP" or "BTN" depending)
    { x: 510, y: 100, label: 'CO' },    // 4
    { x: 540, y: 240, label: 'BTN' },   // 5
  ];

  function renderTable(scenario){
    const { hand, position, heroSeat, actorSeat, context, stackBB } = scenario;
    const cards = handToCards(hand);
    const villains = pickVillains(5, 'Hero');

    // Override hero seat label with their position
    const seatLabels = ['HERO'];
    const otherPositions = ['UTG','HJ','CO','BTN','SB'].filter(p => p !== (position || 'CO'));
    // Seats 1..5 get position labels (clockwise around)
    // We'll just label them simply
    const positionsInOrder = ['UTG','HJ','MP','CO','BTN'];
    for (let i=1; i<6; i++) seatLabels.push(positionsInOrder[i-1]);

    // Build SVG
    const stack = stackBB || 100;
    let svg = `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" class="poker-table">`;
    // Outer table felt
    svg += `<defs>
      <radialGradient id="felt-grad" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="oklch(0.30 0.06 155)"/>
        <stop offset="100%" stop-color="oklch(0.18 0.04 155)"/>
      </radialGradient>
    </defs>`;
    svg += `<ellipse cx="300" cy="200" rx="270" ry="160" fill="url(#felt-grad)" stroke="oklch(0.42 0.07 155)" stroke-width="3"/>`;
    svg += `<ellipse cx="300" cy="200" rx="220" ry="115" fill="none" stroke="rgba(255,255,255,.04)" stroke-width="1"/>`;
    // Center logo
    svg += `<text x="300" y="200" text-anchor="middle" font-family="Instrument Serif,Georgia,serif" font-style="italic" font-size="22" fill="rgba(255,255,255,.18)">EdgeLeak</text>`;
    svg += `<text x="300" y="220" text-anchor="middle" font-family="Geist Mono,monospace" font-size="9" letter-spacing="2" fill="rgba(255,255,255,.25)">MTT 6-MAX</text>`;

    // Render seats
    for (let i=0; i<6; i++){
      const seat = SEAT_POS[i];
      const isHero = i === 0;
      const isActor = actorSeat === i;
      const name = isHero ? 'YOU' : villains[i-1];
      const label = isHero && position ? position : seatLabels[i];
      const avatarColor = isHero ? 'oklch(0.78 0.09 85)' : (isActor ? 'oklch(0.55 0.18 25)' : 'oklch(0.40 0.04 155)');
      const textColor = isHero || isActor ? 'oklch(0.18 0.012 60)' : 'oklch(0.985 0.008 90)';

      svg += `<g transform="translate(${seat.x},${seat.y})">`;
      // Avatar circle
      svg += `<circle cx="0" cy="0" r="22" fill="${avatarColor}" stroke="${isHero?'oklch(0.85 0.08 85)':'rgba(255,255,255,.15)'}" stroke-width="${isHero?'2.5':'1.5'}"/>`;
      svg += `<text x="0" y="5" text-anchor="middle" font-family="Instrument Serif,Georgia,serif" font-style="italic" font-size="18" fill="${textColor}">${name[0]}</text>`;
      // Name + position label below avatar
      svg += `<text x="0" y="42" text-anchor="middle" font-family="Geist,sans-serif" font-size="10" fill="rgba(255,255,255,.7)">${name}</text>`;
      svg += `<text x="0" y="55" text-anchor="middle" font-family="Geist Mono,monospace" font-size="8" letter-spacing="1" fill="${isHero?'oklch(0.78 0.09 85)':'rgba(255,255,255,.4)'}">${label}</text>`;
      // Stack
      svg += `<text x="0" y="-32" text-anchor="middle" font-family="Geist Mono,monospace" font-size="9" fill="rgba(255,255,255,.55)">${stack}bb</text>`;
      // Actor indicator
      if (isActor){
        svg += `<text x="0" y="-46" text-anchor="middle" font-family="Geist Mono,monospace" font-size="8" letter-spacing="1" fill="oklch(0.62 0.18 25)" font-weight="600">OPENS 2.5x</text>`;
      }
      svg += `</g>`;
    }

    // Hero cards
    const hSeat = SEAT_POS[0];
    const cardW = 36, cardH = 50, gap = 4;
    const cardsX = hSeat.x - cardW - gap/2;
    const cardsY = hSeat.y - 35 - cardH;
    cards.forEach((c, idx) => {
      const x = cardsX + idx * (cardW + gap);
      const isRed = SUIT_RED[c.s];
      const color = isRed ? 'oklch(0.55 0.18 25)' : 'oklch(0.18 0.012 60)';
      svg += `<g class="hero-card" style="animation:cardDeal .4s ${idx*0.1}s both">`;
      svg += `<rect x="${x}" y="${cardsY}" width="${cardW}" height="${cardH}" rx="4" fill="oklch(0.985 0.008 90)" stroke="oklch(0.89 0.016 82)" stroke-width="1"/>`;
      svg += `<text x="${x + 6}" y="${cardsY + 14}" font-family="Geist,sans-serif" font-size="13" font-weight="600" fill="${color}">${c.r}</text>`;
      svg += `<text x="${x + 6}" y="${cardsY + 28}" font-family="Geist,sans-serif" font-size="14" fill="${color}">${SUIT_GLYPH[c.s]}</text>`;
      svg += `<text x="${x + cardW - 6}" y="${cardsY + cardH - 4}" text-anchor="end" font-family="Geist,sans-serif" font-size="11" font-weight="600" fill="${color}" transform="rotate(180 ${x + cardW - 6} ${cardsY + cardH - 4})">${c.r}</text>`;
      svg += `</g>`;
    });

    // Pot indicator (small pill at center top)
    if (actorSeat !== null && actorSeat !== undefined){
      svg += `<rect x="270" y="155" width="60" height="20" rx="10" fill="rgba(0,0,0,.4)" stroke="rgba(255,255,255,.1)"/>`;
      svg += `<text x="300" y="169" text-anchor="middle" font-family="Geist Mono,monospace" font-size="10" fill="oklch(0.78 0.09 85)">POT 4bb</text>`;
    }

    svg += `</svg>`;
    return { svg, context, hand };
  }

  // ── QUIZ STATE ──
  const state = {
    mode: 'home', // 'home' | 'level' | 'quiz' | 'results' | 'revision'
    levelId: null,
    questions: [],
    idx: 0,
    score: 0,
    answers: [], // [{q, given, correct}]
    isRevision: false,
    progress: { levels_completed: [], current_streak: 0, longest_streak: 0, total_correct: 0, total_attempts: 0 }
  };

  // ── PROGRESS PERSISTENCE ──
  async function loadProgress(){
    if (!window.currentUser || !window.getSupa) return;
    const sb = window.getSupa();
    if (!sb) {
      const local = localStorage.getItem('el_gto_progress');
      if (local) state.progress = { ...state.progress, ...JSON.parse(local) };
      return;
    }
    const { data } = await sb.from('gto_progress').select('*').eq('user_id', window.currentUser.id).maybeSingle();
    if (data) state.progress = { ...state.progress, ...data };
    else {
      await sb.from('gto_progress').insert({ user_id: window.currentUser.id });
    }
  }
  async function saveProgress(updates){
    state.progress = { ...state.progress, ...updates };
    if (!window.currentUser) return;
    const sb = window.getSupa();
    if (!sb) {
      localStorage.setItem('el_gto_progress', JSON.stringify(state.progress));
      return;
    }
    await sb.from('gto_progress').upsert({ user_id: window.currentUser.id, ...state.progress, updated_at: new Date().toISOString() });
  }
  async function markLevelMastered(levelId){
    const list = state.progress.levels_completed || [];
    if (!list.includes(String(levelId))) {
      const updated = [...list, String(levelId)];
      await saveProgress({ levels_completed: updated });
    }
    showHome();
  }

  // ── RENDER VIEWS ──
  function getContainer(){ return document.getElementById('gto-content'); }

  function showHome(){
    state.mode = 'home';
    const c = getContainer();
    const completed = state.progress.levels_completed || [];
    const streak = state.progress.current_streak || 0;
    const totalAcc = state.progress.total_attempts > 0
      ? Math.round((state.progress.total_correct / state.progress.total_attempts) * 100) : 0;

    c.innerHTML = `
      <div class="gto-stats">
        <div class="gto-stat-card"><div class="gto-stat-v">${completed.length}/5</div><div class="gto-stat-l">niveaux maîtrisés</div></div>
        <div class="gto-stat-card"><div class="gto-stat-v">${streak}🔥</div><div class="gto-stat-l">série en cours</div></div>
        <div class="gto-stat-card"><div class="gto-stat-v">${totalAcc}%</div><div class="gto-stat-l">précision globale</div></div>
        <div class="gto-stat-card"><div class="gto-stat-v">${state.progress.longest_streak || 0}</div><div class="gto-stat-l">meilleure série</div></div>
      </div>
      <div class="gto-levels-grid">
        ${LEVELS.map((lv, idx) => {
          const isCompleted = completed.includes(String(lv.id));
          const isLocked = idx > 0 && !completed.includes(String(LEVELS[idx-1].id));
          return `
            <div class="gto-level-card ${isCompleted?'completed':''} ${isLocked?'locked':''}" ${isLocked?'':`onclick="window.gtoQuiz.showLevel(${lv.id})"`}>
              <div class="gto-level-num">Niveau ${lv.id}${isCompleted?' ✦':''}</div>
              <div class="gto-level-title">${lv.title}</div>
              <div class="gto-level-concept">${lv.concept}</div>
              ${isLocked ? `<div class="gto-level-cta locked">🔒 Termine le niveau ${LEVELS[idx-1].id} d'abord</div>` :
                isCompleted ? `<div class="gto-level-cta done">✓ Maîtrisé · Réviser →</div>` :
                `<div class="gto-level-cta">Commencer →</div>`}
            </div>`;
        }).join('')}
        <div class="gto-level-card revision ${completed.length > 0 ? '' : 'locked'}" ${completed.length > 0 ? 'onclick="window.gtoQuiz.startRevision()"':''}>
          <div class="gto-level-num">🎯 Révision</div>
          <div class="gto-level-title">Mix libre</div>
          <div class="gto-level-concept">Quiz aléatoires de tous les niveaux débloqués. Pas de score, juste de la pratique.</div>
          ${completed.length > 0 ? '<div class="gto-level-cta">Lancer →</div>' : '<div class="gto-level-cta locked">🔒 Maîtrise au moins un niveau</div>'}
        </div>
      </div>`;
  }

  function showLevel(levelId){
    state.levelId = levelId;
    state.mode = 'level';
    const lv = LEVELS.find(l => l.id === levelId);
    const completed = state.progress.levels_completed || [];
    const isCompleted = completed.includes(String(levelId));
    const c = getContainer();
    c.innerHTML = `
      <button class="gto-back" onclick="window.gtoQuiz.showHome()">← Retour aux niveaux</button>
      <div class="gto-level-detail">
        <div class="gto-level-eyebrow">Niveau ${lv.id}${isCompleted?' · ✦ Maîtrisé':''}</div>
        <h2 class="gto-level-h2">${lv.title}</h2>
        <p class="gto-level-concept-big">${lv.concept}</p>

        <div class="gto-explainer">
          <h3>Pourquoi c'est important</h3>
          <p>${lv.explanation}</p>
        </div>

        ${lv.coreRange || lv.tightRange || lv.ranges || lv.threeBet || lv.pushRanges ? `
        <div class="gto-rangeview">
          <h3>La range de référence</h3>
          ${renderRangePreview(lv)}
        </div>` : ''}

        <div class="gto-level-actions">
          <button class="gto-btn gto-btn-primary" onclick="window.gtoQuiz.startQuiz(${levelId})">Lancer le quiz (10 questions)</button>
          ${!isCompleted ? `<button class="gto-btn gto-btn-ghost" onclick="window.gtoQuiz.markMastered(${levelId})">Je connais déjà cette range — Marquer comme maîtrisé</button>` : ''}
        </div>
      </div>`;
  }

  function renderRangePreview(lv){
    // Use the simplest range available for visualization
    const range = lv.coreRange || lv.tightRange || (lv.ranges && lv.ranges.CO) || lv.threeBet || (lv.pushRanges && lv.pushRanges.BTN);
    if (!range) return '';
    let html = '<div class="mini-grid-13" style="display:grid;grid-template-columns:repeat(13,1fr);gap:2px;max-width:380px;margin:14px 0">';
    for (let r=0; r<13; r++) for (let c=0; c<13; c++){
      const h = r===c ? RANKS[r]+RANKS[c] : r<c ? RANKS[r]+RANKS[c]+'s' : RANKS[c]+RANKS[r]+'o';
      const inRange = range.includes(h);
      html += `<div style="aspect-ratio:1;border-radius:2px;background:${inRange?'rgba(180,55,40,.65)':'rgba(255,255,255,.05)'};display:flex;align-items:center;justify-content:center;font-family:'Geist Mono',monospace;font-size:8px;color:${inRange?'white':'rgba(255,255,255,.3)'}">${h.length<=2?h:''}</div>`;
    }
    html += '</div><p style="font-family:Geist Mono,monospace;font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em">Couleur foncée = à jouer · Vide = à fold</p>';
    return html;
  }

  function startQuiz(levelId){
    const lv = LEVELS.find(l => l.id === levelId);
    if (!lv) return;
    state.levelId = levelId;
    state.mode = 'quiz';
    state.idx = 0;
    state.score = 0;
    state.answers = [];
    state.isRevision = false;
    // Generate 10 unique questions
    const seen = new Set();
    state.questions = [];
    let attempts = 0;
    while (state.questions.length < 10 && attempts < 60){
      const q = lv.quizFn();
      const key = q.hand + (q.position || '') + (q.actorSeat || '');
      if (!seen.has(key)) { seen.add(key); state.questions.push({ ...q, levelId, actions: lv.actions }); }
      attempts++;
    }
    showQuestion();
  }

  function startRevision(){
    const completed = state.progress.levels_completed || [];
    if (completed.length === 0) return;
    state.mode = 'quiz';
    state.idx = 0;
    state.score = 0;
    state.answers = [];
    state.isRevision = true;
    state.levelId = null;
    // 15 mixed questions from all unlocked levels
    state.questions = [];
    const unlockedLevels = LEVELS.filter(lv => completed.includes(String(lv.id)));
    for (let i=0; i<15; i++){
      const lv = randomFrom(unlockedLevels);
      state.questions.push({ ...lv.quizFn(), levelId: lv.id, actions: lv.actions });
    }
    showQuestion();
  }

  function showQuestion(){
    const q = state.questions[state.idx];
    if (!q) return showResults();
    const { svg, context } = renderTable(q);
    const c = getContainer();
    const total = state.questions.length;
    const progressPct = Math.round((state.idx / total) * 100);
    c.innerHTML = `
      <div class="gto-quiz-bar">
        <button class="gto-back" onclick="window.gtoQuiz.exitQuiz()">← Quitter</button>
        <div class="gto-quiz-progress">
          <div class="gto-quiz-prog-fill" style="width:${progressPct}%"></div>
        </div>
        <div class="gto-quiz-counter">${state.idx + 1} / ${total}${state.isRevision ? ' · Révision' : ''}</div>
      </div>
      <div class="gto-quiz-table">${svg}</div>
      <div class="gto-quiz-context">${context}</div>
      <div class="gto-quiz-actions">
        ${q.actions.map(a => `<button class="gto-action gto-action-${a.color}" onclick="window.gtoQuiz.answer('${a.key}')">${a.label}</button>`).join('')}
      </div>
      <div class="gto-quiz-feedback" id="gto-feedback"></div>`;
  }

  async function answer(action){
    const q = state.questions[state.idx];
    if (!q || q._answered) return;
    q._answered = true;
    q.given = action;
    const correct = action === q.correct;
    if (correct) state.score++;
    state.answers.push({ q, given: action, correct });

    // Update streak / stats
    const newStreak = correct ? (state.progress.current_streak || 0) + 1 : 0;
    const longest = Math.max(state.progress.longest_streak || 0, newStreak);
    await saveProgress({
      current_streak: newStreak,
      longest_streak: longest,
      total_correct: (state.progress.total_correct || 0) + (correct ? 1 : 0),
      total_attempts: (state.progress.total_attempts || 0) + 1,
      last_quiz_at: new Date().toISOString()
    });

    // Show feedback
    const fb = document.getElementById('gto-feedback');
    fb.className = 'gto-quiz-feedback show ' + (correct ? 'correct' : 'incorrect');
    fb.innerHTML = `
      <div class="fb-icon">${correct ? '✓' : '✕'}</div>
      <div class="fb-text">
        <div class="fb-verdict">${correct ? 'Bien joué !' : 'Pas tout à fait.'}</div>
        <div class="fb-explain">La bonne réponse était <b>${q.actions.find(a => a.key === q.correct).label}</b>. ${q.explanation}</div>
      </div>
      <button class="gto-btn gto-btn-primary fb-next" onclick="window.gtoQuiz.next()">${state.idx === state.questions.length - 1 ? 'Voir le résultat →' : 'Suivante →'}</button>`;
    // Disable action buttons
    document.querySelectorAll('.gto-action').forEach(b => {
      const isCorrect = b.textContent === q.actions.find(a => a.key === q.correct).label;
      const isGiven = b.textContent === q.actions.find(a => a.key === action).label;
      if (isCorrect) b.classList.add('answered-correct');
      else if (isGiven) b.classList.add('answered-wrong');
      b.disabled = true;
    });
  }

  function next(){ state.idx++; showQuestion(); }

  function exitQuiz(){ if (confirm('Quitter le quiz en cours ?')) showHome(); }

  async function showResults(){
    if (state.isRevision){ showHome(); return; }
    state.mode = 'results';
    const total = state.questions.length;
    const pct = Math.round((state.score / total) * 100);
    const passed = pct >= 80;
    if (passed){
      const list = state.progress.levels_completed || [];
      if (!list.includes(String(state.levelId))){
        await saveProgress({ levels_completed: [...list, String(state.levelId)] });
      }
    }
    const c = getContainer();
    c.innerHTML = `
      <div class="gto-results">
        <div class="gto-results-icon">${passed ? '✦' : '↻'}</div>
        <div class="gto-results-score">${state.score} / ${total}</div>
        <div class="gto-results-pct">${pct}%</div>
        <div class="gto-results-msg">${passed ? 'Niveau maîtrisé ! Tu peux passer au suivant.' : 'Pas encore au niveau requis (80%). Réessaie quand tu veux.'}</div>
        <div class="gto-results-actions">
          <button class="gto-btn gto-btn-ghost" onclick="window.gtoQuiz.startQuiz(${state.levelId})">Refaire le quiz</button>
          <button class="gto-btn gto-btn-primary" onclick="window.gtoQuiz.showHome()">Retour aux niveaux</button>
        </div>
      </div>`;
  }

  // ── PUBLIC API ──
  window.gtoQuiz = {
    init: async function(){ await loadProgress(); showHome(); },
    showHome, showLevel, startQuiz, startRevision, answer, next, exitQuiz, markMastered: markLevelMastered
  };

})();
