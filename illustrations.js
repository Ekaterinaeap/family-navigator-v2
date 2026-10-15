/* Иллюстрации в стиле plus.gov.kr / LifeSG: люди крупным планом, рядом друг с другом,
   тонкий тёплый контур, румянец, мягкая пастель. Герои — русская внешность. Чистый SVG. */
(function () {
  'use strict';
  var INK = '#4A3530';
  var P = {
    skin: '#FBE2D2', skinSh: '#F0C9B4', blush: '#F2A49B', lip: '#C0645A',
    bg: '#E2EAFB', bg2: '#C9D7F7', leaf: '#A9C9A4', leaf2: '#86B285', heart: '#F4A6A0', white: '#fff'
  };
  var uid = 0;

  /* Бюст человека. Центр головы в (x,y). */
  function bust(o) {
    var s = o.s || 1, hc = o.hairColor, dk = o.brow || shade(hc), cl = o.clothes, h = '';
    var line = ' stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"';
    /* волосы сзади */
    var back = {
      bob: 'M-41 0C-45 -48 45 -48 41 0L42 30C32 37 25 31 27 20L-27 20C-25 31 -32 37 -42 30Z',
      long: 'M-41 -4C-47 -52 47 -52 41 -4L45 72C31 78 22 68 26 42L-26 42C-22 68 -31 78 -45 72Z',
      wavy: 'M-41 -2C-47 -52 47 -52 41 -2C47 20 40 40 47 54C35 60 26 48 28 28L-28 28C-26 48 -35 60 -47 54C-40 40 -47 20 -41 -2Z',
      bun: 'M-36 -2C-40 -46 40 -46 36 -2Z'
    }[o.hair];
    if (back) h += '<path d="' + back + '" fill="' + hc + '"' + line + '/>';
    if (o.hair === 'bun') h += '<circle cx="0" cy="-44" r="14" fill="' + hc + '"' + line + '/>';
    /* туловище */
    h += '<path d="M-74 240C-74 86 -46 60 0 60C46 60 74 86 74 240Z" fill="' + cl + '"' + line + '/>';
    if (o.collar === 'shirt') h += '<path d="M-16 60L0 82L16 60L8 56L0 66L-8 56Z" fill="#fff"' + line + '/>';
    if (o.collar === 'v') h += '<path d="M-14 60L0 80L14 60" fill="' + P.skinSh + '"' + line + '/>';
    if (o.collar === 'round') h += '<path d="M-18 60Q0 74 18 60" fill="none"' + line + '/>';
    if (o.cardigan) h += '<path d="M0 66V240" stroke="' + INK + '" stroke-width="1.4"/><circle cx="-5" cy="96" r="2.2" fill="' + INK + '"/><circle cx="-5" cy="118" r="2.2" fill="' + INK + '"/>';
    if (o.straps) h += '<path d="M-36 66L-30 240M36 66L30 240" stroke="' + o.straps + '" stroke-width="9" stroke-linecap="round"/>';
    /* шея, уши, лицо */
    h += '<path d="M-11 30H11V62Q0 70 -11 62Z" fill="' + P.skinSh + '"' + line + '/>';
    h += '<ellipse cx="-33" cy="4" rx="6" ry="9" fill="' + P.skin + '"' + line + '/><ellipse cx="33" cy="4" rx="6" ry="9" fill="' + P.skin + '"' + line + '/>';
    h += '<ellipse cx="0" cy="0" rx="33" ry="39" fill="' + P.skin + '"' + line + '/>';
    if (o.beard) h += '<path d="M-31 10C-29 34 -15 44 0 44C15 44 29 34 31 10C24 24 14 30 0 30C-14 30 -24 24 -31 10Z" fill="' + hc + '" opacity=".8"/>';
    /* чёлка / причёска спереди */
    var front = {
      bob: 'M-35 -4C-37 -44 35 -46 36 -8C26 -26 4 -30 -10 -24C-20 -18 -28 -10 -35 -4Z',
      long: 'M-35 -4C-38 -46 36 -50 36 -6C30 -24 12 -34 -4 -30C-14 -22 -26 -12 -35 -4Z',
      wavy: 'M-35 -2C-38 -46 36 -50 36 -4C28 -20 18 -30 2 -30C-6 -22 -20 -14 -35 -2Z',
      short: 'M-34 -8C-38 -46 36 -50 35 -10C30 -22 22 -28 6 -28C-10 -28 -24 -22 -34 -8Z',
      bun: 'M-34 -4C-36 -38 36 -38 34 -4C28 -20 14 -27 0 -27C-14 -27 -28 -20 -34 -4Z',
      kid: 'M-33 -8C-37 -44 35 -48 34 -10C26 -18 18 -26 4 -22C-6 -30 -22 -22 -33 -8Z'
    }[o.hair];
    h += '<path d="' + front + '" fill="' + hc + '"' + line + '/>';
    /* брови, глаза */
    h += '<path d="M-20 -11Q-13 -15 -6 -12M6 -12Q13 -15 20 -11" stroke="' + dk + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
    if (o.eyes === 'smile') h += '<path d="M-19 3Q-13 -3 -7 3M7 3Q13 -3 19 3" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
    else h += '<ellipse cx="-13" cy="2" rx="3.2" ry="4" fill="' + INK + '"/><ellipse cx="13" cy="2" rx="3.2" ry="4" fill="' + INK + '"/><circle cx="-12" cy="0.5" r="1.1" fill="#fff"/><circle cx="14" cy="0.5" r="1.1" fill="#fff"/>';
    if (o.age) h += '<path d="M-25 2l-4 -2M-25 6l-4 1M25 2l4 -2M25 6l4 1M-10 30q10 4 20 0" stroke="' + P.skinSh + '" stroke-width="1.4" stroke-linecap="round" fill="none"/>';
    if (o.glasses) h += '<rect x="-23" y="-6" width="18" height="15" rx="7" fill="none" stroke="' + INK + '" stroke-width="1.8"/><rect x="5" y="-6" width="18" height="15" rx="7" fill="none" stroke="' + INK + '" stroke-width="1.8"/><path d="M-5 0H5" stroke="' + INK + '" stroke-width="1.8"/>';
    /* нос, румянец, улыбка */
    h += '<path d="M1 7Q5 15 -1 17" stroke="#D49A85" stroke-width="1.8" stroke-linecap="round" fill="none"/>';
    h += '<ellipse cx="-19" cy="16" rx="6.5" ry="3.8" fill="' + P.blush + '" opacity=".5"/><ellipse cx="19" cy="16" rx="6.5" ry="3.8" fill="' + P.blush + '" opacity=".5"/>';
    if (o.beard) h += '<path d="M-7 27Q0 32 7 27" stroke="' + INK + '" stroke-width="2" stroke-linecap="round" fill="none"/>';
    else if (o.mouth === 'open') h += '<path d="M-8 24Q0 34 8 24Z" fill="' + P.lip + '"' + line + '/>';
    else h += '<path d="M-8 24Q0 31 8 24" stroke="' + P.lip + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
    return '<g transform="translate(' + o.x + ' ' + o.y + ') rotate(' + (o.tilt || 0) + ') scale(' + s + ')">' + h + '</g>';
  }
  function shade(c) { return c === '#B9B4AE' ? '#8E8780' : '#5A3D2E'; }
  function hand(x, y, r) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (r || 11) + '" ry="' + ((r || 11) * 0.85) + '" fill="' + P.skin + '" stroke="' + INK + '" stroke-width="1.6"/>'; }
  function arm(d, color, w) { return '<path d="' + d + '" stroke="' + INK + '" stroke-width="' + ((w || 22) + 3.2) + '" stroke-linecap="round" fill="none"/><path d="' + d + '" stroke="' + color + '" stroke-width="' + (w || 22) + '" stroke-linecap="round" fill="none"/>'; }
  function heart(x, y, s, f) { return '<path transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0 6C-6 -2 -16 0 -16 8C-16 16 -6 22 0 28C6 22 16 16 16 8C16 0 6 -2 0 6Z" fill="' + (f || P.heart) + '"/>'; }
  function leaf(x, y, r, s) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + (s || 1) + ')"><path d="M0 0V-46" stroke="' + P.leaf2 + '" stroke-width="2"/><ellipse cx="-7" cy="-14" rx="7" ry="4" transform="rotate(-30 -7 -14)" fill="' + P.leaf + '"/><ellipse cx="7" cy="-24" rx="7" ry="4" transform="rotate(30 7 -24)" fill="' + P.leaf + '"/><ellipse cx="-7" cy="-34" rx="7" ry="4" transform="rotate(-30 -7 -34)" fill="' + P.leaf + '"/><ellipse cx="0" cy="-47" rx="4" ry="7" fill="' + P.leaf + '"/></g>'; }
  function bubble(x, y, inner) { return '<g transform="translate(' + x + ' ' + y + ')"><circle r="25" fill="#fff" stroke="' + P.bg2 + '" stroke-width="2"/>' + inner + '</g>'; }
  var I = {
    phone: '<rect x="-8" y="-13" width="16" height="26" rx="4" fill="none" stroke="#3567E8" stroke-width="2.4"/><path d="M-3 8H3" stroke="#3567E8" stroke-width="2.4" stroke-linecap="round"/>',
    heart: '<path transform="translate(0 -8) scale(.7)" d="M0 6C-6 -2 -16 0 -16 8C-16 16 -6 22 0 28C6 22 16 16 16 8C16 0 6 -2 0 6Z" fill="' + P.heart + '"/>',
    home: '<path d="M-12 0L0 -11L12 0V12H-12Z" fill="none" stroke="#3567E8" stroke-width="2.4" stroke-linejoin="round"/><path d="M-3 12V4H3V12" stroke="#3567E8" stroke-width="2.4" fill="none"/>',
    cap: '<path d="M-14 -3L0 -10L14 -3L0 4Z" fill="#3567E8"/><path d="M-8 0V7C-4 11 4 11 8 7V0" stroke="#3567E8" stroke-width="2.4" fill="none"/>',
    bulb: '<path d="M-8 -2a8 8 0 1 1 16 0c0 5-4 6-4 10h-8c0-4-4-5-4-10z" fill="#FFD68A" stroke="' + INK + '" stroke-width="1.4"/><path d="M-4 12H4" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>',
    check: '<path d="M-10 0L-3 7L10 -7" stroke="#3567E8" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    talk: '<rect x="-14" y="-10" width="28" height="18" rx="9" fill="#3567E8"/><path d="M-6 8L-9 14L0 8Z" fill="#3567E8"/><circle cx="-6" cy="-1" r="2" fill="#fff"/><circle cx="0" cy="-1" r="2" fill="#fff"/><circle cx="6" cy="-1" r="2" fill="#fff"/>',
    book: '<path d="M0 -8C-6 -12 -12 -12 -14 -10V10C-12 8 -6 8 0 12C6 8 12 8 14 10V-10C12 -12 6 -12 0 -8ZM0 -8V12" fill="#fff" stroke="#3567E8" stroke-width="2.2" stroke-linejoin="round"/>',
    ball: '<circle r="12" fill="#FFD68A" stroke="' + INK + '" stroke-width="1.4"/><path d="M-12 0H12M0 -12C6 -6 6 6 0 12M0 -12C-6 -6 -6 6 0 12" stroke="' + INK + '" stroke-width="1.2" fill="none"/>',
    cross: '<path d="M-4 -12H4V-4H12V4H4V12H-4V4H-12V-4H-4Z" fill="#F4A6A0"/>',
    sprout: '<path d="M0 12V-2" stroke="' + P.leaf2 + '" stroke-width="2.4"/><path d="M0 -2C-2 -12 -12 -12 -12 -12C-12 -4 -6 0 0 -2ZM0 2C2 -8 12 -8 12 -8C12 0 6 4 0 2Z" fill="' + P.leaf + '"/>'
  };
  function frame(inner) {
    return '<svg class="illu" viewBox="0 0 480 300" role="img" aria-hidden="true"><defs><clipPath id="ic' + (++uid) + '"><rect width="480" height="300"/></clipPath></defs><g clip-path="url(#ic' + uid + ')">' +
      '<ellipse cx="250" cy="200" rx="170" ry="150" fill="' + P.bg + '"/>' + inner + '</g></svg>';
  }

  var SCENES = {
    /* Ирина обнимает маму: забота дома */
    'uhod-za-tyazhelobolnym': function () {
      return frame(
        leaf(84, 300, -12, 1.3) + leaf(410, 300, 14, 1.2) +
        bust({ x: 196, y: 150, s: 0.95, hair: 'bun', hairColor: '#B9B4AE', clothes: '#E8D5C0', collar: 'round', cardigan: true, glasses: true, eyes: 'smile', age: true, tilt: 6 }) +
        '<path d="M110 262C130 236 270 236 292 262V300H110Z" fill="#A9C3E8" stroke="' + INK + '" stroke-width="1.6"/><path d="M128 272H274M138 288H266" stroke="#8FAEDB" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M176 236H212V250C212 260 204 266 194 266C184 266 176 260 176 250Z" fill="#fff" stroke="' + INK + '" stroke-width="1.6"/><path d="M212 242C222 242 222 254 211 254" stroke="' + INK + '" stroke-width="1.6" fill="none"/><path d="M188 230C186 224 192 222 190 216M198 230C196 224 202 222 200 216" stroke="#C9D7F7" stroke-width="2" stroke-linecap="round" fill="none"/>' + hand(172, 252, 10) + hand(216, 256, 10) +
        bust({ x: 306, y: 128, hair: 'bob', hairColor: '#9A5A3C', clothes: '#7FA4D9', collar: 'v', eyes: 'smile', tilt: -5 }) +
        arm('M262 214C246 200 236 196 222 196', '#7FA4D9') + hand(214, 196, 11) +
        heart(252, 54, 1.2) +
        bubble(78, 96, I.phone) + bubble(414, 82, I.home) + bubble(424, 196, I.heart)
      );
    },
    /* Анна и наставник за ноутбуком */
    'smena-professii': function () {
      return frame(
        leaf(80, 300, -12, 1.2) + leaf(418, 300, 12, 1.1) +
        bust({ x: 198, y: 136, hair: 'long', hairColor: '#B88A5A', clothes: '#F2C77A', collar: 'round' }) +
        bust({ x: 318, y: 122, s: 1.02, hair: 'short', hairColor: '#7A5A3E', clothes: '#8FB3E0', collar: 'shirt', glasses: true, eyes: 'smile', tilt: -6 }) +
        '<path d="M150 236H300L314 300H136Z" fill="#DCE5F5" stroke="' + INK + '" stroke-width="1.6"/><rect x="160" y="226" width="130" height="10" rx="4" fill="#B7C7E6" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<circle cx="225" cy="268" r="9" fill="#fff" stroke="' + INK + '" stroke-width="1.4"/><path d="M221 268l3 3 5 -6" stroke="#3567E8" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        arm('M282 212C270 222 262 230 254 238', '#8FB3E0', 20) + hand(250, 240, 10) +
        bubble(78, 92, I.cap) + bubble(412, 76, I.bulb) + bubble(426, 192, I.check)
      );
    },
    /* Михаил рядом с сыном-первоклассником */
    'rebenok-v-shkolu': function () {
      return frame(
        leaf(84, 300, -12, 1.2) + leaf(418, 300, 12, 1.1) +
        bust({ x: 300, y: 124, hair: 'short', hairColor: '#8E6B45', clothes: '#7FA4D9', collar: 'round', beard: true, eyes: 'smile', tilt: -8 }) +
        bust({ x: 186, y: 176, s: 0.72, hair: 'kid', hairColor: '#D9B46E', brow: '#A8844A', clothes: '#F2C77A', collar: 'round', straps: '#E58C7E', tilt: 4 }) +
        arm('M258 214C240 214 226 220 214 230', '#7FA4D9') + hand(208, 232, 11) +
        bubble(80, 92, I.talk) + bubble(412, 78, I.book) + bubble(426, 194, I.ball)
      );
    },
    /* Оля и Игорь вместе */
    'planirovanie-rebenka': function () {
      return frame(
        leaf(84, 300, -12, 1.2) + leaf(418, 300, 12, 1.1) +
        bust({ x: 296, y: 124, hair: 'short', hairColor: '#6B4A35', clothes: '#8FB3E0', collar: 'shirt', eyes: 'smile', tilt: -6 }) +
        bust({ x: 200, y: 138, hair: 'wavy', hairColor: '#D2AE78', brow: '#A8844A', clothes: '#F3B7A8', collar: 'v', eyes: 'smile', tilt: 10 }) +
        heart(248, 40, 1.3) +
        bubble(80, 94, I.talk) + bubble(412, 80, I.home) + bubble(426, 194, I.sprout)
      );
    }
  };

  /* Портреты героев для историй */
  var LOOKS = {
    irina: { hair: 'bob', hairColor: '#9A5A3C', clothes: '#7FA4D9', collar: 'v', eyes: 'smile' },
    anna: { hair: 'long', hairColor: '#B88A5A', clothes: '#F2C77A', collar: 'round' },
    mikhail: { hair: 'short', hairColor: '#8E6B45', clothes: '#7FA4D9', collar: 'round', beard: true, eyes: 'smile' }
  };
  window.NAV_PORTRAIT = function (look) {
    var o = {}, k, src = LOOKS[look] || LOOKS.anna; for (k in src) o[k] = src[k];
    o.x = 60; o.y = 50; o.s = 0.8;
    var id = 'pc' + (++uid);
    return '<svg class="portrait" viewBox="0 0 120 120" aria-hidden="true"><defs><clipPath id="' + id + '"><circle cx="60" cy="60" r="60"/></clipPath></defs><g clip-path="url(#' + id + ')"><rect width="120" height="120" fill="' + P.bg + '"/>' + bust(o) + '</g></svg>';
  };
  window.NAV_ILLU = function (slug) { return SCENES[slug] ? SCENES[slug]() : ''; };
})();
