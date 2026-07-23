'use strict';
/**
 * ═══════════════════════════════════════════════════════════════
 *  TOXIC CONTENT FILTER  ·  Sagara AI Chatbot
 *  Mode: STRICT  —  blocks mild profanity and inappropriate lang
 *  Bilingual: Bahasa Indonesia + English
 * ═══════════════════════════════════════════════════════════════
 *
 * Categories (ordered by severity, high → low):
 *   threats       — ancaman kekerasan / violence threats
 *   hateSpeech    — ujaran kebencian / SARA
 *   sexualContent — konten seksual / pornografi
 *   profanity     — kata kasar / swear words
 *   harassment    — pelecehan / personal attacks
 *
 * Each category carries a weight (0–100). Any message whose
 * highest matched weight meets or exceeds `this.threshold`
 * is flagged as toxic.
 *
 * STRICT threshold = 65  (catches mild profanity too)
 */

class ToxicContentFilter {
  constructor() {
    this.threshold = 65; // STRICT mode

    this.categories = {
      // ── 1. Threats / Ancaman Kekerasan ─────────────────────────── weight 95
      threats: {
        weight: 95,
        label:  'Ancaman Kekerasan',
        words:  { id: [], en: [] },
        phrases: [],
        patterns: [
          /\b(bunuh|hajar|habisi|hancurkan|musnahkan|bakar|tikam|serang)\b.{0,30}\b(kamu|anda|lu|lo|kalian|mereka|sagara|admin)\b/i,
          /\b(aku|saya|gue|gw|kita)\b.{0,15}\b(akan|mau|bakal|siap)\b.{0,15}\b(bunuh|hajar|laporkan|hancurkan|ancam|serang)\b/i,
          /\bi.{0,5}(will|gonna|going to|plan to).{0,20}(kill|hurt|harm|destroy|attack|bomb|shoot|stab|murder)\b/i,
          /\b(death|murder|bomb|shoot|stab|execute).{0,30}\b(you|your|this|sagara|admin|company)\b/i,
          /\b(ancam|mengancam|diancam)\b/i,
          /\b(mati aja|mati lo|mati kamu)\b/i,
        ],
      },

      // ── 2. Hate Speech / SARA ───────────────────────────────────── weight 90
      hateSpeech: {
        weight: 90,
        label:  'Ujaran Kebencian / SARA',
        words: {
          id: [
            'kafir hina','monyet','babi hutan','cina babi','yahudi babi',
            'keturunan pki','komunis laknat','dasar kafir','usir cina',
            'pribumi kampungan','anti-islam','anti-kristen','anti-hindu',
            'ganyang','genosida','etnis rendah',
          ],
          en: [
            'nigger','nigga','chink','gook','wetback','kike','spic','raghead',
            'faggot','tranny','go back to your country','white power','nazi',
            'genocide','ethnic cleansing','white supremacy','holocaust denial',
          ],
        },
        phrases: [
          'indonesia untuk pribumi saja',
          'usir semua kafir',
          'kulit hitam rendah',
          'white lives matter only',
        ],
        patterns: [
          /\b(ras|suku|agama|etnis).{0,20}(rendah|hina|lebih buruk|tidak berguna|tidak pantas)\b/i,
        ],
      },

      // ── 3. Sexual Content / Konten Seksual ─────────────────────── weight 85
      sexualContent: {
        weight: 85,
        label:  'Konten Seksual',
        words: {
          id: [
            'bokep','porno','pornografi','bugil','telanjang bugil',
            'seks bebas','esek-esek','mesum','cabul','masturbasi',
            'orgasme','ejakulasi','ngentot','entot','ngewe','ewe',
            'kontol','memek','onlyfans','ml bareng','sex tape',
          ],
          en: [
            'porn','pornography','nude','naked','xxx','erotic','orgasm',
            'ejaculate','masturbate','hentai','nsfw','onlyfans',
            'sex tape','explicit video','adult content','sexual intercourse',
            'oral sex','anal sex',
          ],
        },
        phrases: [
          'video mesum','film porno','konten dewasa','adult film',
          'kirim foto bugil','kirim video mesum',
        ],
        patterns: [
          /\b(send|kirim|share|bagikan).{0,20}(nude|naked|bugil|foto dewasa|video mesum)\b/i,
        ],
      },

      // ── 4. Profanity / Kata Kasar ───────────────────────────────── weight 70
      profanity: {
        weight: 70,
        label:  'Kata Kasar',
        words: {
          id: [
            'anjing','bangsat','brengsek','goblok','tolol','bego',
            'idiot','kampret','keparat','tai','tahi','sialan',
            'bedebah','asu','jancok','jancuk','cok','cuk',
            'bajingan','celeng','setan','iblis','lonte','sundal',
            'pelacur','biadab','kurang ajar','dasar bodoh',
            'goblog','gblk','b4ngsat','a5u',
          ],
          en: [
            'fuck','shit','bitch','bastard','asshole','cunt',
            'prick','dick','cock','pussy','whore','slut',
            'motherfucker','fucker','bullshit','dumbass','jackass',
            'retard','moron','dumbfuck','dipshit','scumbag',
            'f*ck','sh*t','b*tch','a**hole',
          ],
        },
        phrases: [],
        patterns: [
          // leet-speak detection (e.g. @njing, 4njing)
          /[@4][nN][jJ][iI1][nN][gG]/,
          /[bB][@4][nN][gG][sS@4][aA4][tT]/,
          /[fF][uU*][cC][kK]/,
          /[sS][hH][iI1*][tT]/,
        ],
      },

      // ── 5. Harassment / Pelecehan Personal ─────────────────────── weight 65
      harassment: {
        weight: 65,
        label:  'Pelecehan',
        words: { id: [], en: [] },
        phrases: [
          'dasar bodoh kamu','mending kamu mati','ga ada gunanya kamu',
          'kamu tidak berguna','pergi sana bodoh','minggat sana',
          'mati aja lo','ga ada yang suka kamu',
          'go die','kill yourself','kys','nobody likes you',
          'you are worthless','you are nothing','go kill yourself',
          'jump off a bridge',
        ],
        patterns: [
          /\b(kamu|lo|lu|you)\b.{0,15}\b(tidak|ga|gak|nggak|bukan).{0,10}\b(berguna|pantas|dibutuhkan|diperlukan|penting)\b/i,
          /\b(kamu|lo|lu|you).{0,10}\b(bodoh|idiot|goblok|tolol|worthless|useless|stupid|dumb)\b/i,
        ],
      },
    };
  }

