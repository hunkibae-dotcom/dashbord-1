const fs = require('fs');
const DATE_SORT_KEYS = ['납기일', '포장일', '검사일'];
eval(fs.readFileSync('.scratch_perf/extracted.js', 'utf8'));

function load(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
const cj1Active = load('.scratch_perf/cj1_active.json').rows;
const cj1Archive = load('.scratch_perf/cj1_archive.json').rows;
const cj2Active = load('.scratch_perf/cj2_active.json').rows;
const cj2Archive = load('.scratch_perf/cj2_archive.json').rows;

const F1 = { key: 'cj1', label: '충주1공장', accent: 'f1' };
const F2 = { key: 'cj2', label: '충주2공장', accent: 'f2' };

console.time('parseRows total');
const allData = [...parseRows(cj1Active, F1), ...parseRows(cj2Active, F2)];
console.timeEnd('parseRows total');

console.time('parseArchiveRows total');
const archiveRows = [...parseArchiveRows(cj1Archive, F1), ...parseArchiveRows(cj2Archive, F2)];
console.timeEnd('parseArchiveRows total');

console.log('allData:', allData.length, 'archiveRows:', archiveRows.length, 'combined:', allData.length + archiveRows.length);

// applyFilters의 desktop 경로 흉내: filtered / allItems / display / sort
function bench(label, fn, iters) {
  iters = iters || 1;
  const t0 = process.hrtime.bigint();
  let last;
  for (let i = 0; i < iters; i++) last = fn();
  const t1 = process.hrtime.bigint();
  console.log(label, '=>', Number(t1 - t0) / 1e6 / iters, 'ms/iter (', iters, 'iters)', Array.isArray(last) ? 'len=' + last.length : '');
  return last;
}

const matchRow = (d) => true; // 기본(필터 없음) 상태 흉내

bench('filtered = allData.filter(matchRow)', () => allData.filter(matchRow), 20);
const allItems = [...allData, ...archiveRows];
bench('allItems = [...allData, ...archiveRows]', () => [...allData, ...archiveRows], 20);
const display = bench('display = allItems.filter(matchRow)', () => allItems.filter(matchRow), 20);
bench('sortByKey(display, null, asc) [no key]', () => sortByKey(display, null, 'asc'), 20);
bench('sortByKey(display, "납기일", asc)', () => sortByKey(display, '납기일', 'asc'), 20);
bench('sortByKey(display, "건명", asc) [localeCompare]', () => sortByKey(display, '건명', 'asc'), 20);

bench('computeCumulativeSeries(allItems.filter(검사=검사+archive), day)', () => {
  const items = allItems.filter(d => d.검사 === '검사' || d.source === 'archive');
  return computeCumulativeSeries(items, 'day', 'all');
}, 20);

// renderTable이 하는 문자열 조립만 순수 JS로 흉내(DOM 비용은 제외하고 문자열 빌드 비용만 측정)
function fakeRenderTableStrings(data) {
  return data.map((d, i) => {
    return `<tr><td>${i}</td><td>${d.공장명}</td><td>${d.건명}</td><td>${d.단품코드}</td><td>${d.단품명칭}</td><td>${d.색상}</td><td>${d.수량}</td><td>${d.납기일}</td><td>${d.포장일}</td><td>${d.검사}</td></tr>`;
  }).join('');
}
bench('renderTable 문자열 조립(순수 JS, DOM 제외)', () => fakeRenderTableStrings(display), 20);

console.log('--- DONE ---');
