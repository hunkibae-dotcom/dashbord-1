function parseKDate(str) {
  if (!str) return null;
  const m = str.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

function parseRows(rows, factory) {
  const result = [];
  if (!rows) return result;
  for (const row of rows) {
    if (!row) continue;
    const g = (i) => (row[i] !== null && row[i] !== undefined ? String(row[i]) : '');
    const 건명 = g(0).trim();
    if (!건명 || 건명.includes('검사 항목') || 건명 === '건명' || 건명 === '충주1' || 건명 === '충주2' || 건명.includes('신규')) continue;

    const 단품코드val = g(1).trim();
    if (!단품코드val || 단품코드val === '-') continue; // 시트 내 구분선/안내 행(실제 데이터 아님) 건너뛰기

    const 검사raw = g(13).trim();
    const inspectStatus = 검사raw === '검사' ? '검사' : 검사raw === '양지' ? '양지' : 검사raw === '재투입' ? '재투입' : 검사raw === '미투입' ? '미투입' : 검사raw === '취소' ? '취소' : 검사raw === '포장대기' ? '포장대기' : '미검사';
    const 가로 = parseFloat(g(9)) || 0, 세로 = parseFloat(g(10)) || 0, 높이 = parseFloat(g(11)) || 0;

    result.push({
      source: 'active',
      공장: factory.key,
      공장명: factory.label,
      accent: factory.accent,
      건명,
      단품코드: 단품코드val,
      색상: g(2).trim(),
      수량: parseInt(g(3)) || 0,
      단품명칭: g(4).trim(),
      BOM: g(5).trim().toUpperCase(),
      납기일: g(6).trim(),
      포장일: g(7).trim(),
      검사일: g(8).trim(),
      검사: inspectStatus,
      가로, 세로, 높이,
      중량: parseFloat(g(12)) || 0,
      CBM: (가로 && 세로 && 높이) ? (가로 * 세로 * 높이 / 1e9) : null,
      비고: g(15).trim(),
    });
  }
  return result;
}

function parseArchiveRows(rows, factory) {
  const result = [];
  if (!rows) return result;
  for (const row of rows) {
    if (!row) continue;
    const g = (i) => (row[i] !== null && row[i] !== undefined ? String(row[i]) : '');
    const 건명 = g(0).trim();
    if (!건명 || 건명.includes('검사') || 건명 === '건명' || 건명 === '충주1' || 건명 === '충주2' || 건명.includes('신규')) continue;

    const 단품코드val = g(1).trim();
    if (!단품코드val || 단품코드val === '-') continue; // 시트 내 구분선/안내 행(실제 데이터 아님) 건너뛰기

    const 비고raw = g(13).trim();
    const 가로 = parseFloat(g(9)) || 0, 세로 = parseFloat(g(10)) || 0, 높이 = parseFloat(g(11)) || 0;

    result.push({
      source: 'archive',
      공장: factory.key,
      공장명: factory.label,
      accent: factory.accent,
      건명,
      단품코드: 단품코드val,
      색상: g(2).trim(),
      수량: parseInt(g(3)) || 0,
      단품명칭: g(4).trim(),
      포장처: g(5).trim(),
      납기일: g(6).trim(),
      포장일: g(7).trim(),
      검사일: g(8).trim(),
      검사: (비고raw === '검사') ? '검사' : '미검사',
      가로, 세로, 높이,
      중량: parseFloat(g(12)) || 0,
      CBM: (가로 && 세로 && 높이) ? (가로 * 세로 * 높이 / 1e9) : null,
      비고: g(14).trim(),
    });
  }
  return result;
}

function sortByKey(rows, key, dir) {
  if (!key) return rows;
  const mul = dir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    if (key === '수량') return ((a.수량 || 0) - (b.수량 || 0)) * mul;
    if (DATE_SORT_KEYS.includes(key)) {
      const da = parseKDate(a[key]), db = parseKDate(b[key]);
      if (!da && !db) return 0;
      if (!da) return 1 * mul;
      if (!db) return -1 * mul;
      return (da - db) * mul;
    }
    return String(a[key] || '').localeCompare(String(b[key] || ''), 'ko') * mul;
  });
}

