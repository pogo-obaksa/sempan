(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var SV = C.severance;

  function modeNow() {
    var btn = document.querySelector('.segmented button[aria-selected="true"]');
    return btn ? btn.getAttribute('data-mode') : 'days';
  }

  function daysBetween(a, b) {
    if (!a || !b) return 0;
    var d1 = new Date(a + 'T00:00:00');
    var d2 = new Date(b + 'T00:00:00');
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    return Math.max(0, Math.round((d2 - d1) / 86400000) + 1);
  }

  function serviceDeduction(years) {
    var y = Math.max(1, years);
    if (y <= 5) return Math.round(SV.serviceDeduction.base * y);
    if (y <= 10) return Math.round(SV.serviceDeduction.tier1.add + SV.serviceDeduction.tier1.perYear * (y - 5));
    if (y <= 20) return Math.round(SV.serviceDeduction.tier2.add + SV.serviceDeduction.tier2.perYear * (y - 10));
    return Math.round(SV.serviceDeduction.tier3.add + SV.serviceDeduction.tier3.perYear * (y - 20));
  }

  function convertedDeduction(converted) {
    var t = SV.convertedDeduction;
    var lower = 0;
    for (var i = 0; i < t.length; i++) {
      if (converted <= t[i].upTo) {
        return Math.round(t[i].add + t[i].rate * (converted - lower));
      }
      lower = t[i].upTo;
    }
    return 0;
  }

  function render() {
    var mode = modeNow();
    var days = mode === 'dates'
      ? daysBetween($('s-start').value, $('s-end').value)
      : Math.max(0, Math.round(K.money('s-days')));
    var wage = K.money('s-wage');
    var bonus = K.money('s-bonus');
    var exec = $('s-exec').value === 'exec';

    var monthlyAvg = wage + bonus / 12;
    var oneDay = monthlyAvg / SV.dayDivisor;
    var years = days / 365;
    var serviceYears = Math.max(SV.minServiceYears, years);
    var severance = Math.round(oneDay * 30 * years);

    var serviceDed = Math.min(severance, serviceDeduction(serviceYears));
    var incomeBase = Math.max(0, severance - serviceDed);
    var converted = Math.round(incomeBase / serviceYears * 12);
    var convertedDed = Math.min(converted, convertedDeduction(converted));
    var taxable = Math.max(0, converted - convertedDed);

    var monthlyTaxBase = taxable / 12;
    var monthlyTax = K.taxOf(monthlyTaxBase);
    var tax = Math.round(monthlyTax * serviceYears);
    var local = Math.round(tax * SV.localRate);
    var net = severance - tax - local;

    var rows = K.row('재직일수', S.comma(days) + '일', { unit: false });
    rows += K.row('근속연수', years.toFixed(2) + '년', { unit: false, sub: true });
    rows += K.row('월 평균임금', S.comma(Math.round(monthlyAvg)) + (bonus ? ' (상여 포함)' : ''), { unit: !bonus });
    rows += K.row('1일 평균임금', S.comma(Math.round(oneDay)));
    rows += '<div class="dashed" style="margin:6px 0"></div>';
    rows += K.row('법정 퇴직금', S.comma(severance));
    rows += K.row('근속연수공제', '− ' + S.comma(serviceDed), { sub: true });
    rows += K.row('퇴직소득금액', S.comma(incomeBase));
    rows += K.row('환산급여', S.comma(converted), { sub: true });
    rows += K.row('환산급여공제', '− ' + S.comma(convertedDed), { sub: true });
    rows += K.row('과세표준 (환산)', S.comma(taxable));
    rows += K.row('퇴직소득세', '− ' + S.comma(tax));
    rows += K.row('지방소득세 (10%)', '− ' + S.comma(local), { sub: true });
    if (exec) rows += K.row('근로자 구분', '임원 (정관·주총 결의)', { unit: false, sub: true });
    $('report-rows').innerHTML = rows;

    K.total(net, {
      cap: '세후 실수령액',
      tag: '근속 ' + years.toFixed(1) + '년',
      sub: '퇴직금 ' + S.won(severance) + ' − 세금 ' + S.won(tax + local) + ' (세율 ' +
        (severance ? ((tax + local) / severance * 100).toFixed(2) : '0') + '%)'
    });

    $('cmp-gross-v').textContent = S.won(severance);
    $('cmp-gross-d').textContent = '1일 ' + S.comma(Math.round(oneDay)) + ' × 30 × ' + years.toFixed(2) + '년';
    $('cmp-net-v').textContent = S.won(net);
    $('cmp-net-d').textContent = '퇴직소득세 ' + S.comma(tax) + ' + 지방 ' + S.comma(local);
    $('cmp-gross').className = 'col';
    $('cmp-net').className = 'col is-win';

    var words;
    if (days < 365) {
      words = '재직일수가 <strong>1년 미만</strong>이라 법정 퇴직금 대상이 아닙니다. 아래 금액은 참고 계산입니다. ' +
        '퇴직금은 1년 이상 계속 근로한 근로자에게 발생합니다.';
      K.verdict(words, 'is-note');
    } else {
      words = '법정 퇴직금 <strong>' + S.won(severance) + '</strong>에서 근속연수공제 ' + S.won(serviceDed) +
        '과 환산급여공제 ' + S.won(convertedDed) + '을 빼고, 퇴직소득세 ' + S.won(tax) + '·지방소득세 ' + S.won(local) +
        '를 공제하면 실수령액은 <strong>' + S.won(net) + '</strong>입니다.';
      K.verdict(words, 'is-ok');
    }
    if (exec) {
      $('verdict-text').innerHTML += ' 임원은 정관·주주총회 결의로 정한 퇴직급여 한도가 적용될 수 있어 실제 퇴직금이 다를 수 있습니다.';
    }

    $('steps').innerHTML = K.steps([
      { t: '재직일수와 근속연수', e: S.comma(days) + '일 ÷ 365 = <b>' + years.toFixed(2) + '년</b>',
        w: '근속연수는 재직일수를 365로 나눈 값이고, 1년 미만은 1년으로 봅니다.' },
      { t: '1일 평균임금', e: '(' + S.comma(wage) + ' + ' + S.comma(bonus) + ' ÷ 12) ÷ 30.4167 = <b>' + S.comma(Math.round(oneDay)) + '원</b>',
        w: '퇴직 전 3개월 임금총액을 그 기간 일수로 나눈 값이 원칙이고, 여기서는 월 급여로 근사했습니다.' },
      { t: '법정 퇴직금', e: S.comma(Math.round(oneDay)) + ' × 30 × ' + years.toFixed(2) + ' = <b>' + S.comma(severance) + '원</b>',
        w: '1일 평균임금의 30일분에 근속연수를 곱합니다(근로자퇴직급여보장법 §8).' },
      { t: '근속연수공제', e: '근속 ' + years.toFixed(2) + '년 → <b>' + S.comma(serviceDed) + '원</b>',
        w: '5년 이하 연 100만, 이후 구간별로 공제가 커집니다(2023년 상향 기준).' },
      { t: '환산급여와 환산급여공제', e: S.comma(incomeBase) + ' ÷ ' + years.toFixed(2) + ' × 12 = ' + S.comma(converted) + ' → 공제 <b>' + S.comma(convertedDed) + '원</b>',
        w: '퇴직소득을 1년치로 환산해 누진세율을 적용하기 위한 단계입니다.' },
      { t: '퇴직소득세·실수령', e: '환산 과세표준 ' + S.comma(taxable) + ' → 세금 ' + S.comma(tax + local) + ' → <b>' + S.comma(net) + '원</b>',
        w: '환산세액을 12로 나눠 근속연수를 곱하고, 지방소득세 10%를 더합니다.' }
    ]);

    K.mbar('세후 실수령액', S.won(net));
    K.copy('[퇴직금·퇴직소득세 · ' + C.meta.asOfLabel + ' 기준]\n' +
      '재직 ' + S.comma(days) + '일 (' + years.toFixed(2) + '년) · 월 평균임금 ' + S.won(Math.round(monthlyAvg)) + '\n' +
      '법정 퇴직금 ' + S.won(severance) + ' − 근속연수공제 ' + S.won(serviceDed) + '\n' +
      '퇴직소득세 ' + S.won(tax) + ' + 지방소득세 ' + S.won(local) + '\n' +
      '세후 실수령액 ' + S.won(net));
  }

  K.bindMode('.segmented button[data-mode]', render);
  K.bindMoney(['s-wage', 's-bonus', 's-days'], render);
  ['s-start', 's-end', 's-exec'].forEach(function (id) {
    $(id).addEventListener('change', render);
    $(id).addEventListener('input', render);
  });
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
