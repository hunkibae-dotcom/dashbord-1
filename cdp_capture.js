const ws = new WebSocket('ws://localhost:9222/devtools/page/C71F198DD03682324DA945AF75286521');
let id = 1;
function send(method, params) {
  const msg = { id: id++, method, params: params || {} };
  ws.send(JSON.stringify(msg));
}
ws.addEventListener('open', () => {
  send('Runtime.enable');
  send('Log.enable');
  send('Page.enable');
  setTimeout(() => {
    send('Runtime.evaluate', { expression: `({
      fiApp: document.getElementById('fiApp') ? document.getElementById('fiApp').style.display : 'MISSING',
      fiPcApp: document.getElementById('fiPcApp') ? document.getElementById('fiPcApp').style.display : 'MISSING',
      loadingOverlay: document.getElementById('fiInitLoadingOverlay') ? 'STILL THERE' : 'removed',
      bodyText: document.body.innerText.slice(0,300),
      fiAllDataLen: (typeof fiAllData !== 'undefined') ? fiAllData.length : 'fiAllData undefined'
    })`, returnByValue: true });
  }, 4000);
  setTimeout(() => process.exit(0), 6000);
});
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    const args = (msg.params.args || []).map(a => a.value !== undefined ? a.value : (a.description || JSON.stringify(a))).join(' ');
    console.log('[console.' + msg.params.type + ']', args);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    const ex = msg.params.exceptionDetails;
    console.log('[EXCEPTION]', ex.text, ex.exception ? (ex.exception.description || ex.exception.value) : '', 'at line', ex.lineNumber, 'col', ex.columnNumber, ex.url);
  } else if (msg.id && msg.result) {
    console.log('[EVAL RESULT]', JSON.stringify(msg.result, null, 2));
  }
});
ws.addEventListener('error', (e) => console.log('WS ERROR', e.message));
