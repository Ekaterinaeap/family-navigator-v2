(function () {
  'use strict';
  var D = window.NAV_DATA;
  var app = document.getElementById('app');
  var TAG = { UZNAT: 'Узнать', OFORMIT: 'Оформить', POLUCHIT: 'Получить' };
  var uid = 0;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function icon(n) { return '<i data-lucide="' + n + '"></i>'; }
  function icons() { if (window.lucide) window.lucide.createIcons(); }
  function store(k, v) { try { if (v === undefined) { return JSON.parse(localStorage.getItem('pg:' + k) || 'null'); } localStorage.setItem('pg:' + k, JSON.stringify(v)); } catch (e) { return null; } }
  function sphereById(id) { for (var i = 0; i < D.spheres.length; i++) if (D.spheres[i].id === id) return D.spheres[i]; return null; }
  function sphereOf(slug) { for (var i = 0; i < D.spheres.length; i++) if (D.spheres[i].situations.indexOf(slug) > -1) return D.spheres[i]; return null; }
  function storyById(id) { for (var i = 0; i < D.stories.length; i++) if (D.stories[i].id === id) return D.stories[i]; return null; }
  function isReady(slug) { return !!D.situations[slug]; }
  function titleOf(slug) { return isReady(slug) ? D.situations[slug].title : (D.stubs[slug] ? D.stubs[slug][0] : slug); }
  function descOf(slug) { return isReady(slug) ? D.situations[slug].card : (D.stubs[slug] ? D.stubs[slug][1] : ''); }
  function allSlugs() { var a = []; D.spheres.forEach(function (s) { a = a.concat(s.situations); }); return a; }
  function readySlugs() { return ['uhod-za-tyazhelobolnym', 'smena-professii', 'rebenok-v-shkolu', 'planirovanie-rebenka'].filter(isReady); }
  function shareUrl(slug) { return location.origin + location.pathname + '#/s/' + slug; }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? a : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? b : c; }

  var toastEl = document.querySelector('.toast'), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }
  function crumbs(items) {
    var h = '<nav class="crumbs" aria-label="Навигация"><a href="#/">Жизненные ситуации</a>';
    items.forEach(function (it) { h += icon('chevron-right') + (it.href ? '<a href="' + it.href + '">' + esc(it.t) + '</a>' : '<span>' + esc(it.t) + '</span>'); });
    return h + '</nav>';
  }
  function qr(el, text, size) {
    if (!el) return;
    if (window.QRCode) { el.innerHTML = ''; new window.QRCode(el, { text: text, width: size, height: size, colorDark: '#0B1F33', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M }); }
    else el.innerHTML = '<span class="muted-s">QR недоступен офлайн</span>';
  }

  /* ---------- illustrations ---------- */
  /* Проводник — дружелюбный персонаж-навигатор (капитанская фуражка — отсылка к парусу на обложке книги) */
  function mascot(cls) {
    var g = 'mg' + (++uid);
    return '<svg class="mascot ' + (cls || '') + '" viewBox="0 0 120 120" aria-hidden="true">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7BA4FF"/><stop offset="1" stop-color="#2F62E6"/></linearGradient></defs>' +
      '<ellipse cx="60" cy="113" rx="26" ry="4" fill="#0B1F33" opacity=".12"/>' +
      '<path d="M27 78 Q15 82 17 94" stroke="#3567E8" stroke-width="9" stroke-linecap="round" fill="none"/>' +
      '<path class="m-arm" d="M93 72 Q107 66 106 50" stroke="#3567E8" stroke-width="9" stroke-linecap="round" fill="none"/>' +
      '<path d="M60 31C85 31 98 50 98 73C98 97 82 109 60 109C38 109 22 97 22 73C22 50 35 31 60 31Z" fill="url(#' + g + ')"/>' +
      '<ellipse cx="60" cy="91" rx="21" ry="13" fill="#fff" opacity=".2"/>' +
      '<path d="M31 46C31 21 89 21 89 46Z" fill="#fff" stroke="#1F4FBF" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<rect x="29" y="41" width="62" height="9" rx="4.5" fill="#0B1F33"/>' +
      '<path d="M38 49Q60 59 82 49L80 54Q60 63 40 54Z" fill="#0B1F33"/>' +
      
      '<ellipse cx="47" cy="69" rx="8.5" ry="9.5" fill="#fff"/><ellipse cx="73" cy="69" rx="8.5" ry="9.5" fill="#fff"/>' +
      '<circle class="m-eye" cx="48.5" cy="71" r="4.6" fill="#0B1F33"/><circle class="m-eye" cx="74.5" cy="71" r="4.6" fill="#0B1F33"/>' +
      '<circle cx="50" cy="69" r="1.6" fill="#fff"/><circle cx="76" cy="69" r="1.6" fill="#fff"/>' +
      '<ellipse cx="37" cy="83" rx="6" ry="3.8" fill="#FF9DB4" opacity=".55"/><ellipse cx="83" cy="83" rx="6" ry="3.8" fill="#FF9DB4" opacity=".55"/>' +
      '<path d="M52 84Q60 92 68 84" stroke="#0B1F33" stroke-width="3" stroke-linecap="round" fill="none"/></svg>';
  }
  /* Портреты героев — из illustrations.js, в том же стиле, что и баннеры */
  function portrait(look) { return window.NAV_PORTRAIT(look); }

  /* ---------- search ---------- */
  var STOP = ['не', 'на', 'по', 'за', 'из', 'от', 'до', 'во', 'со', 'после', 'что', 'как', 'для', 'мой', 'моя', 'мое', 'мои', 'меня', 'мне', 'нас', 'нам', 'это', 'уже', 'или', 'при', 'без', 'все', 'всё', 'его', 'она', 'они', 'когда', 'где', 'надо', 'нужно', 'делать', 'очень', 'если', 'над', 'под', 'про', 'так', 'там', 'тут', 'чем', 'чтобы', 'хочу', 'у'];
  function norm(s) { return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s-]/g, ' '); }
  function toks(s) { return norm(s).split(/[\s-]+/).filter(function (w) { return w.length >= 2 && STOP.indexOf(w) < 0; }); }
  function wmatch(a, b) {
    var n = Math.min(a.length, b.length), i = 0;
    while (i < n && a[i] === b[i]) i++;
    if (a.length <= 3 || b.length <= 3) return a === b;
    return i >= Math.max(4, n - 4);
  }
  function search(q) {
    var qt = toks(q); if (!qt.length) return [];
    var res = [];
    allSlugs().forEach(function (slug) {
      var s = D.situations[slug], sp = sphereOf(slug);
      var fields = [[toks(titleOf(slug)), 3], [toks(descOf(slug)), 1], [toks(sp ? sp.title : ''), 1]];
      if (s) { fields.push([toks(s.h1), 2]); fields.push([toks(s.synonyms.join(' ')), 3]); fields.push([toks(s.intro), 0.5]); }
      var score = 0, hit = 0;
      qt.forEach(function (w) {
        var best = 0;
        fields.forEach(function (f) { if (f[1] > best && f[0].some(function (d) { return wmatch(w, d); })) best = f[1]; });
        if (best) hit++; score += best;
      });
      if (score > 0) res.push({ slug: slug, score: score + (s ? 0.75 : 0) + hit });
    });
    res.sort(function (a, b) { return b.score - a.score; });
    return res.filter(function (x) { return x.score >= res[0].score * 0.45; });
  }

  function sitRow(slug) {
    var r = isReady(slug), sp = sphereOf(slug);
    return '<a class="sit-row" href="#/situations/' + slug + '"><span class="ico">' + icon(sp ? sp.icon : 'circle') + '</span><span class="sit-row-t"><h3>' +
      esc(r ? D.situations[slug].h1 : titleOf(slug)) + '</h3><p>' + esc(r ? D.situations[slug].route.length + ' шагов · ' + sp.title : 'Готовится · ' + (sp ? sp.title : '')) + '</p></span>' +
      '<span class="go">' + icon('chevron-right') + '</span></a>';
  }

  function bindSuggest(form) {
    var input = form.querySelector('input'), box = form.parentNode.querySelector('.suggest');
    form.addEventListener('submit', function (e) { e.preventDefault(); location.hash = '#/search?q=' + encodeURIComponent(input.value.trim()); });
    if (!box) return;
    input.addEventListener('input', function () {
      var v = input.value.trim();
      if (v.length < 3) { box.hidden = true; return; }
      var r = search(v).slice(0, 5);
      if (!r.length) { box.innerHTML = '<div class="sg-empty">Пока не нашли. Нажмите «Найти» — покажем все сферы.</div>'; box.hidden = false; return; }
      box.innerHTML = r.map(function (x) {
        var s = D.situations[x.slug];
        return '<a href="#/situations/' + x.slug + '"><b>' + esc(s ? s.h1 : titleOf(x.slug)) + '</b><span>' + esc(sphereOf(x.slug).title) + (s ? ' · пошаговый план' : ' · готовится') + '</span></a>';
      }).join('');
      box.hidden = false;
    });
    document.addEventListener('click', function (e) { if (!form.parentNode.contains(e.target)) box.hidden = true; });
  }

  /* ---------- HOME ---------- */
  function storyCard(st) {
    var s = D.situations[st.situation];
    return '<a class="story-card" href="#/istorii/' + st.id + '">' + portrait(st.look) +
      '<span class="story-card-b"><span class="story-name">' + esc(st.name) + ', ' + st.age + '</span><b>' + esc(st.lead) + '</b>' +
      '<span class="story-q">«' + esc(st.quote) + '»</span><span class="link-more">Как ' + (st.id === 'mikhail' ? 'он' : 'она') + ' прошл' + (st.id === 'mikhail' ? '' : 'а') + ' этот путь' + icon('arrow-right') + '</span></span></a>';
  }

  function viewHome() {
    var total = allSlugs().length;
    var chips = [['Близкому нужен уход', 'uhod-za-tyazhelobolnym'], ['Меняю профессию', 'smena-professii'], ['Ребёнку трудно в школе', 'rebenok-v-shkolu'], ['Не получается завести ребёнка', 'planirovanie-rebenka'], ['Родился ребёнок', 'rozhdenie-rebenka'], ['Выхожу на пенсию', 'pensiya']];
    var h = '<section class="hero"><div class="wrap hero-in"><div><h1>Навигатор по жизненным ситуациям</h1>' +
      '<p class="hero-sub">Пошаговые планы для важных моментов жизни и трудных дней. Шаги и контакты проверены экспертами.</p></div>' +
      '<div class="hero-search"><form class="sbox" role="search"><button type="button" class="sbox-guide" data-guide aria-label="Спросить Проводника">' + mascot('mascot-s') + '</button><input type="search" name="q" autocomplete="off" aria-label="Что у вас случилось?" placeholder="Что у вас случилось?"><button type="submit" class="sbox-go" aria-label="Найти">' + icon('search') + '</button></form>' +
      '<div class="suggest" hidden></div>' +
      '<div class="qchips">' + chips.map(function (c) { return '<a class="qchip" href="#/situations/' + c[1] + '">' + c[0] + '</a>'; }).join('') + '</div></div></div></section>';

    h += '<section class="sec"><div class="wrap"><div class="sec-head"><h2>Сферы жизни</h2>' +
      '<a class="counter" href="#/kniga">' + D.spheres.length + ' сфер · ' + total + ' ' + plural(total, 'ситуация', 'ситуации', 'ситуаций') + '</a></div><div class="spheres">';
    D.spheres.forEach(function (sp) {
      var shown = 0, extra = 0;
      var items = sp.situations.map(function (sl) {
        var r = isReady(sl), x = !r && shown >= 2; if (!x) shown++; else extra++;
        return '<li' + (x ? ' class="x"' : '') + '><a class="' + (r ? 'ready' : '') + '" href="#/situations/' + sl + '">' + esc(titleOf(sl)) + '</a></li>';
      }).join('');
      h += '<div class="sphere"><a class="sphere-h" href="#/sphere/' + sp.id + '"><span class="ico">' + icon(sp.icon) + '</span>' + esc(sp.title) + '</a><ul>' + items + '</ul>' +
        (extra ? '<button type="button" class="sphere-more" data-more>Ещё ' + extra + ' ' + plural(extra, 'ситуация', 'ситуации', 'ситуаций') + icon('chevron-down') + '</button>' : '') + '</div>';
    });
    h += '</div><p class="legend-ready">Синим выделены ситуации с готовым пошаговым планом</p></div></section>';

    h += '<section class="sec sec-white"><div class="wrap"><div class="sec-head"><h2>Пошаговые планы</h2></div><div class="plans">';
    readySlugs().forEach(function (sl) {
      var s = D.situations[sl], sp = sphereById(s.sphere);
      h += '<a class="plan-card" href="#/situations/' + sl + '"><span class="plan-illu">' + window.NAV_ILLU(sl) + '</span><span class="plan-b"><b>' + esc(s.h1) + '</b><span class="muted-s">' + s.route.length + ' шагов · ' + esc(sp.title) + '</span></span></a>';
    });
    h += '</div></div></section>';

    h += '<section class="sec"><div class="wrap"><div class="sec-head"><div><h2>Истории людей</h2><p class="sub">Как герои наших интервью прошли свою ситуацию с навигатором</p></div><a href="#/istorii">Все истории</a></div><div class="stories">' +
      D.stories.map(storyCard).join('') + '</div></div></section>';

    h += '<section class="sec sec-white"><div class="wrap"><div class="sec-head"><h2>Как это работает</h2></div><ol class="how">' +
      '<li><b>Книга дома</b><span>«Путеводитель российской семьи» вручают в важный день — свадьба, рождение ребёнка, первая работа.</span></li>' +
      '<li><b>QR-код в каждом разделе</b><span>Наведите камеру — откроется нужная ситуация на Госуслугах.</span></li>' +
      '<li><b>Пошаговый план</b><span>Куда обратиться, какие документы взять и где получить поддержку. Данные обновляются.</span></li>' +
      '</ol></div></section>';
    app.innerHTML = h;
    bindSuggest(app.querySelector('.sbox'));
    app.querySelectorAll('[data-more]').forEach(function (b) { b.addEventListener('click', function () { b.parentNode.classList.add('open'); b.remove(); }); });
  }

  /* ---------- SITUATION ---------- */
  function factsHtml(st) {
    var f = '';
    if (st.where) f += '<div class="fact"><dt>' + icon('map-pin') + 'Куда обратиться</dt><dd>' + esc(st.where) + '</dd></div>';
    if (st.bring) f += '<div class="fact"><dt>' + icon('file-text') + 'Что взять</dt><dd>' + esc(st.bring.join(', ')) + '</dd></div>';
    if (st.cost) f += '<div class="fact"><dt>' + icon('wallet') + 'Стоимость</dt><dd>' + esc(st.cost) + '</dd></div>';
    if (st.term) f += '<div class="fact"><dt>' + icon('clock') + 'Срок рассмотрения</dt><dd>' + esc(st.term) + '</dd></div>';
    return '<dl class="facts">' + f + '</dl>';
  }
  function actionHtml(a) {
    if (!a) return '';
    if (a.href) return '<a class="btn btn-primary" href="' + a.href + '"' + (/^http/.test(a.href) ? ' target="_blank" rel="noopener"' : '') + '>' + icon(a.icon || 'arrow-right') + esc(a.label) + '</a>';
    return '<button type="button" class="btn btn-primary" data-toast="В прототипе заявление не отправляется. На Госуслугах здесь откроется форма услуги.">' + icon(a.icon || 'arrow-right') + esc(a.label) + '</button>';
  }
  function stepBody(st, i, n, done) {
    return '<p class="step-k">Шаг ' + (i + 1) + ' из ' + n + ' · ' + TAG[st.tag] + '</p>' +
      '<h3>' + esc(st.title) + '</h3><p class="step-text">' + esc(st.text) + '</p>' + factsHtml(st) +
      (st.note ? '<p class="note">' + icon('info') + '<span>' + esc(st.note) + '</span></p>' : '') +
      '<div class="step-act">' + actionHtml(st.action) + '<button type="button" class="done-btn" data-done="' + i + '" aria-pressed="' + (done ? 'true' : 'false') + '">' + icon(done ? 'check-circle-2' : 'circle') + (done ? 'Сделано' : 'Отметить как сделано') + '</button></div>' +
      '<div class="step-nav"><button type="button" data-go="' + (i - 1) + '"' + (i === 0 ? ' disabled' : '') + '>' + icon('arrow-left') + 'Назад</button><button type="button" data-go="' + (i + 1) + '"' + (i === n - 1 ? ' disabled' : '') + '>Следующий шаг' + icon('arrow-right') + '</button></div>';
  }

  function mountRoute(root, slug, s, active, scroll) {
    var done = store('done-' + slug) || [], n = s.route.length;
    var h = '<div class="route"><ol class="steps">';
    s.route.forEach(function (st, i) {
      var d = done.indexOf(i) > -1;
      h += '<li class="step' + (i === active ? ' on' : '') + (d ? ' done' : '') + (i === 0 ? ' first' : '') + '"><button type="button" class="step-btn" data-step="' + i + '" aria-expanded="' + (i === active) + '">' +
        '<span class="step-n">' + (d ? icon('check') : (i + 1)) + '</span><span class="step-h"><span class="step-t">' + esc(st.title) + '</span>' +
        (i === 0 ? '<span class="step-start">Начните с этого шага</span>' : '') + '</span><span class="step-chev">' + icon('chevron-right') + '</span></button>' +
        (i === active ? '<div class="step-inline">' + stepBody(st, i, n, d) + '</div>' : '') + '</li>';
    });
    h += '</ol><div class="panel" aria-live="polite">' + stepBody(s.route[active], active, n, done.indexOf(active) > -1) + '</div></div>';
    if (done.length) h = '<p class="progress">Отмечено ' + done.length + ' из ' + n + '</p>' + h;
    root.innerHTML = h;
    icons();
    if (scroll) {
      var el = window.innerWidth <= 900 ? root.querySelectorAll('.step')[active] : root;
      var top = el.getBoundingClientRect().top + window.scrollY - (window.innerWidth <= 600 ? 72 : 88);
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
    root.onclick = function (e) {
      var b = e.target.closest('[data-step],[data-go],[data-done]'); if (!b) return;
      if (b.hasAttribute('data-step')) mountRoute(root, slug, s, +b.getAttribute('data-step'), window.innerWidth <= 900);
      else if (b.hasAttribute('data-go')) mountRoute(root, slug, s, +b.getAttribute('data-go'), true);
      else {
        var j = +b.getAttribute('data-done'), arr = store('done-' + slug) || [], p = arr.indexOf(j);
        if (p > -1) arr.splice(p, 1); else arr.push(j);
        store('done-' + slug, arr);
        mountRoute(root, slug, s, (p < 0 && active < n - 1) ? active + 1 : active, p < 0 && active < n - 1 && window.innerWidth <= 900);
      }
    };
  }

  function toolHtml(t, slug) {
    var h = '<section class="sblock"><h2>' + esc(t.title) + '</h2><p class="sblock-sub">' + esc(t.text) + '</p>';
    if (t.type === 'checklist') {
      var got = store('chk-' + slug) || [];
      h += '<ul class="chk">' + t.items.map(function (it, k) { return '<li><label><input type="checkbox" data-chk="' + k + '"' + (got.indexOf(k) > -1 ? ' checked' : '') + '><span>' + esc(it) + '</span></label></li>'; }).join('') + '</ul>';
    } else if (t.type === 'calc') {
      h += '<div class="calc"><input type="number" inputmode="numeric" min="0" step="1000" placeholder="Стоимость курса, ₽" aria-label="Стоимость обучения в рублях" data-calc><p class="calc-out" aria-live="polite"></p></div><p class="muted-s">13% от расходов, но не больше 19 500 ₽ в год. Оформляется в личном кабинете налогоплательщика.</p>';
    } else if (t.type === 'questions') {
      h += '<div class="qcard" aria-live="polite">' + esc(t.items[0]) + '</div><button type="button" class="btn btn-line" data-nextq>' + icon('refresh-cw') + 'Другой вопрос</button>';
    }
    return h + '</section>';
  }
  function bindTool(root, s, slug) {
    if (!root || !s.tool) return;
    var qi = 0;
    root.addEventListener('change', function (e) {
      if (!e.target.matches('[data-chk]')) return;
      var arr = []; root.querySelectorAll('[data-chk]').forEach(function (x) { if (x.checked) arr.push(+x.getAttribute('data-chk')); });
      store('chk-' + slug, arr);
    });
    root.addEventListener('input', function (e) {
      if (!e.target.matches('[data-calc]')) return;
      var v = parseFloat(e.target.value) || 0;
      root.querySelector('.calc-out').textContent = v > 0 ? 'Вернётся ' + Math.min(Math.round(v * 0.13), 19500).toLocaleString('ru-RU') + ' ₽' : '';
    });
    root.addEventListener('click', function (e) {
      if (!e.target.closest('[data-nextq]')) return;
      qi = (qi + 1) % s.tool.items.length; root.querySelector('.qcard').textContent = s.tool.items[qi];
    });
  }

  function viewSituation(slug, fromBook) {
    var s = D.situations[slug];
    if (!s) return viewStub(slug, fromBook);
    var sp = sphereById(s.sphere), n = s.route.length, st = s.story ? storyById(s.story) : null;
    document.title = s.h1 + ' — Жизненные ситуации';
    var h = '';
    if (fromBook) h += '<div class="frombook"><div class="wrap frombook-in">' + icon('book-open') + '<span>Вы перешли из книги — раздел ' + s.bookRef.section + '. Здесь самые свежие контакты.</span><button type="button" aria-label="Скрыть" data-close>' + icon('x') + '</button></div></div>';
    h += '<div class="wrap page">' + crumbs([{ t: sp.title, href: '#/sphere/' + sp.id }, { t: s.title }]) +
      '<header class="sbanner"><div class="sbanner-t"><p class="kicker">' + esc(sp.title) + '</p><h1>' + esc(s.h1) + '</h1><p class="intro">' + esc(s.intro) + '</p>' +
      '<p class="smeta"><span>' + n + ' шагов</span><span>Проверено экспертами</span>' + (st ? '<a href="#/istorii/' + st.id + '">История: ' + esc(st.name) + icon('arrow-right') + '</a>' : '') + '</p></div>' +
      '<div class="sbanner-i">' + window.NAV_ILLU(slug) + '</div></header>' +
      '<section class="plan" id="plan"><div class="plan-head"><h2>Пошаговый план</h2>' +
      '<div class="guide-tip">' + mascot('mascot-xs') + '<p>Проходите шаги в своём темпе. Если не знаете, с чего начать, — начните с первого.</p></div></div><div id="route-root"></div></section>' +
      '<section class="sblock"><h2>Полезно знать</h2><ul class="know">' + s.important.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' +
      (s.tool ? toolHtml(s.tool, slug) : '') +
      '<section class="sblock"><h2>Если возникли сложности</h2><div class="faq">' + s.ifWrong.map(function (w, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(w.q) + icon('chevron-down') + '</summary><p>' + esc(w.a) + '</p></details>'; }).join('') + '</div></section>' +
      '<section class="sblock"><h2>Где получить поддержку</h2><div class="support">' + s.support.map(function (x) {
        var b = x.href ? '<a class="btn btn-line" href="' + x.href + '"' + (/^http/.test(x.href) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(x.label) + '</a>' : (x.label ? '<button type="button" class="btn btn-line" data-toast="В пилоте здесь появится запись к проверенному наставнику или в сообщество.">' + esc(x.label) + '</button>' : '');
        return '<div class="sup"><span class="ico">' + icon(x.icon) + '</span><div><b>' + esc(x.title) + '</b><p>' + esc(x.text) + '</p></div>' + b + '</div>';
      }).join('') + '</div></section>' +
      '<section class="sblock trust"><div><p class="fb"><b>Страница помогла?</b><button type="button" class="btn btn-line" data-fb="yes">Да</button><button type="button" class="btn btn-line" data-fb="no">Не совсем</button></p>' +
      '<details class="src"><summary>Источники и проверка' + icon('chevron-down') + '</summary><p>Проверяет: ' + esc(s.checkedBy) + '. Обновлено ' + D.checkedAt + '. Тексты — черновик прототипа.</p><ul>' + s.sources.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details></div>' +
      '<div class="qrbox"><div class="qr" id="sit-qr"></div><p>Раздел ' + s.bookRef.section + ' в книге</p></div></section></div>';
    app.innerHTML = h;

    mountRoute(document.getElementById('route-root'), slug, s, 0, false);
    var tools = app.querySelectorAll('.sblock'); bindTool(s.tool ? tools[1] : null, s, slug);
    qr(document.getElementById('sit-qr'), shareUrl(slug), 120);
    var fb = app.querySelector('.fb');
    fb.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fb]'); if (!b) return;
      fb.innerHTML = '<span class="ok">' + icon('check') + (b.getAttribute('data-fb') === 'yes' ? 'Спасибо! Так мы понимаем, какие планы работают.' : 'Спасибо. Эксперты посмотрят, что улучшить.') + '</span>'; icons();
    });
    var cl = app.querySelector('[data-close]'); if (cl) cl.addEventListener('click', function () { cl.closest('.frombook').remove(); });
  }

  /* ---------- STUB ---------- */
  function viewStub(slug, fromBook) {
    var st = D.stubs[slug]; if (!st) return viewNotFound();
    var sp = sphereOf(slug);
    document.title = st[0] + ' — Жизненные ситуации';
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: sp.title, href: '#/sphere/' + sp.id }, { t: st[0] }]) +
      '<header class="shead"><p class="badge">Раздел готовится</p><h1>' + esc(st[0]) + '</h1><p class="intro">' + esc(st[1]) + '</p>' +
      '<p class="muted">Пошаговый план сейчас пишут и проверяют эксперты: врачи, юристы, социальные работники.</p>' +
      '<div class="act-row"><button type="button" class="btn btn-primary" data-vote>' + icon('heart') + 'Эта тема важна для меня</button></div></header>' +
      '<section class="sblock"><h2>Готовые пошаговые планы</h2><div class="sit-list">' + readySlugs().map(sitRow).join('') + '</div></section></div>';
    var v = app.querySelector('[data-vote]');
    v.addEventListener('click', function () { v.outerHTML = '<span class="ok">' + icon('check') + 'Спасибо! Учтём, какие разделы нужнее.</span>'; icons(); });
  }

  /* ---------- STORIES ---------- */
  function viewStories() {
    document.title = 'Истории людей — Жизненные ситуации';
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: 'Истории людей' }]) +
      '<header class="shead"><h1>Истории людей</h1><p class="intro">Герои наших интервью и то, как навигатор помог им пройти свою ситуацию шаг за шагом.</p></header>' +
      '<div class="stories">' + D.stories.map(storyCard).join('') + '</div></div>';
  }
  function viewStory(id) {
    var st = storyById(id); if (!st) return viewNotFound();
    var s = D.situations[st.situation];
    document.title = 'История: ' + st.name + ' — Жизненные ситуации';
    app.innerHTML = '<div class="wrap page narrow">' + crumbs([{ t: 'Истории людей', href: '#/istorii' }, { t: st.name }]) +
      '<header class="story-head">' + portrait(st.look) + '<div><p class="muted">' + esc(st.name) + ', ' + st.age + '</p><h1>' + esc(st.lead) + '</h1></div></header>' +
      '<p class="intro">' + esc(st.context) + '</p><blockquote class="quote">«' + esc(st.quote) + '»</blockquote>' +
      '<section class="sblock"><h2>Как ' + (id === 'mikhail' ? 'он' : 'она') + ' прош' + (id === 'mikhail' ? 'ёл' : 'ла') + ' этот путь</h2><ol class="path">' +
      st.path.map(function (p) { return '<li><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></li>'; }).join('') + '</ol>' +
      '<p class="result">' + esc(st.result) + '</p></section>' +
      '<section class="sblock cta"><div><b>' + esc(s.h1) + '</b><p class="muted">Тот же пошаговый план — для вашей ситуации</p></div><a class="btn btn-primary" href="#/situations/' + st.situation + '">Открыть план' + icon('arrow-right') + '</a></section>' +
      '<p class="muted-s disclaimer">Сценарий составлен по материалам интервью проекта и показывает, как может работать маршрут.</p></div>';
  }

  /* ---------- SPHERE / SEARCH / BOOK / QR / ABOUT ---------- */
  function viewSphere(id) {
    var sp = sphereById(id); if (!sp) return viewNotFound();
    document.title = sp.title + ' — Жизненные ситуации';
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: sp.title }]) + '<header class="shead"><h1>' + esc(sp.title) + '</h1><p class="intro">' + esc(sp.lead) + '</p></header>' +
      '<div class="sit-list">' + sp.situations.map(sitRow).join('') + '</div></div>';
  }
  function viewSearch(q) {
    document.title = 'Поиск — Жизненные ситуации';
    var r = q ? search(q) : [];
    var h = '<div class="wrap page">' + crumbs([{ t: 'Поиск' }]) + '<header class="shead"><h1>Что у вас случилось?</h1><p class="intro">Напишите своими словами — как рассказали бы другу.</p>' +
      '<div class="search-wrap"><form class="sbox big" role="search"><input type="search" name="q" autocomplete="off" aria-label="Что у вас случилось?" value="' + esc(q) + '" placeholder="Например: маму выписывают после инсульта"><button type="submit" class="sbox-go" aria-label="Найти">' + icon('search') + '</button></form><div class="suggest" hidden></div></div></header>';
    if (q && r.length) h += '<p class="muted res-n">Найдено: ' + r.length + '</p><div class="sit-list">' + r.slice(0, 12).map(function (x) { return sitRow(x.slug); }).join('') + '</div>';
    else if (q) h += '<section class="sblock"><h2>Точного совпадения нет</h2><p class="sblock-sub">Попробуйте другими словами или выберите сферу жизни.</p><div class="chips-row">' + D.spheres.map(function (x) { return '<a class="chip" href="#/sphere/' + x.id + '">' + esc(x.title) + '</a>'; }).join('') + '</div></section>';
    else h += '<section class="sblock"><h2>Готовые пошаговые планы</h2><div class="sit-list">' + readySlugs().map(sitRow).join('') + '</div></section>';
    app.innerHTML = h + '</div>';
    bindSuggest(app.querySelector('.sbox'));
    if (!q) app.querySelector('.sbox input').focus();
  }
  function viewBook() {
    document.title = 'Книга — Путеводитель российской семьи';
    var map = {};
    readySlugs().forEach(function (sl) { var p = D.situations[sl].bookRef.part.split(' ')[1]; (map[p] = map[p] || []).push(sl); });
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: 'Книга' }]) + '<header class="shead"><h1>Книга: 12 частей, 84 раздела</h1><p class="intro">Книга открывается не подряд, а по ситуации. В каждом разделе — QR-код, который ведёт в нужный пошаговый план.</p></header>' +
      '<div class="book">' + D.bookParts.map(function (b) {
        var l = (map[b.n] || []).map(function (sl) { return '<a href="#/situations/' + sl + '">' + esc(D.situations[sl].h1) + '</a>'; }).join('');
        return '<div class="book-i"><p class="muted-s">Часть ' + b.n + ' · разделы ' + b.range + '</p><b>' + esc(b.title) + '</b>' + (l ? '<div class="links">' + l + '</div>' : '') + '</div>';
      }).join('') + '</div></div>';
  }
  function viewQR() {
    document.title = 'QR-коды для книги';
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: 'QR-коды для книги' }]) + '<header class="shead"><h1>QR-коды для печатной книги</h1><p class="intro">Каждый код ведёт сразу в нужный пошаговый план.</p>' +
      '<div class="act-row no-print"><button type="button" class="btn btn-primary" onclick="window.print()">' + icon('printer') + 'Распечатать</button></div></header>' +
      '<div class="qrgrid">' + readySlugs().map(function (sl) { var s = D.situations[sl]; return '<div class="qritem"><div class="qr" data-qr="' + sl + '"></div><b>Раздел ' + s.bookRef.section + '</b><p>' + esc(s.h1) + '</p></div>'; }).join('') + '</div></div>';
    app.querySelectorAll('[data-qr]').forEach(function (el) { qr(el, shareUrl(el.getAttribute('data-qr')), 150); });
  }
  function viewAbout() {
    document.title = 'О проекте — Путеводитель российской семьи';
    var stats = [['50%', 'сотрудников испытывают страх перед будущим', 'Опрос 629 сотрудников Группы'], ['15%', 'родителей знают меры поддержки в деталях', 'НАФИ, 2023'], ['33%', 'не обращаются за льготами, потому что не знают о них', 'Росгосстрах / РБК, 2021']];
    app.innerHTML = '<div class="wrap page narrow">' + crumbs([{ t: 'О проекте' }]) + '<header class="shead"><h1>Помощь есть. Дороги к ней нет.</h1><p class="intro">«Путеводитель российской семьи» — книга и онлайн-навигатор. Мы не создаём новые меры, а собираем путь к тем, что уже есть.</p></header>' +
      '<div class="stats">' + stats.map(function (s) { return '<div><b>' + s[0] + '</b><span>' + s[1] + '</span><small>' + s[2] + '</small></div>'; }).join('') + '</div>' +
      '<section class="sblock"><h2>Принцип</h2><p>Не лечить страх, а сокращать беспомощность: дать человеку понятный план, проверенные контакты и живую поддержку.</p></section>' +
      '<section class="sblock"><h2>Это концепт-прототип</h2><p class="muted">Сайт показывает, как раздел «Жизненные ситуации» мог бы встроиться в Госуслуги. Он не является официальным сервисом и не собирает данные. Проект «Уверенность в будущем», программа «Код лидера», Группа АБР.</p></section></div>';
  }
  function viewNotFound() {
    app.innerHTML = '<div class="wrap page"><header class="shead"><h1>Такой страницы нет</h1><p class="intro">Начните с главной или поиска.</p><div class="act-row"><a class="btn btn-primary" href="#/">Все жизненные ситуации</a></div></header></div>';
  }

  /* ---------- Проводник (чат-помощник по скрипту) ---------- */
  var G = D.guide, guideEl = null, logEl, optsEl, ctx = null;
  function buildGuide() {
    var w = document.createElement('div');
    w.className = 'guide';
    w.innerHTML = '<div class="guide-hint" hidden><span>' + esc(G.teaser) + '</span><button type="button" aria-label="Скрыть подсказку" data-hint-x>' + icon('x') + '</button></div>' +
      '<button type="button" class="guide-fab" data-guide aria-label="Открыть помощника ' + esc(G.name) + '">' + mascot('mascot-fab') + '</button>' +
      '<section class="guide-panel" role="dialog" aria-label="' + esc(G.name) + '" hidden><header class="guide-top">' + mascot('mascot-xs') + '<div><b>' + esc(G.name) + '</b><span>Помощник по жизненным ситуациям</span></div>' +
      '<button type="button" class="guide-x" data-guide-close aria-label="Закрыть">' + icon('x') + '</button></header>' +
      '<div class="guide-log" aria-live="polite"></div><div class="guide-opts"></div>' +
      '<form class="guide-in"><input type="text" placeholder="Напишите своими словами" aria-label="Сообщение помощнику"><button type="submit" aria-label="Отправить">' + icon('send') + '</button></form></section>';
    document.body.appendChild(w);
    guideEl = w; logEl = w.querySelector('.guide-log'); optsEl = w.querySelector('.guide-opts');
    w.querySelector('.guide-in').addEventListener('submit', function (e) {
      e.preventDefault(); var i = e.target.querySelector('input'), v = i.value.trim(); if (!v) return; i.value = '';
      say(v, true); answerFree(v);
    });
    optsEl.addEventListener('click', function (e) { var b = e.target.closest('[data-g]'); if (!b) return; say(b.textContent, true); go(b.getAttribute('data-g')); });
    var hint = w.querySelector('.guide-hint');
    if (!store('hint-seen')) setTimeout(function () { if (w.querySelector('.guide-panel').hidden) { hint.hidden = false; } }, 1500);
    w.querySelector('[data-hint-x]').addEventListener('click', function () { hint.hidden = true; store('hint-seen', 1); });
  }
  function say(text, me) {
    var p = document.createElement('p'); p.className = 'msg' + (me ? ' me' : ''); p.textContent = text; logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function botSay(lines, opts) {
    optsEl.innerHTML = '';
    var t = document.createElement('p'); t.className = 'msg typing'; t.innerHTML = '<i></i><i></i><i></i>'; logEl.appendChild(t); logEl.scrollTop = logEl.scrollHeight;
    setTimeout(function () {
      t.remove(); [].concat(lines).forEach(function (l) { say(l); });
      optsEl.innerHTML = (opts || []).map(function (o) { return '<button type="button" class="gopt" data-g="' + esc(o[1]) + '">' + esc(o[0]) + '</button>'; }).join(''); logEl.scrollTop = logEl.scrollHeight;
    }, 450);
  }
  function go(target) {
    if (target.indexOf('n:') === 0) { var n = G.nodes[target.slice(2)]; botSay(n.text, n.options); }
    else if (target.indexOf('s:') === 0) {
      var slug = target.slice(2);
      if (isReady(slug)) { botSay([G.found], [['Открыть: ' + D.situations[slug].h1, '#/situations/' + slug], ['Начать сначала', 'n:start']]); }
      else { botSay([G.stub], readySlugs().map(function (r) { return [D.situations[r].h1, '#/situations/' + r]; }).concat([['Начать сначала', 'n:start']])); }
    }
    else if (target === 'search') { botSay([G.askFree], [['Начать сначала', 'n:start']]); guideEl.querySelector('.guide-in input').focus(); }
    else if (target.charAt(0) === '#') { location.hash = target; if (window.innerWidth <= 600) closeGuide(); }
  }
  function answerFree(v) {
    var r = search(v).slice(0, 3);
    if (r.length) botSay(['Похоже, вам подойдёт:'], r.map(function (x) { return [isReady(x.slug) ? D.situations[x.slug].h1 : titleOf(x.slug), '#/situations/' + x.slug]; }).concat([['Начать сначала', 'n:start']]));
    else botSay([G.notFound], D.spheres.slice(0, 6).map(function (s) { return [s.title, '#/sphere/' + s.id]; }));
  }
  function openGuide() {
    var p = guideEl.querySelector('.guide-panel'); p.hidden = false; guideEl.classList.add('open'); guideEl.querySelector('.guide-hint').hidden = true; store('hint-seen', 1);
    logEl.innerHTML = '';
    if (ctx) { var s = D.situations[ctx]; botSay([G.onPage.replace('{h1}', s.h1).replace('{step}', s.route[0].title)], [['Где получить поддержку', 'scroll:support'], ['Другая ситуация', 'n:start']]); }
    else { var st = G.nodes[G.start]; botSay(st.text, st.options); }
    icons();
  }
  function closeGuide() { guideEl.querySelector('.guide-panel').hidden = true; guideEl.classList.remove('open'); }

  /* ---------- router ---------- */
  function route() {
    var raw = location.hash.replace(/^#/, '') || '/';
    var qi = raw.indexOf('?'), path = qi > -1 ? raw.slice(0, qi) : raw, qs = qi > -1 ? raw.slice(qi + 1) : '';
    var params = {}; qs.split('&').forEach(function (p) { if (!p) return; var kv = p.split('='); params[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); });
    var parts = path.split('/').filter(Boolean);
    document.title = 'Жизненные ситуации — концепт-прототип';
    ctx = null;
    if (!parts.length) viewHome();
    else if ((parts[0] === 'situations' || parts[0] === 's') && parts[1]) { viewSituation(parts[1], parts[0] === 's'); if (isReady(parts[1])) ctx = parts[1]; }
    else if (parts[0] === 'sphere' && parts[1]) viewSphere(parts[1]);
    else if (parts[0] === 'istorii' && parts[1]) viewStory(parts[1]);
    else if (parts[0] === 'istorii') viewStories();
    else if (parts[0] === 'search') viewSearch(params.q || '');
    else if (parts[0] === 'kniga') viewBook();
    else if (parts[0] === 'qr') viewQR();
    else if (parts[0] === 'about') viewAbout();
    else viewNotFound();
    icons();
    window.scrollTo(0, 0);
    var m = document.querySelector('.mnav'); m.hidden = true; document.querySelector('.burger').setAttribute('aria-expanded', 'false');
    if (guideEl && !guideEl.querySelector('.guide-panel').hidden && window.innerWidth <= 600) closeGuide();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toast]');
    if (t) { e.preventDefault(); toast(t.getAttribute('data-toast')); return; }
    var l = e.target.closest('[data-toast-link]');
    if (l) { e.preventDefault(); toast('В прототипе работает раздел «Жизненные ситуации»'); return; }
    var g = e.target.closest('[data-guide]');
    if (g) { e.preventDefault(); if (guideEl.classList.contains('open')) closeGuide(); else openGuide(); return; }
    if (e.target.closest('[data-guide-close]')) { closeGuide(); return; }
    var sc = e.target.closest('[data-g^="scroll:"]');
    if (sc) { var el = app.querySelectorAll('.sblock'); var sup = [].filter.call(el, function (x) { return x.querySelector('.support'); })[0]; if (sup) sup.scrollIntoView({ behavior: 'smooth' }); if (window.innerWidth <= 600) closeGuide(); return; }
    var b = e.target.closest('.burger');
    if (b) { var m = document.querySelector('.mnav'); m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden)); }
  });
  window.addEventListener('hashchange', route);
  buildGuide();
  route();
})();
