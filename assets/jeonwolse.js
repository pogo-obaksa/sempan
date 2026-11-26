(function () {
  'use strict';

  var L = window.LIFECALC.lease;
  var S = window.SEM;
  var $ = function (id) { return document.getElementById(id); };

  var LEGAL = Math.min(L.baseRate + L.statutoryAdd, L.absoluteCap); // 5.25

  var state = { mode: 'toMonthly' };

  var TITLES = {
    toMonthly: '산출 명세서 · 전세 → 반전세',
    toJeonse: '산출 명세서 · 반전세 → 전세',
    renew: '산출 명세서 · 갱신 5% 상한'
  };

  var TOTAL_CAPS = {
    toMonthly: ['법정 상한 월세', '연 ' + LEGAL + '% 기준'],
    toJeonse: ['전세 환산 보증금', '연 ' + LEGAL + '% 기준'],
    renew: ['갱신 시 월세 상한', '각각 5% · 합산 5% 기준']
  };

  function val(id) { return S.toNumber($(id).value); }

  function marketRate() {
    var v = parseFloat(String($('market-rate').value).replace(/[^0-9.]/g, ''));
    if (!isFinite(v) || v <= 0) v = L.marketRate;
    return Math.min(v, 30);
  }

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

  function stepsHTML(list) {
    return list.map(function (s, i) {
      return '<li><span class="idx">' + (i + 1) + '</span><div>' +
        '<div class="step-t">' + s.t + '</div>' +
        '<div class="expr">' + s.e + '</div>' +
        (s.w ? '<div class="why">' + s.w + '</div>' : '') +
        '</div></li>';
    }).join('');
  }

  function render() {
    var market = marketRate();
    var rows = '';
    var total = 0;
    var sub = '';
    var steps = [];
    var copy = '';

    if (state.mode === 'toMonthly') {
      var jeonse = val('a-jeonse');
      var dep = val('a-deposit');
      var diff = Math.max(0, jeonse - dep);
      var annualLegal = diff * LEGAL / 100;
      var monthlyLegal = Math.round(annualLegal / 12);
      var monthlyMarket = Math.round(diff * market / 100 / 12);
      var annualDelta = Math.round(diff * (market - LEGAL) / 100);
      var monthlyDelta = Math.round(annualDelta / 12);

      rows = row('전세보증금', S.comma(jeonse)) +
        row('반전세 보증금', S.comma(dep)) +
        '<div class="dashed" style="margin:0 0 4px"></div>' +
        row('전환대상 보증금', S.comma(diff)) +
        row('적용 전환율', LEGAL + '<small>%</small>', { unit: false }) +
        row('연 환산 이자', S.comma(annualLegal));

      total = monthlyLegal;
      sub = '연 ' + S.won(annualLegal) + ' ÷ 12 · 전환대상 ' + S.korean(diff) + ' 기준';

      steps = [
        { t: '법정 전환율 확인', e: 'min(' + L.baseRate + '% + ' + L.statutoryAdd.toFixed(1) + '%p, ' + L.absoluteCap + '%) = <b>' + LEGAL + '%</b>', w: '주택임대차보호법 §7의2 · 시행령 §9조. 기준금리에 가산 이율을 더한 값과 연 10% 중 낮은 비율을 씁니다.' },
        { t: '전환대상 보증금', e: S.comma(jeonse) + ' − ' + S.comma(dep) + ' = <b>' + S.comma(diff) + '원</b>', w: '전세보증금 전액이 아니라, 반전세로 돌리며 돌려받는 차액에만 전환율을 적용합니다.' },
        { t: '연 이자 상당액', e: S.comma(diff) + ' × ' + LEGAL + '% = <b>' + S.comma(annualLegal) + '원</b>' },
        { t: '월세 환산', e: S.comma(annualLegal) + ' ÷ 12 = <b>' + S.comma(monthlyLegal) + '원</b>', w: '원 단위 반올림. 이 금액이 법이 허용하는 월세의 상한입니다.' },
        { t: '시장 전환율 비교', e: S.comma(diff) + ' × ' + market + '% ÷ 12 = <b>' + S.comma(monthlyMarket) + '원</b>', w: '법정 상한과의 차액: 월 ' + S.comma(monthlyDelta) + '원 · 연 ' + S.comma(annualDelta) + '원' }
      ];

      if (dep >= jeonse) {
        setVerdict('반전세 보증금이 전세보증금과 같거나 커서 월세로 전환할 금액이 없습니다. 두 보증금을 확인하세요.', 'is-note');
      } else if (monthlyMarket > monthlyLegal) {
        setVerdict('시장 전환율 ' + market + '%로 계산하면 월 ' + S.won(monthlyMarket) + '입니다. 법정 상한보다 월 <strong>' + S.comma(monthlyDelta) + '원</strong>(연 ' + S.won(annualDelta) + ') 높습니다. 법정 상한을 넘는 요구는 효력이 없습니다.');
      } else {
        setVerdict('입력한 시장 전환율 ' + market + '% 기준 월세는 ' + S.won(monthlyMarket) + '으로, 법정 상한 이내입니다.', 'is-ok');
      }

      copy = '[전월세 전환율 계산 · ' + window.LIFECALC.meta.asOfLabel + ' 기준]\n' +
        '전세보증금 ' + S.won(jeonse) + ' → 반전세보증금 ' + S.won(dep) + '\n' +
        '전환대상 ' + S.won(diff) + ' × 법정 전환율 ' + LEGAL + '% ÷ 12\n' +
        '법정 상한 월세 ' + S.won(monthlyLegal) + ' (연 ' + S.won(annualLegal) + ')\n' +
        '시장 ' + market + '% 기준 월세 ' + S.won(monthlyMarket);

    } else if (state.mode === 'toJeonse') {
      var bDep = val('b-deposit');
      var bMon = val('b-monthly');
      var annualRent = bMon * 12;
      var converted = annualRent / (LEGAL / 100);
      var equiv = Math.round(bDep + converted);
      var convertedMarket = annualRent / (market / 100);
      var equivMarket = Math.round(bDep + convertedMarket);

      rows = row('반전세 보증금', S.comma(bDep)) +
        row('월세 × 12 (연 월세)', S.comma(annualRent)) +
        row('적용 전환율', LEGAL + '<small>%</small>', { unit: false }) +
        '<div class="dashed" style="margin:0 0 4px"></div>' +
        row('월세의 전세 환산액', S.comma(converted)) +
        row('환산 배수', (12 / (LEGAL / 100)).toFixed(2) + '<small>배</small>', { unit: false });

      total = equiv;
      sub = '보증금 ' + S.korean(bDep) + ' + 월세 환산 ' + S.korean(converted);

      steps = [
        { t: '법정 전환율 확인', e: 'min(' + L.baseRate + '% + ' + L.statutoryAdd.toFixed(1) + '%p, ' + L.absoluteCap + '%) = <b>' + LEGAL + '%</b>', w: '전환율이 낮을수록 월세가 전세보증금으로 크게 환산됩니다.' },
        { t: '월세를 연 단위로', e: S.comma(bMon) + ' × 12 = <b>' + S.comma(annualRent) + '원</b>' },
        { t: '전환율로 나누기', e: S.comma(annualRent) + ' ÷ ' + LEGAL + '% = <b>' + S.comma(converted) + '원</b>', w: '연 월세를 전환율로 나눈 값이 월세에 해당하는 보증금입니다.' },
        { t: '보증금과 합산', e: S.comma(bDep) + ' + ' + S.comma(converted) + ' = <b>' + S.comma(equiv) + '원</b>' },
        { t: '시장 전환율 비교', e: S.comma(annualRent) + ' ÷ ' + market + '% = <b>' + S.comma(convertedMarket) + '원</b>', w: '환산보증금 ' + S.won(equivMarket) + ' — 법정 기준과 ' + S.won(equiv - equivMarket) + ' 차이' }
      ];

      if (bMon <= 0 || bDep <= 0) {
        setVerdict('보증금과 월세를 입력하면 환산 전세보증금이 계산됩니다.', 'is-note');
      } else if (equiv > equivMarket) {
        setVerdict('법정 전환율 기준 환산보증금은 <strong>' + S.won(equiv) + '</strong>입니다. 시장 전환율 ' + market + '%로 환산한 ' + S.won(equivMarket) + '보다 ' + S.won(equiv - equivMarket) + ' 높게 산정됩니다.', 'is-note');
      } else {
        setVerdict('법정 전환율 기준 환산보증금은 <strong>' + S.won(equiv) + '</strong>입니다. 시장 전환율 ' + market + '% 기준보다 낮게 산정됩니다.', 'is-note');
      }

      copy = '[반전세 → 전세 환산 · ' + window.LIFECALC.meta.asOfLabel + ' 기준]\n' +
        '보증금 ' + S.won(bDep) + ' · 월세 ' + S.won(bMon) + '\n' +
        '월세 × 12 ÷ ' + LEGAL + '% = ' + S.won(converted) + '\n' +
        '전세 환산 보증금 ' + S.won(equiv) + ' (시장 ' + market + '% 기준 ' + S.won(equivMarket) + ')';

    } else {
      var B0 = val('c-deposit');
      var M0 = val('c-monthly');
      var B1 = val('c-newdeposit');
      var capDep = Math.round(B0 * (1 + L.renewalCapRate));
      var capMonSimple = Math.round(M0 * (1 + L.renewalCapRate));
      var totalValue = B0 + M0 * 12 / (LEGAL / 100);
      var allowed = totalValue * L.renewalCapRate;
      var incDep = Math.max(0, B1 - B0);
      var remain = allowed - incDep;
      var capByTotal = M0 + Math.max(0, remain) * (LEGAL / 100) / 12;
      var capMon = Math.min(capMonSimple, Math.max(M0, Math.round(capByTotal)));
      var incMon = capMon - M0;
      var rateShown = M0 > 0 ? (incMon / M0 * 100) : 0;

      rows = row('현재 보증금', S.comma(B0)) +
        row('현재 월세', S.comma(M0)) +
        '<div class="dashed" style="margin:0 0 4px"></div>' +
        row('보증금 5% 상한', S.comma(capDep)) +
        row('월세 5% 상한', S.comma(capMonSimple)) +
        row('갱신 후 보증금 증액분', S.comma(incDep)) +
        row('증액 허용 총액 (환산 5%)', S.comma(allowed));

      total = capMon;
      sub = '현재 ' + S.won(M0) + ' → ' + S.won(capMon) + ' (' + rateShown.toFixed(1) + '% 증액) · 연 부담 ' + (incMon >= 0 ? '+' : '−') + S.won(Math.abs(incMon) * 12);

      steps = [
        { t: '법정 전환율 확인', e: 'min(' + L.baseRate + '% + ' + L.statutoryAdd.toFixed(1) + '%p, ' + L.absoluteCap + '%) = <b>' + LEGAL + '%</b>', w: '보증금 인상분을 월세로 환산할 때 쓰는 비율입니다.' },
        { t: '보증금 5% 상한', e: S.comma(B0) + ' × 1.05 = <b>' + S.comma(capDep) + '원</b>', w: '갱신 후 보증금은 이 금액을 넘을 수 없습니다.' },
        { t: '월세 5% 상한', e: S.comma(M0) + ' × 1.05 = <b>' + S.comma(capMonSimple) + '원</b>' },
        { t: '환산 기준액과 증액 허용 총액', e: S.comma(B0) + ' + ' + S.comma(M0) + ' × 12 ÷ ' + LEGAL + '% = ' + S.comma(totalValue) + '원 → × 5% = <b>' + S.comma(allowed) + '원</b>', w: '보증금 증액분과 월세 증액분을 합쳐 이 금액을 넘을 수 없습니다.' },
        { t: '보증금 증액 반영 후 월세 상한', e: '월세 ' + S.comma(M0) + ' + (' + S.comma(allowed) + ' − ' + S.comma(incDep) + ') × ' + LEGAL + '% ÷ 12 = ' + S.comma(Math.max(M0, Math.round(capByTotal))) + '원 → 5% 상한과 비교해 <b>' + S.comma(capMon) + '원</b>' }
      ];

      if (B1 > capDep) {
        setVerdict('갱신 후 보증금 ' + S.won(B1) + '이 5% 상한(' + S.won(capDep) + ')을 넘습니다. 보증금과 월세를 합쳐 5%를 초과하는 증액은 효력이 없습니다.');
      } else if (incDep > allowed) {
        setVerdict('보증금 증액분 ' + S.won(incDep) + '이 환산 기준 증액 허용 총액(' + S.won(allowed) + ')을 넘습니다. 이 경우 월세는 올릴 수 없습니다.');
      } else if (incDep > 0) {
        setVerdict('보증금을 ' + S.won(incDep) + ' 올린 경우 월세는 최대 ' + S.won(incMon) + '까지 인상할 수 있습니다. 두 항목을 합쳐 5%를 넘지 않아야 합니다.', 'is-note');
      } else if (B1 < B0) {
        setVerdict('보증금을 낮추는 것은 증액이 아니지만, 월세 인상은 5%(최대 ' + S.won(incMon) + ')까지만 인정됩니다.', 'is-note');
      } else {
        setVerdict('보증금을 그대로 두면 월세는 5%, 최대 <strong>' + S.comma(incMon) + '원</strong>까지 오를 수 있습니다. 협의로 정한 인상률이 5%를 넘으면 초과분은 효력이 없습니다.', 'is-ok');
      }

      copy = '[계약갱신 5% 상한 · ' + window.LIFECALC.meta.asOfLabel + ' 기준]\n' +
        '현재 보증금 ' + S.won(B0) + ' · 월세 ' + S.won(M0) + '\n' +
        '갱신 후 보증금 ' + S.won(B1) + '\n' +
        '보증금 상한 ' + S.won(capDep) + ' · 월세 상한 ' + S.won(capMon) + '\n' +
        '증액 허용 총액(환산 5%) ' + S.won(allowed);
    }

    $('report-title').textContent = TITLES[state.mode];
    $('total-cap').textContent = TOTAL_CAPS[state.mode][0];
    $('total-tag').textContent = TOTAL_CAPS[state.mode][1];
    $('total-amount').innerHTML = S.comma(total) + '<span class="won">원</span>';
    $('total-sub').textContent = sub;
    $('report-rows').innerHTML = rows;
    $('steps').innerHTML = stepsHTML(steps);
    $('copy-src').textContent = copy;

    var mbarV = document.getElementById('mbar-v');
    if (mbarV) mbarV.textContent = S.comma(total) + '원';
    var mbarL = document.getElementById('mbar-label');
    if (mbarL) mbarL.textContent = TOTAL_CAPS[state.mode][0];

    renderCompare(market);
  }

  function renderCompare(market) {
    var per = 100000000;
    function line(name, rate, basis, key) {
      var m = Math.round(per * rate / 100 / 12);
      var y = Math.round(per * rate / 100);
      return '<tr' + (key ? ' class="is-key"' : '') + '>' +
        '<td>' + name + '</td>' +
        '<td class="num">' + rate + '%</td>' +
        '<td class="num">' + S.comma(m) + '원</td>' +
        '<td class="num">' + S.comma(y) + '원</td>' +
        '<td>' + basis + '</td></tr>';
    }
    $('compare-body').innerHTML =
      line('법정 상한', LEGAL, '기준금리 ' + L.baseRate + '% + 2.0%p', true) +
      line('시장 전환율<span class="small">직접 입력</span>', market, '입력값 · 기본 6.5%') +
      line('금융기관 심사 참고<span class="small">HF · HUG</span>', L.loanReviewRate, '전세자금대출 심사 시 적용');

    var note = $('compare-note');
    if (note) {
      note.textContent = (Math.abs(market - L.loanReviewRate) < 0.001
        ? '입력한 시장 전환율이 HF·HUG 전세자금대출 심사 참고치(' + L.loanReviewRate + '%)와 같습니다. '
        : '') +
        '금융기관 심사 기준은 상품·기관 고시에 따라 달라지며, 대출 심사에는 시세·담보·보증 조건이 함께 반영됩니다.';
    }
  }

  /* 모드 전환 */
  document.querySelectorAll('.segmented button[data-mode]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.mode = btn.getAttribute('data-mode');
      document.querySelectorAll('.segmented button[data-mode]').forEach(function (b) {
        b.setAttribute('aria-selected', String(b === btn));
      });
      ['toMonthly', 'toJeonse', 'renew'].forEach(function (m) {
        $('pane-' + m).hidden = m !== state.mode;
      });
      render();
    });
  });

  /* 금액 입력 */
  ['a-jeonse', 'a-deposit', 'b-deposit', 'b-monthly', 'c-deposit', 'c-monthly', 'c-newdeposit'].forEach(function (id) {
    S.bindMoney($(id), render);
  });

  /* 전환율 입력 (소수 허용) */
  $('market-rate').addEventListener('input', function () {
    var cleaned = this.value.replace(/[^0-9.]/g, '');
    var parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    this.value = cleaned;
    render();
  });

  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
