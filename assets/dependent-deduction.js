(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var D = C.dependents;

  function plan() {
    var kids = parseInt(document.querySelector('.mini-tabs button[data-kids][aria-selected="true"]').getAttribute('data-kids'), 10) || 0;
    var parents = parseInt($('d-parents').value, 10) || 0;
    var seniors = Math.min(parseInt($('d-seniors').value, 10) || 0, parents);
    var units = [];
    for (var i = 0; i < kids; i++) units.push({ label: '자녀', amount: D.basic });
    for (var j = 0; j < parents; j++) units.push({ label: '부모', amount: D.basic });
    for (var k = 0; k < seniors; k++) units.push({ label: '경로우대', amount: D.senior });
    return { kids: kids, parents: parents, seniors: seniors, units: units };
  }

  function taxAll(salary, extra) {
    var base = K.salaryBase(salary, 1, extra);
    var tax = K.taxOf(base);
    return { base: base, tax: tax, total: Math.round(tax * 1.1) };
  }

  function combo(units, mask) {
    var a = 0, b = 0;
    units.forEach(function (u, i) {
      if (mask & (1 << i)) a += u.amount; else b += u.amount;
    });
    return { a: a, b: b };
  }

  function render() {
    var salaryA = K.money('d-salary-a');
    var salaryB = K.money('d-salary-b');
    var p = plan();
    var totalUnits = p.units.reduce(function (s, u) { return s + u.amount; }, 0);

    var allA = taxAll(salaryA, totalUnits);
    var allB = taxAll(salaryB, totalUnits);
    var baseA = taxAll(salaryA, 0);
    var baseB = taxAll(salaryB, 0);
    var costA = allA.total + baseB.total;
    var costB = allB.total + baseA.total;

    var best = { cost: Infinity, mask: 0, a: 0, b: 0 };
    for (var mask = 0; mask < (1 << p.units.length); mask++) {
      var sp = combo(p.units, mask);
      var cost = taxAll(salaryA, sp.a).total + taxAll(salaryB, sp.b).total;
      if (cost < best.cost) best = { cost: cost, mask: mask, a: sp.a, b: sp.b };
    }
    var optA = taxAll(salaryA, best.a);
    var optB = taxAll(salaryB, best.b);

    var rows =
      K.row('A 총급여', S.comma(salaryA)) +
      K.row('A 근로소득공제', '− ' + S.comma(K.wageDeduction(salaryA)), { sub: true }) +
      K.row('A 국민연금 (4.75%)', '− ' + S.comma(K.pensionAnnual(salaryA)), { sub: true }) +
      K.row('A 기본공제 (본인)', '− ' + S.comma(D.basic), { sub: true }) +
      K.row('A 배분 인적공제', '− ' + S.comma(best.a), { sub: true }) +
      K.row('A 과세표준', S.comma(optA.base)) +
      K.row('A 산출세액 (지방세 포함)', S.comma(optA.total)) +
      '<div class="dashed" style="margin:6px 0"></div>' +
      K.row('B 총급여', S.comma(salaryB)) +
      K.row('B 배분 인적공제', best.b ? '− ' + S.comma(best.b) : '0', { sub: true }) +
      K.row('B 과세표준', S.comma(optB.base)) +
      K.row('B 산출세액 (지방세 포함)', S.comma(optB.total));

    $('report-rows').innerHTML = rows;

    var saving = costA - best.cost;
    K.total(best.cost, {
      cap: '최적 배분 합산 세부담',
      tag: 'A + B · 지방소득세 포함',
      sub: saving > 0
        ? 'A 몰아주기(' + S.won(costA) + ')보다 ' + S.won(saving) + ' 적습니다.'
        : 'A 몰아주기와 같습니다. 두 사람의 한계세율이 비슷합니다.'
    });

    $('cmp-a-k').textContent = 'A 몰아주기';
    $('cmp-a-v').textContent = S.won(costA);
    $('cmp-a-d').textContent = Math.round(costA - best.cost) > 0 ? '최적보다 ' + S.won(costA - best.cost) + ' 많음' : '최적과 동일';
    $('cmp-a').className = 'col' + (costA === best.cost ? ' is-win' : '');

    $('cmp-b-k').textContent = 'B 몰아주기';
    $('cmp-b-v').textContent = S.won(costB);
    $('cmp-b-d').textContent = Math.round(costB - best.cost) > 0 ? '최적보다 ' + S.won(costB - best.cost) + ' 많음' : '최적과 동일';
    $('cmp-b').className = 'col' + (costB === best.cost ? ' is-win' : '');

    $('cmp-o-k').textContent = '최적 분산';
    $('cmp-o-v').textContent = S.won(best.cost);
    $('cmp-o-d').textContent = 'A ' + S.comma(best.a) + ' · B ' + S.comma(best.b);
    $('cmp-o').className = 'col is-win';

    $('opt-table-body').innerHTML = [
      { name: 'A 몰아주기', a: allA, b: baseB, cost: costA },
      { name: 'B 몰아주기', a: baseA, b: allB, cost: costB },
      { name: '최적 분산', a: optA, b: optB, cost: best.cost }
    ].map(function (o) {
      var win = o.cost === best.cost;
      return '<tr' + (win ? ' class="is-key"' : '') + '>' +
        '<td>' + o.name + (win ? '<span class="small">최소 세부담</span>' : '') + '</td>' +
        '<td class="num">' + S.comma(o.a.base) + '원</td>' +
        '<td class="num">' + S.comma(o.b.base) + '원</td>' +
        '<td class="num">' + S.comma(o.cost) + '원</td>' +
        '<td class="num">' + (o.cost === best.cost ? '—' : S.comma(o.cost - best.cost) + '원') + '</td>' +
        '</tr>';
    }).join('');

    var mrgA = Math.round(K.marginal(optA.base) * 1000) / 10;
    var mrgB = Math.round(K.marginal(optB.base) * 1000) / 10;
    var words;
    if (p.units.length === 0) {
      words = '자녀·부모님 수를 입력하면 A·B 중 누구에게 인적공제를 넣을 때 유리한지 계산합니다.';
    } else if (best.cost < Math.min(costA, costB)) {
      words = '공제를 한쪽에 몰아주기보다 <strong>나눠 넣는 편</strong>이 ' +
        S.won(Math.min(costA, costB) - best.cost) + ' 유리합니다. A ' + S.comma(best.a) +
        '원 · B ' + S.comma(best.b) + '원 배분입니다.';
    } else if (costB > costA) {
      words = 'A에게 몰아주는 편이 B에게 몰아주는 것보다 <strong>' + S.won(costB - costA) +
        '</strong> 유리합니다. 한계세율은 A ' + mrgA + '%, B ' + mrgB + '%입니다.';
    } else if (costA > costB) {
      words = 'B에게 몰아주는 편이 A에게 몰아주는 것보다 <strong>' + S.won(costA - costB) +
        '</strong> 유리합니다. 한계세율은 A ' + mrgA + '%, B ' + mrgB + '%입니다.';
    } else {
      words = '두 사람의 한계세율이 같아 배분에 따른 차이가 없습니다. 신고 편의대로 정하세요.';
    }
    words += ' 부모님은 만 60세 이상·소득 100만원 이하, 경로우대 추가공제는 만 70세 이상일 때 붙습니다.';
    K.verdict(words, saving > 0 || costB > costA || costA > costB ? 'is-ok' : 'is-note');

    $('steps').innerHTML = K.steps([
      { t: '총급여 → 근로소득공제', e: 'A ' + S.comma(K.wageDeduction(salaryA)) + ' · B ' + S.comma(K.wageDeduction(salaryB)) + '원',
        w: '근로소득공제는 총급여 구간별로 정해진 공식(2026년)을 적용했습니다.' },
      { t: '국민연금 공제', e: 'A ' + S.comma(K.pensionAnnual(salaryA)) + ' · B ' + S.comma(K.pensionAnnual(salaryB)) + '원',
        w: '근로자 부담 4.75%, 기준소득월액 상한 659만원을 반영했습니다.' },
      { t: '인적공제 묶음', e: '자녀 ' + p.kids + '명 + 부모 ' + p.parents + '명 + 경로우대 ' + p.seniors + '명 = <b>' + S.comma(totalUnits) + '원</b>',
        w: '기본공제 1인 150만원, 만 70세 이상 경로우대 1인 100만원.' },
      { t: '과세표준', e: '총급여 − 근로소득공제 − 연금 − 본인·배분 공제 = <b>A ' + S.comma(optA.base) + ' · B ' + S.comma(optB.base) + '원</b>' },
      { t: '산출세액', e: '누진세율 적용 → <b>A ' + S.comma(optA.tax) + ' · B ' + S.comma(optB.tax) + '원</b>',
        w: '여기에 지방소득세 10%를 더합니다.' },
      { t: '배분 비교', e: 'A 몰아주기 ' + S.comma(costA) + ' · B 몰아주기 ' + S.comma(costB) + ' · 최적 <b>' + S.comma(best.cost) + '원</b>',
        w: '가능한 모든 배분 조합을 계산해 합산 세부담이 가장 작은 안을 골랐습니다.' }
    ]);

    K.mbar('최적 배분 세부담', S.won(best.cost));
    K.copy('[맞벌이 인적공제 배분 · ' + C.meta.asOfLabel + ' 기준]\n' +
      'A 총급여 ' + S.won(salaryA) + ' · B 총급여 ' + S.won(salaryB) + '\n' +
      '자녀 ' + p.kids + '명 · 부모 ' + p.parents + '명(경로우대 ' + p.seniors + '명)\n' +
      'A 몰아주기 ' + S.won(costA) + ' · B 몰아주기 ' + S.won(costB) + '\n' +
      '최적 배분 ' + S.won(best.cost) + ' (A ' + S.won(best.a) + ' · B ' + S.won(best.b) + ' 배분)');
  }

  K.bindMoney(['d-salary-a', 'd-salary-b'], render);
  K.bindTabs('.mini-tabs button[data-kids]', 'data-kids', render);
  K.bindSelect('d-parents', render);
  K.bindSelect('d-seniors', render);
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
