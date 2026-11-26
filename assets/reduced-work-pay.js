(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var RW = C.reducedWork;

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function num(id) {
    var n = parseFloat(String($(id).value || '').replace(/[^0-9.]/g, ''));
    return isFinite(n) ? n : 0;
  }

  function render() {
    var wage = K.money('rw-wage');
    var before = Math.max(1, num('rw-before'));
    var after = Math.max(0, num('rw-after'));
    var reduced = Math.max(0, before - after);

    var firstHours = Math.min(reduced, RW.firstHours);
    var restHours = Math.max(0, reduced - RW.firstHours);

    var part1 = reduced > 0 ? clamp(wage * RW.firstRate * firstHours / before, RW.floor, RW.firstCap) : 0;
    var part2 = restHours > 0 ? clamp(wage * RW.secondRate * restHours / before, RW.floor, RW.secondCap) : 0;
    var govRaw = Math.round(part1 + part2);

    var company = Math.round(wage * after / before);
    var cap = Math.max(0, wage - company);
    var cut = Math.max(0, govRaw - cap);
    var gov = govRaw - cut;
    var total = company + gov;
    var gap = total - wage;

    var rows = K.row('단축 전 통상임금', S.comma(wage));
    rows += K.row('주 소정근로시간', before + '시간 → ' + after + '시간', { unit: false, sub: true });
    rows += K.row('최초 ' + RW.firstHours + '시간 단축분 (100%)', S.comma(part1));
    rows += K.row('나머지 ' + restHours + '시간 단축분 (80%)', restHours ? S.comma(part2) : '0', { sub: !restHours });
    rows += K.row('정부 급여 합계', S.comma(govRaw));
    if (cut > 0) rows += K.row('통상임금 초과 감액', '− ' + S.comma(cut), { sub: true });
    rows += '<div class="dashed" style="margin:6px 0"></div>';
    rows += K.row('회사 급여 (' + after + '/' + before + ')', S.comma(company));
    rows += K.row('월 총 수령액', S.comma(total));
    $('report-rows').innerHTML = rows;

    K.total(total, {
      cap: '월 총 수령액',
      tag: before + ' → ' + after + '시간',
      sub: '회사 급여 ' + S.won(company) + ' + 정부 급여 ' + S.won(gov) +
        ' · 단축 전 대비 ' + (gap < 0 ? '− ' + S.comma(Math.abs(gap)) : '0') + '원'
    });

    $('cmp-before-v').textContent = S.won(wage);
    $('cmp-before-d').textContent = '주 ' + before + '시간 · 100%';
    $('cmp-after-v').textContent = S.won(total);
    $('cmp-after-d').textContent = '회사 ' + S.comma(company) + ' + 정부 ' + S.comma(gov);
    $('cmp-before').className = 'col' + (gap === 0 ? ' is-win' : '');
    $('cmp-after').className = 'col' + (gap === 0 ? ' is-win' : '');

    var eligible = after >= RW.minHours && after <= RW.maxHours && after < before;
    var words;
    if (!eligible) {
      words = '단축 후 근로시간이 <strong>주 ' + RW.minHours + '~' + RW.maxHours + '시간</strong> 범위를 벗어나 지원 대상이 아닙니다. ' +
        '대상 여부와 별개로, 단축 후 회사 급여는 ' + S.won(company) + '입니다.';
      K.verdict(words, 'is-note');
    } else {
      words = '주 ' + before + '시간에서 ' + after + '시간으로 줄이면 정부 급여 <strong>' + S.won(gov) +
        '</strong>에 회사 급여 ' + S.won(company) + '을 더해 월 <strong>' + S.won(total) + '</strong>입니다.' +
        (gap === 0 ? ' 최초 10시간 100% 덕분에 단축 전 통상임금과 같습니다.' : ' 단축 전보다 ' + S.won(Math.abs(gap)) + ' 줄어듭니다.');
      K.verdict(words, 'is-ok');
    }
    if (after > 35) {
      $('verdict-text').innerHTML += ' 단축 후 시간이 35시간을 넘으면 지원 대상이 아닙니다.';
    }

    $('steps').innerHTML = K.steps([
      { t: '단축 시간', e: before + ' − ' + after + ' = <b>' + reduced + '시간</b>',
        w: '주 소정근로시간에서 단축 후 시간을 뺀 값이 정부 급여 계산의 기준이 됩니다.' },
      { t: '최초 10시간분 (100%)', e: '통상임금 × 10 ÷ ' + before + ' → 상한 250만·하한 50만 → <b>' + S.comma(Math.round(part1)) + '원</b>',
        w: '2026년 개정으로 최초 10시간 단축분은 통상임금의 100%를 지급합니다.' },
      { t: '나머지 단축분 (80%)', e: '통상임금 × 80% × ' + restHours + ' ÷ ' + before + ' → 상한 160만·하한 50만 → <b>' + S.comma(Math.round(part2)) + '원</b>',
        w: '10시간을 넘는 단축분에만 80%를 적용하고, 별도 상한 160만원을 둡니다.' },
      { t: '정부 급여 합계', e: S.comma(Math.round(part1)) + ' + ' + S.comma(Math.round(part2)) + ' = <b>' + S.comma(govRaw) + '원</b>',
        w: '두 구간을 더한 뒤 회사 급여와 합쳐 통상임금을 넘지 않는지 확인합니다.' },
      { t: '회사 급여와 감액', e: '회사 ' + S.comma(company) + ' + 정부 ' + S.comma(govRaw) + ' → 초과 ' + S.comma(cut) + ' 감액',
        w: '합계가 단축 전 통상임금을 넘으면 넘는 만큼 정부 급여에서 뺍니다.' },
      { t: '월 총 수령액', e: S.comma(company) + ' + ' + S.comma(gov) + ' = <b>' + S.comma(total) + '원</b>',
        w: '단축 전 통상임금 ' + S.comma(wage) + '원과 비교해 ' + S.comma(Math.abs(gap)) + '원 차이입니다.' }
    ]);

    K.mbar('월 총 수령액', S.won(total));
    K.copy('[육아기 근로시간 단축 급여 · ' + C.meta.asOfLabel + ' 기준]\n' +
      '통상임금 ' + S.won(wage) + ' · 주 ' + before + '→' + after + '시간\n' +
      '정부 급여 ' + S.won(gov) + ' (최초 10시간 ' + S.won(part1) + ' + 나머지 ' + S.won(part2) + ')\n' +
      '회사 급여 ' + S.won(company) + ' · 월 합계 ' + S.won(total));
  }

  K.bindMoney(['rw-wage'], render);
  ['rw-before', 'rw-after'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9.]/g, '');
      render();
    });
  });
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
