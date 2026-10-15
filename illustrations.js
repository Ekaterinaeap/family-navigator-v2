/* Иллюстрации-баннеры для ситуаций: плоский дружелюбный стиль (LifeSG / plus.gov.kr),
   одна синяя гамма + один тёплый акцент. Рисуются в SVG, без внешних картинок. */
(function () {
  'use strict';
  var C = { b1: '#0D4CD3', b2: '#3567E8', b3: '#7BA4FF', b4: '#C9D7F7', b5: '#E2EAFB', skin: '#F2C8A6', skin2: '#E8B892', dark: '#3B2A22', grey: '#A89A90', ink: '#0B1F33', warm: '#FF9DB4', sun: '#FFD9A0', white: '#fff' };

  /* Человечек: ноги на (x,y), s — масштаб. */
  function person(o) {
    var s = o.s || 1, shirt = o.shirt || C.b2, pants = o.pants || C.ink, h = '';
    var arms = {
      down: ['M-15 -74Q-24 -58 -21 -44', 'M15 -74Q24 -58 21 -44'],
      reachL: ['M-15 -74Q-34 -70 -44 -62', 'M15 -74Q24 -58 21 -44'],
      holdR: ['M-15 -74Q-24 -58 -21 -44', 'M15 -74Q27 -56 30 -38'],
      holdL: ['M-15 -74Q-26 -62 -31 -50', 'M15 -74Q24 -58 21 -44'],
      wave: ['M-15 -74Q-24 -58 -21 -44', 'M15 -74Q30 -84 31 -100'],
      both: ['M-15 -74Q-26 -62 -31 -50', 'M15 -74Q27 -60 32 -48']
    }[o.arms || 'down'];
    h += '<rect x="-10" y="-40" width="8" height="40" rx="4" fill="' + pants + '"/><rect x="2" y="-40" width="8" height="40" rx="4" fill="' + pants + '"/>';
    if (o.bag) h += '<rect x="-31" y="-82" width="20" height="32" rx="8" fill="' + o.bag + '"/>';
    h += '<path d="' + arms[0] + '" stroke="' + shirt + '" stroke-width="8" stroke-linecap="round" fill="none"/><path d="' + arms[1] + '" stroke="' + shirt + '" stroke-width="8" stroke-linecap="round" fill="none"/>';
    h += '<rect x="-18" y="-84" width="36" height="50" rx="15" fill="' + shirt + '"/>';
    h += '<rect x="-4" y="-90" width="8" height="8" fill="' + C.skin2 + '"/><circle cx="0" cy="-102" r="15" fill="' + C.skin + '"/>';
    var hair = {
      short: '<path d="M-15 -104C-15 -124 15 -124 15 -104C10 -112 -10 -112 -15 -104Z" fill="' + C.dark + '"/>',
      bob: '<path d="M-17 -100C-19 -126 19 -126 17 -100L15 -91L12 -106C6 -112 -6 -112 -12 -106L-15 -91Z" fill="' + (o.hairColor || '#8C7B6E') + '"/>',
      long: '<path d="M-17 -102C-19 -126 19 -126 17 -102L19 -78L12 -80L12 -106C6 -112 -6 -112 -12 -106L-12 -80L-19 -78Z" fill="' + C.dark + '"/>',
      kid: '<path d="M-15 -104C-15 -122 15 -122 15 -104C8 -114 -6 -114 -15 -104Z" fill="#6B4A35"/>'
    }[o.hair || 'short'];
    h += hair;
    if (o.beard) h += '<path d="M-12 -98C-10 -86 10 -86 12 -98C9 -92 4 -90 0 -90C-4 -90 -9 -92 -12 -98Z" fill="' + C.dark + '" opacity=".85"/>';
    h += '<circle cx="-5" cy="-102" r="1.8" fill="' + C.ink + '"/><circle cx="5" cy="-102" r="1.8" fill="' + C.ink + '"/>';
    if (!o.beard) h += '<path d="M-4 -96Q0 -93 4 -96" stroke="#9A5B45" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    if (o.glasses) h += '<circle cx="-5.5" cy="-102" r="4.5" fill="none" stroke="' + C.ink + '" stroke-width="1.4"/><circle cx="5.5" cy="-102" r="4.5" fill="none" stroke="' + C.ink + '" stroke-width="1.4"/>';
    return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + s + ')">' + h + '</g>';
  }
  function heart(x, y, s, fill) { return '<path transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0 6C-6 -2 -16 0 -16 8C-16 16 -6 22 0 28C6 22 16 16 16 8C16 0 6 -2 0 6Z" fill="' + (fill || C.warm) + '"/>'; }
  function bubble(x, y, inner) { return '<g transform="translate(' + x + ' ' + y + ')"><circle r="22" fill="#fff"/>' + inner + '</g>'; }
  function base(inner) {
    return '<svg class="illu" viewBox="0 0 480 300" role="img" aria-hidden="true">' +
      '<circle cx="300" cy="150" r="128" fill="' + C.b5 + '"/><circle cx="96" cy="70" r="10" fill="' + C.b4 + '"/><circle cx="440" cy="60" r="6" fill="' + C.b4 + '"/><circle cx="60" cy="210" r="5" fill="' + C.b4 + '"/>' +
      '<ellipse cx="250" cy="272" rx="210" ry="12" fill="' + C.b4 + '" opacity=".6"/>' + inner + '</svg>';
  }

  var SCENES = {
    /* Уход за близким: дочь рядом с мамой, дом, тепло */
    'uhod-za-tyazhelobolnym': function () {
      return base(
        '<rect x="300" y="46" width="96" height="84" rx="10" fill="#fff" stroke="' + C.b4 + '" stroke-width="3"/><path d="M348 46V130M300 88H396" stroke="' + C.b4 + '" stroke-width="3"/><circle cx="374" cy="68" r="11" fill="' + C.sun + '"/>' +
        '<rect x="96" y="150" width="16" height="120" rx="7" fill="' + C.b3 + '"/><rect x="300" y="200" width="12" height="70" rx="6" fill="' + C.b3 + '"/>' +
        '<rect x="104" y="206" width="206" height="30" rx="12" fill="#fff" stroke="' + C.b4 + '" stroke-width="3"/>' +
        '<ellipse cx="146" cy="198" rx="28" ry="13" fill="#fff" stroke="' + C.b4 + '" stroke-width="3"/>' +
        '<circle cx="150" cy="186" r="15" fill="' + C.skin + '"/><path d="M135 184C134 166 166 166 165 184C160 176 140 176 135 184Z" fill="' + C.grey + '"/><circle cx="150" cy="168" r="6" fill="' + C.grey + '"/>' +
        '<path d="M143 187Q146 189 149 187M152 187Q155 189 158 187" stroke="' + C.ink + '" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M146 193Q150 196 154 193" stroke="#9A5B45" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M168 196H300V218C300 224 296 228 290 228H178C172 228 168 224 168 218Z" fill="' + C.b2 + '"/>' +
        person({ x: 352, y: 268, hair: 'bob', glasses: true, shirt: C.b1, arms: 'reachL' }) +
        heart(318, 132, 1, C.warm) +
        '<rect x="410" y="232" width="30" height="36" rx="6" fill="' + C.b3 + '"/><path d="M425 232C410 210 418 196 425 190C432 196 440 210 425 232Z" fill="' + C.b2 + '"/>'
      );
    },
    /* Смена профессии: от ноутбука вверх по ступеням к новой роли */
    'smena-professii': function () {
      return base(
        '<rect x="70" y="196" width="150" height="10" rx="5" fill="' + C.b3 + '"/><rect x="82" y="206" width="8" height="64" rx="4" fill="' + C.b3 + '"/><rect x="198" y="206" width="8" height="64" rx="4" fill="' + C.b3 + '"/>' +
        '<rect x="104" y="148" width="78" height="48" rx="6" fill="' + C.b1 + '"/><rect x="96" y="194" width="94" height="6" rx="3" fill="' + C.ink + '"/>' +
        '<circle cx="132" cy="168" r="4" fill="#fff"/><circle cx="154" cy="168" r="4" fill="#fff"/><path d="M134 180Q143 186 152 180" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<rect x="300" y="232" width="150" height="40" rx="6" fill="' + C.b4 + '"/><rect x="340" y="192" width="110" height="40" rx="6" fill="' + C.b3 + '"/><rect x="380" y="152" width="70" height="40" rx="6" fill="' + C.b2 + '"/>' +
        '<path d="M415 152V108" stroke="' + C.ink + '" stroke-width="4" stroke-linecap="round"/><path d="M417 108L446 118L417 128Z" fill="' + C.warm + '"/>' +
        person({ x: 262, y: 268, hair: 'long', shirt: C.b2, arms: 'wave' }) +
        bubble(250, 90, '<path d="M-8 -2a8 8 0 1 1 16 0c0 5-4 6-4 10h-8c0-4-4-5-4-10z" fill="' + C.sun + '"/><rect x="-4" y="10" width="8" height="4" rx="2" fill="' + C.b3 + '"/>') +
        bubble(330, 60, '<path d="M-10 0L-3 7L10 -7" stroke="' + C.b1 + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>') +
        bubble(190, 52, '<path d="M-12 -2L0 -8L12 -2L0 4Z" fill="' + C.b1 + '"/><path d="M-7 1V7C-3 10 3 10 7 7V1" stroke="' + C.b1 + '" stroke-width="3" fill="none"/>')
      );
    },
    /* Ребёнок в школе: папа и сын идут к школе, ребёнок говорит */
    'rebenok-v-shkolu': function () {
      return base(
        '<rect x="300" y="120" width="140" height="150" rx="8" fill="#fff" stroke="' + C.b4 + '" stroke-width="3"/><path d="M290 124L370 72L450 124Z" fill="' + C.b2 + '"/>' +
        '<circle cx="370" cy="104" r="10" fill="#fff"/><path d="M370 98V104L374 107" stroke="' + C.b1 + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<rect x="322" y="144" width="26" height="22" rx="4" fill="' + C.b4 + '"/><rect x="392" y="144" width="26" height="22" rx="4" fill="' + C.b4 + '"/><rect x="322" y="184" width="26" height="22" rx="4" fill="' + C.b4 + '"/><rect x="392" y="184" width="26" height="22" rx="4" fill="' + C.b4 + '"/>' +
        '<rect x="354" y="214" width="32" height="56" rx="6" fill="' + C.b3 + '"/>' +
        '<path d="M232 268C270 262 310 266 354 266" stroke="' + C.b3 + '" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" fill="none"/>' +
        person({ x: 150, y: 268, hair: 'short', beard: true, shirt: C.b1, arms: 'holdR' }) +
        person({ x: 201, y: 268, s: 0.68, hair: 'kid', shirt: C.b3, pants: C.b1, arms: 'holdL', bag: C.warm }) +
        '<g transform="translate(232 150)"><rect x="0" y="0" width="58" height="34" rx="17" fill="#fff"/><path d="M8 30L4 44L20 32Z" fill="#fff"/><circle cx="17" cy="17" r="3.5" fill="' + C.b2 + '"/><circle cx="29" cy="17" r="3.5" fill="' + C.b2 + '"/><circle cx="41" cy="17" r="3.5" fill="' + C.b2 + '"/></g>'
      );
    },
    /* Планирование ребёнка: пара вместе, сердце и несколько дорог */
    'planirovanie-rebenka': function () {
      return base(
        '<path d="M70 262C140 250 150 214 230 214" stroke="' + C.b4 + '" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M430 262C360 250 350 214 270 214" stroke="' + C.b4 + '" stroke-width="6" stroke-linecap="round" fill="none"/>' +
        '<circle cx="110" cy="250" r="7" fill="' + C.b3 + '"/><circle cx="170" cy="226" r="7" fill="' + C.b3 + '"/><circle cx="390" cy="250" r="7" fill="' + C.b3 + '"/><circle cx="330" cy="226" r="7" fill="' + C.b3 + '"/>' +
        '<path d="M318 120V80" stroke="' + C.ink + '" stroke-width="1.5"/>' + heart(318, 50, 1.6, C.warm) +
        person({ x: 228, y: 268, hair: 'long', shirt: C.b2, arms: 'holdR' }) +
        person({ x: 282, y: 268, hair: 'short', shirt: C.b1, arms: 'holdL' }) +
        '<path d="M254 222Q255 216 256 222" stroke="' + C.skin + '" stroke-width="8" stroke-linecap="round"/>' +
        '<g transform="translate(372 132)"><path d="M0 22L22 4L44 22V50H0Z" fill="#fff" stroke="' + C.b4 + '" stroke-width="3" stroke-linejoin="round"/><rect x="16" y="30" width="12" height="20" rx="3" fill="' + C.b3 + '"/></g>'
      );
    }
  };

  window.NAV_ILLU = function (slug) { return SCENES[slug] ? SCENES[slug]() : ''; };
})();
