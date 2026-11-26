/* 셈판 — 2026년 기준 상수
 * 법령·고시·금리가 바뀌면 이 파일만 수정하면 전 페이지에 반영됩니다.
 * 최종 확인: 2026-11-26
 */
window.LIFECALC = {
  meta: {
    brand: '셈판',
    tagline: '세무·주거 계산노트',
    asOf: '2026-11-26',
    asOfLabel: '2026.11.26'
  },

  /* 한국은행 기준금리 · 전월세전환율 (주택임대차보호법 제7조의2, 시행령 제9조) */
  lease: {
    baseRate: 3.25,          // 한국은행 기준금리 (%)
    statutoryAdd: 2.0,       // 시행령 제9조 가산 이율 (%p)
    absoluteCap: 10.0,       // 법정 상한 절대치 (%)
    marketRate: 6.5,         // 시장 전환율 기본값 (%)
    loanReviewRate: 6.5,     // HF·HUG 전세자금대출 심사 참고 (%)
    renewalCapRate: 0.05,    // 계약갱신 증액 상한 (5%)
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 주택임대차보호법 제7조의2 및 시행령 제9조',
      bok: 'https://www.bok.or.kr/portal/singl/baseRate/list.do?menuNo=200643',
      bokName: '한국은행 기준금리',
      hf: 'https://www.hf.go.kr/',
      hug: 'https://www.khug.or.kr/'
    }
  },

  /* 2026년 귀속 신용카드 등 사용금액 소득공제 (조세특례제한법 제126조의2) */
  card: {
    year: 2026,
    minimumUseRate: 0.25,        // 총급여 25% 문턱
    rates: {
      credit: 0.15,              // 신용카드 일반
      check: 0.30,               // 체크·직불·선불·현금영수증
      culture: 0.30,             // 도서·공연·영화·수영장·체력단련장 (총급여 7천만 이하)
      traditional: 0.40,         // 전통시장
      transit: 0.40              // 대중교통
    },
    cultureSalaryLimit: 70000000,
    cultureStartDate: '2025-07-01', // 수영장·체력단련장 시설이용료 포함 시점
    baseLimit: {
      under: { '0': 3000000, '1': 3500000, '2': 4000000 },
      over:  { '0': 2500000, '1': 2750000, '2': 3000000 }
    },
    extraLimit: {
      under: 3000000,            // 전통시장·대중교통·문화체육 합산
      over: 2000000              // 전통시장·대중교통 합산
    },
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 조세특례제한법 제126조의2',
      nts: 'https://www.nts.go.kr/',
      ntsName: '국세청 연말정산 안내',
      hometax: 'https://hometax.go.kr/'
    }
  },

  /* 소득세 한계세율 (소득세법 제55조) — 지방소득세 10% 포함 배율 */
  incomeTax: {
    localRate: 0.10,
    brackets: [
      { upTo: 14000000,   rate: 0.06, label: '6%' },
      { upTo: 50000000,   rate: 0.15, label: '15%' },
      { upTo: 88000000,   rate: 0.24, label: '24%' },
      { upTo: 150000000,  rate: 0.35, label: '35%' },
      { upTo: 300000000,  rate: 0.38, label: '38%' },
      { upTo: 500000000,  rate: 0.40, label: '40%' },
      { upTo: 1000000000, rate: 0.42, label: '42%' },
      { upTo: Infinity,   rate: 0.45, label: '45%' }
    ],
    /* 총급여 → 과세표준 개략 추정용 근로소득공제 (2026년 기준) */
    wageDeduction: [
      { upTo: 5000000,    base: 0,       rate: 0.70, min: 0 },
      { upTo: 15000000,   base: 3500000, rate: 0.40, min: 3500000 },
      { upTo: 45000000,   base: 7500000, rate: 0.15, min: 7500000 },
      { upTo: 100000000,  base: 12000000, rate: 0.05, min: 12000000 },
      { upTo: Infinity,   base: 14750000, rate: 0.02, min: 14750000 }
    ],
    basicDeduction: 1500000
  },

  /* 2026년 적용 최저임금 (고용노동부고시 제2025-47호) */
  wage: {
    year: 2026,
    hourly: 10320,
    daily8: 82560,
    monthly209: 2156880,      // 주 40시간 + 유급주휴 8시간, 월 209시간
    weeklyHolidayMinHours: 15, // 주 소정근로 15시간 이상
    weeksPerMonth: 4.345,     // 365 ÷ 7 ÷ 12
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 근로기준법 제55조, 근로자퇴직급여보장법',
      moel: 'https://www.minimumwage.go.kr/',
      moelName: '최저임금위원회 · 2026년 적용 최저임금 고시'
    }
  },

  /* 2026년 4대보험 근로자 부담 (국민연금법 부칙, 건강보험법 시행령 §44, 장기요양보험법 §9) */
  insurance: {
    pension: 0.0475,          // 국민연금 근로자 4.75% (총 9.5%)
    pensionCap: 6590000,      // 기준소득월액 상한 (2026.7~2027.6)
    pensionFloor: 410000,     // 기준소득월액 하한
    health: 0.03595,          // 건강보험 근로자 3.595% (총 7.19%)
    healthRate: 7.19,
    ltcRate: 0.9448,          // 장기요양보험료율 (건강보험료의 13.14%)
    employment: 0.009,        // 고용보험 실업급여 0.9%
    employeeTotal: 0.0972,    // 근로자 부담 합계 약 9.72%
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 국민연금법 부칙 §4, 국민건강보험법 시행령 §44',
      nhis: 'https://www.nhis.or.kr/',
      nhisName: '국민건강보험공단 2026년 보험료율 안내',
      nps: 'https://www.nps.or.kr/'
    }
  },

  /* 공인중개사법 시행규칙 별표1(주택)·별표2(오피스텔) 상한요율 — 2021.10.19 개정, 2026 현행 */
  brokerage: {
    sale: [
      { under: 50000000,   rate: 0.006, cap: 250000 },
      { under: 200000000,  rate: 0.005, cap: 800000 },
      { under: 900000000,  rate: 0.004, cap: 0 },
      { under: 1200000000, rate: 0.005, cap: 0 },
      { under: 1500000000, rate: 0.006, cap: 0 },
      { under: Infinity,   rate: 0.007, cap: 0 }
    ],
    lease: [
      { under: 50000000,   rate: 0.005, cap: 200000 },
      { under: 100000000,  rate: 0.004, cap: 300000 },
      { under: 600000000,  rate: 0.003, cap: 0 },
      { under: 1200000000, rate: 0.004, cap: 0 },
      { under: 1500000000, rate: 0.005, cap: 0 },
      { under: Infinity,   rate: 0.006, cap: 0 }
    ],
    officetel: { sale: 0.005, lease: 0.004, other: 0.009 },
    vat: 0.10,
    monthlyMultiplier: 100,
    monthlyMultiplierSmall: 70,
    monthlySmallThreshold: 50000000,
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 공인중개사법 §32, 시행규칙 §20 및 별표1·2',
      seoul: 'https://land.seoul.go.kr/land/broker/brokerageCommission.do',
      seoulName: '서울시 부동산 중개보수 요율표'
    }
  },

  /* 인지세법 §3·§6 — 소유권 이전 증서는 정액, 임대차 계약서는 비과세 */
  stamp: {
    bands: [
      { under: 10000000,  tax: 0 },
      { under: 30000000,  tax: 20000 },
      { under: 50000000,  tax: 40000 },
      { under: 100000000, tax: 70000 },
      { under: 1000000000, tax: 150000 },
      { under: Infinity,  tax: 350000 }
    ],
    housingExemptUpTo: 100000000, // 주택 소유권 이전 1억 이하 비과세
    loanExemptUpTo: 50000000,     // 금융기관 대출 약정 5천만 이하 비과세
    loanSplit: 0.5,               // 대출 인지세 은행·고객 50% 부담 관행
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 인지세법 §3, §6, §8',
      stamp: 'https://www.e-revenuestamp.or.kr/',
      stampName: '정부 전자수입인지'
    }
  },

  /* 전세보증금반환보증(HUG) 보증료율 — 2025.3.31 개편, 2026 현행 */
  guarantee: {
    rateDefault: 0.107,       // 아파트 · 부채비율 70% 이하 · 2억 초과 5억 이하
    rateMin: 0.097,
    rateMax: 0.211,
    years: 2,
    sources: {
      hug: 'https://www.khug.or.kr/hug/web/ig/dr/igdr000001.jsp',
      hugName: 'HUG 전세보증금반환보증 보증료율 안내',
      hf: 'https://www.hf.go.kr/'
    }
  },

  /* 2026년 귀속 월세 세액공제 (조세특례제한법 §95의2, 시행령 §95) */
  rentCredit: {
    salaryLimit: 80000000,       // 총급여 8,000만 이하
    highRate: 0.17,              // 총급여 5,500만 이하
    highSalaryLimit: 55000000,
    lowRate: 0.15,               // 5,500만 초과 ~ 8,000만 이하
    annualCap: 10000000,         // 연 1,000만원
    areaCap: 85,                 // 국민주택규모 전용 85㎡
    areaCap3Kids: 100,           // 기본공제 자녀 3명 이상 100㎡
    priceCap: 400000000,         // 기준시가 4억 이하
    standardDeduction: 130000,   // 월세 세액공제 적용 시 표준세액공제 13만원 상실
    cashReceiptRate: 0.30,       // 현금영수증 소득공제 30%
    cashReceiptLimit: 3000000,   // 기본한도 300만원 가정
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 조세특례제한법 §95의2, 시행령 §95',
      nts: 'https://nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=239025',
      ntsName: '국세청 월세액 세액공제 안내'
    }
  },

  /* 청약 가점제 (주택공급에 관한 규칙 별표1) */
  cheongyak: {
    max: 84,
    homelessMax: 32,
    dependentsMax: 35,
    accountMax: 17,
    /* 2025년도 도시근로자 가구원수별 월평균소득 (2026년 모집공고 적용) */
    income: { '3': 7533763, '4': 8802202, '5': 9326985, '6': 9906263 },
    incomeYear: 2025,
    sources: {
      rule: 'https://www.law.go.kr/',
      ruleName: '국가법령정보센터 · 주택공급에 관한 규칙 별표1',
      home: 'https://www.applyhome.co.kr/ap/apg/selectAddpntCalculatorView.do',
      homeName: '청약홈 청약가점 계산',
      special: 'https://www.applyhome.co.kr/ar/ara/selectSubscrptIntroSpetialView.do',
      specialName: '청약홈 특별공급 소득기준'
    }
  },

  /* 인적공제 (소득세법 §50·§51) */
  dependents: {
    basic: 1500000,
    senior: 1000000,      // 경로우대 (만 70세 이상) 추가공제
    disabled: 2000000,
    singleParent: 1000000,
    woman: 500000
  },

  /* 2026 육아휴직급여 (고용보험법 시행령 §95) */
  parental: {
    floor: 700000,               // 월 하한 70만원
    general: { firstCap: 2500000, secondCap: 2000000, lateCap: 1600000, lateRate: 0.8 },
    single: { firstCap: 3000000 },
    six: [2500000, 2500000, 3000000, 3500000, 4000000, 4500000], // 부모 각각 첫 6개월
    maxMonths: 12,
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 고용보험법 시행령 §95',
      work24: 'https://www.work24.go.kr/',
      work24Name: '고용24 육아휴직급여 안내'
    }
  },

  /* 프리랜서 3.3% 원천징수 · 종합소득세 (소득세법 §127, §55) */
  freelancer: {
    withholdingIncome: 0.03,
    withholdingLocal: 0.003,
    standardCredit: 70000,       // 사업소득 표준세액공제
    simpleExpenseRate: 0.60,     // 단순경비율 예시 (업종별로 다름)
    standardExpenseRate: 0.20,   // 기준경비율 예시
    simpleIncomeLimit: 24000000, // 직전연도 수입금액 기준 (업종별 차이)
    yellowUmbrellaCap: 5000000,
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 소득세법 §127, §55, 조특법 §86의3',
      nts: 'https://www.nts.go.kr/',
      ntsName: '국세청 종합소득세 신고 안내'
    }
  },

  /* 2026 부모급여·아동수당·첫만남이용권 (영유아보육법 §34의2, 아동수당법 §4) */
  childcare: {
    months: 24,                    // 0~23개월
    parent: {
      age0: 1000000,               // 0세 월 100만원
      age1: 500000,                // 1세 월 50만원
      daycareFee0: 584000,         // 0세 어린이집 보육료 바우처
      daycareFee1: 500000          // 1세 어린이집 보육료 바우처 (현금 차액 0)
    },
    allowance: {
      base: 100000,                // 월 10만원 (2026년 만 9세 미만)
      metro: 100000,
      nonMetro: 105000,            // 비수도권 10만 5천
      declining: 110000,           // 인구감소지역 11만
      special: 120000              // 특별지원 12만
    },
    firstMeet: {
      first: 2000000,              // 첫째 200만원
      second: 3000000              // 둘째 이상 300만원
    },
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 아동수당법 §4·§5, 영유아보육법 §34의2',
      mohw: 'https://www.mohw.go.kr/',
      mohwName: '보건복지부 2026년 부모급여·아동수당 안내',
      bokjiro: 'https://www.bokjiro.go.kr/',
      bokjiroName: '복지로 부모급여 신청',
      firstMeet: 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do',
      firstMeetName: '복지로 첫만남이용권 안내'
    }
  },

  /* 2026.1.1 개정 육아기 근로시간 단축 급여 (고용보험법 §75·시행령 §95) */
  reducedWork: {
    firstHours: 10,              // 최초 10시간 단축분 통상임금 100%
    firstRate: 1.0,
    firstCap: 2500000,           // 월 상한 250만원
    secondRate: 0.8,             // 나머지 단축분 80%
    secondCap: 1600000,          // 월 상한 160만원
    floor: 500000,               // 월 하한 50만원
    minHours: 15,                // 단축 후 주 15시간 이상
    maxHours: 35,                // 단축 후 주 35시간 이하
    childAgeLimit: 12,           // 만 12세 이하 또는 초등 6학년 이하
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 고용보험법 §75, 시행령 §95, 남녀고용평등법 §19의2',
      work24: 'https://www.work24.go.kr/',
      work24Name: '고용24 육아기 근로시간 단축 급여 안내',
      moel: 'https://www.moel.go.kr/',
      moelName: '고용노동부 육아기 근로시간 단축 제도 안내'
    }
  },

  /* 2026 신생아 특례대출 (디딤돌·버팀목) */
  newbornLoan: {
    birthFrom: '2023-01-01',     // 2년 내 출산 (2023.1.1 이후 출생아)
    incomeLimit: { single: 130000000, dual: 200000000 },
    dualEachLimit: 130000000,
    assetLimit: { didimdol: 511000000, buteokmok: 345000000 },
    priceLimit: { didimdol: 900000000, buteokmok: { metro: 500000000, local: 400000000 } },
    loanCap: { didimdol: 400000000, buteokmok: 240000000 },
    rate: {
      didimdol: { min: 1.8, max: 4.5, floor: 1.2 },
      buteokmok: { min: 1.3, max: 4.3, floor: 1.0, localCut: 0.2 }
    },
    /* 소득 구간별 기준금리 — 디딤돌(구입) / 버팀목(전세) */
    tiers: [
      { upTo: 20000000,  didimdol: 1.8, buteokmok: 1.3 },
      { upTo: 40000000,  didimdol: 2.4, buteokmok: 1.9 },
      { upTo: 60000000,  didimdol: 3.0, buteokmok: 2.5 },
      { upTo: 85000000,  didimdol: 3.6, buteokmok: 3.2 },
      { upTo: 100000000, didimdol: 4.1, buteokmok: 3.8 },
      { upTo: Infinity,  didimdol: 4.5, buteokmok: 4.3 }
    ],
    preferentialMax: 0.5,
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 주택도시기금법, 주택도시기금 대출 취급 기준',
      nhuf: 'https://nhuf.molit.go.kr/',
      nhufName: '주택도시기금 신생아 특례대출 안내',
      hf: 'https://www.hf.go.kr/',
      hfName: 'HF 주택도시기금 수탁은행 안내'
    }
  },

  /* 퇴직금·퇴직소득세 (근로자퇴직급여보장법 §8, 소득세법 §48·§55) */
  severance: {
    dayDivisor: 30.4167,          // 365 ÷ 12 — 1일 평균임금 환산
    minServiceYears: 1,           // 근속 1년 미만은 1년으로 봄
    /* 근속연수공제 (2023년 상향) */
    serviceDeduction: {
      base: 1000000,              // 5년 이하 연 100만
      tier1: { years: 5, add: 5000000, perYear: 2000000 },   // 10년 이하 500만 + 200만×(년-5)
      tier2: { years: 10, add: 15000000, perYear: 2500000 }, // 20년 이하 1,500만 + 250만×(년-10)
      tier3: { years: 20, add: 40000000, perYear: 3000000 }  // 20년 초과 4,000만 + 300만×(년-20)
    },
    /* 환산급여공제 */
    convertedDeduction: [
      { upTo: 8000000,    rate: 1.0,  add: 0 },
      { upTo: 70000000,   rate: 0.6,  add: 8000000 },
      { upTo: 100000000,  rate: 0.55, add: 45200000 },
      { upTo: 300000000,  rate: 0.45, add: 61700000 },
      { upTo: Infinity,   rate: 0.35, add: 151700000 }
    ],
    /* 기본세율 누진공제액 */
    progressive: [0, 0, 0, 1260000, 5760000, 15440000, 19940000, 25940000, 35940000, 65940000],
    localRate: 0.10,
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 근로자퇴직급여보장법 §8, 소득세법 §48·§55',
      nts: 'https://www.nts.go.kr/',
      ntsName: '국세청 퇴직소득세 계산 안내',
      moel: 'https://www.moel.go.kr/',
      moelName: '고용노동부 퇴직금 계산 안내'
    }
  },

  /* 대출 상환방식 비교 (원리금균등·원금균등·만기일시) */
  loanRepay: {
    methods: ['equal-payment', 'equal-principal', 'bullet'],
    sources: {
      law: 'https://www.law.go.kr/',
      lawName: '국가법령정보센터 · 은행법, 여신전문금융업법',
      fss: 'https://www.fss.or.kr/',
      fssName: '금융감독원 금리·상환방식 안내',
      hf: 'https://www.hf.go.kr/',
      hfName: 'HF 주택담보대출 상환방식 안내'
    }
  },

  /* 계산기 라인업 (홈 디렉터리 공용) */
  calculators: [
    { id: 'jeonwolse', no: '01', cat: 'realty', title: '전월세 전환율 · 5% 갱신 상한',
      desc: '전세를 반전세로 돌릴 때의 법정 월세와, 계약갱신에서 오를 수 있는 월세 상한을 계산합니다.',
      meta: '주택임대차보호법 §7의2 · 기준금리 3.25%', href: 'jeonwolse.html', ready: true },
    { id: 'card-ratio', no: '02', cat: 'tax', title: '신용카드 · 체크카드 황금비율',
      desc: '총급여 25% 문턱과 남은 기간 지출 계획으로 소득공제액과 절세액을 비교합니다.',
      meta: '조세특례제한법 §126의2 · 2026년 귀속', href: 'card-ratio.html', ready: true },
    { id: 'jeonse-vs-wolse', no: '03', cat: 'realty', title: '전세 vs 반전세 손익 비교',
      desc: '전세대출 이자와 월세 세액공제까지 넣어 연간 실질 주거비를 나란히 놓고 봅니다.',
      meta: '주거비 비교 · 세액공제 반영', href: 'jeonse-vs-wolse.html', ready: true },
    { id: 'move-budget', no: '04', cat: 'realty', title: '이사 · 입주 필요 현금',
      desc: '중개보수 법정 상한, 등기·인지세, 보증보험료까지 계약일에 필요한 현금을 한 번에 뽑습니다.',
      meta: '공인중개사법 §32 · 인지세법 §3', href: 'move-in-budget.html', ready: true },
    { id: 'cheongyak', no: '05', cat: 'realty', title: '청약 가점 · 특별공급 자가진단',
      desc: '84점 만점 가점을 계산하고 신혼·생애최초·신생아 특공 요건을 함께 확인합니다.',
      meta: '주택공급에 관한 규칙 별표1', href: 'subscription-score.html', ready: true },
    { id: 'dependent-split', no: '06', cat: 'tax', title: '맞벌이 부양가족 몰아주기',
      desc: '부모님·자녀 인적공제를 남편과 아내 중 누구에게 넣을 때 환급이 큰지 비교합니다.',
      meta: '소득세법 §50 · §51', href: 'dependent-deduction.html', ready: true },
    { id: 'wolse-credit', no: '07', cat: 'tax', title: '월세 세액공제 vs 현금영수증',
      desc: '요건을 채우지 못한 월세를 현금영수증 소득공제로 돌렸을 때와 비교합니다.',
      meta: '조특법 §95의2 · 총급여 8,000만 이하', href: 'rent-deduction.html', ready: true },
    { id: 'freelancer-33', no: '08', cat: 'tax', title: '프리랜서 3.3% 정산',
      desc: '원천징수된 기납부세액과 결정세액을 비교해 5월 환급액 또는 추가납부액을 가늠합니다.',
      meta: '소득세법 §127 · 경비율', href: 'freelancer-tax.html', ready: true },
    { id: 'parental-leave', no: '09', cat: 'care', title: '2026 육아휴직 급여 · 6+6',
      desc: '월별 수령액과 부부 합산 총수령액을 사후지급금 폐지 기준으로 계산합니다.',
      meta: '고용보험법 시행령 §95', href: 'parental-leave.html', ready: true },
    { id: 'weekly-allowance', no: '10', cat: 'work', title: '주휴수당 · 알바 실수령액',
      desc: '주 15시간 기준 주휴수당과 4대보험·3.3% 공제 방식별 실수령액을 비교합니다.',
      meta: '최저임금 10,320원 · 4대보험 9.72%', href: 'weekly-holiday-pay.html', ready: true },
    { id: 'newborn-loan', no: '11', cat: 'realty', title: '신생아 특례대출 자격 · 금리',
      desc: '2년 내 출산 가구의 디딤돌·버팀목 자격을 체크하고 적용 금리와 월 상환액을 계산합니다.',
      meta: '주택도시기금 · 소득·순자산·주택가격 요건', href: 'newborn-loan.html', ready: true },
    { id: 'childcare-support', no: '12', cat: 'care', title: '부모급여 · 아동수당 24개월 총액',
      desc: '부모급여·아동수당·첫만남이용권을 0~23개월 월별로 합산해 현금과 바우처를 나눠 보여 줍니다.',
      meta: '아동수당법 §4 · 2026년 지급액', href: 'childcare-support.html', ready: true },
    { id: 'reduced-work-pay', no: '13', cat: 'care', title: '2026 육아기 근로시간 단축 급여',
      desc: '최초 10시간 100%·나머지 80% 개정 기준으로 회사 급여와 정부 급여를 합산합니다.',
      meta: '고용보험법 §75 · 2026.1.1 개정', href: 'reduced-work-pay.html', ready: true },
    { id: 'severance-tax', no: '14', cat: 'work', title: '퇴직금 · 퇴직소득세 실수령',
      desc: '법정 퇴직금과 근속연수·환산급여 공제를 적용해 퇴직소득세를 뺀 실수령액을 계산합니다.',
      meta: '근로자퇴직급여보장법 §8 · 소득세법 §48', href: 'severance-tax.html', ready: true },
    { id: 'loan-repayment', no: '15', cat: 'work', title: '대출 상환방식 총이자 비교',
      desc: '원리금균등·원금균등·만기일시의 첫 달 납입액과 총이자, 절감액을 나란히 비교합니다.',
      meta: '거치기간 반영 · 연차별 잔액', href: 'loan-repayment.html', ready: true }
  ]
};
