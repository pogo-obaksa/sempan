(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var P = C.parental;

  var state = { mode: 'general' };

  var MODE_NAME = {
    general: '일반 육아휴직',
    single: '한부모 육아휴직',
    six: '6+6 부모육아휴직제'
  };

  function capFor(mode, m) {
    if (mode === 'six' && m <= 6) return P.six[m - 1];
    if (mode === 'single' && m <= 3) return P.single.firstCap;
    if (m <= 3) return P.general.firstCap;
    if (m <= 6) return P.general.secondCap;
    return P.general.lateCap;
  }

  function rateFor(mode, m) {
    if (mode === 'six' && m <= 6) return 1;
    if (m <= 6) return 1;
    return P.general.lateRate;
  }

  function render() {
    var wage = K.money('p-wage');
    var months = parseInt($('p-months').value, 10) || 12;
    var mode = state.mode;

    var MODE_HELP = {
      general: '일반: 1~3개월 250만원, 4~6개월 200만원, 7개월~ 160만원 상한.',
      single: '한부모: 첫 3개월 상한 300만원, 4~6개월 200만원, 7개월~ 160만원.',
      six: '6+6: 부모 각각 첫 6개월 250·250·300·350·400·450만원 상한.'
    };
    if ($('mode-help')) $('mode-help').textContent = MODE_HELP[mode];

    var list = [];
    var sum = 0;
    var capped = 0;
    var floored = 0;

    for (var m = 1; m <= months; m++) {
      var cap = capFor(mode, m);
      var rate = rateFor(mode, m);
      var raw = wage * rate;
      var amount = Math.min(raw, cap);
      var note = '통상임금 ' + Math.round(rate * 100) + '%';
      if (amount < P.floor) {
        amount = P.floor;
        note = '하한 70만원 적용';
        floored++;
      } else if (raw > cap) {
        note = '상한 ' + S.comma(cap) + '원 적용';
        capped++;
      }
      amount = Math.round(amount);
      sum += amount;
      list.push({ m: m, rate: rate, cap: cap, amount: amount, note: note });
    }

    function subtotal(from, to) {
      return list.filter(function (x) { return x.m >= from && x.m <= to; })
        .reduce(function (s, x) { return s + x.amount; }, 0);
    }

    var first = subtotal(1, 3);
    var second = subtotal(4, 6);
    var late = subtotal(7, 12);

    $('report-rows').innerHTML =
      K.row('월 통상임금', S.comma(wage)) +
      K.row('휴직 유형', MODE_NAME[mode], { unit: false, sub: true }) +
      K.row('휴직 개월', months + '개월', { unit: false, sub: true }) +
      '<div class="dashed" style="margin:6px 0"></div>' +
      K.row('1~3개월 소계', S.comma(first)) +
      K.row('4~6개월 소계', S.comma(second)) +
      K.row('7개월 이후 소계', S.comma(late)) +
      (mode === 'six' ? K.row('부모 합산 (같은 조건 가정)', S.comma(sum * 2), { sub: true }) : '');

    K.total(sum, {
      cap: '휴직 중 총 수령액',
      tag: MODE_NAME[mode] + ' · 사후지급금 폐지',
      sub: '월 하한 70만원 · 7개월부터 통상임금 80% · 상한 적용 ' + capped + '회'
    });

    $('month-body').innerHTML = list.map(function (x) {
      return '<tr>' +
        '<td class="num">' + x.m + '개월</td>' +
        '<td class="num">' + Math.round(x.rate * 100) + '%</td>' +
        '<td class="num">' + S.comma(x.cap) + '원</td>' +
        '<td class="num"' + (x.note.indexOf('상한') === 0 ? ' style="color:var(--green);font-weight:650"' : '') + '>' +
        S.comma(x.amount) + '원</td>' +
        '<td>' + x.note + '</td></tr>';
    }).join('');

    var words;
    if (wage >= P.single.firstCap) {
      words = '통상임금이 상한을 넘어 <strong>상한액만큼</strong> 받습니다. 총 ' + S.won(sum) + '입니다.';
    } else {
      words = '통상임금이 상한보다 낮아 <strong>통상임금 기준</strong>으로 계산됩니다. 총 ' + S.won(sum) + '입니다.';
    }
    if (mode === 'six') {
      words += ' 6+6은 자녀 생후 18개월 안에 부모가 함께 써야 하며, 상한은 부모 각각에게 적용됩니다.';
    }
    if (floored) {
      words += ' 산정액이 70만원보다 낮은 달은 하한 70만원으로 올렸습니다.';
    }
    words += ' 2025년 1월 1일 이후 휴직분은 사후지급금 없이 매달 전액 지급됩니다.';
    K.verdict(words, 'is-ok');

    $('steps').innerHTML = K.steps([
      { t: '적용 유형 확인', e: '<b>' + MODE_NAME[mode] + '</b>',
        w: mode === 'six' ? '자녀 생후 18개월 이내, 부모 각각 첫 6개월에 적용됩니다.' :
          (mode === 'single' ? '한부모가족지원법상 한부모가 첫 3개월 상한 300만원입니다.' : '일반 육아휴직 기준입니다.') },
      { t: '월별 지급률', e: '1~6개월 <b>100%</b> · 7개월 이후 <b>80%</b>',
        w: '6+6도 7개월째부터는 일반 기준(80%, 160만원 상한)으로 돌아갑니다.' },
      { t: '월별 상한', e: mode === 'six' ? '250·250·300·350·400·450만원' :
        (mode === 'single' ? '1~3개월 300만 · 4~6개월 200만 · 7개월~ 160만' : '1~3개월 250만 · 4~6개월 200만 · 7개월~ 160만'),
        w: '상한은 통상임금과 비교해 작은 값을 씁니다.' },
      { t: '월 하한', e: '산정액이 70만원 미만이면 <b>70만원</b>',
        w: '고용보험법 시행령 제95조의 하한입니다.' },
      { t: '총수령액', e: '월별 수령액 합계 = <b>' + S.comma(sum) + '원</b>',
        w: '사후지급금 폐지로 복직 후 떼어 두는 금액이 없습니다.' }
    ]);

    K.mbar('총 수령액', S.won(sum));
    K.copy('[육아휴직 급여 · ' + C.meta.asOfLabel + ' 기준]\n' +
      MODE_NAME[mode] + ' · 통상임금 ' + S.won(wage) + ' · ' + months + '개월\n' +
      '1~3개월 ' + S.won(first) + ' · 4~6개월 ' + S.won(second) + ' · 7개월~ ' + S.won(late) + '\n' +
      '총 ' + S.won(sum));
  }

  K.bindMode('.segmented button[data-mode]', function (mode) {
    state.mode = mode;
    render();
  });
  K.bindMoney(['p-wage'], render);
  K.bindSelect('p-months', render);
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
