(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var R = C.rentCredit;

  function render() {
    var salary = K.money('r-salary');
    var rent = K.money('r-rent');
    var area = parseFloat(String($('r-area').value).replace(/[^0-9.]/g, '')) || 0;
    var price = K.money('r-price');
    var noHouse = K.checked('r-nohouse');
    var kids3 = K.checked('r-kids3');
    var weekend = K.checked('r-weekend');

    var areaLimit = kids3 ? R.areaCap3Kids : R.areaCap;
    var incomeOk = salary <= R.salaryLimit;
    var areaOk = area > 0 && area <= areaLimit;
    var priceOk = price > 0 && price <= R.priceCap;
    var houseOk = areaOk || priceOk;
    var eligible = incomeOk && noHouse && houseOk;

    var rate = salary <= R.highSalaryLimit ? R.highRate : (salary <= R.salaryLimit ? R.lowRate : 0);
    var creditBase = Math.min(rent, R.annualCap);
    var credit = eligible && rate > 0 ? Math.round(creditBase * rate) : 0;
    var creditLocal = Math.round(credit * 1.1);
    var standardLoss = Math.round(R.standardDeduction * 1.1);
    var creditNet = credit > 0 ? Math.max(0, creditLocal - standardLoss) : 0;

    var base = K.salaryBase(salary, 1, 0);
    var mrg = K.marginal(base);
    var cashBase = Math.min(rent, R.cashReceiptLimit) * R.cashReceiptRate;
    var cashSave = Math.round(cashBase * mrg * 1.1);

    var bestCredit = creditNet >= cashSave;
    var best = Math.max(creditNet, cashSave);
    var diff = Math.abs(creditNet - cashSave);

    $('report-rows').innerHTML =
      K.row('총급여 ' + S.comma(salary) + '원', (rate * 100) + '% 공제율', { unit: false, sub: true }) +
      K.row('공제 대상 월세 (연 1,000만 한도)', S.comma(creditBase)) +
      K.row('월세 세액공제액', S.comma(credit)) +
      K.row('지방소득세 효과 (10%)', '+ ' + S.comma(creditLocal - credit), { sub: true }) +
      K.row('표준세액공제 상실', '− ' + S.comma(standardLoss), { sub: true }) +
      K.row('세액공제 순절감', S.comma(creditNet)) +
      '<div class="dashed" style="margin:6px 0"></div>' +
      K.row('현금영수증 소득공제 (30%)', S.comma(cashBase)) +
      K.row('한계세율 ' + (mrg * 100).toFixed(1) + '% 적용', S.comma(cashSave), { sub: true }) +
      K.row('현금영수증 순절감', S.comma(cashSave));

    K.total(best, {
      cap: bestCredit ? '월세 세액공제 순절감' : '현금영수증 소득공제 절감',
      tag: bestCredit ? '요건 충족 · 지방세 포함' : '세액공제 요건 미충족',
      sub: eligible
        ? '현금영수증 소득공제보다 ' + S.won(diff) + ' 유리합니다.'
        : '세액공제 대신 현금영수증(30%) 소득공제로 돌린 금액입니다.'
    });

    $('cmp-credit-k').textContent = '월세 세액공제';
    $('cmp-credit-v').textContent = S.won(creditNet);
    $('cmp-credit-d').textContent = '공제액 ' + S.comma(credit) + ' − 표준세액공제 상실';
    $('cmp-credit').className = 'col' + (bestCredit ? ' is-win' : '');

    $('cmp-cash-k').textContent = '현금영수증 소득공제';
    $('cmp-cash-v').textContent = S.won(cashSave);
    $('cmp-cash-d').textContent = '한도 ' + S.comma(R.cashReceiptLimit) + ' 가정 · 한계세율 ' + (mrg * 100).toFixed(1) + '%';
    $('cmp-cash').className = 'col' + (bestCredit ? '' : ' is-win');

    function line(name, basis, ok, note) {
      return '<tr' + (ok ? '' : ' class="is-key"') + '>' +
        '<td>' + name + '</td><td>' + basis + '</td>' +
        '<td>' + (note || '') + '</td>' +
        '<td class="num">' + (ok ? '충족' : '미충족') + '</td></tr>';
    }
    $('elig-body').innerHTML =
      line('무주택 세대주', '12월 31일 기준 세대 전원 무주택', noHouse, noHouse ? '세대주 본인' : '무주택 아님') +
      line('소득', '총급여 8,000만원 이하', incomeOk, S.comma(salary) + '원') +
      line('면적', '전용 ' + areaLimit + '㎡ 이하' + (kids3 ? ' (자녀 3명 이상)' : ''), areaOk, area + '㎡') +
      line('기준시가', '4억원 이하 (면적과 택일)', priceOk, S.comma(price) + '원') +
      line('합계', '소득 · 무주택 · 주택 요건 모두 충족', eligible, eligible ? '세액공제 가능' : '현금영수증 검토');

    var reasons = [];
    if (!noHouse) reasons.push('무주택 세대주 요건');
    if (!incomeOk) reasons.push('총급여 8,000만원 초과');
    if (!houseOk) reasons.push('면적·기준시가 요건');
    var words = eligible
      ? '<strong>요건을 모두 충족</strong>합니다. 월세 ' + S.won(creditBase) + '에 ' + rate * 100 +
        '%를 적용해 ' + S.won(credit) + '을 세액공제 받고, 표준세액공제 13만원을 포기하는 계산입니다.'
      : '<strong>세액공제 요건을 충족하지 못합니다</strong>(' + (reasons.join(' · ') || '요건 미확인') +
        '). 이 경우 월세를 현금영수증(주택임차료)으로 발급받아 소득공제 30%에 넣는 편이 낫습니다.';
    if (weekend) {
      words += ' 2026년부터 세대주와 다른 시·군·구에 사는 무주택 배우자는 각자 공제받을 수 있고, 부부 합산 한도는 연 1,000만원입니다.';
    }
    K.verdict(words, eligible ? 'is-ok' : 'is-note');

    $('steps').innerHTML = K.steps([
      { t: '소득 요건과 공제율', e: '총급여 ' + S.comma(salary) + ' → <b>' + (rate * 100) + '%</b>',
        w: '5,500만원 이하 17%, 5,500만 초과~8,000만 이하 15%, 8,000만 초과 0%. 종합소득금액 요건도 함께 봅니다.' },
      { t: '주택 요건', e: '전용 ' + area + '㎡ ≤ ' + areaLimit + '㎡ ' + (areaOk ? '충족' : '미달') +
        ' / 기준시가 ' + S.comma(price) + '원 ' + (priceOk ? '충족' : '초과'),
        w: '면적과 기준시가 중 하나만 만족하면 됩니다. 주거용 오피스텔·고시원도 대상입니다.' },
      { t: '공제 대상 월세', e: 'min(' + S.comma(rent) + ', ' + S.comma(R.annualCap) + ') = <b>' + S.comma(creditBase) + '원</b>',
        w: '관리비·보증금은 제외하고 실제 납부한 월세만 봅니다.' },
      { t: '세액공제액', e: S.comma(creditBase) + ' × ' + (rate * 100) + '% = <b>' + S.comma(credit) + '원</b>',
        w: eligible ? '지방소득세 10%가 함께 줄어 실질 효과는 ' + S.comma(creditLocal) + '원입니다.' : '요건 미충족으로 0원 처리했습니다.' },
      { t: '표준세액공제 상실', e: '13만원 × 1.1 = <b>− ' + S.comma(standardLoss) + '원</b>',
        w: '월세 세액공제를 받으면 근로자 표준세액공제 13만원은 받을 수 없습니다.' },
      { t: '현금영수증 소득공제 비교', e: 'min(' + S.comma(rent) + ', 300만) × 30% × ' + (mrg * 100).toFixed(1) + '% = <b>' + S.comma(cashSave) + '원</b>',
        w: '총급여 25% 문턱과 카드 소득공제 한도는 이미 다른 지출로 채웠다고 가정했습니다.' }
    ]);

    K.mbar(bestCredit ? '세액공제 순절감' : '현금영수증 절감', S.won(best));
    K.copy('[월세 세액공제 vs 현금영수증 · ' + C.meta.asOfLabel + ' 기준]\n' +
      '총급여 ' + S.won(salary) + ' · 연 월세 ' + S.won(rent) + ' · 전용 ' + area + '㎡ · 기준시가 ' + S.won(price) + '\n' +
      '요건 ' + (eligible ? '충족' : '미충족') + ' → 세액공제 ' + S.won(credit) + ' (순절감 ' + S.won(creditNet) + ')\n' +
      '현금영수증 소득공제 절감 ' + S.won(cashSave) + '\n' +
      '유리한 쪽: ' + (bestCredit ? '월세 세액공제' : '현금영수증 소득공제'));
  }

  K.bindMoney(['r-salary', 'r-rent', 'r-price'], render);
  ['r-area'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9.]/g, '');
      render();
    });
  });
  ['r-nohouse', 'r-kids3', 'r-weekend'].forEach(function (id) {
    $(id).addEventListener('change', render);
  });
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
