(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var NL = C.newbornLoan;

  function typeNow() {
    var btn = document.querySelector('.segmented button[aria-selected="true"]');
    return btn ? btn.getAttribute('data-mode') : 'didimdol';
  }

  function monthlyPayment(principal, annualRate, months) {
    var i = annualRate / 100 / 12;
    if (i <= 0) return Math.round(principal / months);
    return Math.round(principal * i / (1 - Math.pow(1 + i, -months)));
  }

  function tierRate(income, kind) {
    for (var i = 0; i < NL.tiers.length; i++) {
      if (income <= NL.tiers[i].upTo) return NL.tiers[i][kind];
    }
    return NL.rate[kind].max;
  }

  function render() {
    var type = typeNow();
    var isD = type === 'didimdol';
    var dual = $('n-dual').value === 'dual';
    var income = K.money('n-income');
    var asset = K.money('n-asset');
    var price = K.money('n-price');
    var loan = K.money('n-loan');
    var region = $('n-region').value;
    var years = parseInt($('n-years').value, 10) || 30;
    var pref = parseFloat($('n-pref').value) || 0;
    var nohouse = $('n-nohouse').checked;
    var birth = $('n-birth').checked;

    var incomeLimit = dual ? NL.incomeLimit.dual : NL.incomeLimit.single;
    var assetLimit = isD ? NL.assetLimit.didimdol : NL.assetLimit.buteokmok;
    var priceLimit = isD ? NL.priceLimit.didimdol
      : (region === 'metro' ? NL.priceLimit.buteokmok.metro : NL.priceLimit.buteokmok.local);
    var loanCap = isD ? NL.loanCap.didimdol : NL.loanCap.buteokmok;

    $('n-price-label').textContent = isD ? '주택가격' : '보증금';
    $('n-price-help').textContent = isD
      ? '디딤돌은 주택가격 9억원 이하입니다.'
      : '버팀목은 보증금 ' + (region === 'metro' ? '수도권 5억원' : '비수도권 4억원') + ' 이하입니다.';

    var checks = [
      { who: '출산', req: '2년 내 출산 (2023.1.1 이후 출생아)', ok: birth, note: birth ? '출생아 있음' : '출생아 없음' },
      { who: '소득', req: (dual ? '맞벌이' : '외벌이') + ' ' + S.korean(incomeLimit) + ' 이하', ok: income <= incomeLimit, note: '신청 소득 ' + S.korean(income) },
      { who: '자산', req: '순자산 ' + S.korean(assetLimit) + ' 이하', ok: asset <= assetLimit, note: '신청 순자산 ' + S.korean(asset) },
      { who: '주택', req: isD ? '주택가격 9억원 이하' : '보증금 ' + S.korean(priceLimit) + ' 이하', ok: price <= priceLimit, note: (isD ? '주택가격 ' : '보증금 ') + S.korean(price) },
      { who: '무주택', req: '무주택 세대', ok: nohouse, note: nohouse ? '세대 전원 무주택' : '주택 보유' }
    ];
    var okCount = checks.filter(function (c) { return c.ok; }).length;
    var eligible = okCount === checks.length;

    $('checklist').innerHTML = checks.map(function (c) {
      return '<li><span class="who">' + c.who + '</span>' +
        '<span class="req">' + c.req + '<small>' + c.note + '</small></span>' +
        '<span class="mark ' + (c.ok ? 'is-ok' : 'is-no') + '">' + (c.ok ? '충족' : '미충족') + '</span></li>';
    }).join('');

    var baseRate = tierRate(income, isD ? 'didimdol' : 'buteokmok');
    var localCut = (!isD && region === 'local') ? NL.rate.buteokmok.localCut : 0;
    var conf = isD ? NL.rate.didimdol : NL.rate.buteokmok;
    var rate = Math.max(conf.floor, baseRate - localCut - pref);
    rate = Math.round(rate * 100) / 100;

    var applied = Math.min(loan, loanCap);
    var capped = loan > loanCap;
    var months = years * 12;
    var monthly = monthlyPayment(applied, rate, months);
    var totalPay = monthly * months;
    var interest = totalPay - applied;

    var rows = K.row('대상 상품', isD ? '디딤돌 (구입자금)' : '버팀목 (전세자금)', { unit: false });
    rows += K.row('자격 요건', okCount + ' / ' + checks.length + ' 충족', { unit: false, sub: true });
    rows += K.row('부부합산 소득', S.comma(income));
    rows += K.row('순자산', S.comma(asset));
    rows += K.row(isD ? '주택가격' : '보증금', S.comma(price));
    rows += '<div class="dashed" style="margin:6px 0"></div>';
    rows += K.row('기준금리 (' + (isD ? '디딤돌' : '버팀목') + ')', '연 ' + baseRate + '%', { unit: false });
    if (localCut) rows += K.row('비수도권 인하', '− ' + localCut + '%p', { unit: false, sub: true });
    if (pref) rows += K.row('우대금리', '− ' + pref + '%p', { unit: false, sub: true });
    rows += K.row('적용 금리', '연 ' + rate + '%', { unit: false });
    rows += K.row('대출금액' + (capped ? ' (한도 적용)' : ''), S.comma(applied), { sub: capped });
    rows += K.row('기간', years + '년 · ' + months + '개월', { unit: false, sub: true });
    rows += K.row('월 상환액', S.comma(monthly));
    rows += K.row('총 이자', S.comma(interest));
    rows += K.row('총 상환액', S.comma(totalPay));

    $('report-rows').innerHTML = rows;

    K.total(monthly, {
      cap: '월 상환액 (원리금균등)',
      tag: '연 ' + rate + '% · ' + years + '년',
      sub: '대출 ' + S.won(applied) + ' · 총 이자 ' + S.won(interest) + ' · 총 상환 ' + S.won(totalPay)
    });

    var words;
    if (!eligible) {
      var miss = checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.who; });
      words = '<strong>' + miss.join('·') + '</strong> 요건이 맞지 않아 신청이 어렵습니다. ' +
        '그래도 조건을 바꿨을 때의 금리·상환액은 위와 같이 계산됩니다.';
      K.verdict(words, 'is-note');
    } else {
      words = '자격 요건 <strong>' + checks.length + '가지를 모두 충족</strong>합니다. 적용 금리 연 ' + rate + '%로 ' + years + '년 원리금균등 상환 시 월 <strong>' +
        S.won(monthly) + '</strong>, 총 이자는 ' + S.won(interest) + '입니다.';
      K.verdict(words, 'is-ok');
    }
    if (dual && income > NL.dualEachLimit) {
      $('verdict-text').innerHTML += ' 맞벌이는 부부 각각 1억 3천만원 이하여야 하므로, 한쪽 소득이 이를 넘으면 요건을 다시 확인하세요.';
    }
    if (capped) {
      $('verdict-text').innerHTML += ' 신청 금액이 한도 ' + S.korean(loanCap) + '을 넘어 한도까지만 계산했습니다.';
    }

    $('steps').innerHTML = K.steps([
      { t: '출산·무주택 요건', e: (birth ? '2023.1.1 이후 출생아 <b>충족</b>' : '출생아 <b>없음</b>') + ' · ' + (nohouse ? '무주택 <b>충족</b>' : '무주택 <b>미충족</b>'),
        w: '신생아 특례대출은 2년 내 출산한 무주택 세대가 대상입니다.' },
      { t: '소득 요건', e: (dual ? '맞벌이 2억' : '외벌이 1.3억') + ' 이하 → ' + S.comma(income) + '원 ' + (income <= incomeLimit ? '<b>충족</b>' : '<b>초과</b>'),
        w: '맞벌이는 부부 각각 1억 3천만원 이하 조건이 함께 붙습니다.' },
      { t: '자산·주택 요건', e: '순자산 ' + S.comma(assetLimit) + ' · ' + (isD ? '주택가격 9억' : '보증금 ' + S.comma(priceLimit)) + ' 이하',
        w: '디딤돌과 버팀목의 순자산·주택가격 기준이 서로 다릅니다.' },
      { t: '적용 금리', e: '기준 ' + baseRate + '%' + (localCut ? ' − ' + localCut + '%p' : '') + (pref ? ' − ' + pref + '%p' : '') + ' = <b>연 ' + rate + '%</b>',
        w: '하한(디딤돌 1.2%·버팀목 1.0%)보다 낮아지지 않습니다.' },
      { t: '대출금액 한도', e: S.comma(loan) + ' → 한도 ' + S.comma(loanCap) + ' → <b>' + S.comma(applied) + '원</b>',
        w: '디딤돌 최대 4억원, 버팀목 최대 2억 4천만원입니다.' },
      { t: '월 상환액', e: S.comma(applied) + ' × 연 ' + rate + '% ÷ ' + months + '개월(원리금균등) = <b>' + S.comma(monthly) + '원</b>',
        w: '총 이자 ' + S.comma(interest) + '원, 총 상환액 ' + S.comma(totalPay) + '원입니다.' }
    ]);

    K.mbar('월 상환액', S.won(monthly));
    K.copy('[신생아 특례대출 · ' + C.meta.asOfLabel + ' 기준]\n' +
      (isD ? '디딤돌(구입)' : '버팀목(전세)') + ' · 요건 ' + okCount + '/' + checks.length + ' 충족\n' +
      '소득 ' + S.won(income) + ' · 순자산 ' + S.won(asset) + ' · ' + (isD ? '주택가격 ' : '보증금 ') + S.won(price) + '\n' +
      '적용 금리 연 ' + rate + '% · 대출 ' + S.won(applied) + ' · ' + years + '년\n' +
      '월 상환액 ' + S.won(monthly) + ' · 총 이자 ' + S.won(interest));
  }

  K.bindTabs('.segmented button[data-mode]', 'data-mode', render);
  K.bindMoney(['n-income', 'n-asset', 'n-price', 'n-loan'], render);
  ['n-dual', 'n-region', 'n-years', 'n-pref'].forEach(function (id) {
    $(id).addEventListener('change', render);
  });
  ['n-nohouse', 'n-birth'].forEach(function (id) {
    $(id).addEventListener('change', render);
  });
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
