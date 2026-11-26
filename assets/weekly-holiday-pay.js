(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var I = C.insurance;
  var W = C.wage;

  function render() {
    var hourly = K.money('w-hourly');
    var hours = parseFloat(String($('w-hours').value).replace(/[^0-9.]/g, '')) || 0;
    var deps = parseInt($('w-dependents').value, 10) || 1;

    var weeklyBase = hourly * hours;
    var holiday = hours >= W.weeklyHolidayMinHours ? hourly * 8 * Math.min(hours, 40) / 40 : 0;
    var weekly = weeklyBase + holiday;
    var monthly = Math.round(weekly * W.weeksPerMonth);
    var annual = monthly * 12;

    var pensionBase = Math.min(Math.max(monthly, I.pensionFloor), I.pensionCap);
    var pension = Math.round(pensionBase * I.pension);
    var health = Math.round(monthly * I.health);
    var ltc = Math.round(health * (I.ltcRate / I.healthRate));
    var employment = Math.round(monthly * I.employment);
    var insTotal = pension + health + ltc + employment;

    var tax = K.taxOf(K.salaryBase(annual, deps, 0));
    var credit = Math.min(K.laborCredit(tax) + C.rentCredit.standardDeduction, tax);
    var incomeTax = Math.round(Math.max(0, tax - credit) * 1.1 / 12);

    var net4 = monthly - insTotal - incomeTax;
    var net33 = Math.round(monthly * 0.967);
    var diff = net33 - net4;

    $('report-rows').innerHTML =
      K.row('시급', S.comma(hourly)) +
      K.row('주 소정근로시간', hours + '시간', { unit: false, sub: true }) +
      K.row('주 기본급', S.comma(weeklyBase)) +
      K.row('주휴수당', holiday ? S.comma(holiday) : '0', { sub: !holiday }) +
      K.row('주급 합계', S.comma(weekly)) +
      '<div class="dashed" style="margin:6px 0"></div>' +
      K.row('월 환산 (4.345주)', S.comma(monthly)) +
      K.row('국민연금 4.75%', '− ' + S.comma(pension), { sub: true }) +
      K.row('건강보험 3.595%', '− ' + S.comma(health), { sub: true }) +
      K.row('장기요양 (건보료의 13.14%)', '− ' + S.comma(ltc), { sub: true }) +
      K.row('고용보험 0.9%', '− ' + S.comma(employment), { sub: true }) +
      K.row('소득세·지방소득세', incomeTax ? '− ' + S.comma(incomeTax) : '0', { sub: true }) +
      K.row('4대보험 합계', '− ' + S.comma(insTotal));

    K.total(net4, {
      cap: '월 실수령액 (4대보험)',
      tag: '주 ' + hours + '시간 · 월 ' + S.comma(monthly) + '원',
      sub: '3.3% 공제 방식보다 ' + S.won(Math.abs(diff)) + (diff >= 0 ? ' 적습니다.' : ' 많습니다.')
    });

    $('cmp-4-k').textContent = '4대보험 (근로자 9.72%)';
    $('cmp-4-v').textContent = S.won(net4);
    $('cmp-4-d').textContent = '보험료 ' + S.comma(insTotal) + ' + 소득세 ' + S.comma(incomeTax);
    $('cmp-4').className = 'col' + (diff <= 0 ? ' is-win' : '');

    $('cmp-33-k').textContent = '3.3% 원천징수';
    $('cmp-33-v').textContent = S.won(net33);
    $('cmp-33-d').textContent = '소득세 3% + 지방세 0.3% · 5월 정산';
    $('cmp-33').className = 'col' + (diff > 0 ? ' is-win' : '');

    var words;
    if (hours < W.weeklyHolidayMinHours) {
      words = '주 소정근로시간이 <strong>15시간 미만</strong>이라 주휴수당이 발생하지 않습니다. 세전 월급은 ' + S.won(monthly) +
        '입니다. 초단시간 근로자는 4대보험 가입 의무가 없거나 달라질 수 있어, 아래 공제는 가입된 경우의 참고값입니다.';
    } else {
      words = '주휴수당 <strong>' + S.won(holiday) + '</strong>이 포함돼 주급 ' + S.won(weekly) +
        ', 세전 월급 ' + S.won(monthly) + '입니다.';
    }
    words += ' 3.3% 공제는 당장 실수령이 ' + S.won(Math.abs(diff)) +
      ' 많지만 국민연금·건강보험 가입이 아니고, 5월 종합소득세 신고로 정산합니다.';
    K.verdict(words, 'is-note');

    $('steps').innerHTML = K.steps([
      { t: '주휴수당 요건', e: hours >= W.weeklyHolidayMinHours ? hours + '시간 ≥ 15시간 → <b>발생</b>' : hours + '시간 < 15시간 → <b>없음</b>',
        w: '주 15시간 이상 근무하고 개근하면 주휴수당이 발생합니다.' },
      { t: '주휴수당', e: hourly + ' × 8 × ' + Math.min(hours, 40) + ' ÷ 40 = <b>' + S.comma(Math.round(holiday)) + '원</b>',
        w: '주 40시간을 기준으로 비례 계산하고, 40시간을 넘는 시간은 주휴 산정에서 제외합니다.' },
      { t: '주급과 월급', e: '(' + S.comma(weeklyBase) + ' + ' + S.comma(Math.round(holiday)) + ') × 4.345 = <b>' + S.comma(monthly) + '원</b>',
        w: '한 달을 4.345주(365÷7÷12)로 환산했습니다.' },
      { t: '4대보험', e: '연금 ' + S.comma(pension) + ' + 건강 ' + S.comma(health) + ' + 요양 ' + S.comma(ltc) + ' + 고용 ' + S.comma(employment) + ' = <b>' + S.comma(insTotal) + '원</b>',
        w: '2026년 근로자 부담률(9.72%)과 국민연금 상·하한을 적용했습니다.' },
      { t: '소득세', e: '연 환산 ' + S.comma(annual) + '원 기준 → 월 <b>' + S.comma(incomeTax) + '원</b>',
        w: '근로소득공제·기본공제·근로소득세액공제를 간이 추정했습니다.' },
      { t: '3.3%와 비교', e: S.comma(monthly) + ' × 3.3% = ' + S.comma(monthly - net33) + ' → 실수령 <b>' + S.comma(net33) + '원</b>',
        w: '4대보험 실수령과의 차이는 ' + S.comma(Math.abs(diff)) + '원입니다.' }
    ]);

    K.mbar('월 실수령 (4대보험)', S.won(net4));
    K.copy('[주휴수당·알바 실수령 · ' + C.meta.asOfLabel + ' 기준]\n' +
      '시급 ' + S.won(hourly) + ' × 주 ' + hours + '시간\n' +
      '주휴수당 ' + S.won(holiday) + ' · 주급 ' + S.won(weekly) + ' · 월급 ' + S.won(monthly) + '\n' +
      '4대보험 ' + S.won(insTotal) + ' → 실수령 ' + S.won(net4) + '\n' +
      '3.3% 공제 → 실수령 ' + S.won(net33));
  }

  K.bindMoney(['w-hourly'], render);
  ['w-hours'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9.]/g, '');
      render();
    });
  });
  K.bindSelect('w-dependents', render);
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
