(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;

  var RC = C.rentCredit;

  function creditRate(salary) {
    if (salary <= RC.highSalaryLimit) return RC.highRate;
    if (salary <= RC.salaryLimit) return RC.lowRate;
    return 0;
  }

  function render() {
    var jeonse = K.money('j-jeonse');
    var loan = Math.min(K.money('j-loan'), jeonse);
    var loanRate = K.pct('j-loan-rate', 4.0);
    var deposit = K.money('j-deposit');
    var monthly = K.money('j-monthly');
    var salary = K.money('j-salary');
    var opp = K.pct('j-opp', 3.5);
    var useCredit = K.checked('j-credit') && creditRate(salary) > 0;

    var equity = Math.max(0, jeonse - loan);
    var interest = loan * loanRate / 100;
    var oppJeonse = equity * opp / 100;
    var costJeonse = interest + oppJeonse;

    var annualRent = monthly * 12;
    var oppWolse = deposit * opp / 100;
    var rate = creditRate(salary);
    var creditBase = Math.min(annualRent, RC.annualCap);
    var credit = useCredit ? Math.round(creditBase * rate) : 0;
    var costWolse = annualRent + oppWolse - credit;

    var yearlyDiff = costJeonse - costWolse;
    var monthlyJeonse = Math.round(costJeonse / 12);
    var monthlyWolse = Math.round(costWolse / 12);

    /* 손익분기 월세: 반전세 연 실질부담 = 전세 연 실질부담 */
    var gap = costJeonse - oppWolse;
    var breakeven = 0;
    if (gap > 0) {
      var t = useCredit ? rate : 0;
      breakeven = gap / (12 * (1 - t));
      if (breakeven * 12 > RC.annualCap && useCredit) {
        breakeven = (gap + RC.annualCap * t) / 12;
      }
      breakeven = Math.round(breakeven);
    }

    var rows =
      K.row('전세 자기자본 (보증금 − 대출)', S.comma(equity)) +
      K.row('전세대출 이자 (연 ' + loanRate + '%)', S.comma(interest)) +
      K.row('현금 기회비용 (연 ' + opp + '%)', S.comma(oppJeonse)) +
      K.row('전세 연 실질 주거비', S.comma(costJeonse)) +
      '<div class="dashed" style="margin:6px 0"></div>' +
      K.row('반전세 보증금 기회비용', S.comma(oppWolse)) +
      K.row('반전세 연 월세 (' + S.comma(monthly) + ' × 12)', S.comma(annualRent)) +
      K.row('월세 세액공제 (' + (credit ? rate * 100 : 0) + '% · ' + S.comma(creditBase) + ')',
        credit ? '− ' + S.comma(credit) : '0', { sub: true }) +
      K.row('반전세 연 실질 주거비', S.comma(costWolse));

    $('report-rows').innerHTML = rows;

    K.total(breakeven, {
      cap: '손익분기 월세',
      tag: '이 월세보다 비싸면 전세가 유리',
      sub: '전세 연 실질부담 ' + S.won(costJeonse) + ' ÷ 12 기준 · ' +
        (useCredit ? '월세 세액공제 ' + rate * 100 + '% 반영' : '세액공제 미반영')
    });

    $('cmp-jeonse').textContent = S.won(monthlyJeonse);
    $('cmp-wolse').textContent = S.won(monthlyWolse);
    $('cmp-jeonse-d').textContent = '연 ' + S.won(Math.round(costJeonse)) + ' · 대출이자 ' + S.comma(interest);
    $('cmp-wolse-d').textContent = '연 ' + S.won(Math.round(costWolse)) + ' · 세액공제 ' + S.comma(credit);
    $('cmp-jeonse-col').className = 'col' + (yearlyDiff > 0 ? '' : ' is-win');
    $('cmp-wolse-col').className = 'col' + (yearlyDiff > 0 ? ' is-win' : '');

    var cheaper = yearlyDiff > 0 ? '반전세' : (yearlyDiff < 0 ? '전세' : '두 조건');
    var diffAbs = Math.abs(Math.round(yearlyDiff));

    if (monthly <= 0 && deposit <= 0) {
      K.verdict('반전세 조건을 입력하면 전세와의 실질 주거비 차이와 손익분기 월세를 계산합니다.', 'is-note');
    } else if (Math.abs(yearlyDiff) < 1000) {
      K.verdict('두 조건의 연 실질 주거비가 사실상 같습니다. 보증금 반환 위험·계약 기간·금리 변동을 함께 보세요.', 'is-note');
    } else {
      K.verdict('<strong>' + cheaper + '가 연 ' + S.won(diffAbs) + ' (월 ' + S.comma(Math.round(diffAbs / 12)) +
        '원) 유리</strong>합니다. 현재 월세 ' + S.won(monthly) + '는 손익분기 월세 ' + S.won(breakeven) +
        (monthly <= breakeven ? '보다 낮습니다.' : '보다 높습니다.') +
        (useCredit ? ' 월세 세액공제 ' + S.comma(credit) + '원을 반영했습니다.' : ''),
        yearlyDiff > 0 ? 'is-ok' : '');
    }

    $('steps').innerHTML = K.steps([
      { t: '전세 자기자본', e: S.comma(jeonse) + ' − ' + S.comma(loan) + ' = <b>' + S.comma(equity) + '원</b>',
        w: '대출로 마련한 금액을 뺀, 내 돈이 묶이는 부분입니다.' },
      { t: '전세 연 비용', e: '대출이자 ' + S.comma(interest) + ' + 기회비용 ' + S.comma(oppJeonse) + ' = <b>' + S.comma(costJeonse) + '원</b>',
        w: '기회비용은 자기자본을 다른 곳에 두었다면 받을 수 있었던 수익(연 ' + opp + '%)입니다.' },
      { t: '월세 세액공제 요건', e: '총급여 ' + S.comma(salary) + '원 → 공제율 <b>' + (rate * 100) + '%</b>',
        w: '총급여 5,500만 이하 17%, 8,000만 이하 15%, 초과 0%. 무주택·면적·기준시가 요건은 별도로 충족해야 합니다.' },
      { t: '반전세 연 비용', e: S.comma(annualRent) + ' + ' + S.comma(oppWolse) + ' − 세액공제 ' + S.comma(credit) + ' = <b>' + S.comma(costWolse) + '원</b>',
        w: '월세는 연 1,000만원까지만 공제 대상입니다.' },
      { t: '연·월 차액', e: S.comma(costJeonse) + ' − ' + S.comma(costWolse) + ' = <b>' + S.comma(yearlyDiff) + '원</b>',
        w: '월 환산 ' + S.comma(monthlyJeonse) + '원 vs ' + S.comma(monthlyWolse) + '원' },
      { t: '손익분기 월세', e: '(전세 연비용 − 보증금 기회비용) ÷ (12 × (1 − 공제율)) = <b>' + S.comma(breakeven) + '원</b>',
        w: '이 월세보다 비싸면 전세가, 싸면 반전세가 유리해지는 지점입니다.' }
    ]);

    var scenarios = [400000, 500000, 600000, 700000, 800000, 1000000];
    $('scenario-body').innerHTML = scenarios.map(function (m) {
      var c = m <= RC.annualCap / 12 ? Math.round(m * 12 * (useCredit ? rate : 0)) : Math.round(RC.annualCap * (useCredit ? rate : 0));
      var w = m * 12 + oppWolse - c;
      var d = costJeonse - w;
      return '<tr' + (Math.abs(m - monthly) < 1 ? ' class="is-key"' : '') + '>' +
        '<td class="num">' + S.comma(m) + '원</td>' +
        '<td class="num">' + S.comma(m * 12) + '원</td>' +
        '<td class="num">' + S.comma(w) + '원</td>' +
        '<td class="num">' + (d > 0 ? '전세 ' : (d < 0 ? '반전세 ' : '')) + S.comma(Math.abs(d)) + '원</td>' +
        '</tr>';
    }).join('');

    K.mbar('손익분기 월세', S.won(breakeven));
    K.copy('[전세 vs 반전세 · ' + C.meta.asOfLabel + ' 기준]\n' +
      '전세보증금 ' + S.won(jeonse) + ' · 대출 ' + S.won(loan) + ' (' + loanRate + '%) · 기회비용 ' + opp + '%\n' +
      '전세 연 실질부담 ' + S.won(Math.round(costJeonse)) + ' (월 ' + S.won(monthlyJeonse) + ')\n' +
      '반전세 보증금 ' + S.won(deposit) + ' · 월세 ' + S.won(monthly) + ' · 세액공제 ' + S.won(credit) + '\n' +
      '반전세 연 실질부담 ' + S.won(Math.round(costWolse)) + ' (월 ' + S.won(monthlyWolse) + ')\n' +
      '손익분기 월세 ' + S.won(breakeven) + ' · 유리: ' + cheaper);
  }

  K.bindMoney(['j-jeonse', 'j-loan', 'j-deposit', 'j-monthly', 'j-salary'], render);
  ['j-loan-rate', 'j-opp'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9.]/g, '');
      render();
    });
  });
  $('j-credit').addEventListener('change', render);
  $('btn-print').addEventListener('click', function () { window.print(); });
  $('j-salary').addEventListener('input', function () {
    var salary = K.money('j-salary');
    var box = $('j-credit');
    box.disabled = salary > RC.salaryLimit;
    if (box.disabled) box.checked = false;
  });

  render();
})();
