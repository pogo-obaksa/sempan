(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var F = C.freelancer;

  function expenseRate() {
    var preset = $('f-preset').value;
    if (preset === 'simple') return F.simpleExpenseRate * 100;
    if (preset === 'standard') return F.standardExpenseRate * 100;
    return K.pct('f-rate', 30);
  }

  function render() {
    var income = K.money('f-income');
    var deps = parseInt($('f-dependents').value, 10) || 0;
    var pension = K.money('f-pension');
    var yellow = Math.min(K.money('f-yellow'), F.yellowUmbrellaCap);
    var rate = expenseRate();
    var preset = $('f-preset').value;

    $('f-rate').disabled = preset !== 'custom';
    $('f-rate-wrap').hidden = preset !== 'custom';

    var expense = Math.round(income * rate / 100);
    var business = Math.max(0, income - expense);
    var basic = (1 + deps) * C.dependents.basic;
    var deduction = basic + pension + yellow;
    var taxBase = Math.max(0, business - deduction);
    var tax = K.taxOf(taxBase);
    var netTax = Math.max(0, tax - F.standardCredit);
    var local = Math.round(netTax * C.incomeTax.localRate);
    var decided = netTax + local;
    var prepaid = Math.round(income * (F.withholdingIncome + F.withholdingLocal));
    var balance = prepaid - decided;

    $('report-rows').innerHTML =
      K.row('연간 총수입', S.comma(income)) +
      K.row('경비 (' + rate + '% · ' + (preset === 'custom' ? '직접 입력' : (preset === 'simple' ? '단순경비율' : '기준경비율')) + ')',
        '− ' + S.comma(expense)) +
      K.row('소득금액', S.comma(business)) +
      '<div class="dashed" style="margin:6px 0"></div>' +
      K.row('기본공제 (본인 + ' + deps + '명)', '− ' + S.comma(basic), { sub: true }) +
      K.row('국민연금 납부액', pension ? '− ' + S.comma(pension) : '0', { sub: true }) +
      K.row('노란우산공제', yellow ? '− ' + S.comma(yellow) : '0', { sub: true }) +
      K.row('과세표준', S.comma(taxBase)) +
      K.row('산출세액', S.comma(tax)) +
      K.row('표준세액공제', '− ' + S.comma(Math.min(tax, F.standardCredit)), { sub: true }) +
      K.row('결정세액 (지방소득세 포함)', S.comma(decided)) +
      '<div class="dashed" style="margin:6px 0"></div>' +
      K.row('기납부세액 (3.3%)', S.comma(prepaid));

    K.total(balance, {
      cap: balance >= 0 ? '5월 예상 환급' : '5월 예상 추가납부',
      tag: '기납부 3.3% − 결정세액',
      sub: '기납부 ' + S.won(prepaid) + ' − 결정세액 ' + S.won(decided) + ' · 5월 종합소득세 신고 기준'
    });

    var words = balance >= 0
      ? '원천징수로 <strong>' + S.won(balance) + '을 더 냈으므로</strong> 5월에 환급받을 수 있습니다. 경비율과 공제를 실제와 맞추면 환급액이 달라집니다.'
      : '원천징수된 3.3%보다 결정세액이 <strong>' + S.won(-balance) + ' 많습니다</strong>. 5월에 추가 납부해야 합니다.';
    if (income <= F.simpleIncomeLimit) {
      words += ' 직전연도 수입이 2,400만원 이하라면 업종별 단순경비율을 적용할 수 있습니다.';
    } else {
      words += ' 수입이 2,400만원을 넘으면 원칙적으로 기준경비율(또는 복식부기) 대상입니다.';
    }
    K.verdict(words, balance >= 0 ? 'is-ok' : '');

    $('steps').innerHTML = K.steps([
      { t: '경비 차감', e: S.comma(income) + ' × ' + rate + '% = <b>' + S.comma(expense) + '원</b>',
        w: '단순경비율은 업종별 고시율, 기준경비율은 주요경비 증빙 + 한도율로 계산합니다. 여기서는 입력한 비율을 일괄 적용했습니다.' },
      { t: '소득금액', e: S.comma(income) + ' − ' + S.comma(expense) + ' = <b>' + S.comma(business) + '원</b>' },
      { t: '종합소득공제', e: '기본 ' + S.comma(basic) + ' + 연금 ' + S.comma(pension) + ' + 노란우산 ' + S.comma(yellow) + ' = <b>' + S.comma(deduction) + '원</b>',
        w: '노란우산공제는 연 500만원까지 소득공제됩니다.' },
      { t: '과세표준', e: S.comma(business) + ' − ' + S.comma(deduction) + ' = <b>' + S.comma(taxBase) + '원</b>' },
      { t: '산출세액', e: '누진세율 → <b>' + S.comma(tax) + '원</b>',
        w: '표준세액공제 7만원을 뺀 뒤 지방소득세 10%를 더합니다.' },
      { t: '5월 정산', e: S.comma(prepaid) + ' − ' + S.comma(decided) + ' = <b>' + S.comma(balance) + '원</b>',
        w: balance >= 0 ? '양수면 환급, 음수면 추가납부입니다.' : '음수는 추가납부액입니다.' }
    ]);

    K.mbar(balance >= 0 ? '5월 예상 환급' : '5월 추가납부', S.won(Math.abs(balance)));
    K.copy('[프리랜서 3.3% 정산 · ' + C.meta.asOfLabel + ' 기준]\n' +
      '총수입 ' + S.won(income) + ' · 경비율 ' + rate + '% · 소득금액 ' + S.won(business) + '\n' +
      '공제 ' + S.won(deduction) + ' · 과세표준 ' + S.won(taxBase) + '\n' +
      '결정세액 ' + S.won(decided) + ' (지방세 포함) · 기납부 ' + S.won(prepaid) + '\n' +
      (balance >= 0 ? '환급 ' : '추가납부 ') + S.won(Math.abs(balance)));
  }

  K.bindMoney(['f-income', 'f-pension', 'f-yellow'], render);
  K.bindSelect('f-preset', render);
  K.bindSelect('f-dependents', render);
  ['f-rate'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9.]/g, '');
      render();
    });
  });
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
