const ws = new WebSocket('ws://localhost:9222/devtools/page/A7F30C909A9A8E43A886ACF4F7773017');
let id = 1;
function send(method, params) {
  const msg = { id: id++, method, params: params || {} };
  ws.send(JSON.stringify(msg));
  return msg.id;
}
ws.addEventListener('open', () => {
  send('Runtime.enable');
  setTimeout(() => {
    send('Runtime.evaluate', { expression: `openFieldInspectOverlay(); 'triggered'` , returnByValue: true});
  }, 3000);
  setTimeout(() => {
    send('Runtime.evaluate', { expression: `({
      overlayDisplay: document.getElementById('fieldInspectOverlay') ? document.getElementById('fieldInspectOverlay').style.display : 'MISSING overlay',
      iframeSrc: document.getElementById('fieldInspectFrame') ? document.getElementById('fieldInspectFrame').src : 'MISSING iframe',
      iframeRect: (() => { const f = document.getElementById('fieldInspectFrame'); if (!f) return null; const r = f.getBoundingClientRect(); return {w: r.width, h: r.height}; })(),
      iframeDocReachable: (() => { try { const f = document.getElementById('fieldInspectFrame'); return f.contentDocument ? (f.contentDocument.body ? f.contentDocument.body.innerText.slice(0,200) : 'no body') : 'no contentDocument'; } catch(e) { return 'ERROR: ' + e.message; } })()
    })`, returnByValue: true });
  }, 7000);
  setTimeout(() => process.exit(0), 9000);
});
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    const args = (msg.params.args || []).map(a => a.value !== undefined ? a.value : (a.description || JSON.stringify(a))).join(' ');
    console.log('[console.' + msg.params.type + ']', args);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    const ex = msg.params.exceptionDetails;
    console.log('[EXCEPTION]', ex.text, ex.exception ? (ex.exception.description || ex.exception.value) : '', 'at line', ex.lineNumber, ex.url);
  } else if (msg.id && msg.result) {
    console.log('[EVAL RESULT]', JSON.stringify(msg.result, null, 2));
  }
});
ws.addEventListener('error', (e) => console.log('WS ERROR', e.message));
