# 셈판 — 세무·주거 계산노트 (15종 · 운영 중)

한국 부동산·연말정산·출산육아·근로금융 틈새 계산기 사이트입니다. 계산기 **15종**, 정책 페이지 3종, SEO 파일, **원클릭 예시 프리셋·연관 계산기 추천·입력값 자동 이어받기**까지 갖춘 정적 사이트입니다.

- **운영 주소**: https://pogo-obaksa.github.io/sempan/
- **배포 저장소**: `pogo-obaksa/sempan` (GitHub Pages, `main` 브랜치 `/`)
- 기준일: **2026.11.26** · 2026년 귀속·2026년 고시 기준

## 구성

```
web/life-calc/
├─ index.html                  홈 — 15종 디렉터리, 4개 카테고리 필터, 기준 요약
├─ [부동산·임대차 5종]
│  ├─ jeonwolse.html           01 전월세 전환율 · 5% 갱신 상한
│  ├─ jeonse-vs-wolse.html     03 전세 vs 반전세 손익 비교
│  ├─ move-in-budget.html      04 이사 · 입주 필요 현금
│  ├─ subscription-score.html  05 청약 가점 · 특별공급 자가진단
│  └─ newborn-loan.html        11 신생아 특례대출 자격 · 금리
├─ [연말정산·세금 4종]
│  ├─ card-ratio.html          02 신용카드 · 체크카드 황금비율
│  ├─ dependent-deduction.html 06 맞벌이 부양가족 몰아주기
│  ├─ rent-deduction.html      07 월세 세액공제 vs 현금영수증
│  └─ freelancer-tax.html      08 프리랜서 3.3% 정산
├─ [출산·육아 3종]
│  ├─ parental-leave.html      09 2026 육아휴직 급여 · 6+6
│  ├─ childcare-support.html   12 부모급여 · 아동수당 · 첫만남이용권 24개월 총액
│  └─ reduced-work-pay.html    13 2026 육아기 근로시간 단축 급여
├─ [근로·생활금융 3종]
│  ├─ weekly-holiday-pay.html  10 주휴수당 · 알바 실수령액
│  ├─ severance-tax.html       14 퇴직금 · 퇴직소득세 실수령
│  └─ loan-repayment.html      15 대출 상환방식(원리금균등·원금균등·만기일시) 총이자
├─ privacy.html · terms.html · disclaimer.html   정책 3종 (문의 redfilm24@gmail.com)
├─ sitemap.xml                 계산기 15 + 정책 3 + 홈 = 19 URL
├─ robots.txt                  /sempan/ 허용 · preview·tools 차단 · 사이트맵 위치
├─ data/constants-2026.js      기준금리·세율·요율·최저임금·상한 (전 페이지 공유)
├─ assets/site.css             디자인 시스템 (영수증 패널·프리셋·연관 카드·모바일 바·정책 문서·이어받기 안내)
├─ assets/site.js              숫자 포맷, 홈 필터(해시 연동), 모바일 바, 예시 프리셋, 복사, 입력값 이어받기
├─ assets/calc-kit.js          새 계산기 공용 렌더링 (행·단계·판정·합계)
├─ assets/<slug>.js            계산기별 로직 15종
├─ tools/run-verify.sh         /sempan/ 서브경로로 로컬 서버 기동 → 검증 → 종료
├─ tools/verify.py             Playwright 전수 검증·스크린샷 (400여 개 체크)
├─ tools/examples.py           실전 예시표 생성(gen)·검산(check) — 표 숫자를 페이지 JS로 다시 계산해 대조
├─ tools/apply-ga.py           GA4 측정 ID를 19페이지 <head>에 삽입·교체
├─ tools/check-ga.py           GA4 태그·이벤트 전용 검증 (13항목)
├─ tools/detail-shots.py       요소 단위 확대 캡처
└─ preview/                    PC·모바일 스크린샷, verify-report.json
```

`preview/`와 `tools/`는 배포물에서 제외합니다(`.gitignore` 및 배포 스크립트 화이트리스트).

## 실행

```sh
# 로컬에서 바로 볼 때
cd web/life-calc
python3 -m http.server 8123
# http://127.0.0.1:8123/index.html

# 배포와 같은 /sempan/ 서브경로로 볼 때
mkdir -p /tmp/siteroot && cp -R web/life-calc /tmp/siteroot/sempan
cd /tmp/siteroot && python3 -m http.server 8124
# http://127.0.0.1:8124/sempan/index.html
```

## 검증

```sh
sh web/life-calc/tools/run-verify.sh
```

