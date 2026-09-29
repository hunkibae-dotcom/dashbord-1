const fs = require('fs');
const html = fs.readFileSync('수출검사리스트_대시보드.html', 'utf8');
function extractFn(name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{');
  const m = html.match(re);
  if (!m) { console.log('MISSING:', name); return ''; }
  let start = m.index + m[0].length;
  let depth = 1, i = start;
  while (depth > 0) { if (html[i]==='{') depth++; else if (html[i]==='}') depth--; i++; }
  return html.slice(m.index, i);
}
const names = ['parseKDate','parseRows','parseArchiveRows','sortByKey','computeCumulativeSeries',
  'ymd','weekStart','formatChartLabel','extractCountry','isReinspectWaiting','ddayInfo'];
const code = names.map(extractFn).join('\n\n');
fs.writeFileSync('.scratch_perf/extracted.js', code);
console.log('extracted', code.length, 'chars');
