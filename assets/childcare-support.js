(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var CH = C.childcare;

  function render() {
    var order = parseInt($('k-order').value, 10) || 1;
    var facility = $('k-facility').value;
    var allowance = parseInt($('k-region').value, 10) || CH.allowance.base;
    var daycare = facility === 'daycare';

    /* 부모급여: 0세 100만, 1세 50만 — 어린이집 이용 시 보육료로 전환 */
    var cash0 = daycare ? CH.parent.age0 - CH.parent.daycareFee0 : CH.parent.age0;
    var vouch0 = daycare ? CH.parent.daycareFee0 : 0;
    var cash1 = daycare ? Math.max(0, CH.parent.age1 - CH.parent.daycareFee1) : CH.parent.age1;
    var vouch1 = daycare ? Math.min(CH.parent.age1, CH.parent.daycareFee1) : 0;

    var first = order >= 2 ? CH.firstMeet.second : CH.firstMeet.first;
    var cashParent = cash0 * 12 + cash1 * 12;
    var voucherParent = vouch0 * 12 + vouch1 * 12;
    var allowanceTotal = allowance * 24;
    var cashTotal = cashParent + allowanceTotal;
    var voucherTotal = voucherParent + first;
    var total = cashTotal + voucherTotal;

    var rows = K.row('부모급여 0세' + (daycare ? ' 현금' : '') + ' (12개월)', S.comma(cash0 * 12));
    if (daycare) rows += K.row('보육료 바우처 (0세 12개월)', S.comma(vouch0 * 12), { sub: true });
    rows += K.row('부모급여 1세' + (daycare ? ' 현금' : '') + ' (12개월)', S.comma(cash1 * 12));
    if (daycare) rows += K.row('보육료 바우처 (1세 12개월)', S.comma(vouch1 * 12), { sub: true });
    rows += K.row('아동수당 (' + S.comma(allowance) + '원 × 24개월)', S.comma(allowanceTotal));
    rows += '<div class="dashed" style="margin:6px 0"></div>';
    rows += K.row('현금 합계', S.comma(cashTotal));
    rows += K.row('첫만남이용권 (' + (order >= 2 ? '둘째 이상' : '첫째') + ')', S.comma(first));
    rows += K.row('바우처 합계', S.comma(voucherTotal));
    $('report-rows').innerHTML = rows;

    K.total(total, {
      cap: '24개월 총 지원액',
      tag: (order >= 2 ? '둘째 이상' : '첫째') + ' · ' + (daycare ? '어린이집' : '가정양육'),
      sub: '현금 ' + S.won(cashTotal) + ' + 바우처 ' + S.won(voucherTotal) + ' · 월평균 ' + S.won(Math.round(total / 24))
    });

    $('cmp-cash-v').textContent = S.won(cashTotal);
    $('cmp-cash-d').textContent = '부모급여 현금 ' + S.comma(cashParent) + ' + 아동수당 ' + S.comma(allowanceTotal);
    $('cmp-voucher-v').textContent = S.won(voucherTotal);
    $('cmp-voucher-d').textContent = '보육료 ' + S.comma(voucherParent) + ' + 첫만남 ' + S.comma(first);
    $('cmp-cash').className = 'col' + (cashTotal >= voucherTotal ? ' is-win' : '');
    $('cmp-voucher').className = 'col' + (voucherTotal > cashTotal ? ' is-win' : '');

    /* 0~23개월 월별 표 */
    var body = '';
    var sumCash = 0, sumVouch = 0, sumAllow = 0, sumFirst = 0;
    for (var m = 0; m < CH.months; m++) {
      var age = m < 12 ? 0 : 1;
      var c = age === 0 ? cash0 : cash1;
      var v = age === 0 ? vouch0 : vouch1;
      var f = m === 0 ? first : 0;
      sumCash += c;
      sumVouch += v;
      sumAllow += allowance;
      sumFirst += f;
      body += '<tr' + (m === 0 ? ' class="is-key"' : '') + '>' +
        '<td class="num">' + m + '개월' + (age === 0 ? ' (0세)' : ' (1세)') + '</td>' +
        '<td class="num">' + S.comma(c) + '</td>' +
        '<td class="num">' + S.comma(v) + '</td>' +
        '<td class="num">' + S.comma(allowance) + '</td>' +
        '<td class="num">' + (f ? S.comma(f) : '—') + '</td>' +
        '<td class="num">' + S.comma(c + v + allowance + f) + '</td></tr>';
    }
    $('month-body').innerHTML = body;
    $('month-foot').innerHTML = '<tr><td class="num">24개월 합계</td>' +
      '<td class="num">' + S.comma(sumCash) + '</td>' +
      '<td class="num">' + S.comma(sumVouch) + '</td>' +
      '<td class="num">' + S.comma(sumAllow) + '</td>' +
      '<td class="num">' + S.comma(sumFirst) + '</td>' +
      '<td class="num">' + S.comma(total) + '</td></tr>';

    var words;
    if (daycare) {
      words = '어린이집을 이용하면 0세는 보육료 <strong>58만 4천원</strong>을 빼고 현금 <strong>' + S.won(cash0) +
        '</strong>, 1세부터는 부모급여가 보육료로 전환되어 현금 지급이 없습니다. 24개월 현금은 <strong>' + S.won(cashTotal) +
        '</strong>, 보육료·첫만남 바우처는 <strong>' + S.won(voucherTotal) + '</strong>입니다.';
    } else {
      words = '가정양육이면 24개월 동안 현금 <strong>' + S.won(cashTotal) + '</strong>을 받고, 첫만남이용권 ' +
        S.won(first) + '은 국민행복카드 바우처로 따로 들어옵니다. 합계 <strong>' + S.won(total) +
        '</strong>이고 월평균 ' + S.won(Math.round(total / 24)) + '입니다.';
    }
    words += ' 아동수당은 이 기간 이후에도 만 9세 미만까지 계속됩니다.';
    K.verdict(words, 'is-ok');

    $('steps').innerHTML = K.steps([
      { t: '0세 부모급여', e: S.comma(CH.parent.age0) + ' × 12 = <b>' + S.comma(cash0 * 12 + vouch0 * 12) + '원</b>' + (daycare ? ' (보육료 ' + S.comma(vouch0) + ' + 현금 ' + S.comma(cash0) + ')' : ''),
        w: '만 0세는 월 100만원이 기준이고, 어린이집 이용 시 보육료 58만 4천원을 뺀 나머지가 현금으로 지급됩니다.' },
      { t: '1세 부모급여', e: S.comma(CH.parent.age1) + ' × 12 = <b>' + S.comma(cash1 * 12 + vouch1 * 12) + '원</b>' + (daycare ? ' (보육료 전환, 현금 0)' : ''),
        w: '만 1세는 월 50만원이며, 어린이집 이용 시 보육료로 전환되어 현금 지급이 없습니다.' },
      { t: '아동수당', e: S.comma(allowance) + ' × 24 = <b>' + S.comma(allowanceTotal) + '원</b>',
        w: '2026년 만 9세 미만 월 10만원이 기본이고, 거주 지역에 따라 10만 5천~12만원이 적용됩니다.' },
      { t: '첫만남이용권', e: (order >= 2 ? '둘째 이상 300만' : '첫째 200만') + ' → <b>' + S.comma(first) + '원</b>',
        w: '출생 시 한 번만 지급되는 국민행복카드 바우처입니다. 매달 반복되지 않습니다.' },
      { t: '현금과 바우처 합계', e: '현금 ' + S.comma(cashTotal) + ' + 바우처 ' + S.comma(voucherTotal) + ' = <b>' + S.comma(total) + '원</b>',
        w: '현금은 통장으로, 바우처는 보육료·첫만남이용권처럼 정해진 용도로만 쓸 수 있습니다.' },
      { t: '월평균 환산', e: S.comma(total) + ' ÷ 24 = <b>' + S.comma(Math.round(total / 24)) + '원</b>',
        w: '0~23개월 평균으로 나눈 값입니다. 실제 지급은 0세 구간에 더 집중됩니다.' }
    ]);

    K.mbar('24개월 총 지원액', S.won(total));
    K.copy('[부모급여·아동수당 24개월 · ' + C.meta.asOfLabel + ' 기준]\n' +
      (order >= 2 ? '둘째 이상' : '첫째') + ' · ' + (daycare ? '어린이집' : '가정양육') + ' · 아동수당 ' + S.won(allowance) + '/월\n' +
      '부모급여 현금 ' + S.won(cashParent) + ' · 보육료 ' + S.won(voucherParent) + '\n' +
      '아동수당 ' + S.won(allowanceTotal) + ' · 첫만남 ' + S.won(first) + '\n' +
      '현금 ' + S.won(cashTotal) + ' + 바우처 ' + S.won(voucherTotal) + ' = ' + S.won(total));
  }

  ['k-order', 'k-facility', 'k-region'].forEach(function (id) {
    $(id).addEventListener('change', render);
  });
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
