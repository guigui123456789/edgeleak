// EdgeLeak — GTO Ranges Library
// Format: each entry is a map of hand -> action ('R'=raise, 'C'=call, 'M'=mixed, 'B'=3-bet, 'F'=fold)
// Hand notation: AA, KK, ..., AKs, AKo, etc.
// Ranges are based on standard MTT solver outputs (PioSolver / GTO Wizard equivalents).
// Key format: POSITION-STACK-SITUATION  (e.g. "CO-100-open")

(function(){

  // ── Helper to convert hand list arrays into {hand:action} maps ──
  function r(actions){
    const out = {};
    Object.entries(actions).forEach(([action, hands]) => {
      hands.forEach(h => out[h] = action);
    });
    return out;
  }

  window.GTO_RANGES = {

    // ────────── 100 BB OPENS (MTT) ──────────
    'UTG-100-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77',
          'AKs','AQs','AJs','ATs','A5s','A4s',
          'KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s',
          'AKo','AQo','AJo','KQo']
    }),
    'UTG+1-100-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66',
          'AKs','AQs','AJs','ATs','A9s','A5s','A4s','A3s',
          'KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s',
          'AKo','AQo','AJo','ATo','KQo','KJo']
    }),
    'LJ-100-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55',
          'AKs','AQs','AJs','ATs','A9s','A8s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','T8s','98s','87s','76s',
          'AKo','AQo','AJo','ATo','KQo','KJo','QJo']
    }),
    'HJ-100-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','QJs','QTs','Q9s','Q8s',
          'JTs','J9s','J8s','T9s','T8s','98s','87s','76s','65s',
          'AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo']
    }),
    'CO-100-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','K7s',
          'QJs','QTs','Q9s','Q8s','Q7s',
          'JTs','J9s','J8s','J7s','T9s','T8s','T7s',
          '98s','97s','87s','86s','76s','75s','65s','54s',
          'AKo','AQo','AJo','ATo','A9o','A8o','A7o',
          'KQo','KJo','KTo','K9o','QJo','QTo','Q9o','JTo','J9o','T9o']
    }),
    'BTN-100-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
          'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s',
          'JTs','J9s','J8s','J7s','J6s','T9s','T8s','T7s','T6s',
          '98s','97s','96s','87s','86s','85s','76s','75s','65s','64s','54s','53s','43s',
          'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o',
          'KQo','KJo','KTo','K9o','K8o','K7o',
          'QJo','QTo','Q9o','Q8o','JTo','J9o','J8o','T9o','T8o','98o','87o','76o'],
      M: ['K6o','Q7o','J7o','97o','86o','75o','65o']
    }),
    'SB-100-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
          'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s','Q3s','Q2s',
          'JTs','J9s','J8s','J7s','J6s','J5s',
          'T9s','T8s','T7s','T6s','98s','97s','96s','87s','86s','85s','76s','75s','65s','54s',
          'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o',
          'KQo','KJo','KTo','K9o','K8o','QJo','QTo','Q9o','Q8o','JTo','J9o','T9o']
    }),
    'BB-100-vs-open': r({
      B: ['AA','KK','QQ','JJ','AKs','AKo','AQs'],
      C: ['TT','99','88','77','66','55','44','33','22',
          'AQo','AJs','AJo','ATs','ATo','A9s','A8s','A7s','A5s','A4s','A3s','A2s',
          'KQs','KQo','KJs','KJo','KTs','KTo','K9s','K8s','K7s',
          'QJs','QJo','QTs','QTo','Q9s','Q8s','Q7s','Q6s',
          'JTs','JTo','J9s','J8s','J7s',
          'T9s','T8s','T7s','98s','97s','87s','86s','76s','75s','65s','54s']
    }),

    // ────────── 40 BB OPENS (MTT) ──────────
    'UTG-40-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77',
          'AKs','AQs','AJs','ATs','KQs','KJs','QJs','JTs',
          'AKo','AQo','AJo']
    }),
    'UTG+1-40-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66',
          'AKs','AQs','AJs','ATs','A5s','KQs','KJs','KTs','QJs','QTs','JTs','T9s',
          'AKo','AQo','AJo','KQo']
    }),
    'LJ-40-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55',
          'AKs','AQs','AJs','ATs','A9s','A5s','A4s',
          'KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','98s',
          'AKo','AQo','AJo','ATo','KQo','KJo']
    }),
    'HJ-40-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
          'AKs','AQs','AJs','ATs','A9s','A8s','A5s','A4s','A3s',
          'KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','76s',
          'AKo','AQo','AJo','ATo','KQo','KJo','QJo']
    }),
    'CO-40-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
          'AKs','AQs','AJs','ATs','A9s','A8s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','QJs','QTs','Q9s','Q8s',
          'JTs','J9s','J8s','T9s','T8s','98s','87s','76s','65s',
          'AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo']
    }),
    'BTN-40-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s',
          'QJs','QTs','Q9s','Q8s','Q7s','Q6s',
          'JTs','J9s','J8s','J7s','T9s','T8s','T7s','98s','97s','87s','86s','76s','65s','54s',
          'AKo','AQo','AJo','ATo','A9o','A8o','A7o',
          'KQo','KJo','KTo','K9o','K8o','QJo','QTo','Q9o','JTo','J9o','T9o']
    }),
    'SB-40-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','K7s','QJs','QTs','Q9s','Q8s',
          'JTs','J9s','J8s','T9s','T8s','98s','87s','76s','65s',
          'AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo']
    }),
    'BB-40-vs-open': r({
      B: ['AA','KK','QQ','JJ','TT','AKs','AKo','AQs','AQo'],
      C: ['99','88','77','66','55','44','33','22',
          'AJs','AJo','ATs','ATo','A9s','A8s','A5s','A4s','A3s','A2s',
          'KQs','KQo','KJs','KJo','KTs','K9s','K8s',
          'QJs','QJo','QTs','Q9s','Q8s',
          'JTs','J9s','J8s','T9s','T8s','98s','87s','76s','65s','54s']
    }),

    // ────────── 20 BB PUSH/FOLD (MTT) ──────────
    'UTG-20-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s',
          'AKo','AQo','AJo','ATo','KQo']
    }),
    'UTG+1-20-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','QJs','QTs','Q9s','JTs','J9s','T9s','98s',
          'AKo','AQo','AJo','ATo','A9o','KQo','KJo']
    }),
    'LJ-20-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','K7s','QJs','QTs','Q9s','Q8s','JTs','J9s','J8s','T9s','T8s','98s','87s',
          'AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo']
    }),
    'HJ-20-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s',
          'QJs','QTs','Q9s','Q8s','Q7s','JTs','J9s','J8s','J7s','T9s','T8s','T7s','98s','97s','87s','76s','65s',
          'AKo','AQo','AJo','ATo','A9o','A8o','KQo','KJo','KTo','K9o','QJo','QTo','JTo']
    }),
    'CO-20-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
          'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s',
          'JTs','J9s','J8s','J7s','J6s','T9s','T8s','T7s','T6s',
          '98s','97s','96s','87s','86s','76s','75s','65s','54s',
          'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o',
          'KQo','KJo','KTo','K9o','K8o','QJo','QTo','Q9o','JTo','J9o','T9o','98o']
    }),
    'BTN-20-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
          'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s','Q3s','Q2s',
          'JTs','J9s','J8s','J7s','J6s','J5s','T9s','T8s','T7s','T6s','T5s',
          '98s','97s','96s','95s','87s','86s','85s','76s','75s','65s','64s','54s','53s','43s',
          'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o',
          'KQo','KJo','KTo','K9o','K8o','K7o','K6o',
          'QJo','QTo','Q9o','Q8o','Q7o','JTo','J9o','J8o','T9o','T8o','98o','87o','76o']
    }),
    'SB-20-open': r({
      R: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
          'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
          'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s','Q3s','Q2s',
          'JTs','J9s','J8s','J7s','J6s','T9s','T8s','T7s','98s','97s','87s','86s','76s','75s','65s','54s',
          'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o',
          'KQo','KJo','KTo','K9o','K8o','QJo','QTo','Q9o','JTo','J9o','T9o','98o']
    }),
    'BB-20-vs-open': r({
      B: ['AA','KK','QQ','JJ','TT','99','88','77','66','55','AKs','AKo','AQs','AQo','AJs','ATs','KQs'],
      C: ['44','33','22','AJo','ATo','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
          'KJs','KTs','KQo','KJo','K9s','K8s',
          'QJs','QTs','Q9s','Q8s','JTs','J9s','J8s','T9s','T8s','98s','87s','76s','65s','54s']
    }),

    // ────────── vs 3-BET (100 BB selection) ──────────
    'CO-100-vs-3bet': r({
      B: ['AA','KK','QQ','JJ','AKs','AKo','AQs','A5s','A4s'],
      C: ['TT','99','88','77','AQo','AJs','ATs','KQs','KJs','QJs','JTs','T9s']
    }),
    'BTN-100-vs-3bet': r({
      B: ['AA','KK','QQ','JJ','AKs','AKo','AQs','A5s','A4s'],
      C: ['TT','99','88','77','66','AQo','AJs','AJo','ATs','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s']
    }),
    'SB-100-vs-3bet': r({
      B: ['AA','KK','QQ','JJ','TT','AKs','AKo','AQs','A5s'],
      C: ['99','88','77','AQo','AJs','ATs','KQs','KJs','QJs','JTs','T9s']
    }),
  };

  // ────────── COACH TIPS BY POSITION ──────────
  window.RANGE_TIPS = {
    'UTG': "Sous le canon — la position la plus difficile. Tu joues environ 12-15% des mains, principalement les premiums. Beaucoup d'adversaires parlent après toi, donc reste sélectif.",
    'UTG+1': "Toujours position early. Tu peux ouvrir un peu plus large (~17%) qu'UTG. Ajoute petites paires et quelques connecteurs.",
    'LJ': "Lojack — position early-middle. Les paires moyennes et les broadways assortis deviennent jouables. ~18-20% d'open.",
    'HJ': "Hijack — middle position. Les small suited connectors entrent dans la range. ~22-24% d'open.",
    'CO': "Cutoff — début des positions tardives. ~27% d'open. AA, KK, AK toujours dedans. Le BTN va te 3-bet large, prépare-toi.",
    'BTN': "Bouton — la meilleure position. Tu peux ouvrir 45-50% car tu seras IP post-flop sur tous sauf SB et BB. Wide opening, value-betting facile.",
    'SB': "Small Blind — 1bb investi. Tu joues seulement contre BB si tout fold. Tu peux limper ou raise très large (~40%).",
    'BB': "Big Blind — défense. Tu as déjà 1bb dedans, donc tu peux call beaucoup pour les cotes. 3-bet les premiums et les bluffs polarisés (A5s, A4s)."
  };

})();
