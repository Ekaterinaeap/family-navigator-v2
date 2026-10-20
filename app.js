(function () {
  'use strict';
  var D = window.NAV_DATA;
  var app = document.getElementById('app');
  var STATUS = [['not_started', 'Не начинал(а)'], ['in_progress', 'В процессе'], ['done', 'Сделано'], ['not_now', 'Не нужно сейчас']];
  var PRIO = [['now', 'Важно сейчас'], ['next', 'Следующие шаги'], ['later', 'Когда буду готов(а)']];
  var SCEN = [['uhod-za-tyazhelobolnym', 'Уход за близким'], ['smena-professii', 'Смена профессии'], ['rebenok-v-shkolu', 'Ребёнок растёт'], ['planirovanie-rebenka', 'Планирование ребёнка']];
  var ctx = { slug: null, step: null };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function icon(n) { return '<i data-lucide="' + n + '" aria-hidden="true"></i>'; }
  function icons() { if (window.lucide) window.lucide.createIcons(); }
  function load(k, d) { try { var v = localStorage.getItem('navigator:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem('navigator:' + k, JSON.stringify(v)); } catch (e) { } }
  function sphereById(id) { for (var i = 0; i < D.spheres.length; i++) if (D.spheres[i].id === id) return D.spheres[i]; return null; }
  function sphereOf(slug) { for (var i = 0; i < D.spheres.length; i++) if (D.spheres[i].situations.indexOf(slug) > -1) return D.spheres[i]; return null; }
  function storyById(id) { for (var i = 0; i < D.stories.length; i++) if (D.stories[i].id === id) return D.stories[i]; return null; }
  function isReady(slug) { return !!D.situations[slug]; }
  function titleOf(slug) { return isReady(slug) ? D.situations[slug].title : (D.stubs[slug] ? D.stubs[slug][0] : slug); }
  function allSlugs() { var a = []; D.spheres.forEach(function (s) { a = a.concat(s.situations); }); return a; }
  function readySlugs() { return SCEN.map(function (x) { return x[0]; }); }
  function stepOf(slug, id) { var s = D.situations[slug]; if (!s) return null; for (var i = 0; i < s.steps.length; i++) if (s.steps[i].id === id) return s.steps[i]; return null; }
  function stepIndex(slug, id) { var s = D.situations[slug]; for (var i = 0; i < s.steps.length; i++) if (s.steps[i].id === id) return i; return -1; }
  function baseUrl() { return location.origin + location.pathname; }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? a : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? b : c; }
  function telHref(p) { return 'tel:' + String(p).replace(/[^\d+]/g, ''); }
  function ext(href, label, cls) { return '<a class="' + (cls || 'lnk') + '" href="' + href + '" target="_blank" rel="noopener noreferrer">' + esc(label) + icon('external-link') + '</a>'; }
  function tel(p, label, cls) { return '<a class="' + (cls || 'tel') + '" href="' + telHref(p) + '">' + icon('phone') + '<span><b>' + esc(p) + '</b>' + (label ? '<small>' + esc(label) + '</small>' : '') + '</span></a>'; }

  var toastEl = document.querySelector('.toast'), toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3200); }
  function copy(text, okMsg) {
    var done = function () { toast(okMsg || 'Скопировано'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(t) { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) { } a.remove(); }
  function speak(text) {
    if (!('speechSynthesis' in window)) { toast('Озвучивание недоступно в этом браузере'); return; }
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = 'ru-RU'; u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }
  function stopSpeak() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
  function crumbs(items) {
    var h = '<nav class="crumbs" aria-label="Навигация"><a href="#/">Жизненные ситуации</a>';
    items.forEach(function (it) { h += '<span aria-hidden="true">›</span>' + (it.href ? '<a href="' + it.href + '">' + esc(it.t) + '</a>' : '<span>' + esc(it.t) + '</span>'); });
    return h + '</nav>';
  }
  function qr(el, text, size) {
    if (!el) return;
    if (window.QRCode) { el.innerHTML = ''; new window.QRCode(el, { text: text, width: size, height: size, colorDark: '#0B1F33', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M }); }
    else el.innerHTML = '<span class="muted-s">QR-код недоступен без интернета</span>';
  }
  function trustLine() { return '<p class="trust-line">Ссылки и телефоны сверены ' + D.sourceCheckedAt + ' · ' + D.reviewStatus + ' · <a href="#/verification">Как мы проверяем сведения</a></p>'; }

  /* ---------- state: statuses, plan, checklists ---------- */
  function getStatus(slug, id) { var s = load('status', {}); return (s[slug] && s[slug][id]) || 'not_started'; }
  function setStatus(slug, id, v) { var s = load('status', {}); s[slug] = s[slug] || {}; s[slug][id] = v; save('status', s); }
  function getPlan() { return load('plan', []); }
  function inPlan(slug, id) { return getPlan().some(function (p) { return p.s === slug && p.id === id; }); }
  function addPlan(slug, id, prio) { var p = getPlan(); if (!inPlan(slug, id)) { p.push({ s: slug, id: id, p: prio || 'now' }); save('plan', p); } }
  function removePlan(slug, id) { save('plan', getPlan().filter(function (p) { return !(p.s === slug && p.id === id); })); }
  function chkGet(key) { return load('chk', {})[key] === 1; }
  function chkSet(key, on) { var c = load('chk', {}); if (on) c[key] = 1; else delete c[key]; save('chk', c); }
  function statusLabel(v) { for (var i = 0; i < STATUS.length; i++) if (STATUS[i][0] === v) return STATUS[i][1]; return ''; }

  /* ---------- search over situations and steps ---------- */
  var STOP = ['не', 'на', 'по', 'за', 'из', 'от', 'до', 'во', 'со', 'после', 'что', 'как', 'для', 'мой', 'моя', 'мое', 'мои', 'меня', 'мне', 'нас', 'нам', 'это', 'уже', 'или', 'при', 'без', 'все', 'всё', 'его', 'она', 'они', 'когда', 'где', 'надо', 'нужно', 'нужна', 'нужен', 'делать', 'очень', 'если', 'над', 'под', 'про', 'так', 'там', 'тут', 'чем', 'чтобы', 'хочу', 'у', 'я', 'и', 'а', 'с', 'в', 'к', 'о'];
  function norm(s) { return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s-]/g, ' '); }
  function toks(s) { return norm(s).split(/[\s-]+/).filter(function (w) { return w.length >= 2 && STOP.indexOf(w) < 0; }); }
  function wmatch(a, b) { var n = Math.min(a.length, b.length), i = 0; while (i < n && a[i] === b[i]) i++; if (a.length <= 3 || b.length <= 3) return a === b; return i >= Math.max(4, n - 4); }
  function score(qt, fields) {
    var sc = 0, hit = 0;
    qt.forEach(function (w) { var best = 0; fields.forEach(function (f) { if (f[1] > best && f[0].some(function (d) { return wmatch(w, d); })) best = f[1]; }); if (best) hit++; sc += best; });
    return sc ? sc + hit : 0;
  }
  function search(q) {
    var qt = toks(q); if (!qt.length) return { sit: [], steps: [] };
    var sit = [], steps = [];
    allSlugs().forEach(function (slug) {
      var s = D.situations[slug], sp = sphereOf(slug), st = D.stubs[slug];
      var f = [[toks(titleOf(slug)), 3], [toks(sp ? sp.title : ''), 1]];
      if (s) { f.push([toks(s.h1), 2], [toks(s.synonyms.join(' ')), 3], [toks(s.card), 1]); }
      else if (st) f.push([toks(st[1]), 1]);
      var sc = score(qt, f); if (sc) sit.push({ slug: slug, score: sc + (s ? 1 : 0) });
      if (s) s.steps.forEach(function (stp) {
        var sc2 = score(qt, [[toks(stp.title), 3], [toks(stp.kw || ''), 3], [toks(stp.when), 1.5], [toks(stp.act.join(' ')), 0.7]]);
        if (sc2 >= 4) steps.push({ slug: slug, id: stp.id, score: sc2 });
      });
    });
    sit.sort(function (a, b) { return b.score - a.score; });
    steps.sort(function (a, b) { return b.score - a.score; });
    if (sit.length) sit = sit.filter(function (x) { return x.score >= sit[0].score * 0.45; });
    if (steps.length) steps = steps.filter(function (x) { return x.score >= steps[0].score * 0.6; });
    return { sit: sit, steps: steps.slice(0, 5) };
  }
  function sitRow(slug) {
    var r = isReady(slug), sp = sphereOf(slug);
    return '<a class="row" href="#/situations/' + slug + '"><span class="row-t"><b>' + esc(r ? D.situations[slug].h1 : titleOf(slug)) + '</b><small>' +
      esc((sp ? sp.title : '') + (r ? ' · ' + D.situations[slug].steps.length + ' шагов' : '')) + '</small></span><span class="badge ' + (r ? 'b-ready' : 'b-draft') + '">' + (r ? 'Маршрут доступен' : 'В разработке') + '</span>' + icon('chevron-right') + '</a>';
  }
  function stepRow(slug, id) {
    var st = stepOf(slug, id);
    return '<a class="row" href="#/situations/' + slug + '?step=' + id + '"><span class="row-t"><b>' + esc(st.title) + '</b><small>Шаг маршрута «' + esc(D.situations[slug].h1) + '»</small></span>' + icon('chevron-right') + '</a>';
  }
  function bindSuggest(form) {
    var input = form.querySelector('input'), box = form.parentNode.querySelector('.suggest');
    form.addEventListener('submit', function (e) { e.preventDefault(); location.hash = '#/search?q=' + encodeURIComponent(input.value.trim()); });
    if (!box) return;
    input.addEventListener('input', function () {
      var v = input.value.trim();
      if (v.length < 3) { box.hidden = true; return; }
      var r = search(v), h = '';
      r.sit.slice(0, 4).forEach(function (x) { h += '<a href="#/situations/' + x.slug + '"><b>' + esc(isReady(x.slug) ? D.situations[x.slug].h1 : titleOf(x.slug)) + '</b><span>' + (isReady(x.slug) ? 'Маршрут доступен' : 'В разработке') + '</span></a>'; });
      r.steps.slice(0, 2).forEach(function (x) { h += '<a href="#/situations/' + x.slug + '?step=' + x.id + '"><b>' + esc(stepOf(x.slug, x.id).title) + '</b><span>Шаг маршрута</span></a>'; });
      box.innerHTML = h || '<div class="sg-empty">Пока не нашли. Нажмите «Найти» — покажем все сферы.</div>';
      box.hidden = false;
    });
    document.addEventListener('click', function (e) { if (!form.parentNode.contains(e.target)) box.hidden = true; });
  }

  /* ---------- HOME ---------- */
  function viewHome() {
    var total = allSlugs().length;
    var chips = [['Близкому нужен уход', 'uhod-za-tyazhelobolnym'], ['Меняю профессию', 'smena-professii'], ['Ребёнок растёт', 'rebenok-v-shkolu'], ['Не получается завести ребёнка', 'planirovanie-rebenka'], ['Родился ребёнок', 'rozhdenie-rebenka'], ['Выхожу на пенсию', 'pensiya']];
    var h = '<section class="hero"><div class="wrap hero-in"><div class="hero-t"><h1>Навигатор по жизненным ситуациям</h1>' +
      '<p class="hero-sub">Получите необходимую информацию для жизни в России. Путеводители помогут подготовиться к важным моментам жизни и найти выход из сложных ситуаций.</p></div>' +
      '<div class="hero-search"><form class="sbox" role="search"><input type="search" name="q" autocomplete="off" aria-label="Опишите вашу ситуацию" placeholder="Опишите вашу ситуацию своими словами"><button type="submit" class="sbox-go">Найти</button></form><div class="suggest" hidden></div>' +
      '<div class="hero-acts"><button type="button" class="hbtn" data-assist-voice>' + icon('mic') + 'Задать голосом</button><button type="button" class="hbtn" data-assist>' + icon('message-square') + 'Спросить помощника</button></div>' +
      '<div class="qchips">' + chips.map(function (c) { return '<a class="qchip" href="#/situations/' + c[1] + '">' + c[0] + '</a>'; }).join('') + '</div></div></div></section>';
    h += '<div class="wrap"><p class="notice">Материалы подготовлены с опорой на официальные источники и проходят экспертную проверку. Это концепт-прототип: навигатор показывает, как раздел может работать в Госуслугах.</p></div>';

    h += '<section class="sec"><div class="wrap"><div class="sec-head"><h2>Сферы жизни</h2><p class="sec-meta">' + D.spheres.length + ' сфер · ' + total + ' ' + plural(total, 'ситуация', 'ситуации', 'ситуаций') + ' · <a href="#/kniga">12 частей и 84 раздела книги</a></p></div><div class="spheres">';
    D.spheres.forEach(function (sp) {
      var shown = 0, extra = 0;
      var items = sp.situations.map(function (sl) {
        var r = isReady(sl), x = !r && shown >= 2; if (!x) shown++; else extra++;
        return '<li' + (x ? ' class="x"' : '') + '><a class="' + (r ? 'ready' : '') + '" href="#/situations/' + sl + '">' + esc(titleOf(sl)) + '</a></li>';
      }).join('');
      h += '<div class="sphere"><a class="sphere-h" href="#/sphere/' + sp.id + '">' + esc(sp.title) + '</a><ul>' + items + '</ul>' +
        (extra ? '<button type="button" class="more" data-more>Ещё ' + extra + ' ' + plural(extra, 'ситуация', 'ситуации', 'ситуаций') + '</button>' : '') + '</div>';
    });
    h += '</div><p class="legend">Синим выделены ситуации с готовым маршрутом. Остальные разделы готовятся и проходят экспертную проверку.</p></div></section>';

    h += '<section class="sec sec-white"><div class="wrap"><div class="sec-head"><h2>С чего начать</h2><p class="sec-meta">Готовые маршруты. Начать можно с любого шага</p></div><div class="guides">';
    readySlugs().forEach(function (sl) {
      var s = D.situations[sl];
      h += '<a class="guide" href="#/situations/' + sl + '"><b>' + esc(s.h1) + '</b><span>' + esc(s.card) + '</span><small>' + s.steps.length + ' шагов · чек-лист · меры поддержки · консультации</small></a>';
    });
    h += '</div></div></section>';

    h += '<section class="sec"><div class="wrap"><div class="sec-head"><h2>Ваши инструменты</h2></div><div class="tools">' +
      tool('#/my-plan', 'Мой план', 'Шаги и чек-листы, которые вы сохранили') +
      tool('#/support', 'Меры поддержки', 'Что может подойти и где проверить условия') +
      tool('#/consultations', 'Консультации', 'Куда обратиться и как подготовить вопрос') +
      tool('#/communities', 'Сообщества', 'Люди с похожим опытом') +
      '<button type="button" class="tool" data-assist><b>Помощник</b><span>Спросите текстом или голосом</span></button></div></div></section>';

    h += '<section class="sec sec-white"><div class="wrap"><div class="sec-head"><h2>Примеры из жизни</h2><p class="sec-meta">Как люди проходят свои ситуации. Это примеры, а не обязательная часть маршрута</p></div><div class="stories">' + D.stories.map(storyCard).join('') + '</div></div></section>';

    h += '<section class="sec"><div class="wrap"><div class="sec-head"><h2>Как это работает</h2></div><ol class="how">' +
      '<li><b>Книга</b><span>«Путеводитель российской семьи» вручают в важный день, и он остаётся дома.</span></li>' +
      '<li><b>QR-код</b><span>В каждом разделе книги — код, который открывает нужную ситуацию.</span></li>' +
      '<li><b>Свой шаг</b><span>Человек выбирает то, что важно сейчас, — без обязательного порядка.</span></li>' +
      '<li><b>Поддержка</b><span>Меры, документы и официальные сайты собраны в одном месте.</span></li>' +
      '<li><b>Живой человек</b><span>Консультации, горячие линии и люди с похожим опытом.</span></li></ol>' +
      '<p class="muted how-note">В перспективе навигатор может быть встроен в Госуслуги. Сейчас кнопки ведут на официальные сайты.</p>' +
      '<div class="links-row"><a href="#/kniga">Книга: 12 частей</a><a href="#/qr">QR-коды</a><a href="#/about">О проекте</a><a href="#/verification">Как мы проверяем сведения</a></div></div></section>';
    app.innerHTML = h;
    bindSuggest(app.querySelector('.sbox'));
    app.querySelectorAll('[data-more]').forEach(function (b) { b.addEventListener('click', function () { b.parentNode.classList.add('open'); b.remove(); }); });
  }
  function tool(href, t, d) { return '<a class="tool" href="' + href + '"><b>' + t + '</b><span>' + d + '</span></a>'; }
  function storyCard(st) {
    return '<a class="story" href="#/stories/' + st.id + '"><span class="muted-s">' + esc(st.name) + ', ' + st.age + '</span><b>' + esc(st.title) + '</b><span class="link-more">Читать пример' + icon('arrow-right') + '</span></a>';
  }

  /* ---------- SITUATION ---------- */
  function viewSituation(slug, fromBook, q) {
    var s = D.situations[slug];
    if (!s) return viewStub(slug, fromBook);
    var sp = sphereById(s.sphere), tab = q.tab || 'plan', openId = q.step && stepOf(slug, q.step) ? q.step : null;
    if (q.step && !openId) setTimeout(function () { toast('Такого шага нет — открыт весь маршрут'); }, 300);
    if (openId) tab = 'plan';
    ctx.slug = slug; ctx.step = openId;
    document.title = s.h1 + ' — Жизненные ситуации';
    var tabs = [['plan', 'Пошаговый план'], ['checklist', 'Чек-лист'], ['support', 'Меры поддержки'], ['people', 'Консультации и сообщества'], ['sources', 'Источники']];
    var h = '';
    if (fromBook) h += '<div class="frombook"><div class="wrap">Вы перешли по QR-коду из книги — ' + esc(s.bookRef.part) + ', раздел ' + s.bookRef.section + '.</div></div>';
    h += '<div class="wrap page">' + crumbs([{ t: sp.title, href: '#/sphere/' + sp.id }, { t: s.title }]) +
      '<header class="shead"><h1>' + esc(s.h1) + '</h1><p class="intro">' + esc(s.intro) + '</p>' +
      '<p class="smeta">' + s.steps.length + ' шагов · начать можно с любого · <a href="#/verification">' + D.reviewStatus + '</a></p></header>';
    if (s.urgent) h += '<section class="urgent" aria-label="Нужна помощь сейчас"><div><b>Нужна помощь сейчас?</b><p>' + esc(s.urgent.text) + '</p></div><div class="urgent-tels">' + s.urgent.phones.map(function (p) { return tel(p[0], p[1]); }).join('') + '</div></section>';
    h += '<nav class="tabs" role="tablist" aria-label="Разделы маршрута">' + tabs.map(function (t) { return '<a role="tab" href="#/situations/' + slug + (t[0] === 'plan' ? '' : '?tab=' + t[0]) + '" aria-selected="' + (t[0] === tab) + '">' + t[1] + '</a>'; }).join('') + '</nav>';
    h += '<div class="tabpanel" id="tabpanel"></div></div>';
    app.innerHTML = h;
    var panel = document.getElementById('tabpanel');
    if (tab === 'plan') renderPlanTab(panel, slug, openId);
    else if (tab === 'checklist') renderChecklistTab(panel, slug);
    else if (tab === 'support') renderSupportTab(panel, slug);
    else if (tab === 'people') renderPeopleTab(panel, slug);
    else renderSourcesTab(panel, slug);
    icons();
    if (openId) setTimeout(function () { var el = document.getElementById('st-' + openId); if (el) el.scrollIntoView({ block: 'start' }); }, 50);
    guardUrgent();
  }
  /* На мобильном кнопка помощника не должна закрывать экстренные номера */
  var urgentObs = null;
  function guardUrgent() {
    if (urgentObs) { urgentObs.disconnect(); urgentObs = null; }
    if (aEl) aEl.classList.remove('hide-fab');
    var u = app.querySelector('.urgent, .qcard.alarm');
    if (!u || !('IntersectionObserver' in window)) return;
    urgentObs = new IntersectionObserver(function (en) { aEl.classList.toggle('hide-fab', en[0].isIntersecting && window.innerWidth <= 600); });
    urgentObs.observe(u);
  }

  function renderPlanTab(root, slug, openId) {
    var s = D.situations[slug], h = '';
    if (s.assessment) h += '<div class="callout"><div><b>Не знаете, с чего начать?</b><p>Ответьте на несколько вопросов — подберём подходящие шаги и меры поддержки. Это не обязательно: все шаги доступны и без опроса.</p></div><a class="btn btn-primary" href="#/care-check">Подобрать помощь</a></div>';
    h += '<div class="need"><p class="need-t">Что вам важно сейчас?</p><div class="chips" role="group" aria-label="Выберите, что важно сейчас">' + s.quick.map(function (qk, i) { return '<button type="button" class="chip" data-quick="' + i + '" aria-pressed="false">' + esc(qk[0]) + '</button>'; }).join('') + '</div></div>';
    h += '<p class="progress" id="progress"></p><ol class="steps" id="steps">' + s.steps.map(function (st, i) { return stepHtml(slug, st, i, st.id === openId); }).join('') + '</ol>';
    root.innerHTML = h;
    updateProgress(slug);
    bindSteps(root, slug);
  }
  function updateProgress(slug) {
    var s = D.situations[slug], el = document.getElementById('progress'); if (!el) return;
    var done = 0, nn = 0; s.steps.forEach(function (st) { var v = getStatus(slug, st.id); if (v === 'done') done++; if (v === 'not_now') nn++; });
    el.textContent = 'Сделано ' + done + ' из ' + s.steps.length + (nn ? ' · не нужно сейчас: ' + nn : '') + '. Порядок шагов — только подсказка.';
  }
  function stepHtml(slug, st, i, open) {
    var v = getStatus(slug, st.id);
    return '<li class="step' + (open ? ' open' : '') + '" id="st-' + st.id + '" data-id="' + st.id + '">' +
      '<button type="button" class="step-h" aria-expanded="' + open + '" aria-controls="sb-' + st.id + '"><span class="num">' + (i + 1) + '</span>' +
      '<span class="step-ht"><span class="tag">' + esc(st.tag) + '</span><b>' + esc(st.title) + '</b><small>' + esc(st.when) + '</small></span>' +
      '<span class="st st-' + v + '">' + statusLabel(v) + '</span>' + icon('chevron-down') + '</button>' +
      '<div class="step-b" id="sb-' + st.id + '"' + (open ? '' : ' hidden') + '>' + (open ? stepBody(slug, st) : '') + '</div></li>';
  }
  function stepBody(slug, st) {
    var v = getStatus(slug, st.id), h = '<div class="sb-grid"><div class="sb-main">';
    h += '<h4>Что можно сделать</h4><ul class="ul">' + st.act.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>';
    h += extrasHtml(slug, st);
    if (st.prepare && st.prepare.length) h += '<h4>Что подготовить</h4><ul class="ul">' + st.prepare.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>';
    if (st.go && st.go.length) h += '<h4>Куда обратиться</h4><div class="go">' + st.go.map(function (g) { return g[0] === 'tel' ? tel(g[1], g[2]) : g[0] === 'page' ? '<a class="lnk" href="' + g[1] + '">' + esc(g[2]) + icon('arrow-right') + '</a>' : ext(g[1], g[2]); }).join('') + '</div>';
    if (st.note) h += '<p class="note">' + esc(st.note) + '</p>';
    h += '<h4>Как понять, что получилось</h4><p>' + esc(st.result) + '</p>';
    h += '</div><div class="sb-side">';
    h += '<h4>Чек-лист шага</h4><ul class="chk">' + st.check.map(function (c, k) { var key = slug + ':' + st.id + ':' + k; return '<li><label><input type="checkbox" data-schk="' + key + '"' + (chkGet(key) ? ' checked' : '') + '><span>' + esc(c) + '</span></label></li>'; }).join('') + '</ul>';
    if (st.measures && st.measures.length) h += '<h4>Меры поддержки</h4><div class="mlinks">' + st.measures.map(function (m) { return '<a href="#/situations/' + slug + '?tab=support&m=' + m + '">' + esc(D.measures[m].name) + '</a>'; }).join('') + '</div>';
    h += '<h4>Статус шага</h4><div class="seg" role="radiogroup" aria-label="Статус шага">' + STATUS.map(function (x) { return '<button type="button" role="radio" aria-checked="' + (x[0] === v) + '" data-status="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    h += '<div class="sb-acts"><button type="button" class="btn ' + (inPlan(slug, st.id) ? 'btn-on' : 'btn-line') + '" data-plan>' + (inPlan(slug, st.id) ? 'В моём плане' : 'Сохранить в мой план') + '</button>' +
      '<button type="button" class="btn btn-ghost" data-link>' + icon('link') + 'Ссылка на шаг</button><button type="button" class="btn btn-ghost" data-ask>' + icon('message-square') + 'Спросить об этом шаге</button></div>';
    if (st.next && st.next.length) h += '<h4>Что дальше — по желанию</h4><div class="nexts">' + st.next.map(function (n) { var t = stepOf(slug, n); return '<button type="button" class="chip" data-open="' + n + '">' + (stepIndex(slug, n) + 1) + '. ' + esc(t.title) + '</button>'; }).join('') + '</div>';
    return h + '</div></div>';
  }
  function extrasHtml(slug, st) {
    if (st.ages) return '<div class="extra"><p class="extra-t">Возраст ребёнка</p><div class="chips">' + D.ages.map(function (a, i) { return '<button type="button" class="chip" data-age="' + i + '" aria-pressed="false">' + a[0] + '</button>'; }).join('') + '</div><p class="age-out" aria-live="polite">Выберите возраст — покажем, что важно.</p></div>';
    if (st.phrases) return '<div class="extra"><p class="extra-t">Выберите вопрос на сегодняшний разговор</p><div class="chips">' + D.phrases.map(function (p, i) { return '<button type="button" class="chip" data-phrase="' + i + '" aria-pressed="false">' + esc(p) + '</button>'; }).join('') + '</div></div>';
    if (st.trainer) return '<div class="extra"><p class="extra-t">Ребёнок говорит: ' + esc(D.trainer.phrase) + '. Что ответить?</p><div class="opts">' + D.trainer.options.map(function (o, i) { return '<button type="button" class="opt" data-train="' + i + '">' + esc(o[0]) + '</button>'; }).join('') + '</div><p class="train-out" aria-live="polite"></p></div>';
    if (st.calc) return '<div class="extra"><p class="extra-t">Сколько может вернуться</p><div class="calc"><input type="number" inputmode="numeric" min="0" step="1000" placeholder="Стоимость обучения, ₽" aria-label="Стоимость обучения в рублях" data-calc><p class="calc-out" aria-live="polite"></p></div><p class="muted-s">Расчёт при ставке НДФЛ 13% и лимите 150 000 ₽ расходов в год. Возврат не больше уплаченного налога. Условия — на сайте ФНС.</p></div>';
    if (st.planner) {
      var w = load('week', {}), parts = [['m', 'Утром'], ['d', 'Днём'], ['e', 'Вечером'], ['n', 'Ночью']];
      return '<div class="extra"><p class="extra-t">Карта недели: кто рядом</p><div class="week">' + parts.map(function (p) { return '<label><span>' + p[1] + '</span><input type="text" data-week="' + p[0] + '" value="' + esc(w[p[0]] || '') + '" placeholder="Кто может быть рядом"></label>'; }).join('') + '</div><p class="muted-s">Записи хранятся только на этом устройстве.</p></div>';
    }
    return '';
  }
  function openStep(root, slug, id, scroll) {
    var li = root.querySelector('#st-' + id); if (!li) return;
    var b = li.querySelector('.step-b'), st = stepOf(slug, id);
    if (!b.innerHTML) b.innerHTML = stepBody(slug, st);
    b.hidden = false; li.classList.add('open'); li.querySelector('.step-h').setAttribute('aria-expanded', 'true'); icons();
    ctx.step = id;
    if (scroll) li.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function rerenderStep(root, slug, id) {
    var li = root.querySelector('#st-' + id), i = stepIndex(slug, id), wasOpen = li.classList.contains('open');
    li.outerHTML = stepHtml(slug, stepOf(slug, id), i, wasOpen);
    icons(); updateProgress(slug);
  }
  function bindSteps(root, slug) {
    root.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      var li = t.closest('.step'), id = li ? li.getAttribute('data-id') : null;
      if (t.classList.contains('step-h')) {
        var b = li.querySelector('.step-b');
        if (li.classList.contains('open')) { b.hidden = true; li.classList.remove('open'); t.setAttribute('aria-expanded', 'false'); }
        else openStep(root, slug, id, false);
      } else if (t.hasAttribute('data-quick')) {
        var on = t.getAttribute('aria-pressed') !== 'true';
        root.querySelectorAll('[data-quick]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        root.querySelectorAll('.step').forEach(function (x) { x.classList.remove('match'); });
        if (on) {
          t.setAttribute('aria-pressed', 'true');
          var ids = D.situations[slug].quick[+t.getAttribute('data-quick')][1];
          ids.forEach(function (sid, k) { var el = root.querySelector('#st-' + sid); el.classList.add('match'); if (k === 0) openStep(root, slug, sid, true); });
        }
      } else if (t.hasAttribute('data-status')) {
        setStatus(slug, id, t.getAttribute('data-status')); rerenderStep(root, slug, id);
        toast('Статус шага: ' + statusLabel(t.getAttribute('data-status')));
      } else if (t.hasAttribute('data-plan')) {
        if (inPlan(slug, id)) { removePlan(slug, id); toast('Шаг убран из плана'); } else { addPlan(slug, id, 'now'); toast('Шаг сохранён в «Мой план»'); }
        rerenderStep(root, slug, id);
      } else if (t.hasAttribute('data-link')) {
        copy(baseUrl() + '#/situations/' + slug + '?step=' + id, 'Ссылка на шаг скопирована');
      } else if (t.hasAttribute('data-ask')) {
        openAssistant(); assistantAboutStep(slug, id);
      } else if (t.hasAttribute('data-open')) {
        openStep(root, slug, t.getAttribute('data-open'), true);
      } else if (t.hasAttribute('data-age')) {
        li.querySelectorAll('[data-age]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === t)); });
        var a = D.ages[+t.getAttribute('data-age')]; li.querySelector('.age-out').textContent = a[0] + ': ' + a[1];
      } else if (t.hasAttribute('data-phrase')) {
        li.querySelectorAll('[data-phrase]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === t)); });
        toast('Вопрос выбран: ' + D.phrases[+t.getAttribute('data-phrase')]);
      } else if (t.hasAttribute('data-train')) {
        var o = D.trainer.options[+t.getAttribute('data-train')];
        li.querySelectorAll('[data-train]').forEach(function (x) { x.classList.remove('ok', 'no'); });
        t.classList.add(o[1] ? 'ok' : 'no'); li.querySelector('.train-out').textContent = o[2];
      }
    });
    root.addEventListener('change', function (e) {
      if (e.target.matches('[data-schk]')) chkSet(e.target.getAttribute('data-schk'), e.target.checked);
    });
    root.addEventListener('input', function (e) {
      if (e.target.matches('[data-calc]')) {
        var v = parseFloat(e.target.value) || 0, out = e.target.parentNode.querySelector('.calc-out');
        out.textContent = v > 0 ? 'До ' + Math.round(Math.min(v, 150000) * 0.13).toLocaleString('ru-RU') + ' ₽' : '';
      }
      if (e.target.matches('[data-week]')) { var w = load('week', {}); w[e.target.getAttribute('data-week')] = e.target.value; save('week', w); }
    });
  }

  function renderChecklistTab(root, slug) {
    var s = D.situations[slug], total = 0, h = '<div class="tab-head"><h2>Чек-лист</h2><p>Отмечайте то, что уже сделано или не подходит. Список сохраняется на этом устройстве.</p>' +
      '<div class="acts"><button type="button" class="btn btn-line" data-print>' + icon('printer') + 'Распечатать</button><button type="button" class="btn btn-line" data-read>' + icon('volume-2') + 'Озвучить</button><button type="button" class="btn btn-ghost" data-stop>Остановить</button></div></div>';
    if (slug === 'uhod-za-tyazhelobolnym') h += '<p class="note">Чек-лист не заменяет врача. Вопросы о лечении и медицинских действиях обсуждайте с лечащим врачом или обученной медсестрой.</p>';
    s.checklist.forEach(function (g, gi) {
      h += '<section class="cgroup"><h3>' + esc(g.group) + '</h3><ul class="chk">' + g.items.map(function (it, k) { total++; var key = slug + ':c' + gi + '-' + k; return '<li><label><input type="checkbox" data-ck="' + key + '"' + (chkGet(key) ? ' checked' : '') + '><span>' + esc(it) + '</span></label></li>'; }).join('') + '</ul></section>';
    });
    root.innerHTML = h + '<p class="progress" id="ckcount"></p>';
    var count = function () { var on = root.querySelectorAll('[data-ck]:checked').length; root.querySelector('#ckcount').textContent = 'Отмечено ' + on + ' из ' + total + '.'; };
    count();
    root.addEventListener('change', function (e) { if (e.target.matches('[data-ck]')) { chkSet(e.target.getAttribute('data-ck'), e.target.checked); count(); } });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-print')) window.print();
      if (b.hasAttribute('data-read')) speak('Чек-лист. ' + s.checklist.map(function (g) { return g.group + '. ' + g.items.join('. '); }).join('. '));
      if (b.hasAttribute('data-stop')) stopSpeak();
    });
  }
  function measureCard(id, hl) {
    var m = D.measures[id], h = '<article class="measure' + (hl ? ' hl' : '') + '" id="m-' + id + '"><p class="m-cat">' + esc(m.cat) + ' · ' + esc(m.price) + '</p><h3>' + esc(m.name) + '</h3><p class="m-prov">' + esc(m.provider) + '</p>' +
      '<p class="m-el"><b>Условия: </b>' + esc(m.eligibility) + '</p>';
    if (m.basis) h += '<p class="muted-s">Основание: ' + esc(m.basis) + '</p>';
    var a = '';
    if (m.phone) a += tel(m.phone, m.phoneNote);
    if (m.phone2) a += tel(m.phone2, m.phone2Note);
    if (m.url) a += ext(m.url, m.urlLabel || 'Официальный сайт');
    if (a) h += '<div class="go">' + a + '</div>';
    return h + '<p class="m-trust">' + (m.url || m.phone ? 'Ссылка сверена ' + D.sourceCheckedAt + ' · ' : '') + 'требует экспертной проверки · доступность зависит от региона</p></article>';
  }
  function renderSupportTab(root, slug) {
    var q = parseQuery(), ids = Object.keys(D.measures).filter(function (k) { return D.measures[k].scenario === slug; });
    root.innerHTML = '<div class="tab-head"><h2>Меры поддержки</h2><p>Что может подойти. Это не подтверждение права: условия проверяйте на официальных сайтах.</p></div><div class="measures">' + ids.map(function (k) { return measureCard(k, q.m === k); }).join('') + '</div>';
    if (q.m) setTimeout(function () { var el = document.getElementById('m-' + q.m); if (el) el.scrollIntoView({ block: 'center' }); }, 60);
  }
  function renderPeopleTab(root, slug) {
    var s = D.situations[slug], c = commById(s.community);
    root.innerHTML = '<div class="tab-head"><h2>Консультации и сообщества</h2><p>Иногда нужен не текст, а разговор с человеком.</p></div>' +
      '<h3 class="h3">Поговорить со специалистом</h3><div class="measures">' + s.consult.map(function (k) { return measureCard(k); }).join('') + '</div>' +
      askBox(slug) +
      '<h3 class="h3">Люди с похожим опытом</h3>' + commCard(c);
    bindAsk(root);
  }
  function askBox(slug) {
    return '<section class="askbox"><h3>Подготовить вопрос специалисту</h3><p class="muted-s">Опишите ситуацию — мы соберём текст, который удобно скопировать в письмо или зачитать по телефону. Ничего не отправляется.</p>' +
      '<label class="lbl" for="ask-what">Что происходит</label><textarea id="ask-what" rows="3" placeholder="Например: маму выписали после инсульта, она не встаёт"></textarea>' +
      '<label class="lbl" for="ask-q">Что хотите узнать</label><textarea id="ask-q" rows="2" placeholder="Например: какие документы нужны для помощи на дому"></textarea>' +
      '<button type="button" class="btn btn-line" data-askcopy>Скопировать вопрос</button></section>';
  }
  function bindAsk(root) {
    root.addEventListener('click', function (e) {
      if (!e.target.closest('[data-askcopy]')) return;
      var w = root.querySelector('#ask-what').value.trim(), q = root.querySelector('#ask-q').value.trim();
      if (!w && !q) { toast('Опишите ситуацию или вопрос'); return; }
      copy('Здравствуйте! ' + (w ? 'Ситуация: ' + w + '. ' : '') + (q ? 'Вопрос: ' + q + '. ' : '') + 'Подскажите, пожалуйста, куда обратиться и что подготовить.', 'Вопрос скопирован');
    });
  }
  function commById(id) { for (var i = 0; i < D.communities.length; i++) if (D.communities[i].id === id) return D.communities[i]; return D.communities[0]; }
  function commCard(c) {
    return '<article class="measure"><p class="m-cat">' + esc(c.status) + '</p><h3>' + esc(c.title) + '</h3><p>' + esc(c.text) + '</p><p class="muted-s">Уже сейчас можно обратиться:</p><div class="go">' + c.real.map(function (r) { return ext(r[1], r[0]); }).join('') + '</div></article>';
  }
  function renderSourcesTab(root, slug) {
    var s = D.situations[slug], st = storyById(s.story);
    root.innerHTML = '<div class="tab-head"><h2>Источники и проверка</h2></div><div class="trust"><div>' +
      '<p><b>Статус:</b> ' + D.reviewStatus + '. Ссылки и телефоны сверены с официальными сайтами ' + D.sourceCheckedAt + '. Знак «Проверено экспертом» появится только после проверки врачом, юристом или социальным работником.</p>' +
      '<h3 class="h3">Источники</h3><ul class="ul">' + s.sources.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<p><b>В книге:</b> ' + esc(s.bookRef.part) + ', раздел ' + s.bookRef.section + '.</p>' +
      (st ? '<p><a href="#/stories/' + st.id + '">Посмотреть пример, как может пройти этот маршрут</a></p>' : '') +
      '<div class="fb"><b>Страница помогла?</b><button type="button" class="btn btn-line" data-fb>Да</button><button type="button" class="btn btn-line" data-fb>Не совсем</button></div></div>' +
      '<div class="qrbox"><div class="qr" id="sit-qr"></div><p>QR-код раздела ' + s.bookRef.section + '</p></div></div>';
    qr(document.getElementById('sit-qr'), baseUrl() + '#/s/' + slug, 132);
    root.addEventListener('click', function (e) { var b = e.target.closest('[data-fb]'); if (b) b.parentNode.innerHTML = '<span class="ok">Спасибо! Отзыв помогает улучшать маршруты.</span>'; });
  }

  /* ---------- STUB ---------- */
  function viewStub(slug, fromBook) {
    var st = D.stubs[slug]; if (!st) return viewNotFound();
    var sp = sphereOf(slug); ctx.slug = null;
    document.title = st[0] + ' — Жизненные ситуации';
    var items = ['Сформулировать, что именно нужно решить', st[2], 'Проверить информацию на официальных сайтах', 'Найти консультацию или живой контакт'];
    app.innerHTML = '<div class="wrap page">' + (fromBook ? '<p class="frombook-in">Вы перешли по QR-коду из книги.</p>' : '') + crumbs([{ t: sp.title, href: '#/sphere/' + sp.id }, { t: st[0] }]) +
      '<header class="shead"><p class="badge b-draft">Маршрут в разработке</p><h1>' + esc(st[0]) + '</h1><p class="intro">' + esc(st[1]) + '</p></header>' +
      '<section class="block"><h2>С чего можно начать</h2><p class="muted-s">Ориентирующий список · требует экспертной проверки</p><ul class="chk">' + items.map(function (it, k) { var key = 'stub:' + slug + ':' + k; return '<li><label><input type="checkbox" data-sk="' + key + '"' + (chkGet(key) ? ' checked' : '') + '><span>' + esc(it) + '</span></label></li>'; }).join('') + '</ul>' +
      '<p><b>Какую поддержку искать:</b> ' + esc(st[3]) + '.</p></section>' +
      '<div class="tools tools-4">' + tool('#/support', 'Что мне доступно?', 'Каталог мер поддержки') + tool('#/consultations', 'Поговорить со специалистом', 'Консультации и горячие линии') + tool('#/communities', 'Люди с похожим опытом', 'Сообщества') + '<button type="button" class="tool" data-assist><b>Спросить помощника</b><span>Текстом или голосом</span></button></div>' +
      '<section class="block"><h2>Готовые маршруты</h2><div class="rows">' + readySlugs().map(sitRow).join('') + '</div></section>' +
      '<p><button type="button" class="btn btn-line" data-vote>Эта тема важна для меня</button></p></div>';
    app.addEventListener('change', stubChange);
    var v = app.querySelector('[data-vote]'); v.addEventListener('click', function () { v.outerHTML = '<span class="ok">Спасибо! Учтём, какие разделы нужнее.</span>'; });
  }
  function stubChange(e) { if (e.target.matches('[data-sk]')) chkSet(e.target.getAttribute('data-sk'), e.target.checked); }

  /* ---------- CARE CHECK (опросник) ---------- */
  var cc = { i: -1, a: {} };
  function viewCareCheck() {
    document.title = 'Подобрать помощь по уходу — Жизненные ситуации';
    ctx.slug = 'uhod-za-tyazhelobolnym';
    cc = { i: -1, a: {} };
    app.innerHTML = '<div class="wrap page narrow">' + crumbs([{ t: 'Забота о близких', href: '#/sphere/zabota' }, { t: 'Уход', href: '#/situations/uhod-za-tyazhelobolnym' }, { t: 'Подобрать помощь' }]) +
      '<header class="shead"><h1>Подобрать помощь по уходу</h1><p class="intro">Несколько вопросов помогут не пропустить важное и подобрать подходящие шаги. Это не диагноз и не подтверждение права на услугу. Любой вопрос можно пропустить.</p></header><div id="cc"></div></div>';
    ccRender();
  }
  function ccRender() {
    var root = document.getElementById('cc'), Q = D.careCheck, h = '';
    if (cc.i === -1) {
      h = '<section class="qcard"><p class="q-k">Сначала главное</p><h2>Есть ли сейчас внезапное ухудшение: перекос лица, новая слабость, нарушение речи, потеря сознания или трудности с дыханием?</h2><div class="opts">' +
        '<button type="button" class="opt" data-q0="yes">Да</button><button type="button" class="opt" data-q0="no">Нет</button><button type="button" class="opt" data-q0="unsure">Не уверен(а)</button></div></section>';
    } else if (cc.i === -2) {
      h = '<section class="qcard alarm"><h2>Позвоните 103 или 112</h2><p>Не продолжайте опрос вместо экстренной помощи. Цифровой помощник не заменяет врача.</p><div class="urgent-tels">' + tel('103', 'Скорая помощь') + tel('112', 'Экстренные службы') + '</div><button type="button" class="btn btn-line" data-cc="start">Опасность миновала — продолжить</button></section>';
    } else if (cc.i < Q.length) {
      var q = Q[cc.i], ans = cc.a[q.id] || [];
      h = '<section class="qcard"><p class="q-k">Вопрос ' + (cc.i + 1) + ' из ' + Q.length + (q.multi ? ' · можно выбрать несколько' : '') + '</p><h2>' + esc(q.q) + '</h2><div class="opts">' +
        q.opts.map(function (o) { return '<button type="button" class="opt' + (ans.indexOf(o) > -1 ? ' sel' : '') + '" data-opt="' + esc(o) + '" aria-pressed="' + (ans.indexOf(o) > -1) + '">' + esc(o) + '</button>'; }).join('') +
        '<button type="button" class="opt' + (ans.indexOf('Не знаю') > -1 ? ' sel' : '') + '" data-opt="Не знаю">Не знаю</button></div>' +
        '<div class="q-nav"><button type="button" class="btn btn-ghost" data-cc="back">Назад</button><button type="button" class="btn btn-ghost" data-cc="skip">Пропустить</button>' + (q.multi ? '<button type="button" class="btn btn-primary" data-cc="next">Дальше</button>' : '') + '</div></section>';
    } else h = ccResult();
    root.innerHTML = h; icons(); guardUrgent();
    root.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-q0')) { var v = b.getAttribute('data-q0'); cc.unsure = v === 'unsure'; cc.i = v === 'yes' ? -2 : 0; if (v === 'unsure') toast('При подозрении на инсульт лучше сразу вызвать скорую: 103 или 112'); ccRender(); return; }
      var a = b.getAttribute('data-cc');
      if (a === 'start') { cc.i = 0; ccRender(); return; }
      if (a === 'back') { cc.i = Math.max(-1, cc.i - 1); ccRender(); return; }
      if (a === 'skip' || a === 'next') { cc.i++; ccRender(); window.scrollTo(0, 0); return; }
      if (a === 'restart') { cc = { i: -1, a: {} }; ccRender(); return; }
      if (a === 'plan') { ccLast.forEach(function (x) { addPlan('uhod-za-tyazhelobolnym', x[0], x[1]); }); toast('Шаги сохранены в «Мой план»'); return; }
      if (a === 'print') { window.print(); return; }
      if (a === 'read') { speak(document.getElementById('cc').innerText); return; }
      if (a === 'stop') { stopSpeak(); return; }
      if (b.hasAttribute('data-opt')) {
        var q = Q[cc.i], o = b.getAttribute('data-opt'), arr = cc.a[q.id] || [];
        if (q.multi) { var p = arr.indexOf(o); if (p > -1) arr.splice(p, 1); else arr.push(o); cc.a[q.id] = arr; ccRender(); }
        else { cc.a[q.id] = [o]; cc.i++; ccRender(); window.scrollTo(0, 0); }
      }
    };
  }
  var ccLast = [];
  function has(q, v) { return (cc.a[q] || []).indexOf(v) > -1; }
  function ccResult() {
    var sc = {}, add = function (id, n) { sc[id] = (sc[id] || 0) + n; };
    if (has('q1', 'В больнице, скоро выписка')) { add('I0', 5); add('I1', 4); add('I2', 4); }
    if (has('q1', 'Дома после выписки')) { add('I2', 3); add('I5', 2); }
    if (has('q2', 'Практически не может вставать') || has('q2', 'С помощью') || has('q3', 'Гигиена') || has('q3', 'Туалет') || has('q3', 'Перемещение с кровати в кресло')) { add('I3', 3); add('I4', 3); add('I5', 3); add('I1', 1); }
    if (has('q4', 'Есть, но не понимаю') || has('q4', 'Нет') || has('q4', 'Не знаю')) add('I2', 4);
    if ((cc.a.q5 || []).some(function (x) { return x !== 'Пока не нужно' && x !== 'Не знаю'; })) add('I4', 4);
    if (has('q7', 'Я почти один (одна)') || has('q8', 'Совмещать с работой') || has('q8', 'Недосып и тревога') || has('q8', 'Некому подменить')) { add('I6', 4); add('I7', 4); }
    if (has('q8', 'Не хватает знаний об уходе')) add('I3', 3);
    var m9 = { 'Подготовить выписку': 'I0', 'Организовать наблюдение врача': 'I2', 'Подобрать оборудование': 'I4', 'Помощь на дому': 'I5', 'Научиться уходу': 'I3', 'Найти передышку': 'I7' };
    (cc.a.q9 || []).forEach(function (x) { if (m9[x]) add(m9[x], 5); });
    if (!Object.keys(sc).length) { add('I2', 2); add('I5', 1); add('I3', 1); }
    var order = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; }).filter(function (x) { return x !== 'I7'; });
    var first = order.slice(0, 3), then = order.slice(3, 7);
    ccLast = first.map(function (x) { return [x, 'now']; }).concat(then.map(function (x) { return [x, 'next']; })).concat([['I7', 'now']]);
    var slug = 'uhod-za-tyazhelobolnym', ms = {};
    first.concat(then).forEach(function (id) { stepOf(slug, id).measures.forEach(function (m) { if (m !== 'm-emergency') ms[m] = 1; }); });
    if (has('q6', 'Да, нужные средства указаны') || has('q6', 'Да, но нужных средств нет')) ms['m-tsr'] = 1;
    var row = function (id) { var st = stepOf(slug, id); return '<a class="row" href="#/situations/' + slug + '?step=' + id + '"><span class="row-t"><b>' + esc(st.title) + '</b><small>' + esc(st.when) + '</small></span>' + icon('chevron-right') + '</a>'; };
    var h = '<section class="result"><h2>Вот с чего можно начать</h2><p class="muted">Мы подобрали возможные шаги по вашим ответам. Доступность услуг и мер поддержки зависит от медицинских показаний, документов и региона. Это не подтверждение права на услугу: заявление на каждую услугу подаётся отдельно через официальный канал.</p>';
    if (has('q3', 'Трудно есть или пить')) h += '<p class="note">Сначала обсудите с врачом безопасность еды и питья. Не используйте непроверенные способы кормления.</p>';
    if (cc.unsure) h += '<p class="note">Вы ответили «не уверен(а)» на вопрос об ухудшении. При подозрении на инсульт сразу звоните 103 или 112.</p>';
    h += '<h3 class="h3">В первую очередь</h3><div class="rows">' + first.map(row).join('') + '</div>';
    if (then.length) h += '<h3 class="h3">Затем</h3><div class="rows">' + then.map(row).join('') + '</div>';
    h += '<h3 class="h3">Для вас как ухаживающего</h3><div class="rows">' + row('I7') + (first.concat(then).indexOf('I6') < 0 ? row('I6') : '') + '</div>';
    h += '<h3 class="h3">Какая поддержка может подойти</h3><div class="measures">' + Object.keys(ms).map(function (m) { return measureCard(m); }).join('') + '</div>';
    h += '<h3 class="h3">С кем поговорить</h3><div class="go">' + tel('103', 'При резком ухудшении') + tel('112', 'Экстренные службы') + tel('8-800-700-84-36', 'Фонд «Вера» — если нужна паллиативная помощь') + '<a class="lnk" href="#/consultations">Все консультации' + icon('arrow-right') + '</a></div>';
    h += '<div class="acts"><button type="button" class="btn btn-primary" data-cc="plan">Сохранить в мой план</button><button type="button" class="btn btn-line" data-cc="print">' + icon('printer') + 'Распечатать</button><button type="button" class="btn btn-line" data-cc="read">' + icon('volume-2') + 'Озвучить</button><button type="button" class="btn btn-ghost" data-cc="stop">Остановить</button><button type="button" class="btn btn-ghost" data-cc="restart">Пройти заново</button></div>';
    return h + '<p><a href="#/situations/' + slug + '">Открыть весь маршрут</a></p></section>';
  }

  /* ---------- MY PLAN ---------- */
  function viewPlan() {
    document.title = 'Мой план — Жизненные ситуации';
    var plan = getPlan(), h = '<div class="wrap page narrow">' + crumbs([{ t: 'Мой план' }]) + '<header class="shead"><h1>Мой план</h1><p class="intro">Шаги из разных ситуаций, которые вы сохранили. План хранится только на этом устройстве — без регистрации.</p></header>';
    if (!plan.length) {
      h += '<section class="block"><p>Пока здесь пусто. Откройте маршрут и нажмите «Сохранить в мой план» у нужного шага.</p><div class="rows">' + readySlugs().map(sitRow).join('') + '</div></section>';
    } else {
      h += '<div class="acts"><button type="button" class="btn btn-line" data-pcopy>' + icon('copy') + 'Скопировать текстом</button><button type="button" class="btn btn-line" data-pprint>' + icon('printer') + 'Распечатать</button><button type="button" class="btn btn-line" data-pread>' + icon('volume-2') + 'Озвучить</button><button type="button" class="btn btn-ghost" data-pstop>Остановить</button></div>';
      PRIO.forEach(function (p) {
        var items = plan.filter(function (x) { return x.p === p[0] && stepOf(x.s, x.id); });
        h += '<section class="block"><h2>' + p[1] + '</h2>' + (items.length ? '<div class="rows">' + items.map(function (x) {
          var st = stepOf(x.s, x.id), v = getStatus(x.s, x.id);
          return '<div class="prow"><a href="#/situations/' + x.s + '?step=' + x.id + '"><b>' + esc(st.title) + '</b><small>' + esc(D.situations[x.s].h1) + ' · ' + statusLabel(v) + '</small></a>' +
            '<select aria-label="Когда" data-prio="' + x.s + '|' + x.id + '">' + PRIO.map(function (q) { return '<option value="' + q[0] + '"' + (q[0] === x.p ? ' selected' : '') + '>' + q[1] + '</option>'; }).join('') + '</select>' +
            '<button type="button" class="btn btn-ghost" data-premove="' + x.s + '|' + x.id + '">Убрать</button></div>';
        }).join('') + '</div>' : '<p class="muted-s">Нет шагов.</p>') + '</section>';
      });
      h += '<p><button type="button" class="btn btn-ghost danger" data-pclear>Очистить мой план</button></p>';
    }
    app.innerHTML = h + '</div>';
    app.onchange = function (e) { if (e.target.matches('[data-prio]')) { var k = e.target.getAttribute('data-prio').split('|'), p = getPlan(); p.forEach(function (x) { if (x.s === k[0] && x.id === k[1]) x.p = e.target.value; }); save('plan', p); viewPlan(); icons(); } };
    app.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-premove')) { var k = b.getAttribute('data-premove').split('|'); removePlan(k[0], k[1]); viewPlan(); icons(); }
      if (b.hasAttribute('data-pclear')) { if (confirm('Очистить план, статусы шагов и отметки чек-листов на этом устройстве?')) { ['plan', 'status', 'chk', 'week'].forEach(function (k) { try { localStorage.removeItem('navigator:' + k); } catch (er) { } }); viewPlan(); icons(); toast('План очищен'); } }
      if (b.hasAttribute('data-pcopy')) copy(planText(), 'План скопирован');
      if (b.hasAttribute('data-pprint')) window.print();
      if (b.hasAttribute('data-pread')) speak(planText());
      if (b.hasAttribute('data-pstop')) stopSpeak();
    };
  }
  function planText() {
    var plan = getPlan(), out = 'Мой план\n';
    PRIO.forEach(function (p) { var it = plan.filter(function (x) { return x.p === p[0] && stepOf(x.s, x.id); }); if (it.length) { out += '\n' + p[1] + ':\n'; it.forEach(function (x) { out += '— ' + stepOf(x.s, x.id).title + ' (' + D.situations[x.s].title + ')\n'; }); } });
    return out;
  }

  /* ---------- SUPPORT / CONSULTATIONS / COMMUNITIES ---------- */
  function viewSupport(q) {
    document.title = 'Меры поддержки — Жизненные ситуации';
    var f = q.scenario || '', ids = Object.keys(D.measures).filter(function (k) { return !f || D.measures[k].scenario === f; });
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: 'Меры поддержки' }]) + '<header class="shead"><h1>Меры поддержки</h1><p class="intro">Государственные услуги, региональная помощь, НКО и консультации — рядом. Мы показываем, что может подойти; право на меру подтверждает её владелец.</p></header>' +
      '<div class="chips filter" role="group" aria-label="Ситуация"><a class="chip" href="#/support" aria-pressed="' + (!f) + '">Все</a>' + SCEN.map(function (s) { return '<a class="chip" href="#/support?scenario=' + s[0] + '" aria-pressed="' + (f === s[0]) + '">' + s[1] + '</a>'; }).join('') + '</div>' +
      '<div class="measures">' + ids.map(function (k) { return measureCard(k, q.m === k); }).join('') + '</div>' + trustLine() + '</div>';
  }
  function viewConsultations() {
    document.title = 'Консультации — Жизненные ситуации';
    var groups = [['uhod-za-tyazhelobolnym', 'Уход за близким'], ['smena-professii', 'Работа и профессия'], ['rebenok-v-shkolu', 'Дети и родители'], ['planirovanie-rebenka', 'Планирование ребёнка']];
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: 'Консультации' }]) + '<header class="shead"><h1>Консультации</h1><p class="intro">Куда обратиться, чтобы поговорить со специалистом. В прототипе мы не записываем на приём — показываем реальные каналы.</p></header>' +
      '<section class="block"><h2>Экстренная помощь</h2><div class="go">' + tel('112', 'Единый номер экстренных служб') + tel('103', 'Скорая помощь') + tel('8-800-2000-122', 'Детский телефон доверия') + '</div></section>' +
      groups.map(function (g) { return '<section class="block"><h2>' + g[1] + '</h2><div class="measures">' + D.situations[g[0]].consult.map(function (k) { return measureCard(k); }).join('') + '</div></section>'; }).join('') +
      askBox() + '</div>';
    bindAsk(app);
  }
  function viewCommunities() {
    document.title = 'Сообщества — Жизненные ситуации';
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: 'Сообщества' }]) + '<header class="shead"><h1>Сообщества</h1><p class="intro">Люди с похожим опытом. Мы проектируем три модерируемых пространства — с правилами общения и без передачи медицинских данных. Пока они в разработке, показываем организации, к которым можно обратиться уже сейчас.</p></header>' +
      '<div class="measures">' + D.communities.map(commCard).join('') + '</div>' +
      '<section class="askbox"><h3>Предложить сообщество</h3><p class="muted-s">Знаете проверенную группу поддержки? Опишите её — текст можно скопировать и отправить команде проекта. Отправка с сайта появится в пилоте.</p><textarea id="sugg" rows="3" placeholder="Название, тема, город, ссылка"></textarea><button type="button" class="btn btn-line" data-sugg>Скопировать описание</button></section></div>';
    app.onclick = function (e) { if (e.target.closest('[data-sugg]')) { var v = document.getElementById('sugg').value.trim(); if (!v) { toast('Опишите сообщество'); return; } copy('Предлагаю сообщество для навигатора: ' + v, 'Описание скопировано'); } };
  }

  /* ---------- STORIES ---------- */
  function viewStories() {
    document.title = 'Примеры из жизни — Жизненные ситуации';
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: 'Примеры из жизни' }]) + '<header class="shead"><h1>Примеры из жизни</h1><p class="intro">Иллюстративные сценарии на основе типичных ситуаций из интервью проекта. Это не отзывы реальных людей и не обязательная часть маршрута.</p></header><div class="stories">' + D.stories.map(storyCard).join('') + '</div></div>';
  }
  function viewStory(id) {
    var st = storyById(id); if (!st) return viewNotFound();
    var s = D.situations[st.situation];
    document.title = st.name + ': ' + st.title;
    app.innerHTML = '<div class="wrap page narrow">' + crumbs([{ t: 'Примеры из жизни', href: '#/stories' }, { t: st.name }]) +
      '<header class="shead"><p class="muted">' + esc(st.name) + ', ' + st.age + '</p><h1>' + esc(st.title) + '</h1><p class="muted-s">Иллюстративный сценарий на основе типичных жизненных ситуаций</p></header>' +
      '<section class="block"><h2>Ситуация</h2><p>' + esc(st.before) + '</p></section>' +
      '<section class="block"><h2>Что было нужно</h2><p>' + esc(st.need) + '</p></section>' +
      '<section class="block"><h2>Какие шаги выбраны</h2><p class="muted-s">Не по порядку маршрута, а по тому, что было важно.</p><ol class="path">' + st.steps.map(function (p) { return '<li><a href="#/situations/' + st.situation + '?step=' + p[0] + '"><b>' + esc(stepOf(st.situation, p[0]).title) + '</b></a><span>' + esc(p[1]) + '</span></li>'; }).join('') + '</ol></section>' +
      '<section class="block"><h2>Что удалось решить</h2><p class="result">' + esc(st.result) + '</p></section>' +
      '<div class="cta"><div><b>' + esc(s.h1) + '</b><p class="muted-s">Тот же маршрут — для вашей ситуации, без истории</p></div><a class="btn btn-primary" href="#/situations/' + st.situation + '">Открыть маршрут</a></div></div>';
  }

  /* ---------- SPHERE / SEARCH / BOOK / QR / INFO ---------- */
  function viewSphere(id) {
    var sp = sphereById(id); if (!sp) return viewNotFound();
    document.title = sp.title + ' — Жизненные ситуации';
    app.innerHTML = '<div class="wrap page narrow">' + crumbs([{ t: sp.title }]) + '<header class="shead"><h1>' + esc(sp.title) + '</h1><p class="intro">' + esc(sp.lead) + '</p></header><div class="rows">' + sp.situations.map(sitRow).join('') + '</div></div>';
  }
  function viewSearch(q) {
    document.title = 'Поиск — Жизненные ситуации';
    var r = q ? search(q) : { sit: [], steps: [] };
    var h = '<div class="wrap page narrow">' + crumbs([{ t: 'Поиск' }]) + '<header class="shead"><h1>Что у вас случилось?</h1><p class="intro">Опишите ситуацию своими словами — как рассказали бы другу.</p>' +
      '<div class="search-wrap"><form class="sbox big" role="search"><input type="search" name="q" autocomplete="off" aria-label="Опишите вашу ситуацию" value="' + esc(q) + '" placeholder="Например: маму выписывают после инсульта"><button type="submit" class="sbox-go">Найти</button></form><div class="suggest" hidden></div></div>' +
      '<div class="hero-acts dark"><button type="button" class="hbtn" data-assist-voice>' + icon('mic') + 'Задать голосом</button></div></header>';
    if (q && (r.sit.length || r.steps.length)) {
      if (r.steps.length) h += '<section class="block"><h2>Подходящие шаги</h2><div class="rows">' + r.steps.map(function (x) { return stepRow(x.slug, x.id); }).join('') + '</div></section>';
      if (r.sit.length) h += '<section class="block"><h2>Ситуации</h2><div class="rows">' + r.sit.slice(0, 10).map(function (x) { return sitRow(x.slug); }).join('') + '</div></section>';
    } else if (q) h += '<section class="block"><h2>Точного совпадения нет</h2><p>Попробуйте другими словами или выберите сферу жизни.</p><div class="chips">' + D.spheres.map(function (x) { return '<a class="chip" href="#/sphere/' + x.id + '">' + esc(x.title) + '</a>'; }).join('') + '</div></section>';
    else h += '<section class="block"><h2>Готовые маршруты</h2><div class="rows">' + readySlugs().map(sitRow).join('') + '</div></section>';
    app.innerHTML = h + '</div>';
    bindSuggest(app.querySelector('.sbox'));
  }
  function viewBook() {
    document.title = 'Книга — Путеводитель российской семьи';
    var map = {}; readySlugs().forEach(function (sl) { var p = D.situations[sl].bookRef.part.split(' ')[1]; (map[p] = map[p] || []).push(sl); });
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: 'Книга' }]) + '<header class="shead"><h1>Книга: 12 частей, 84 раздела</h1><p class="intro">Книга открывается не подряд, а по ситуации. В разделах — QR-коды, которые ведут в навигатор. Структура книги и 36 ситуаций навигатора — разные: не каждый раздел книги уже стал маршрутом.</p></header>' +
      '<div class="book">' + D.bookParts.map(function (b) { var l = (map[b.n] || []).map(function (sl) { return '<a href="#/situations/' + sl + '">Раздел ' + D.situations[sl].bookRef.section + ': ' + esc(D.situations[sl].h1) + '</a>'; }).join(''); return '<div class="book-i"><p class="muted-s">Часть ' + b.n + ' · разделы ' + b.range + '</p><b>' + esc(b.title) + '</b>' + (l ? '<div class="links">' + l + '</div>' : '') + '</div>'; }).join('') + '</div></div>';
  }
  function viewQR() {
    document.title = 'QR-коды для книги';
    app.innerHTML = '<div class="wrap page">' + crumbs([{ t: 'QR-коды' }]) + '<header class="shead"><h1>QR-коды для печатной книги</h1><p class="intro">Каждый код открывает нужный маршрут с пометкой «Вы перешли из книги». Коды для новых маршрутов добавляются после экспертной проверки, напечатанные не меняются.</p><div class="acts no-print"><button type="button" class="btn btn-primary" onclick="window.print()">Распечатать</button></div></header>' +
      '<div class="qrgrid">' + readySlugs().map(function (sl) { var s = D.situations[sl]; return '<div class="qritem"><div class="qr" data-qr="' + sl + '"></div><b>Раздел ' + s.bookRef.section + '</b><p>' + esc(s.h1) + '</p></div>'; }).join('') + '</div></div>';
    app.querySelectorAll('[data-qr]').forEach(function (el) { qr(el, baseUrl() + '#/s/' + el.getAttribute('data-qr'), 150); });
  }
  function viewAbout() {
    document.title = 'О проекте — Путеводитель российской семьи';
    app.innerHTML = '<div class="wrap page narrow">' + crumbs([{ t: 'О проекте' }]) + '<header class="shead"><h1>Помощь есть. Дороги к ней нет.</h1><p class="intro">«Путеводитель российской семьи» — книга и онлайн-навигатор. Мы не создаём новые меры, а собираем путь к тем, что уже есть.</p></header>' +
      '<section class="block"><h2>Формула сервиса</h2><p class="formula">Жизненная ситуация → понятный маршрут → действия → меры поддержки → персональное сопровождение</p></section>' +
      '<section class="block"><h2>Принципы</h2><ul class="ul"><li>Человек выбирает ситуацию, а не ведомство.</li><li>Начать можно с любого шага — порядок только подсказка.</li><li>В одном маршруте — медицина, социальная помощь, работа, деньги и поддержка семьи.</li><li>Поддержка нужна не только тому, о ком заботятся, но и тому, кто заботится.</li><li>Честность: мы не обещаем права на услугу и не имитируем заявления.</li></ul></section>' +
      '<section class="block"><h2>Откуда методология</h2><p>Эстония (eesti.ee) — жизненное событие объединяет услуги разных ведомств. Сингапур (LifeSG, AIC) — человеческий язык, опросник подбора помощи и поддержка ухаживающих. Южная Корея (plus.gov.kr) — пошаговые руководства по жизненным ситуациям. Меры поддержки и контакты в навигаторе — российские.</p></section>' +
      '<section class="block"><h2>Это концепт-прототип</h2><p class="muted">Сайт показывает, как раздел «Жизненные ситуации» может работать в Госуслугах. Он не является официальным сервисом и не связан с порталом. Проект «Уверенность в будущем», программа «Код лидера», Группа АБР.</p></section></div>';
  }
  function viewVerification() {
    document.title = 'Как мы проверяем сведения';
    app.innerHTML = '<div class="wrap page narrow">' + crumbs([{ t: 'Как мы проверяем сведения' }]) + '<header class="shead"><h1>Как мы проверяем сведения</h1><p class="intro">Знак доверия должен что-то значить. Поэтому у каждого материала есть понятный статус.</p></header>' +
      '<section class="block"><h2>Этапы проверки</h2><ol class="path"><li><b>Черновик</b><span>Текст написан командой проекта.</span></li><li><b>Источники сверены</b><span>Ссылки и телефоны проверены на официальных сайтах — указана дата.</span></li><li><b>Проверено экспертом</b><span>Врач, юрист, социальный работник, психолог или карьерный консультант проверил содержание. Указываются роль и дата.</span></li><li><b>Опубликовано</b><span>Материал доступен людям и регулярно пересматривается.</span></li></ol></section>' +
      '<section class="block"><h2>Где мы сейчас</h2><p>Ссылки и телефоны во всех маршрутах сверены ' + D.sourceCheckedAt + '. Экспертная проверка содержания — следующий этап пилота. До неё на страницах стоит пометка «' + D.reviewStatus + '».</p></section></div>';
  }
  function viewPrivacy() {
    document.title = 'Конфиденциальность';
    app.innerHTML = '<div class="wrap page narrow">' + crumbs([{ t: 'Конфиденциальность' }]) + '<header class="shead"><h1>Конфиденциальность</h1></header>' +
      '<section class="block"><ul class="ul"><li>Сайт не требует регистрации и не собирает персональные данные.</li><li>Статусы шагов, план и отметки чек-листов хранятся только в вашем браузере.</li><li>Голосовой ввод работает через браузер и только после нажатия кнопки. Мы не сохраняем записи.</li><li>Ответы опросника не отправляются на сервер.</li></ul><p><button type="button" class="btn btn-line" data-clearall>Удалить мои данные с этого устройства</button></p></section></div>';
    app.onclick = function (e) { if (e.target.closest('[data-clearall]')) { ['plan', 'status', 'chk', 'week'].forEach(function (k) { try { localStorage.removeItem('navigator:' + k); } catch (er) { } }); toast('Данные удалены'); } };
  }
  function viewHelp() {
    document.title = 'Контакты помощи';
    app.innerHTML = '<div class="wrap page narrow">' + crumbs([{ t: 'Контакты помощи' }]) + '<header class="shead"><h1>Контакты помощи</h1><p class="intro">Если ситуация угрожает жизни или здоровью — звоните сразу.</p></header>' +
      '<section class="block"><div class="go col">' + tel('112', 'Единый номер экстренных служб') + tel('103', 'Скорая помощь') + tel('8-800-2000-122', 'Детский телефон доверия — для детей и родителей, бесплатно и анонимно') + tel('8-800-700-84-36', 'Горячая линия фонда «Вера» — паллиативная помощь, круглосуточно') + '</div>' + trustLine() + '</section></div>';
  }
  function viewNotFound() {
    app.innerHTML = '<div class="wrap page"><header class="shead"><h1>Такой страницы нет</h1><p class="intro">Начните с главной или поиска.</p><div class="acts"><a class="btn btn-primary" href="#/">Все жизненные ситуации</a><a class="btn btn-line" href="#/search">Поиск</a></div></header></div>';
  }

  /* ---------- ПОМОЩНИК: текст и голос, без изображений ---------- */
  var A = D.assistant, aEl, aLog, aIn, aStatus, rec = null, listening = false;
  function buildAssistant() {
    var w = document.createElement('div'); w.className = 'assist';
    w.innerHTML = '<button type="button" class="assist-open" data-assist aria-label="Открыть помощника">' + icon('message-square') + '<span>Помощник</span></button>' +
      '<section class="assist-panel" role="dialog" aria-modal="false" aria-labelledby="as-t" hidden><header><div><b id="as-t">Помощник</b><span>Текстом или голосом. Не заменяет специалиста.</span></div><button type="button" class="as-x" data-assist-close aria-label="Закрыть помощника">' + icon('x') + '</button></header>' +
      '<div class="as-log" aria-live="polite"></div><p class="as-status" aria-live="assertive" hidden></p>' +
      '<form class="as-in"><label class="sr" for="as-input">Ваш вопрос</label><input id="as-input" type="text" autocomplete="off" placeholder="Например: маму выписывают после инсульта"><button type="button" class="as-mic" data-mic aria-label="Задать голосом">' + icon('mic') + '</button><button type="submit" class="as-send">Отправить</button></form></section>';
    document.body.appendChild(w);
    aEl = w; aLog = w.querySelector('.as-log'); aIn = w.querySelector('#as-input'); aStatus = w.querySelector('.as-status');
    w.querySelector('.as-in').addEventListener('submit', function (e) { e.preventDefault(); var v = aIn.value.trim(); if (!v) return; aIn.value = ''; userSay(v); answer(v); });
    aLog.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-say')) speak(b.closest('.msg').querySelector('.msg-t').innerText);
      if (b.hasAttribute('data-stop')) stopSpeak();
      if (b.hasAttribute('data-ex')) { userSay(b.textContent); answer(b.textContent); }
      if (b.hasAttribute('data-readplan')) speak(planText());
    });
    aLog.addEventListener('click', function (e) { var a = e.target.closest('a[href^="#/"]'); if (a && window.innerWidth <= 600) closeAssistant(); });
  }
  function userSay(t) { var p = document.createElement('div'); p.className = 'msg me'; p.textContent = t; aLog.appendChild(p); aLog.scrollTop = aLog.scrollHeight; }
  function botSay(html, links) {
    var p = document.createElement('div'); p.className = 'msg';
    p.innerHTML = '<div class="msg-t">' + html + '</div>' + (links ? '<div class="msg-l">' + links + '</div>' : '') + '<div class="msg-a"><button type="button" data-say>' + icon('volume-2') + 'Прослушать</button><button type="button" data-stop>Остановить</button></div>';
    aLog.appendChild(p); icons(); aLog.scrollTop = aLog.scrollHeight;
  }
  function openAssistant(voice) {
    var p = aEl.querySelector('.assist-panel');
    if (p.hidden) {
      p.hidden = false; aEl.classList.add('open');
      if (!aLog.children.length) botSay(esc(A.hello), A.examples.map(function (x) { return '<button type="button" class="chip" data-ex>' + esc(x) + '</button>'; }).join(''));
    }
    icons();
    if (voice) startVoice(); else aIn.focus();
  }
  function closeAssistant() { aEl.querySelector('.assist-panel').hidden = true; aEl.classList.remove('open'); stopVoice(); }
  function stepLink(slug, id) { return '<a class="as-link" href="#/situations/' + slug + '?step=' + id + '">' + esc(stepOf(slug, id).title) + '</a>'; }
  function assistantAboutStep(slug, id) {
    var st = stepOf(slug, id);
    botSay('<b>' + esc(st.title) + '</b><br>' + esc(st.act[0]) + (st.note ? '<br><small>' + esc(st.note) + '</small>' : ''),
      (st.go || []).filter(function (g) { return g[0] === 'tel'; }).map(function (g) { return '<a class="as-link" href="' + telHref(g[1]) + '">Позвонить ' + esc(g[1]) + '</a>'; }).join('') + '<a class="as-link" href="#/situations/' + slug + '?tab=support">Меры поддержки</a><a class="as-link" href="#/consultations">Спросить специалиста</a>');
  }
  function answer(text) {
    var t = norm(text);
    if (A.emergencyWords.some(function (w) { return t.indexOf(w) > -1; })) { botSay('<b>' + esc(A.emergency) + '</b>', '<a class="as-link urgent-l" href="tel:103">Позвонить 103</a><a class="as-link urgent-l" href="tel:112">Позвонить 112</a><a class="as-link" href="tel:88002000122">Детский телефон доверия</a>'); return; }
    var slug = ctx.slug && D.situations[ctx.slug] ? ctx.slug : null;
    if (/(прочитай|озвучь|прочти).*(план|чек)/.test(t) || /(мой план)/.test(t)) { var pl = getPlan(); botSay(pl.length ? 'В вашем плане ' + pl.length + ' ' + plural(pl.length, 'шаг', 'шага', 'шагов') + '. Могу прочитать вслух.' : 'В плане пока пусто. Сохраните шаги кнопкой «Сохранить в мой план».', (pl.length ? '<button type="button" class="chip" data-readplan>Прочитать план</button>' : '') + '<a class="as-link" href="#/my-plan">Открыть «Мой план»</a>'); return; }
    if (/(мер|льгот|пособ|выплат|поддержк)/.test(t) && !/(сам|себя|мне тяжело)/.test(t)) { botSay('Покажу меры поддержки. ' + esc(A.limits), '<a class="as-link" href="#/support' + (slug ? '?scenario=' + slug : '') + '">Меры поддержки</a>'); return; }
    if (/(куда позвонить|телефон|номер)/.test(t)) { var ph = slug && D.situations[slug].urgent ? D.situations[slug].urgent.phones : [['112', 'Экстренные службы']]; botSay('Вот номера, которые могут пригодиться. Звонок — только по вашему нажатию.', ph.map(function (p) { return '<a class="as-link" href="' + telHref(p[0]) + '">' + esc(p[0]) + ' — ' + esc(p[1]) + '</a>'; }).join('') + '<a class="as-link" href="#/help">Все контакты помощи</a>'); return; }
    if (/(специалист|консультац|психолог|юрист|поговорить с)/.test(t) && !search(text).sit.length) { botSay('Подскажу, где поговорить с человеком.', '<a class="as-link" href="#/consultations">Консультации</a><a class="as-link" href="#/communities">Люди с похожим опытом</a>'); return; }
    if (/(проще|не понимаю|с чего начать)/.test(t) && slug) { var s0 = D.situations[slug]; botSay('Коротко: выберите то, что важно сейчас. Чаще всего начинают с этих шагов:', s0.steps.slice(0, 3).map(function (x) { return stepLink(slug, x.id); }).join('')); return; }
    var r = search(text);
    if (r.sit.length || r.steps.length) {
      var top = r.sit[0] ? r.sit[0].slug : r.steps[0].slug, html, links = '';
      if (isReady(top)) {
        var s = D.situations[top], st = r.steps.filter(function (x) { return x.slug === top; }).slice(0, 3);
        if (!st.length && s.quick) st = s.quick[0][1].slice(0, 3).map(function (id) { return { slug: top, id: id }; });
        html = 'Похоже на ситуацию «' + esc(s.h1) + '». Можно начать с любого шага — вот подходящие:';
        links = st.map(function (x) { return stepLink(x.slug, x.id); }).join('') + '<a class="as-link" href="#/situations/' + top + '">Весь маршрут</a>' + (top === 'uhod-za-tyazhelobolnym' ? '<a class="as-link" href="#/care-check">Подобрать помощь за 3 минуты</a>' : '');
      } else { html = 'Подходит тема «' + esc(titleOf(top)) + '». Маршрут готовится, но уже есть ориентирующий чек-лист.'; links = '<a class="as-link" href="#/situations/' + top + '">Открыть тему</a><a class="as-link" href="#/consultations">Консультации</a>'; }
      botSay(html, links); return;
    }
    botSay('Не нашёл точного совпадения. Попробуйте описать иначе или выберите сферу жизни.', D.spheres.slice(0, 6).map(function (s) { return '<a class="as-link" href="#/sphere/' + s.id + '">' + esc(s.title) + '</a>'; }).join(''));
  }
  function setStatusText(t) { aStatus.hidden = !t; aStatus.textContent = t || ''; }
  function startVoice() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatusText('Голосовой ввод недоступен в этом браузере. Напишите вопрос текстом.'); aIn.focus(); return; }
    if (listening) { stopVoice(); return; }
    try {
      rec = new SR(); rec.lang = 'ru-RU'; rec.interimResults = true; rec.maxAlternatives = 1;
      rec.onstart = function () { listening = true; aEl.querySelector('[data-mic]').classList.add('on'); setStatusText('Идёт распознавание. Говорите. Нажмите на микрофон, чтобы остановить.'); };
      rec.onresult = function (e) { var s = ''; for (var i = 0; i < e.results.length; i++) s += e.results[i][0].transcript; aIn.value = s; };
      rec.onerror = function (e) { setStatusText(e.error === 'not-allowed' ? 'Доступ к микрофону не разрешён. Можно написать вопрос текстом.' : 'Не удалось распознать речь. Попробуйте ещё раз или напишите текстом.'); };
      rec.onend = function () { listening = false; aEl.querySelector('[data-mic]').classList.remove('on'); if (aIn.value.trim()) setStatusText('Проверьте распознанный текст и нажмите «Отправить».'); aIn.focus(); };
      rec.start();
    } catch (er) { setStatusText('Голосовой ввод недоступен. Напишите вопрос текстом.'); }
  }
  function stopVoice() { if (rec && listening) { try { rec.stop(); } catch (e) { } } }

  /* ---------- router ---------- */
  function parseQuery() {
    var raw = location.hash.replace(/^#/, ''), qi = raw.indexOf('?'), out = {};
    if (qi > -1) raw.slice(qi + 1).split('&').forEach(function (p) { if (!p) return; var kv = p.split('='); out[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); });
    return out;
  }
  function route() {
    var raw = location.hash.replace(/^#/, '') || '/';
    var qi = raw.indexOf('?'), path = qi > -1 ? raw.slice(0, qi) : raw, q = parseQuery();
    var parts = path.split('/').filter(Boolean);
    if (parts[0] === 'istorii') { location.replace('#/stories' + (parts[1] ? '/' + (parts[1] === 'mikhail' ? 'mihail' : parts[1]) : '')); return; }
    document.title = 'Жизненные ситуации — концепт-прототип';
    if (urgentObs) { urgentObs.disconnect(); urgentObs = null; } if (aEl) aEl.classList.remove('hide-fab');
    ctx = { slug: null, step: null }; app.onclick = null; app.onchange = null; app.removeEventListener('change', stubChange);
    stopSpeak();
    if (!parts.length) viewHome();
    else if ((parts[0] === 'situations' || parts[0] === 's') && parts[1]) viewSituation(parts[1], parts[0] === 's', q);
    else if (parts[0] === 'sphere' && parts[1]) viewSphere(parts[1]);
    else if (parts[0] === 'stories' && parts[1]) viewStory(parts[1]);
    else if (parts[0] === 'stories') viewStories();
    else if (parts[0] === 'search') viewSearch(q.q || '');
    else if (parts[0] === 'my-plan') viewPlan();
    else if (parts[0] === 'support') viewSupport(q);
    else if (parts[0] === 'consultations') viewConsultations();
    else if (parts[0] === 'communities') viewCommunities();
    else if (parts[0] === 'care-check') viewCareCheck();
    else if (parts[0] === 'kniga') viewBook();
    else if (parts[0] === 'qr') viewQR();
    else if (parts[0] === 'about') viewAbout();
    else if (parts[0] === 'verification') viewVerification();
    else if (parts[0] === 'privacy') viewPrivacy();
    else if (parts[0] === 'help') viewHelp();
    else viewNotFound();
    icons();
    var tabsEl = app.querySelector('.tabs');
    if (q.tab && tabsEl && !q.m) window.scrollTo(0, tabsEl.getBoundingClientRect().top + window.scrollY - 80);
    else if (!q.step && !q.m) window.scrollTo(0, 0);
    var m = document.querySelector('.mnav'); m.hidden = true; document.querySelector('.burger').setAttribute('aria-expanded', 'false');
    if (aEl && window.innerWidth <= 600) closeAssistant();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toast]'); if (t) { e.preventDefault(); toast(t.getAttribute('data-toast')); return; }
    if (e.target.closest('[data-toast-link]')) { e.preventDefault(); toast('В прототипе работает раздел «Жизненные ситуации»'); return; }
    if (e.target.closest('[data-assist-voice]')) { e.preventDefault(); openAssistant(true); return; }
    if (e.target.closest('[data-assist]')) { e.preventDefault(); if (aEl.classList.contains('open') && e.target.closest('.assist-open')) closeAssistant(); else openAssistant(); return; }
    if (e.target.closest('[data-assist-close]')) { closeAssistant(); return; }
    if (e.target.closest('[data-mic]')) { startVoice(); return; }
    var b = e.target.closest('.burger'); if (b) { var m = document.querySelector('.mnav'); m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden)); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && aEl && aEl.classList.contains('open')) closeAssistant(); });
  window.addEventListener('hashchange', route);
  buildAssistant();
  route();
})();