- 로컬 서버를 **`/sempan/` 서브경로**로 띄워 GitHub Pages와 같은 경로 구조에서 확인합니다.
- 홈: 15행·바로가기 15개·필터 5/4/3/3·해시 필터(`#f-tax`, `#f-care`, `#f-work`)·canonical/og:url 배포 주소.
- 계산기 15종: 기본 합계 → 입력 변경 후 합계, 단계별 산출식 5~7단계, 법령 출처 3건 이상, FAQ 5문항, 합계 캡션, 모바일 바 값 일치.
- 새 계산기 구조: 부모급여 24개월 표 24행, 대출 연차별 잔액 30행, 3방식 비교 열, 신생아 자격 체크 5항목, 퇴직금 날짜 입력 모드.
- **입력값 이어받기**: 연관 카드 클릭 시 URL에 `?jeonse=400000000` 형태로 전달 → 도착 페이지 자동 채움·재계산·"이어받음" 안내. 직접 쿼리(`?wage=4000000&hours2=25`)와 잘못된 값 무시까지 확인.
- **연관 카드**: 계산기마다 3장, 명세서 아래·FAQ 위(DOM 순서).
- 정책 3종: 제목·h1·본문 5개 이상 섹션·상호 링크·운영자 메일·모바일 바 미생성.
- 모바일 390px: 19페이지 가로 넘침 0건, 계산기 15종 하단 고정 바 노출·값 일치·클릭 시 합계로 스크롤.
- **내부 링크 전수**: 모든 페이지의 상대경로 `.html` 링크 HTTP 200, 루트 절대경로(`/...`) 0건.
- 정적 파일: `example.com` 잔존 0건, `sitemap.xml` 19 URL 전부 배포 주소, `robots.txt` 경로·사이트맵 확인.
- 콘솔 에러 0건, 요청 실패 0건. 결과는 `preview/verify-report.json`.

## 방문 통계 (GA4)

- 측정 ID: **`G-FY7JKTCH7W`** (속성 `셈판 - 세무·주거 계산노트`, 스트림 `https://pogo-obaksa.github.io/sempan/`)
- 19개 HTML `<head>`의 viewport 메타 바로 뒤에 `gtag.js` 스니펫이 들어 있습니다. ID를 바꾸려면 `python3 tools/apply-ga.py G-새ID`만 다시 실행하면 19페이지가 한 번에 갱신됩니다.
- `file://` 및 로컬 검증 서버(`localhost`·`127.0.0.1`·`::1`)에서는 `ga-disable-G-FY7JKTCH7W`로 전송을 끕니다. 검증 트래픽이 실제 통계에 섞이지 않습니다.
- 기록 이벤트(`assets/site.js`, `gtag` 없으면 조용히 통과): `page_view`(자동) · `calc_run`(입력 변경 0.8초 디바운스, `page`·`changes`) · `preset_click`(`preset` 이름) · `related_click`(`from`·`to`) · `copy_result` · `mbar_click` · `filter_click`(홈 카테고리).
- GA 전용 검증: `LD_LIBRARY_PATH=/workspace/scratch/sysroot/usr/lib/x86_64-linux-gnu python3 tools/check-ga.py`

### 실전 예시표 검산

계산기 15종에는 각 1개의 **실전 계산 예시표**(`table.data.example`)와 3개의 **질문형 H2**(`.detail-body h2.q`)가 있습니다.

```sh
LD_LIBRARY_PATH=/workspace/scratch/sysroot/usr/lib/x86_64-linux-gnu python3 tools/examples.py check
```

- 각 표 행은 `data-in` 속성에 그 값을 만든 입력값(JSON)을, 각 열 머리글은 `data-check` 속성에 값을 읽어 올 위치(`#total-amount`, `#report-rows|행 라벨`)를 들고 있습니다.
- `check`는 그 입력값을 자체 서버(8129)의 페이지에 다시 넣고 `data-check` 위치에서 값을 읽어 표의 숫자와 **1원 단위까지** 대조합니다(15페이지 · 196셀).
- 표 숫자를 바꿀 때는 `gen`으로 다시 생성합니다(마커 `<!-- EXAMPLE:START -->`~`<!-- EXAMPLE:END -->` 사이를 교체). 입력 시나리오는 `SPECS`에 있습니다.
- 390px에서 예시표는 `table-wrap` 안에서 넘치지 않습니다(`min-width: 0` + 560px 이하 축소 서체).

## 값 갱신

`data/constants-2026.js` 한 파일만 고치면 15페이지에 반영됩니다.

| 상수 | 현재 값 | 근거 |
| --- | --- | --- |
| `lease.baseRate` | 3.25% | 한국은행 기준금리 (2026.11.26 공표) |
| `lease.statutoryAdd` / `absoluteCap` | 2.0%p / 10% | 주택임대차보호법 §7의2 · 시행령 §9 |
| `card.rates` | 신용 15 · 체크 30 · 전통시장·대중교통 40 · 문화체육 30 | 조특법 §126의2 |
| `wage.hourly` | 10,320원 (월 2,156,880원 · 209시간) | 고용노동부고시 제2025-47호 |
| `insurance.*` | 연금 4.75 · 건강 3.595 · 장기요양 건보료의 13.14% · 고용 0.9% (합 9.72%) | 2026년 요율 |
| `brokerage` / `stamp` / `guarantee` | 중개보수 상한 · 인지세 · HUG 보증료율 | 공인중개사법 시행규칙, 인지세법, HUG |
| `rentCredit` | 8,000만 이하 · 17%/15% · 1,000만 한도 | 조특법 §95의2 |
| `cheongyak` | 84점 만점 · 도시근로자 월평균소득 | 주택공급에 관한 규칙 별표1 |
| `parental` | 250/200/160만 · 하한 70만 · 6+6 250~450만 | 고용보험법 시행령 §95 |
| `childcare` | 부모급여 0세 100만·1세 50만, 아동수당 10만(지역 10.5~12만), 첫만남 200/300만 | 아동수당법 §4, 영유아보육법 §34의2 |
| `reducedWork` | 최초 10시간 100%(250만), 나머지 80%(160만), 하한 50만 | 고용보험법 §75 · 2026.1.1 개정 |
| `newbornLoan` | 소득 1.3억/2억 · 순자산 5.11억/3.45억 · 한도 4억/2.4억 · 금리 1.8~4.5 / 1.3~4.3 | 주택도시기금 신생아 특례대출 |
| `severance` | 근속연수공제·환산급여공제(2023 상향)·누진공제 | 소득세법 §48·§55 |
| `freelancer` | 원천징수 3.3% · 표준세액공제 7만 · 노란우산 500만 | 소득세법 §127 · 조특법 §86의3 |

