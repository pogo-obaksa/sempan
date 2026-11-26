(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var CY = C.cheongyak;

  function homelessPoints(y) {
    if (!(y > 0)) return 0;
    if (y < 1) return 2;
    return Math.min(CY.homelessMax, 2 * Math.floor(y) + 2);
  }

  function depPoints(n) {
    if (n >= 6) return CY.dependentsMax;
    return 5 + n * 5;
  }

  function accountPoints(y) {
    if (!(y > 0)) return 0;
    if (y < 0.5) return 1;
    if (y < 1) return 2;
    return Math.min(CY.accountMax, Math.floor(y) + 2);
  }

  function gauge(fillId, pctId, value, max) {
    var pct = Math.min(100, value / max * 100);
    var fill = $(fillId);
    var label = $(pctId);
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = value + ' / ' + max + '점';
  }

  function mark(ok, yes, no, unknown) {
    if (ok === null) return '<span class="mark">' + unknown + '</span>';
    return ok
      ? '<span class="mark is-ok">' + yes + '</span>'
      : '<span class="mark is-no">' + no + '</span>';
  }

  function render() {
    var years = parseFloat(String($('c-homeless').value).replace(/[^0-9.]/g, ''));
    if (!isFinite(years)) years = 0;
    var deps = parseInt($('c-dependents').value, 10) || 0;
    var acc = parseFloat(String($('c-account').value).replace(/[^0-9.]/g, ''));
    if (!isFinite(acc)) acc = 0;
    var baby = K.checked('c-baby');
    var marry = $('c-marry').value;
    var incomePct = parseInt($('c-income').value, 10) || 100;
    var household = $('c-household').value;

    var h = homelessPoints(years);
    var d = depPoints(deps);
    var a = accountPoints(acc);
    var total = h + d + a;

    $('report-rows').innerHTML =
      K.row('무주택기간 ' + years + '년', '<b>' + h + '</b><small>점</small>', { unit: false }) +
      K.row('부양가족 ' + deps + '명', '<b>' + d + '</b><small>점</small>', { unit: false }) +
      K.row('청약통장 ' + acc + '년', '<b>' + a + '</b><small>점</small>', { unit: false }) +
      '<div class="dashed" style="margin:6px 0"></div>' +
      K.row('배우자 통장 합산 여부', '최대 3점 추가', { sub: true, unit: false }) +
      K.row('만점', CY.max + '점', { sub: true, unit: false });

    K.total(total, {
      cap: '청약 가점 합계',
      tag: CY.max + '점 만점',
      unit: '점',
      sub: '무주택 ' + h + ' + 부양가족 ' + d + ' + 통장 ' + a + '점 · 배우자 통장 3점은 별도'
    });

    gauge('g-homeless-fill', 'g-homeless-pct', h, CY.homelessMax);
    gauge('g-dep-fill', 'g-dep-pct', d, CY.dependentsMax);
    gauge('g-account-fill', 'g-account-pct', a, CY.accountMax);

    var base = CY.income[household] || CY.income['3'];
    var incomeLimit = Math.round(base * incomePct / 100);
    $('income-ref').innerHTML = CY.incomeYear + '년도 도시근로자 월평균소득(가구원 ' + household + '인) ' +
      S.comma(base) + '원 × ' + incomePct + '% = <strong>월 ' + S.comma(incomeLimit) + '원 이하</strong>';

    var married7 = marry === 'married7';
    var married = marry !== 'single';
    var incomeOk = incomePct <= 160;
    var incomeOkPriority = incomePct <= 120;

    var rows = [];
    rows.push('<li><span class="who">신혼부부</span><span class="req">혼인 7년 이내' +
      '<small>미혼이면 신청할 수 없습니다</small></span>' + mark(married7, '충족', '미해당') + '</li>');
    rows.push('<li><span class="who">신혼부부</span><span class="req">무주택 세대구성원' +
      '<small>세대원 전원이 주택·분양권을 소유하지 않아야 합니다</small></span>' + mark(years > 0, '충족', '확인 필요') + '</li>');
    rows.push('<li><span class="who">신혼부부</span><span class="req">소득 160% 이하' +
      '<small>우선공급은 외벌이 100%·맞벌이 120%, 일반공급은 140%·160%</small></span>' + mark(incomeOk, '충족', '초과', '확인') + '</li>');

    rows.push('<li><span class="who">생애최초</span><span class="req">세대 전원 무주택' +
      '<small>과거 주택 소유 이력이 없어야 합니다</small></span>' + mark(years > 0, '충족', '확인 필요') + '</li>');
    rows.push('<li><span class="who">생애최초</span><span class="req">소득 160% 이하' +
      '<small>민영주택 기준. 국민주택은 130%</small></span>' + mark(incomeOk, '충족', '초과') + '</li>');
    rows.push('<li><span class="who">생애최초</span><span class="req">5년 이상 소득세 납부' +
      '<small>근로·사업소득이 있는 세대원 기준</small></span>' + mark(null, '', '', '확인') + '</li>');

    rows.push('<li><span class="who">신생아</span><span class="req">2세 미만 자녀' +
      '<small>입양·임신 중인 경우 포함</small></span>' + mark(baby, '충족', '미해당') + '</li>');
    rows.push('<li><span class="who">신생아</span><span class="req">혼인 중 또는 미혼 자녀' +
      '<small>한부모·미혼 출산 가구 포함</small></span>' + mark(married, '충족', '미해당') + '</li>');
    rows.push('<li><span class="who">신생아</span><span class="req">소득 160% 이하' +
      '<small>우선공급은 130% 이하</small></span>' + mark(incomeOk, '충족', '초과') + '</li>');
    $('checklist').innerHTML = rows.join('');

    var words;
    if (total >= 60) {
      words = '<strong>' + total + '점</strong>은 가점제 상위권입니다. 같은 단지·평형의 당첨선과 함께 보세요.';
    } else if (total >= 45) {
      words = '<strong>' + total + '점</strong>은 중위권입니다. 부양가족 인정 요건(3년 이상 같은 등본)을 다시 확인하면 점수가 달라질 수 있습니다.';
    } else {
      words = '<strong>' + total + '점</strong>은 특별공급 병행이 현실적입니다. 아래 체크리스트에서 충족 항목을 확인하세요.';
    }
    if (!married7 && !baby) {
      words += ' 현재 조건으로는 신혼부부·신생아 특공 모두 해당하지 않습니다.';
    }
    if (incomePct > 160) {
      words += ' 소득이 160%를 넘으면 특별공급 대부분이 어렵고, 추첨 물량(부동산가액 3억 3,100만원 이하)만 남습니다.';
    }
    K.verdict(words, total >= 60 ? 'is-ok' : 'is-note');

    $('steps').innerHTML = K.steps([
      { t: '무주택기간 점수', e: years + '년 → <b>' + h + '점</b>',
        w: '1년 미만 2점, 이후 1년마다 2점, 15년 이상 32점. 만 30세 또는 그 전 혼인신고일부터 셉니다.' },
      { t: '부양가족 점수', e: deps + '명 → <b>' + d + '점</b>',
        w: '0명 5점에서 1명마다 5점, 6명 이상 35점. 직계존속은 3년 이상 같은 주민등록표에 있어야 합니다.' },
      { t: '청약통장 점수', e: acc + '년 → <b>' + a + '점</b>',
        w: '6개월 미만 1점, 6개월~1년 2점, 이후 1년마다 1점, 15년 이상 17점.' },
      { t: '가점 합계', e: h + ' + ' + d + ' + ' + a + ' = <b>' + total + '점</b>',
        w: '배우자 통장 가입기간의 50%를 최대 3점까지 더할 수 있습니다(합산 17점 한도).' },
      { t: '특별공급 소득 기준', e: '월평균소득 ' + S.comma(base) + '원의 <b>' + incomePct + '%</b> = ' + S.comma(incomeLimit) + '원',
        w: '가구원 수와 비율에 따라 금액이 달라집니다. 모집공고문의 기준 연도를 확인하세요.' }
    ]);

    K.mbar('청약 가점', total + '점');
    K.copy('[청약 가점 · ' + C.meta.asOfLabel + ' 기준]\n' +
      '무주택 ' + years + '년 ' + h + '점 · 부양가족 ' + deps + '명 ' + d + '점 · 통장 ' + acc + '년 ' + a + '점\n' +
      '합계 ' + total + ' / ' + CY.max + '점\n' +
      '특별공급 소득 기준 ' + incomePct + '% = 월 ' + S.comma(incomeLimit) + '원');
  }

  ['c-homeless', 'c-account'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9.]/g, '');
      render();
    });
  });
  ['c-dependents', 'c-marry', 'c-income', 'c-household'].forEach(function (id) {
    K.bindSelect(id, render);
  });
  $('c-baby').addEventListener('change', render);
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
