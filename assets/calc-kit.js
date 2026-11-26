/* 셈판 — 새 계산기 공용 렌더링 도구
 * 영수증 행·단계별 산출식·판정 배지·모바일 요약 바를 같은 규칙으로 그립니다.
 * 페이지별 계산 로직은 assets/<slug>.js 에 있습니다.
 */
(function () {
  'use strict';

  var S = window.SEM;
  var C = window.LIFECALC;
  var $ = function (id) { return document.getElementById(id); };

  function row(k, v, opt) {
    opt = opt || {};
    return '<div class="row' + (opt.sub ? ' is-sub' : '') + '">' +
      '<span class="k">' + k + '</span><span class="leader"></span>' +
      '<span class="v">' + v + (opt.unit === false ? '' : '<small>원</small>') + '</span></div>';
  }

  function stepsHTML(list) {
    return list.map(function (s, i) {
      return '<li><span class="idx">' + (i + 1) + '</span><div>' +
        '<div class="step-t">' + s.t + '</div>' +
        '<div class="expr">' + s.e + '</div>' +
        (s.w ? '<div class="why">' + s.w + '</div>' : '') +
        '</div></li>';
    }).join('');
  }

  function verdict(text, kind) {
    var box = $('verdict');
    if (!box) return;
    box.className = 'verdict' + (kind ? ' ' + kind : '');
    var t = $('verdict-text');
    if (t) t.innerHTML = text;
    var mark = box.querySelector('.mark');
    if (mark) mark.textContent = kind === 'is-ok' ? '적합' : (kind === 'is-note' ? '참고' : '확인');
  }

  function total(amount, opt) {
    opt = opt || {};
    var el = $('total-amount');
    if (!el) return;
    var neg = amount < 0;
    el.innerHTML = (neg ? '−' : '') + S.comma(Math.abs(amount)) + '<span class="won">' + (opt.unit || '원') + '</span>';
    if (opt.cap != null) {
      var cap = $('total-cap');
      if (cap) cap.textContent = opt.cap;
    }
    if (opt.tag != null) {
      var tag = $('total-tag');
      if (tag) tag.textContent = opt.tag;
    }
    if (opt.sub != null) {
      var sub = $('total-sub');
      if (sub) sub.textContent = opt.sub;
    }
  }

  function mbar(label, value) {
    var l = $('mbar-label');
    var v = $('mbar-v');
    if (l && label != null) l.textContent = label;
    if (v && value != null) v.textContent = value;
  }

  function copy(text) {
    var src = $('copy-src');
    if (src) src.textContent = text;
  }

  function money(id) {
    var el = $(id);
    return el ? S.toNumber(el.value) : 0;
  }

  function pct(id, fallback) {
    var el = $(id);
    var v = parseFloat(String(el ? el.value : '').replace(/[^0-9.]/g, ''));
    if (!isFinite(v) || v < 0) v = fallback;
    return v;
  }

  /* ---------- 소득세 ---------- */

  function taxOf(base) {
    base = Math.max(0, base || 0);
    var br = C.incomeTax.brackets;
    var prev = 0;
    var tax = 0;
    for (var i = 0; i < br.length; i++) {
      var up = br[i].upTo;
      if (base <= up) { tax += (base - prev) * br[i].rate; break; }
      tax += (up - prev) * br[i].rate;
      prev = up;
    }
    return Math.round(tax);
  }

  function marginal(base) {
    base = Math.max(0, base || 0);
    var br = C.incomeTax.brackets;
    for (var i = 0; i < br.length; i++) {
      if (base <= br[i].upTo) return br[i].rate;
    }
    return br[br.length - 1].rate;
  }

  function wageDeduction(salary) {
    salary = Math.max(0, salary || 0);
    var t = C.incomeTax.wageDeduction;
    var prev = 0;
    for (var i = 0; i < t.length; i++) {
      if (salary <= t[i].upTo) {
        var v = t[i].base + (salary - prev) * t[i].rate;
        return Math.round(Math.max(t[i].min, v));
      }
      prev = t[i].upTo;
    }
    return 0;
  }

  function pensionAnnual(salary) {
    var monthly = Math.min(Math.max(salary / 12, C.insurance.pensionFloor), C.insurance.pensionCap);
    return Math.round(monthly * C.insurance.pension * 12);
  }

  /* 근로소득세액공제 간이 추정 (산출세액의 55%, 한도 74만원) */
  function laborCredit(tax) {
    return Math.min(Math.round(tax * 0.55), 740000);
  }

  function salaryBase(salary, dependents, extraDeduction) {
    var ded = (dependents || 0) * C.dependents.basic + (extraDeduction || 0);
    return Math.max(0, salary - wageDeduction(salary) - pensionAnnual(salary) - ded);
  }

  /* ---------- 입력 바인딩 ---------- */

  function bindMoney(ids, onChange) {
    ids.forEach(function (id) {
      if ($(id)) S.bindMoney($(id), onChange);
    });
  }

  function bindSelect(id, onChange) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('change', onChange);
  }

  function bindMode(selector, onChange) {
    var btns = Array.prototype.slice.call(document.querySelectorAll(selector));
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
        var mode = btn.getAttribute('data-mode');
        document.querySelectorAll('[data-pane]').forEach(function (pane) {
          pane.hidden = pane.getAttribute('data-pane') !== mode;
        });
        onChange(mode);
      });
    });
  }

  function bindTabs(selector, attr, onChange) {
    var btns = Array.prototype.slice.call(document.querySelectorAll(selector));
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
        onChange(btn.getAttribute(attr));
      });
    });
  }

  function checked(id) {
    var el = $(id);
    return !!(el && el.checked);
  }

  /* 모바일 하단 바 클릭 연결은 site.js 가 처리합니다. */

  window.KIT = {
    row: row,
    steps: stepsHTML,
    verdict: verdict,
    total: total,
    mbar: mbar,
    copy: copy,
    money: money,
    pct: pct,
    taxOf: taxOf,
    marginal: marginal,
    wageDeduction: wageDeduction,
    pensionAnnual: pensionAnnual,
    laborCredit: laborCredit,
    salaryBase: salaryBase,
    bindMoney: bindMoney,
    bindSelect: bindSelect,
    bindMode: bindMode,
    bindTabs: bindTabs,
    checked: checked,
    $: $
  };
})();