## 새 계산기 5종 계산 로직 요약

11. **신생아 특례대출**: 출산·소득·순자산·주택가격·무주택 5요건 체크 → 소득 구간별 기준금리에서 비수도권 0.2%p·우대 최대 0.5%p 차감(하한 1.2/1.0%) → 한도(4억/2.4억) 적용 → 원리금균등 월 상환액·총이자.
12. **부모급여·아동수당**: 0세 12개월 × 100만(어린이집이면 보육료 58.4만 + 현금 41.6만), 1세 12개월 × 50만(어린이집이면 보육료 전환) + 아동수당 24개월 × 지역단가 + 첫만남이용권 200/300만. 0~23개월 표와 현금/바우처 구분 합계.
13. **육아기 근로시간 단축 급여**: 최초 10시간분 = clamp(통상임금 × 10/단축전, 50만, 250만), 나머지 = clamp(통상임금 × 80% × 나머지/단축전, 50만, 160만), 회사 급여(통상임금 × 단축후/단축전)와 합쳐 통상임금 초과분은 정부 급여에서 감액.
14. **퇴직금·퇴직소득세**: 1일 평균임금(월 급여 ÷ 30.4167, 연간 상여 1/12 포함) × 30 × 근속연수 → 근속연수공제 → 환산급여(÷근속×12) → 환산급여공제 → 기본세율 ÷12×근속 → 지방소득세 10%.
15. **대출 상환방식**: 월 단위 시뮬레이션으로 원리금균등(균등분할)·원금균등(원금 균등)·만기일시(이자만)의 첫 달·마지막 달 납입액, 총이자, 절감액, 연차별 잔액을 계산(거치기간은 이자만).

## 체류 장치 — 프리셋·연관 카드·입력값 이어받기

- **원클릭 예시 프리셋**: 계산기마다 칩 3개. `data-preset`(입력값 JSON), `data-preset-tab`/`data-preset-click`(모드 선택)으로 클릭 한 번에 채우고 다시 계산합니다(`assets/site.js`).
- **연관 계산기 카드**: 입력/명세서 아래, FAQ 위의 `함께 많이 계산하는 도구` 3장.
- **입력값 자동 이어받기**: 입력란에 `data-carry="deposit"` 같은 공통 필드명을 달면, 연관 카드의 링크에 현재 값이 `?deposit=300000000` 형태로 붙고 대상 페이지가 같은 필드를 채운 뒤 즉시 재계산합니다. 채운 경우 패널 상단에 "이어받음 · 초기값으로" 안내가 나옵니다. 지원 키: `deposit·deposit2·jeonse·price·monthly·rent·loan·principal·salary·salary2·wage·income·asset·bonus·rate·hours·hours2·years·grace·dependents·kids·days·order·region`.
- 새 계산기를 추가할 때는 `.related-grid`에 카드 3장, 패널에 칩 3개, 입력란에 `data-carry`를 같은 형식으로 넣으면 검증 스크립트가 자동으로 확인합니다.

## 배포

```sh
sh repos/deploy-sempan.sh          # web/life-calc → pogo-obaksa/sempan (main)
```

- 배포 대상: `index.html`, 계산기·정책 HTML 18개, `sitemap.xml`, `robots.txt`, `assets/`, `data/`, `.nojekyll`, `README.md`
- 제외: `preview/`, `tools/`, 작업용 스크래치
- GitHub Pages: `main` 브랜치 `/` (루트) — `gh api repos/pogo-obaksa/sempan/pages`
- 배포 후 확인: `https://pogo-obaksa.github.io/sempan/` 및 새 페이지 HTTP 200, 홈·새 계산기 스크린샷

## 참고

- 페이지는 **정적 HTML**이 원본입니다. 문구·구조 수정은 HTML을 직접 고치세요.
- 기준 상수는 `data/constants-2026.js` 한 곳에서 관리합니다.
- 각 페이지의 `WebApplication`·`FAQPage` JSON-LD는 본문 FAQ와 같은 문항으로 작성되어 있습니다.
- 문의 메일은 정책 3종 모두 `redfilm24@gmail.com`으로 통일했습니다.
