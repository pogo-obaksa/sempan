(function () {
  'use strict';

  var C = window.LIFECALC;
  var nf = new Intl.NumberFormat('ko-KR');

  function toNumber(value) {
    var digits = String(value == null ? '' : value).replace(/[^0-9.-]/g, '');
    var n = parseFloat(digits);
    return isFinite(n) ? n : 0;
  }

  function comma(n) {
    return nf.format(Math.round(n || 0));
  }

  function won(n) {
    return comma(n) + '원';
  }

  /* 238,000,000 → "2억 3,800만원" */
  function korean(n) {
    n = Math.round(n || 0);
    if (n === 0) return '0원';
    var neg = n < 0;
    n = Math.abs(n);
    var eok = Math.floor(n / 100000000);
    var man = Math.floor((n % 100000000) / 10000);
    var rest = n % 10000;
    var out = [];
    if (eok) out.push(eok + '억');
    if (man) out.push(nf.format(man) + '만');
    if (rest) out.push(nf.format(rest));
    return (neg ? '−' : '') + out.join('\u00A0') + '원';
  }

  function pct(n, digits) {
    var d = typeof digits === 'number' ? digits : 2;
    var v = (n || 0).toFixed(d);
    return v.replace(/\.?0+$/, '') + '%';
  }

  /* 통화 입력: 숫자만 남기고 천 단위 구분 */
  function bindMoney(input, onChange) {
    if (!input) return;
    input.addEventListener('input', function () {
      var caretEnd = input.selectionStart === input.value.length;
      var raw = toNumber(input.value);
      input.value = input.value.trim() === '' ? '' : comma(raw);
      if (caretEnd) {
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
      }
      if (onChange) onChange(raw);
    });
    input.addEventListener('focus', function () {
      if (input.value === '0') input.select();
    });
  }

  function copyText(text, button) {
    var done = function (ok) {
      if (!button) return;
      var original = button.getAttribute('data-label') || button.textContent;
      button.setAttribute('data-label', original);
      button.textContent = ok ? '복사됨' : '복사 실패';
      window.setTimeout(function () { button.textContent = original; }, 1600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    done(ok);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  window.SEM = {
    toNumber: toNumber,
    comma: comma,
    won: won,
    korean: korean,
    pct: pct,
    bindMoney: bindMoney,
    copyText: copyText,
    esc: esc,
    constants: C
  };

  /* 기준일 표기 */
  document.querySelectorAll('[data-asof]').forEach(function (el) {
    el.textContent = C.meta.asOfLabel;
  });

  /* 홈 계산기 필터 */
  var filters = document.querySelectorAll('.filter[data-filter]');
  var rows = document.querySelectorAll('.calc-row[data-cat]');
  if (filters.length && rows.length) {
    var applyFilter = function (key, btn) {
      filters.forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
      rows.forEach(function (row) {
        var show = key === 'all' || row.getAttribute('data-cat') === key;
        row.hidden = !show;
      });
      var live = document.getElementById('filter-status');
      if (live) {
        var visible = document.querySelectorAll('.calc-row[data-cat]:not([hidden])').length;
        live.textContent = btn.textContent.replace(/\s+/g, ' ').trim() + ' ' + visible + '종 표시';
      }
    };
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.getAttribute('data-filter'), btn);
      });
    });

    /* 상단 내비게이션의 카테고리 링크(#f-tax 등)로 들어온 경우 해당 필터를 켭니다. */
    var applyHash = function () {
      var m = /^#f-([a-z]+)$/.exec(window.location.hash || '');
      if (!m) return;
      var target = document.querySelector('.filter[data-filter="' + m[1] + '"]');
      if (target) applyFilter(m[1], target);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
  }

  /* 모바일 하단 고정 요약 바 — 클릭하면 결과 명세서로 이동 */
  var mbar = document.getElementById('mbar');
  if (mbar && !document.getElementById('total-amount')) {
    mbar.remove();
    mbar = null;
  }
  if (mbar) {
    document.body.classList.add('has-mbar');
    var go = mbar.querySelector('.mbar-go');
    var target = mbar.getAttribute('data-target') || '.total';
    if (go) {
      go.addEventListener('click', function () {
        var el = document.querySelector(target);
        if (!el) return;
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        catch (e) { el.scrollIntoView(); }
      });
    }
  }

  /* 복사 버튼 */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = document.getElementById(btn.getAttribute('data-copy'));
      if (!src) return;
      copyText(src.textContent.replace(/\s+\n/g, '\n').trim(), btn);
    });
  });

  /* ---------- 입력값 자동 이어받기 ----------
   * 입력란에 data-carry="deposit" 처럼 공통 필드명을 달아 두면
   * 연관 계산기 카드로 이동할 때 그 값을 ?deposit=300000000 형태로 넘기고,
   * 대상 페이지는 같은 data-carry 필드에 값을 채운 뒤 즉시 다시 계산합니다.
   */
  var CARRY_KIND = {
    deposit: 'money', deposit2: 'money', jeonse: 'money', monthly: 'money', rent: 'money',
    price: 'money', loan: 'money', salary: 'money', salary2: 'money', wage: 'money',
    income: 'money', asset: 'money', bonus: 'money', principal: 'money', hourly: 'money',
    rate: 'num', hours: 'num', hours2: 'num', years: 'num', grace: 'num',
    dependents: 'num', kids: 'num', days: 'num', order: 'num', region: 'text', loanType: 'text'
  };
  var CARRY_ORDER = ['deposit', 'deposit2', 'jeonse', 'price', 'monthly', 'rent', 'loan', 'principal',
    'salary', 'salary2', 'wage', 'hourly', 'income', 'asset', 'bonus', 'rate', 'hours', 'hours2', 'years',
    'grace', 'dependents', 'kids', 'days', 'order', 'region', 'loanType'];

  function carryFields() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-carry]'));
  }

  function carrySnapshot() {
    var seen = {};
    var out = [];
    carryFields().forEach(function (el) {
      var key = el.getAttribute('data-carry');
      if (!key || seen[key] || CARRY_KIND[key] == null) return;
      var value = '';
      if (el.type === 'checkbox') {
        if (!el.checked) return;
        value = '1';
      } else {
        value = String(el.value == null ? '' : el.value).trim();
        if (!value || value === '0' || toNumber(value) === 0 && CARRY_KIND[key] !== 'text') return;
        if (CARRY_KIND[key] === 'money' || CARRY_KIND[key] === 'num') value = String(toNumber(value));
      }
      seen[key] = true;
      out.push([key, value]);
    });
    return out;
  }

  function refreshCarryLinks() {
    var pairs = carrySnapshot();
    var qs = pairs.map(function (p) {
      return encodeURIComponent(p[0]) + '=' + encodeURIComponent(p[1]);
    }).join('&');
    document.querySelectorAll('a.related-card').forEach(function (a) {
      var href = a.getAttribute('data-href') || a.getAttribute('href') || '';
      if (!href) return;
      a.setAttribute('data-href', href);
      var base = href.split('#')[0];
      a.setAttribute('href', qs ? base + (base.indexOf('?') >= 0 ? '&' : '?') + qs : href);
    });
  }

  function applyCarryFromQuery() {
    var query = window.location.search || '';
    if (query.length < 2) return;
    var params = {};
    query.replace(/^\?/, '').split('&').forEach(function (part) {
      if (!part) return;
      var i = part.indexOf('=');
      var k = decodeURIComponent(i < 0 ? part : part.slice(0, i));
      var v = i < 0 ? '' : decodeURIComponent(part.slice(i + 1).replace(/\+/g, ' '));
      if (k) params[k] = v;
    });
    var applied = [];
    carryFields().forEach(function (el) {
      var key = el.getAttribute('data-carry');
      if (!key || !Object.prototype.hasOwnProperty.call(params, key)) return;
      var raw = params[key];
      if (el.type === 'checkbox') {
        el.checked = raw === '1' || raw === 'true';
      } else if (el.tagName === 'SELECT') {
        var match = Array.prototype.some.call(el.options, function (o) { return o.value === raw; });
        if (!match) return;
        el.value = raw;
      } else if (CARRY_KIND[key] === 'money') {
        var amount = toNumber(raw);
        if (!String(raw).trim() || amount <= 0) return;
        el.value = comma(amount);
      } else if (CARRY_KIND[key] === 'num') {
        var digits = String(raw).replace(/[^0-9.]/g, '');
        if (!digits || !isFinite(parseFloat(digits))) return;
        el.value = digits;
      } else {
        el.value = String(raw).slice(0, 40);
      }
      applied.push(key);
    });
    if (!applied.length) return;
    window.SEM.carried = applied;
    var panel = document.querySelector('.panel');
    if (!panel) return;
    var note = document.createElement('p');
    note.className = 'carry-note';
    note.setAttribute('role', 'status');
    note.innerHTML = '<span class="carry-tag">이어받음</span> 앞 계산의 ' + applied.length +
      '개 입력값을 그대로 채웠습니다. <a href="' + window.location.pathname + '">초기값으로</a>';
    var head = panel.querySelector('.panel-head');
    if (head && head.nextSibling) panel.insertBefore(note, head.nextSibling);
    else panel.insertBefore(note, panel.firstChild);
  }

  applyCarryFromQuery();
  if (document.querySelector('a.related-card') && carryFields().length) {
    refreshCarryLinks();
    document.addEventListener('input', refreshCarryLinks, true);
    document.addEventListener('change', refreshCarryLinks, true);
  }

  /* 원클릭 예시 프리셋 — 버튼 하나로 입력값을 채우고 다시 계산합니다. */
  var presetBtns = Array.prototype.slice.call(document.querySelectorAll('[data-preset]'));
  var fire = function (el, type) {
    el.dispatchEvent(new Event(type, { bubbles: true }));
  };
  presetBtns.forEach(function (btn) {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      var map;
      try { map = JSON.parse(btn.getAttribute('data-preset') || '{}'); } catch (e) { return; }

      var tab = btn.getAttribute('data-preset-tab');
      if (tab) {
        var tabEl = document.querySelector(tab);
        if (tabEl) tabEl.click();
      }

      var clicks = btn.getAttribute('data-preset-click');
      if (clicks) {
        clicks.split('|').forEach(function (sel) {
          var el = document.querySelector(sel.trim());
          if (el) el.click();
        });
      }

      Object.keys(map).forEach(function (sel) {
        var el = document.querySelector(sel);
        if (!el) return;
        if (el.type === 'checkbox') {
          el.checked = !!map[sel];
          fire(el, 'change');
        } else if (el.tagName === 'SELECT') {
          el.value = String(map[sel]);
          fire(el, 'change');
        } else {
          var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          setter.call(el, String(map[sel]));
          fire(el, 'input');
          fire(el, 'change');
        }
      });

      presetBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
    });
  });
})();
