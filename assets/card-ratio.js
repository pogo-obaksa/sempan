(function () {
  'use strict';

  var C = window.LIFECALC.card;
  var T = window.LIFECALC.incomeTax;
  var S = window.SEM;
  var $ = function (id) { return document.getElementById(id); };

  var state = { kids: 0, rateManual: false };

  var R = C.rates;
  var OVER = C.cultureSalaryLimit;

  /* ---------- 한계세율 ---------- */

  function wageDeduction(salary) {
    if (salary <= 5000000) return salary * 0.7;
    if (salary <= 15000000) return 3500000 + (salary - 5000000) * 0.4;
    if (salary <= 45000000) return 7500000 + (salary - 15000000) * 0.15;
    if (salary <= 100000000) return 12000000 + (salary - 45000000) * 0.05;
    return Math.min(20000000, 14750000 + (salary - 100000000) * 0.02);
  }

  function estimateRate(salary) {
    var base = Math.max(0, salary - wageDeduction(salary) - T.basicDeduction);
    var bracket = T.brackets[T.brackets.length - 1];
    for (var i = 0; i < T.brackets.length; i++) {
      if (base <= T.brackets[i].upTo) { bracket = T.brackets[i]; break; }
    }
    return bracket.rate * (1 + T.localRate);
  }

  function effective(rate) { return rate * (1 + T.localRate); }

  function rateLabel(rate) {
    var pctv = effective(rate) * 100;
    return (Math.round(pctv * 10) / 10).toString().replace(/\.0$/, '') + '%';
  }

  function shortMoney(n) {
    if (n >= 100000000) {
      var v = Math.round(n / 10000000) / 10;
      return (v.toFixed(v % 1 === 0 ? 0 : 1)) + '억';
    }
    return S.comma(n / 10000) + '만';
  }

  function buildRateSelect() {
    var sel = $('tax-rate');
    var prev = 0;
    sel.innerHTML = T.brackets.map(function (b) {
      var range;
      if (b.upTo === Infinity) range = shortMoney(prev) + '원 초과';
      else if (prev === 0) range = shortMoney(b.upTo) + '원 이하';
      else range = shortMoney(prev) + '~' + shortMoney(b.upTo) + '원';
      var opt = '<option value="' + effective(b.rate) + '">' + rateLabel(b.rate) + ' · ' + range + '</option>';
      prev = b.upTo;
      return opt;
    }).join('');
  }

  function syncRateEstimate() {
    if (state.rateManual) return;
    var r = estimateRate(S.toNumber($('salary').value));
    $('tax-rate').value = String(r);
  }

  /* ---------- 계산 ---------- */

  function spendFromInputs() {
    return {
      credit: S.toNumber($('s-credit').value),
      check: S.toNumber($('s-check').value),
      trad: S.toNumber($('s-trad').value),
      transit: S.toNumber($('s-transit').value),
      culture: S.toNumber($('s-culture').value)
    };
  }

  function compute(spend, salary, kids) {
    var over = salary > OVER;
    var cultureRaw = spend.culture || 0;
    var culture = over ? 0 : cultureRaw;
    var creditBase = spend.credit + (over ? cultureRaw : 0);
    var check = spend.check || 0;
    var trad = spend.trad || 0;
    var transit = spend.transit || 0;

    var totalUse = creditBase + check + culture + trad + transit;
    var minUse = salary * C.minimumUseRate;

    var part = {
      credit: creditBase * R.credit,
      check: check * R.check,
      culture: culture * R.culture,
      trad: trad * R.traditional,
      transit: transit * R.transit
    };
    var raw = part.credit + part.check + part.culture + part.trad + part.transit;

    var cut = 0;
    var cutDesc = '';
    if (minUse <= 0) {
      cut = 0;
      cutDesc = '총급여를 입력하면 최저사용금액이 정해집니다.';
    } else if (minUse <= creditBase) {
      cut = minUse * R.credit;
      cutDesc = '신용카드 사용분에서 ' + S.comma(minUse) + '원 × 15%';
    } else if (minUse <= creditBase + check + culture) {
      var rest1 = minUse - creditBase;
      cut = creditBase * R.credit + rest1 * R.check;
      cutDesc = '신용 ' + S.comma(creditBase) + '원 × 15% + 체크·현금 ' + S.comma(rest1) + '원 × 30%';
    } else if (minUse <= totalUse) {
      var rest2 = minUse - creditBase - check - culture;
      cut = creditBase * R.credit + (check + culture) * R.check + rest2 * R.traditional;
      cutDesc = '신용 ' + S.comma(creditBase) + ' × 15% + 체크·현금 ' + S.comma(check + culture) + ' × 30% + 전통시장·대중교통 ' + S.comma(rest2) + ' × 40%';
    } else {
      cut = raw;
      cutDesc = '사용액 전체가 최저사용금액에 미달합니다.';
    }

    var beforeCap = Math.max(0, Math.round(raw - cut));
    var baseLimit = over ? C.baseLimit.over[String(kids)] : C.baseLimit.under[String(kids)];
    var basic = Math.min(beforeCap, baseLimit);
    var priority = trad * R.traditional + transit * R.transit + (over ? 0 : culture * R.culture);
    var extraLimit = over ? C.extraLimit.over : C.extraLimit.under;
    var extra = Math.max(0, Math.min(beforeCap - basic, priority, extraLimit));
    var total = basic + extra;

    return {
      salary: salary, over: over, minUse: minUse, totalUse: totalUse,
      part: part, raw: raw, cut: cut, cutDesc: cutDesc,
      beforeCap: beforeCap, baseLimit: baseLimit, basic: basic,
      priority: priority, extraLimit: extraLimit, extra: extra, total: total,
      culture: culture, creditBase: creditBase
    };
  }

  function extraCheckToFillBase(salary, kids, spend) {
    var base = compute(spend, salary, kids);
    if (base.basic >= base.baseLimit) return 0;
    var lo = 0, hi = 200000000;
    for (var i = 0; i < 50; i++) {
      var mid = (lo + hi) / 2;
      var t = compute({ credit: spend.credit, check: spend.check + mid, trad: spend.trad, transit: spend.transit, culture: spend.culture }, salary, kids);
      if (t.basic >= base.baseLimit - 1) hi = mid; else lo = mid;
    }
    return Math.ceil(hi / 10000) * 10000;
  }

  /* ---------- 렌더 ---------- */

  function row(k, v, opt) {
    opt = opt || {};
    return '<div class="row' + (opt.sub ? ' is-sub' : '') + '">' +
      '<span class="k">' + k + '</span><span class="leader"></span>' +
      '<span class="v">' + v + (opt.unit === false ? '' : '<small>원</small>') + '</span></div>';
  }

  function setVerdict(text, kind) {
    var box = $('verdict');
    box.className = 'verdict' + (kind ? ' ' + kind : '');
    $('verdict-text').innerHTML = text;
    var mark = box.querySelector('.mark');
    if (mark) mark.textContent = kind === 'is-ok' ? '적합' : (kind === 'is-note' ? '참고' : '확인');
  }

  function render() {
    var salary = S.toNumber($('salary').value);
    var kids = state.kids;
    var spend = spendFromInputs();
    var remain = S.toNumber($('s-remain').value);
    var rate = parseFloat($('tax-rate').value) || effective(0.15);

    var d = compute(spend, salary, kids);

    /* 게이지 */
    var pctv = d.minUse > 0 ? d.totalUse / d.minUse * 100 : 0;
    $('gauge-pct').textContent = pctv.toFixed(1).replace(/\.0$/, '') + '%';
    $('gauge-fill').style.width = Math.min(100, Math.max(0, pctv)) + '%';
    $('gauge-zero').textContent = '0원';
    $('gauge-goal').textContent = '기준 ' + S.won(d.minUse);

    /* 명세 행 */
    var rows = row('최저사용금액 (총급여 × 25%)', S.comma(d.minUse)) +
      row('공제대상 사용액 합계', S.comma(d.totalUse)) +
      row('결제수단별 공제율 적용', S.comma(d.raw)) +
      row('최저사용금액 차감', '−' + S.comma(d.cut)) +
      '<div class="dashed" style="margin:6px 0 2px"></div>' +
      row('기본한도 적용', S.comma(d.basic)) +
      row('추가한도 적용', S.comma(d.extra));
    $('report-rows').innerHTML = rows;

    /* 합계 */
    $('total-amount').innerHTML = S.comma(d.total) + '<span class="won">원</span>';
    var mbarV = document.getElementById('mbar-v');
    if (mbarV) mbarV.textContent = S.comma(d.total) + '원';
    var usedPct = d.baseLimit > 0 ? d.basic / d.baseLimit * 100 : 0;
    var remainBase = Math.max(0, d.baseLimit - d.basic);
    $('total-sub').innerHTML = '한계세율 ' + (rate * 100).toFixed(1).replace(/\.0$/, '') + '% 적용 시 절세액 <strong>' + S.won(d.total * rate) + '</strong>' +
      ' · 기본한도 ' + S.won(d.baseLimit) + '의 ' + usedPct.toFixed(1).replace(/\.0$/, '') + '%' +
      (remainBase > 0 ? ' (여지 ' + S.won(remainBase) + ')' : ' — 소진');

    /* 한계세율별 절세액 */
    var common = [0.06, 0.15, 0.24, 0.35];
    $('rate-strip').innerHTML = common.map(function (b) {
      var eff = effective(b);
      var on = Math.abs(eff - rate) < 0.001 ? ' is-on' : '';
      return '<div class="cell' + on + '"><div class="k">' + (eff * 100).toFixed(1).replace(/\.0$/, '') + '%</div>' +
        '<div class="v">' + S.comma(d.total * eff) + '원</div></div>';
    }).join('');

    /* 남은 기간 비교 */
    var withCheck = compute({ credit: spend.credit, check: spend.check + remain, trad: spend.trad, transit: spend.transit, culture: spend.culture }, salary, kids);
    var withCredit = compute({ credit: spend.credit + remain, check: spend.check, trad: spend.trad, transit: spend.transit, culture: spend.culture }, salary, kids);
    var deltaDed = withCheck.total - withCredit.total;
    var deltaTax = deltaDed * rate;
    $('cmp-label').textContent = '추가 지출 ' + S.won(remain);

    function col(title, res, win) {
      return '<div class="col' + (win ? ' is-win' : '') + '">' +
        '<div class="k">' + title + '</div>' +
        '<div class="v">' + S.comma(res.total) + '원</div>' +
        '<div class="d">절세 ' + S.comma(res.total * rate) + '원</div>' +
        '<div class="d">기본한도 ' + (res.basic >= res.baseLimit ? '100%' : Math.round(res.basic / res.baseLimit * 100) + '%') + ' 사용</div>' +
        '</div>';
    }
    $('compare-block').innerHTML = '<div class="compare2">' +
      col('전부 체크·현금영수증', withCheck, deltaDed >= 0) +
      col('전부 신용카드', withCredit, deltaDed < 0) +
      '</div>';

    /* 황금비율 권고 */
    var needCheck = extraCheckToFillBase(salary, kids, spend);
    var msg;
    var kind = 'is-note';

    if (salary <= 0) {
      msg = '총급여를 입력하면 25% 문턱과 공제 한도가 정해집니다.';
    } else if (d.totalUse < d.minUse) {
      msg = '아직 25% 문턱까지 <strong>' + S.won(d.minUse - d.totalUse) + '</strong> 남았습니다. 문턱까지는 어떤 카드로 써도 합산되므로, 남은 지출 ' + S.won(remain) + '으로 문턱을 넘지 못하면 공제는 0원입니다.';
    } else if (d.extra >= d.extraLimit) {
      msg = '기본한도와 추가한도를 모두 채웠습니다. 추가 지출로 늘릴 수 있는 공제가 없으니, 남은 기간은 카드 혜택 기준으로 고르면 됩니다.';
      kind = 'is-ok';
    } else if (d.basic >= d.baseLimit) {
      msg = '기본한도를 채웠습니다. 남은 ' + S.won(remain) + '을 체크카드로 써도 일반 결제는 공제가 늘지 않고, 전통시장·대중교통 지출만 추가한도에 반영됩니다.';
      kind = 'is-ok';
    } else if (needCheck > 0 && needCheck <= remain) {
      msg = '남은 지출 <strong>' + S.won(needCheck) + '</strong>을 체크카드로 쓰면 기본한도(' + S.won(d.baseLimit) + ')를 채웁니다. 그 이상은 신용카드 혜택이 유리합니다.';
      kind = 'is-ok';
    } else if (needCheck > remain) {
      msg = '남은 ' + S.won(remain) + '을 모두 체크카드로 써도 기본한도까지 <strong>' + S.won(needCheck - remain) + '</strong> 부족합니다. 남은 결제는 체크카드로 모으는 편이 낫습니다.';
    } else {
      msg = '현재 조건에서는 남은 지출의 결제수단 차이가 공제액에 영향을 주지 않습니다.';
    }

    if (deltaDed !== 0) {
      msg += ' 같은 금액을 체크카드로 결제하면 신용카드보다 소득공제 <strong>' + S.won(Math.abs(deltaDed)) + '</strong>, 절세액 ' + S.won(Math.abs(deltaTax)) + ' 더 ' + (deltaDed > 0 ? '많습니다' : '적습니다') + '.';
    }
    setVerdict(msg, kind);

    /* 단계 */
    var p = d.part;
    var parts = [];
    if (d.creditBase) parts.push(S.comma(d.creditBase) + ' × 15%');
    if (spend.check) parts.push(S.comma(spend.check) + ' × 30%');
    if (d.culture) parts.push(S.comma(d.culture) + ' × 30%');
    if (spend.trad) parts.push(S.comma(spend.trad) + ' × 40%');
    if (spend.transit) parts.push(S.comma(spend.transit) + ' × 40%');

    var steps = [
      { t: '최저사용금액', e: S.comma(salary) + ' × 25% = <b>' + S.comma(d.minUse) + '원</b>', w: '이 금액까지는 공제가 시작되지 않습니다. 사용액이 이보다 적으면 공제액은 0원입니다.' },
      { t: '공제대상 사용액', e: S.comma(d.creditBase) + ' + ' + S.comma(spend.check) + ' + ' + S.comma(d.culture) + ' + ' + S.comma(spend.trad) + ' + ' + S.comma(spend.transit) + ' = <b>' + S.comma(d.totalUse) + '원</b>', w: d.over ? '총급여 7,000만원 초과 — 문화체육 사용분은 우대공제 대상이 아니어서 신용카드 일반(15%)로 합산했습니다.' : '사용처별로 나눠 각각의 공제율을 적용합니다.' },
      { t: '공제율 적용', e: parts.join(' + ') + ' = <b>' + S.comma(d.raw) + '원</b>', w: '한 사용액에 두 공제율을 겹쳐 적용하지 않습니다.' },
      { t: '최저사용금액 차감', e: '−(' + d.cutDesc + ') = <b>−' + S.comma(d.cut) + '원</b>', w: '차감은 신용카드 → 체크·현금·문화체육 → 전통시장·대중교통 순서로 이뤄집니다.' },
      { t: '기본한도 적용', e: '공제 계산액 ' + S.comma(d.beforeCap) + '원 vs 한도 ' + S.comma(d.baseLimit) + '원 → <b>' + S.comma(d.basic) + '원</b>', w: '총급여 ' + (d.over ? '7,000만원 초과' : '7,000만원 이하') + ' · 자녀 ' + (kids === 2 ? '2명 이상' : kids + '명') + ' 기준 한도입니다.' },
      { t: '추가한도 적용', e: 'min(한도 초과 ' + S.comma(Math.max(0, d.beforeCap - d.baseLimit)) + ', 우대 사용분 ' + S.comma(d.priority) + ', 추가한도 ' + S.comma(d.extraLimit) + ') = <b>' + S.comma(d.extra) + '원</b>', w: '전통시장·대중교통' + (d.over ? '' : '·문화체육') + ' 공제액에만 붙는 한도입니다.' },
      { t: '예상 절세액', e: S.comma(d.total) + ' × ' + (rate * 100).toFixed(1).replace(/\.0$/, '') + '% = <b>' + S.comma(d.total * rate) + '원</b>', w: '한계세율에 지방소득세 10%를 포함한 값입니다. 소득공제액과 환급액은 다릅니다.' }
    ];

    $('steps').innerHTML = steps.map(function (s, i) {
      return '<li><span class="idx">' + (i + 1) + '</span><div><div class="step-t">' + s.t + '</div><div class="expr">' + s.e + '</div>' + (s.w ? '<div class="why">' + s.w + '</div>' : '') + '</div></li>';
    }).join('');

    /* 복사용 요약 */
    $('copy-src').textContent =
      '[카드 소득공제 계산 · 2026년 귀속 · ' + window.LIFECALC.meta.asOfLabel + ' 기준]\n' +
      '총급여 ' + S.won(salary) + ' · 자녀 ' + (kids === 2 ? '2명 이상' : kids + '명') + ' · 한계세율 ' + (rate * 100).toFixed(1) + '%\n' +
      '최저사용금액 ' + S.won(d.minUse) + ' / 공제대상 사용액 ' + S.won(d.totalUse) + '\n' +
      '공제율 적용 ' + S.won(d.raw) + ' − 최저사용 차감 ' + S.won(d.cut) + '\n' +
      '기본한도 ' + S.won(d.baseLimit) + ' · 추가한도 ' + S.won(d.extra) + '\n' +
      '예상 소득공제액 ' + S.won(d.total) + ' (절세 추정 ' + S.won(d.total * rate) + ')\n' +
      '남은 ' + S.won(remain) + ' 체크 기준 ' + S.won(withCheck.total) + ' vs 신용 기준 ' + S.won(withCredit.total) + ' (차이 ' + S.won(deltaDed) + ')';
  }

  /* ---------- 이벤트 ---------- */

  buildRateSelect();
  syncRateEstimate();

  ['s-credit', 's-check', 's-trad', 's-transit', 's-culture', 's-remain'].forEach(function (id) {
    S.bindMoney($(id), render);
  });

  S.bindMoney($('salary'), function () {
    syncRateEstimate();
    var over = S.toNumber($('salary').value) > OVER;
    var culture = $('s-culture');
    culture.disabled = over;
    $('culture-help').textContent = over
      ? '총급여 7,000만원 초과 — 문화체육 우대공제(30%) 대상이 아닙니다. 입력한 금액은 신용카드 일반(15%)로 합산해 계산합니다.'
      : '총급여 7,000만원 이하만 30% 우대공제 대상입니다. 수영장·체력단련장 시설이용료는 2025.7.1 이후 지출분부터 포함됩니다.';
    $('culture-help').className = over ? 'help is-warn' : 'help';
    render();
  });

  $('tax-rate').addEventListener('change', function () {
    state.rateManual = true;
    $('tax-help').textContent = '직접 선택한 한계세율로 절세액을 계산합니다. 실제 과세표준에 따라 달라질 수 있습니다.';
    render();
  });

  document.querySelectorAll('.mini-tabs button[data-kids]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.kids = parseInt(btn.getAttribute('data-kids'), 10) || 0;
      document.querySelectorAll('.mini-tabs button[data-kids]').forEach(function (b) {
        b.setAttribute('aria-selected', String(b === btn));
      });
      render();
    });
  });

  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
