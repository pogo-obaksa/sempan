(function () {
  'use strict';

  var S = window.SEM;
  var K = window.KIT;
  var C = window.LIFECALC;
  var $ = K.$;
  var B = C.brokerage;

  var state = { mode: 'sale', type: 'house' };

  var PRICE_LABEL = {
    sale: '매매가',
    lease: '전세보증금',
    monthly: '월세 보증금'
  };

  var PRICE_HINT = {
    sale: '매매 계약서상 금액',
    lease: '보증금 전액',
    monthly: '보증금 (월세 제외)'
  };

  function brokerFee(deal, kind) {
    if (state.type === 'officetel') {
      var r = kind === 'sale' ? B.officetel.sale : B.officetel.lease;
      return { rate: r, fee: Math.floor(deal * r), cap: 0, capped: false };
    }
    var table = kind === 'sale' ? B.sale : B.lease;
    for (var i = 0; i < table.length; i++) {
      if (deal < table[i].under) {
        var raw = Math.floor(deal * table[i].rate);
        var capped = table[i].cap > 0 && raw > table[i].cap;
        return {
          rate: table[i].rate,
          fee: capped ? table[i].cap : raw,
          cap: table[i].cap,
          capped: capped
        };
      }
    }
    return { rate: 0, fee: 0, cap: 0, capped: false };
  }

  function stampTax(amount) {
    for (var i = 0; i < C.stamp.bands.length; i++) {
      if (amount <= C.stamp.bands[i].under) return C.stamp.bands[i].tax;
    }
    return C.stamp.bands[C.stamp.bands.length - 1].tax;
  }

  function acquisitionTax(price) {
    var rate;
    if (price <= 600000000) rate = 0.01;
    else if (price <= 900000000) rate = 0.01 + (price - 600000000) / 300000000 * 0.02;
    else rate = 0.03;
    return Math.round(price * rate * 1.1); // 지방교육세 10% 포함
  }

  function render() {
    var price = K.money('m-price');
    var monthly = K.money('m-monthly');
    var loan = K.money('m-loan');
    var reserve = K.money('m-reserve');
    var insure = K.checked('m-insure') && state.mode !== 'sale';
    var gRate = K.pct('m-guarantee-rate', C.guarantee.rateDefault);

    var mult = B.monthlyMultiplier;
    if (state.mode === 'monthly' && price + monthly * mult < B.monthlySmallThreshold) {
      mult = B.monthlyMultiplierSmall;
    }
    var deal = state.mode === 'monthly' ? price + monthly * mult : price;

    var contract = Math.round(price * 0.1);
    var balance = Math.max(0, deal - contract - loan);
    var feeInfo = brokerFee(deal, state.mode === 'sale' ? 'sale' : 'lease');
    var vat = Math.round(feeInfo.fee * B.vat);
    var stamp = state.mode === 'sale'
      ? ((state.type === 'house' && price <= C.stamp.housingExemptUpTo) ? 0 : stampTax(price))
      : 0;
    var deed = state.mode === 'sale' ? Math.round(price * 0.0024 + 300000) : 0;
    var guarantee = insure ? Math.round(price * gRate / 100 * C.guarantee.years) : 0;
    var firstRent = state.mode === 'monthly' ? monthly : 0;

    var extra = feeInfo.fee + vat + stamp + deed + guarantee + reserve + firstRent;
    var total = Math.max(0, price - loan) + extra;
    var contractDay = contract + stamp;
    var balanceDay = balance + feeInfo.fee + vat + deed + guarantee + reserve + firstRent;

    $('m-price-label').innerHTML = PRICE_LABEL[state.mode] + ' <span class="unit-hint">' + PRICE_HINT[state.mode] + '</span>';
    $('m-monthly-wrap').hidden = state.mode !== 'monthly';
    $('m-insure-wrap').hidden = state.mode === 'sale';
    $('m-guarantee-wrap').hidden = !insure;

    $('report-rows').innerHTML =
      K.row('거래금액' + (state.mode === 'monthly' ? ' (보증금 + 월세 × ' + mult + ')' : ''), S.comma(deal)) +
      K.row('계약금 (10%)', S.comma(contract)) +
      K.row('잔금 (거래금액 − 계약금 − 대출)', S.comma(balance)) +
      K.row('대출 예정액', '− ' + S.comma(loan), { sub: true }) +
      '<div class="dashed" style="margin:6px 0"></div>' +
      K.row('중개보수 상한 (' + (feeInfo.rate * 100).toFixed(1) + '%' + (feeInfo.capped ? ' · 한도 적용' : '') + ')', S.comma(feeInfo.fee)) +
      K.row('중개보수 부가세 (10%)', S.comma(vat), { sub: true }) +
      K.row('인지세 (내 부담분)', state.mode === 'sale' ? S.comma(stamp) : '0') +
      K.row('등기·부대비용 (추정)', S.comma(deed)) +
      K.row('보증보험료 (' + C.guarantee.years + '년 · 연 ' + gRate + '%)', S.comma(guarantee)) +
      (state.mode === 'monthly' ? K.row('첫 달 월세', S.comma(firstRent)) : '') +
      K.row('이사·청소·도배 예비비', S.comma(reserve));

    K.total(total, {
      cap: '지금 필요한 총 현금',
      tag: state.mode === 'sale' ? '매매 · 자기자금 기준' : (state.mode === 'lease' ? '전세 · 보증금 기준' : '월세 · 보증금 기준'),
      sub: '거래금액 ' + S.korean(deal) + ' − 대출 ' + S.korean(loan) + ' + 부대비용 ' + S.korean(extra) +
        (state.mode === 'sale' ? ' · 취득세는 잔금일 별도' : '')
    });

    $('cmp-contract').textContent = S.won(contractDay);
    $('cmp-balance').textContent = S.won(balanceDay);
    $('cmp-contract-d').textContent = '계약금 ' + S.comma(contract) + ' + 인지세 ' + S.comma(stamp);
    $('cmp-balance-d').textContent = '잔금 ' + S.comma(balance) + ' + 부대비용 ' + S.comma(feeInfo.fee + vat + deed + guarantee + reserve + firstRent);

    var words = [];
    if (state.mode === 'sale' && state.type === 'house') {
      words.push('취득세(지방교육세 포함) 약 <strong>' + S.won(acquisitionTax(price)) +
        '</strong>는 잔금일에 별도 납부합니다. 이 계산기의 합계에는 넣지 않았습니다.');
    } else if (state.mode === 'sale') {
      words.push('오피스텔 취득세는 주택과 다른 세율(4.6% 등)이 적용될 수 있어 이 계산에 넣지 않았습니다. 잔금 전 세율을 따로 확인하세요.');
    } else {
      words.push('인지세는 임대차 계약서에 붙지 않습니다. 전세보증금반환보증 보증료는 계약기간 ' +
        C.guarantee.years + '년치를 한 번에 내는 금액입니다.');
    }
    if (feeInfo.capped) {
      words.push('중개보수는 법정 한도액 ' + S.won(feeInfo.cap) + '이 적용됩니다.');
    }
    words.push('중개보수는 상한요율일 뿐이며, 실제 금액은 이 범위 안에서 협의해 정합니다.');
    K.verdict(words.join(' '), state.mode === 'sale' ? 'is-note' : 'is-ok');

    $('steps').innerHTML = K.steps([
      { t: '거래금액 확정', e: state.mode === 'monthly'
        ? S.comma(price) + ' + ' + S.comma(monthly) + ' × ' + mult + ' = <b>' + S.comma(deal) + '원</b>'
        : '<b>' + S.comma(deal) + '원</b>',
        w: state.mode === 'monthly' ? '월세 거래금액은 보증금 + (월세 × 100), 5천만원 미만이면 월세 × 70으로 다시 계산합니다.' : '매매가 또는 전세보증금 그대로입니다.' },
      { t: '계약금', e: S.comma(price) + ' × 10% = <b>' + S.comma(contract) + '원</b>',
        w: '관행상 10%지만 계약서에 적힌 금액이 우선입니다.' },
      { t: '중개보수 상한', e: S.comma(deal) + ' × ' + (feeInfo.rate * 100).toFixed(1) + '%' +
        (feeInfo.capped ? ' → 한도 ' + S.comma(feeInfo.cap) : '') + ' = <b>' + S.comma(feeInfo.fee) + '원</b>',
        w: '부가가치세 10%는 별도입니다. ' + (state.type === 'officetel' ? '오피스텔은 매매 0.5%·임대차 0.4% 상한입니다.' : '주택 요율표(2021.10.19 개정)를 적용했습니다.') },
      { t: '인지세', e: state.mode === 'sale' ? '기재금액 ' + S.comma(price) + ' → <b>' + S.comma(stamp) + '원</b>' : '<b>0원</b>',
        w: state.mode === 'sale' ? '주택 소유권 이전 1억 이하 비과세, 1억 초과~10억 15만원, 10억 초과 35만원입니다. 계약서 1통 기준.' : '임대차 계약서는 인지세 과세문서가 아닙니다.' },
      { t: '등기·부대비용 (추정)', e: state.mode === 'sale' ? S.comma(price) + ' × 0.24% + 30만원 = <b>' + S.comma(deed) + '원</b>' : '<b>0원</b>',
        w: '등록면허세 0.2% + 지방교육세 0.04%에 국민주택채권·등기수수료·법무사 보수를 30만원으로 잡은 개략치입니다.' },
      { t: '보증보험료', e: insure ? S.comma(price) + ' × ' + gRate + '% × ' + C.guarantee.years + '년 = <b>' + S.comma(guarantee) + '원</b>' : '<b>0원</b>',
        w: 'HUG 전세보증금반환보증 요율은 연 0.097~0.211%입니다. 할인·할증과 심사 결과에 따라 달라집니다.' }
    ]);

    K.mbar('총 필요 현금', S.won(total));
    K.copy('[이사·입주 필요 현금 · ' + C.meta.asOfLabel + ' 기준]\n' +
      '거래: ' + (state.mode === 'sale' ? '매매' : state.mode === 'lease' ? '전세' : '월세') +
      ' · ' + (state.type === 'officetel' ? '오피스텔' : '주택') + '\n' +
      '거래금액 ' + S.won(deal) + ' · 계약금 ' + S.won(contract) + ' · 대출 ' + S.won(loan) + '\n' +
      '중개보수 ' + S.won(feeInfo.fee) + ' (부가세 ' + S.won(vat) + ')\n' +
      '인지세 ' + S.won(stamp) + ' · 등기 ' + S.won(deed) + ' · 보증보험 ' + S.won(guarantee) + '\n' +
      '총 필요 현금 ' + S.won(total));
  }

  K.bindMode('.segmented button[data-mode]', function (mode) {
    state.mode = mode;
    render();
  });

  K.bindTabs('.mini-tabs button[data-type]', 'data-type', function (type) {
    state.type = type;
    render();
  });

  K.bindMoney(['m-price', 'm-monthly', 'm-loan', 'm-reserve'], render);
  ['m-guarantee-rate'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9.]/g, '');
      render();
    });
  });
  $('m-insure').addEventListener('change', render);
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