function computeCumulativeSeries(items, granularity, year) {
  const buckets = new Map();
  items.forEach(d => {
    const date = parseKDate(d.검사일);
    if (!date) return;
    if (year && year !== 'all' && date.getFullYear() !== parseInt(year)) return;
    let rawKey, sortDate, displayLabel;
    if (granularity === 'day') {
      sortDate = date; rawKey = ymd(date);
      displayLabel = formatChartLabel(date, 'day');
    } else if (granularity === 'week') {
      sortDate = weekStart(date); rawKey = ymd(sortDate);
      displayLabel = formatChartLabel(sortDate, 'week');
    } else if (granularity === 'year') {
      sortDate = new Date(date.getFullYear(), 0, 1);
      rawKey = String(date.getFullYear());
      displayLabel = date.getFullYear() + '년';
    } else {
      sortDate = new Date(date.getFullYear(), date.getMonth(), 1);
      rawKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      displayLabel = formatChartLabel(date, 'month');
    }
    if (!buckets.has(rawKey)) buckets.set(rawKey, { count: 0, sortDate, displayLabel, rawKey });
    buckets.get(rawKey).count++;
  });
  const sorted = [...buckets.entries()].sort((a, b) => a[1].sortDate - b[1].sortDate);
  let cum = 0;
  const labels = [], rawLabels = [], data = [], periodData = [];
  sorted.forEach(([, v]) => {
    cum += v.count;
    labels.push(v.displayLabel);
    rawLabels.push(v.rawKey);
    data.push(cum);
    periodData.push(v.count);
  });
  return { labels, rawLabels, data, periodData };
}

function ymd(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function weekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + ((day === 0 ? -6 : 1) - day));
  return d;
}

function formatChartLabel(date, granularity) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  if (granularity === 'month') return date.getFullYear() + '.' + mm;
  return mm + '.' + dd;
}

function extractCountry(건명) {
  if (!건명) return null;
  const s = 건명.trim();
  // 한글로 시작하거나 (주) 패턴 = 내수건 → 제외
  if (/^[가-힣(]/.test(s)) return null;
  // "VAN외3차수"처럼 여러 차수를 하나로 합쳐 표기한 병합 건명(_isMergedRoundName과
  // 같은 규칙)은 구분자 없이 코드 바로 뒤에 한글이 붙지만 전부 수출건이다 — 아래
  // 일반 규칙보다 먼저 이 패턴을 확인해서 앞의 영문 코드를 그대로 인정한다.
  const mergedMatch = s.match(/^([A-Za-z][A-Za-z0-9]*)외\d+차수$/);
  if (mergedMatch) return mergedMatch[1];
  // 수출건은 실제로 "FAM-167/26", "VAN-92/25", "NY-143/25" 처럼 코드 뒤에 대시로
  // 차수가 붙고 그 뒤에 슬래시로 연도가 또 붙는 경우가 대부분이라, 무조건 슬래시가
  // 있으면 내수로 제외하던 예전 로직은 이런 정상 수출건 대다수를 내수로 잘못
  // 분류했다. 대시/슬래시/공백 중 가장 먼저 나오는 지점까지를 코드로 보고, 그
  // 구간 전체가 순수 영문(숫자 조합 가능)일 때만 수출건으로 인정한다 — "KB손해보험
  // (PRO사업부)"처럼 영문 뒤에 구분자 없이 바로 한글이 붙는 내수건은 코드 구간에
  // 한글이 섞여 전체 일치에 실패하므로 자동으로 제외된다.
  const dashIdx = s.indexOf('-');
  const slashIdx = s.indexOf('/');
  const spaceIdx = s.search(/\s/);
  const stops = [dashIdx, slashIdx, spaceIdx].filter(i => i > 0);
  const endIdx = stops.length ? Math.min(...stops) : -1;
  const code = endIdx > 0 ? s.slice(0, endIdx).trim() : s;
  return /^[A-Za-z][A-Za-z0-9]*$/.test(code) ? code : null;
}

function isReinspectWaiting(d) { return d.검사 === '재투입' && !d.검사일; }

function ddayInfo(str) {
  const d = parseKDate(str);
  if (!d) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}