  /**
   * Builds a word-boundary-aware RegExp for a single term.
   * Falls back to simple .includes() via a non-boundary pattern
   * for multi-word phrases passed to this method.
   * @param {string} term
   * @returns {RegExp}
   */
  _wordRegex(term) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![a-zA-Z0-9_])${escaped}(?![a-zA-Z0-9_])`, 'i');
  }

  /**
   * Checks `text` against all categories.
   *
   * @param {string} text
   * @returns {{
   *   isToxic:  boolean,
   *   score:    number,
   *   category: string|null,
   *   label:    string|null,
   *   reasons:  string[]
   * }}
   */
  checkMessage(text) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return { isToxic: false, score: 0, category: null, label: null, reasons: [] };
    }

    const lower   = text.toLowerCase();
    const reasons = [];
    let highest   = 0;
    let topCat    = null;
    let topLabel  = null;

    for (const [key, cfg] of Object.entries(this.categories)) {
      let catScore = 0;

      // ── word lists (word-boundary matched) ──────────────────────────
      const allWords = [...(cfg.words?.id || []), ...(cfg.words?.en || [])];
      for (const word of allWords) {
        if (this._wordRegex(word).test(lower)) {
          catScore = Math.max(catScore, cfg.weight);
          reasons.push(`[${cfg.label}] kata tidak pantas terdeteksi`);
          break;
        }
      }

      // ── phrase list (substring matched) ─────────────────────────────
      for (const phrase of (cfg.phrases || [])) {
        if (lower.includes(phrase.toLowerCase())) {
          catScore = Math.max(catScore, cfg.weight);
          reasons.push(`[${cfg.label}] frasa tidak pantas terdeteksi`);
          break;
        }
      }

      // ── regex patterns ───────────────────────────────────────────────
      for (const pattern of (cfg.patterns || [])) {
        if (pattern.test(text)) {
          catScore = Math.max(catScore, cfg.weight);
          reasons.push(`[${cfg.label}] pola berbahaya terdeteksi`);
          break;
        }
      }

      if (catScore > highest) {
        highest  = catScore;
        topCat   = key;
        topLabel = cfg.label;
      }
    }

    return {
      isToxic:  highest >= this.threshold,
      score:    highest,
      category: topCat,
      label:    topLabel,
      reasons:  [...new Set(reasons)],
    };
  }

  /** Lightweight boolean guard for inline use. */
  isBlocked(text) {
    return this.checkMessage(text).isToxic;
  }
}

// Export a singleton — same instance shared across all routes
module.exports = new ToxicContentFilter();
