(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;

  function num(id) {
    var n = parseFloat(String($(id).value || '').replace(/[^0-9.]/g, ''));
    return isFinite(n) ? n : 0;
  }

  function simulate(kind, P, i, months, graceMonths) {
    var repayMonths = Math.max(1, months - graceMonths);
    var eqPay = i > 0
      ? P * i / (1 - Math.pow(1 + i, -repayMonths))
      : P / repayMonths;
    var principalPer = P / repayMonths;
    var bal = P;
    var total = 0;
    var paid = 0;
    var sumInterest = 0;
    var first = 0;
    var last = 0;
    var rows = [];

    for (var m = 1; m <= months; m++) {
      var interest = bal * i;
      var principal = 0;
      if (m > graceMonths) {
        if (kind === 'ep') principal = eqPay - interest;
        else if (kind === 'pr') principal = principalPer;
        else principal = (m === months) ? bal : 0;
      }
      if (principal > bal) principal = bal;
      if (principal < 0) principal = 0;
      var pay = principal + interest;
      bal = Math.max(0, bal - principal);
      total += pay;
      paid += principal;
      sumInterest += interest;
      if (m === 1) first = pay;
      if (m === months) last = pay;
      rows.push({ month: m, pay: pay, interest: interest, bal: bal });
    }

    return {
      total: total,
      interest: sumInterest,
      first: first,
      last: last,
      rows: rows
    };
  }

  function render() {
    var P = K.money('l-principal');
    var rate = Math.min(30, Math.max(0, num('l-rate')));
    var years = Math.max(1, Math.min(50, Math.round(num('l-years'))));
    var graceYears = Math.max(0, Math.min(years - 1, Math.round(num('l-grace'))));
    var months = years * 12;
    var graceMonths = graceYears * 12;
    var i = rate / 100 / 12;

    var ep = simulate('ep', P, i, months, graceMonths);
    var pr = simulate('pr', P, i, months, graceMonths);
    var bl = simulate('bl', P, i, months, graceMonths);

    var savePr = ep.interest - pr.interest;
    var moreBl = bl.interest - ep.interest;

    var rows = K.row('원리금균등 첫 달', S.comma(Math.round(ep.first)));
    rows += K.row('원리금균등 마지막 달', S.comma(Math.round(ep.last)), { sub: true });
    rows += K.row('원리금균등 총이자', S.comma(ep.interest));
    rows += '<div class="dashed" style="margin:6px 0"></div>';
    rows += K.row('원금균등 첫 달', S.comma(Math.round(pr.first)));
    rows += K.row('원금균등 마지막 달', S.comma(Math.round(pr.last)), { sub: true });
    rows += K.row('원금균등 총이자', S.comma(pr.interest));
    rows += '<div class="dashed" style="margin:6px 0"></div>';
    rows += K.row('만기일시 첫 달', S.comma(Math.round(bl.first)));
    rows += K.row('만기일시 마지막 달', S.comma(Math.round(bl.last)), { sub: true });
    rows += K.row('만기일시 총이자', S.comma(bl.interest));
    rows += '<div class="dashed" style="margin:6px 0"></div>';
    rows += K.row('원리금균등 대비 절감 (원금균등)', S.comma(savePr));
    rows += K.row('원리금균등 대비 증가 (만기일시)', S.comma(moreBl));
    if (graceMonths) rows += K.row('거치기간', graceYears + '년 (이자만 납부)', { unit: false, sub: true });
    $('report-rows').innerHTML = rows;

    K.total(ep.interest, {
      cap: '총 이자 (원리금균등)',
      tag: S.korean(P) + ' · 연 ' + rate + '% · ' + years + '년',
      sub: '원금균등이 ' + S.won(savePr) + ' 적고, 만기일시는 ' + S.won(moreBl) + ' 더 냅니다.'
    });

    $('cmp-eq-v').textContent = S.won(ep.interest);
    $('cmp-eq-d').textContent = '월 ' + S.comma(Math.round(ep.first)) + ' 고정';
    $('cmp-pr-v').textContent = S.won(pr.interest);
    $('cmp-pr-d').textContent = '절감 ' + S.comma(savePr) + ' · 첫 달 ' + S.comma(Math.round(pr.first));
    $('cmp-bl-v').textContent = S.won(bl.interest);
    $('cmp-bl-d').textContent = '월 이자 ' + S.comma(Math.round(bl.first)) + ' · 만기 원금';
    $('cmp-eq').className = 'col';
    $('cmp-pr').className = 'col is-win';
    $('cmp-bl').className = 'col';

    /* 연차별 잔액 */
    var body = '';
    for (var y = 1; y <= years; y++) {
      var idx = Math.min(months, y * 12) - 1;
      body += '<tr' + (y === years ? ' class="is-key"' : '') + '>' +
        '<td class="num">' + y + '년</td>' +
        '<td class="num">' + S.comma(Math.round(ep.rows[idx].bal)) + '</td>' +
        '<td class="num">' + S.comma(Math.round(pr.rows[idx].bal)) + '</td>' +
        '<td class="num">' + S.comma(Math.round(bl.rows[idx].bal)) + '</td></tr>';
    }
    $('year-body').innerHTML = body;

    var words = '같은 ' + S.korean(P) + '·연 ' + rate + '%·' + years + '년 조건에서 원리금균등 총이자는 <strong>' + S.won(ep.interest) +
      '</strong>, 원금균등은 ' + S.won(pr.interest) + '(' + S.won(savePr) + ' 적음), 만기일시는 ' + S.won(bl.interest) + '입니다. ';
    words += graceMonths
      ? '거치 ' + graceYears + '년 동안은 이자만 내므로 총이자가 늘어납니다.'
      : '초기 납입 부담은 원금균등이 가장 큽니다.';
    K.verdict(words, 'is-note');

    $('steps').innerHTML = K.steps([
      { t: '월이율과 개월 수', e: '연 ' + rate + '% ÷ 12 = ' + (i * 100).toFixed(4) + '% · ' + years + '년 = <b>' + months + '개월</b>',
        w: '거치기간 ' + graceYears + '년을 빼면 실제 원금 상환 기간은 ' + (months - graceMonths) + '개월입니다.' },
      { t: '원리금균등 월 납입액', e: S.comma(P) + ' × ' + (i * 100).toFixed(4) + '% ÷ (1 − (1+' + (i * 100).toFixed(4) + '%)^−' + (months - graceMonths) + ') = <b>' + S.comma(Math.round(ep.first)) + '원</b>',
        w: '만기까지 매달 같은 금액을 냅니다.' },
      { t: '원금균등 월 원금', e: S.comma(P) + ' ÷ ' + (months - graceMonths) + '개월 = <b>' + S.comma(Math.round(P / (months - graceMonths))) + '원</b>',
        w: '원금을 균등하게 나누고 이자를 더해, 납입액이 매달 줄어듭니다.' },
      { t: '만기일시 이자', e: S.comma(P) + ' × 월이율 = <b>' + S.comma(Math.round(bl.first)) + '원</b> (매달)',
        w: '만기까지 원금을 갚지 않아 이자가 줄지 않고, 마지막 달에 원금을 한꺼번에 갚습니다.' },
      { t: '거치기간 처리', e: graceMonths ? graceYears + '년 = ' + graceMonths + '개월은 <b>이자만</b> 납부' : '거치기간 <b>없음</b>',
        w: '거치 중에는 원금이 줄지 않아 전체 이자가 늘어납니다.' },
      { t: '총이자와 절감액', e: '원리금균등 ' + S.comma(ep.interest) + ' − 원금균등 ' + S.comma(pr.interest) + ' = <b>' + S.comma(savePr) + '원 절감</b>',
        w: '만기일시는 원리금균등보다 ' + S.comma(moreBl) + '원 더 냅니다.' }
    ]);

    K.mbar('총 이자 (원리금균등)', S.won(ep.interest));
    K.copy('[대출 상환방식 비교 · ' + C.meta.asOfLabel + ' 기준]\n' +
      S.won(P) + ' · 연 ' + rate + '% · ' + years + '년 · 거치 ' + graceYears + '년\n' +
      '원리금균등 총이자 ' + S.won(ep.interest) + ' (월 ' + S.won(Math.round(ep.first)) + ')\n' +
      '원금균등 총이자 ' + S.won(pr.interest) + ' (절감 ' + S.won(savePr) + ')\n' +
      '만기일시 총이자 ' + S.won(bl.interest));
  }

  K.bindMoney(['l-principal'], render);
  ['l-rate', 'l-years', 'l-grace'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9.]/g, '');
      render();
    });
  });
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
