(function () {
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Layers ---- */
const info = [
 ['Application', 'Programs use this layer to talk over the network.', 'Writing the letter.', 'HTTP, HTTPS, DNS, SMTP', 'Data / message'],
 ['Transport', 'Splits data into pieces, numbers them, and (with TCP) checks they arrive. Uses port numbers.', 'Numbering the pages and asking for a receipt.', 'TCP, UDP', 'Segment (TCP) / datagram (UDP)'],
 ['Internet', 'Adds source and destination IP addresses and picks the route.', 'Writing the street address on the outer envelope.', 'IP, ICMP', 'Packet (IP datagram)'],
 ['Network Interface (Link)', 'Sends bits over the local wire or Wi-Fi to the next device.', 'The mail truck driving one stretch of road.', 'Ethernet, Wi-Fi', 'Frame']
];
const li = $('layerInfo');
li.textContent = 'Select a layer above.';
document.querySelectorAll('.layer').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.layer').forEach(x => x.setAttribute('aria-pressed', x === b));
  const d = info[b.dataset.i];
  li.innerHTML = '<strong>' + d[0] + '</strong><br>Job: ' + d[1] + '<br>Analogy: ' + d[2] + '<br>Example protocols: ' + d[3] + '<br>Data unit: ' + d[4];
}));

/* ---- Encapsulation ---- */
const encSteps = [
 {p: ['d'], c: 'Application layer: your data (for example, a web request).'},
 {p: ['h3', 'd'], c: 'Down, Transport: a TCP header is added (ports, sequence number). Now it is a segment.'},
 {p: ['h2', 'h3', 'd'], c: 'Down, Internet: an IP header is added (source and destination IP). Now it is a packet.'},
 {p: ['h1', 'h2', 'h3', 'd', 't1'], c: 'Down, Link: a frame header and trailer are added. Now it is a frame sent as bits.'},
 {p: ['h2', 'h3', 'd'], c: 'Receiver, Link: the frame header and trailer are removed.'},
 {p: ['h3', 'd'], c: 'Receiver, Internet: the IP header is removed.'},
 {p: ['d'], c: 'Receiver, Transport: the TCP header is removed. The app gets the original data.'}
];
const encLabel = {d: 'DATA', h3: 'TCP header', h2: 'IP header', h1: 'Frame header', t1: 'Frame trailer'};
const encCls = {d: 'd', h3: 'h3', h2: 'h2', h1: 'h1', t1: 'h1'};
let es = 0;
function encShow() {
  const s = encSteps[es];
  $('enc').innerHTML = s.p.map(k => '<span class="' + encCls[k] + '">' + encLabel[k] + '</span>').join('');
  $('enc').setAttribute('aria-label', 'Encapsulation: ' + s.p.map(k => encLabel[k]).join(', '));
  $('encCap').textContent = 'Step ' + (es + 1) + ' of ' + encSteps.length + '. ' + s.c;
  $('encBtn').disabled = es === encSteps.length - 1;
}
$('encBtn').onclick = () => { es = Math.min(es + 1, encSteps.length - 1); encShow(); };
$('encReset').onclick = () => { es = 0; encShow(); };
encShow();

/* ---- TCP simulator ---- */
let pk = [], order = [], dropped = null, received = [], resent = null, shuffled = false;
const chip = (p, cls, tag) => '<span class="pkt ' + (cls || '') + '">#' + p.n + ' "' + esc(p.t) + '"' + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</span>';
const say = s => { $('status').innerHTML = '<strong>Status:</strong> ' + s; };
function setBtns() {
  const has = pk.length > 0;
  $('shuffle').disabled = !has; $('drop').disabled = !has || dropped !== null;
  $('send').disabled = !has;
  $('retx').disabled = !(has && dropped !== null && resent === null && received.length > 0);
}
function render() {
  $('sent').innerHTML = pk.map(p => chip(p, p.n === dropped ? 'lost' : '', p.n === dropped ? 'LOST' : '')).join('');
  $('recv').innerHTML = received.map(p => chip(p, p.n === resent ? 're' : '', p.n === resent ? 'RESENT' : '')).join('');
  setBtns();
}
function reassemble() {
  const have = new Map(received.map(p => [p.n, p]));
  let s = '', n = 1;
  while (have.has(n)) { s += have.get(n).t; n++; }
  const missing = pk.filter(p => !have.has(p.n)).map(p => p.n);
  $('out').textContent = s ? '"' + s + '"' + (missing.length ? ' ...waiting for #' + missing[0] : '') : '';
  return {missing, upTo: n - 1};
}
function split() {
  const m = $('msg').value;
  pk = []; order = []; received = []; dropped = null; resent = null; shuffled = false; $('out').textContent = '';
  if (!m) { render(); return say('Type a message first.'); }
  for (let i = 0; i < m.length; i += 3) pk.push({n: pk.length + 1, t: m.slice(i, i + 3)});
  order = pk.slice();
  render();
  say('Message split into ' + pk.length + ' numbered packets (3 characters each). Each number is a sequence number.');
}
$('split').onclick = split;
$('reset').onclick = () => { pk = []; order = []; received = []; dropped = null; resent = null; $('out').textContent = ''; render(); say('Press step 1.'); };
$('shuffle').onclick = () => {
  order = pk.slice();
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  if (pk.length > 1 && order.every((p, i) => p === pk[i])) order.reverse();
  shuffled = true; received = []; resent = null; $('out').textContent = ''; render();
  say('Arrival order shuffled: ' + order.map(p => '#' + p.n).join(', ') + '. Press Send.');
};
$('drop').onclick = () => {
  dropped = pk[Math.floor(Math.random() * pk.length)].n;
  received = []; resent = null; $('out').textContent = ''; render();
  say('Packet #' + dropped + ' will be lost on the way. Press Send.');
};
$('send').onclick = () => {
  received = order.filter(p => p.n !== dropped); resent = null; render();
  const r = reassemble();
  let t = shuffled ? 'Packets arrived out of order, but the sequence numbers let the receiver put them back in order. ' : 'Packets arrived in order. ';
  if (r.missing.length) t += 'Packet #' + r.missing[0] + ' is missing, so the receiver cannot ACK past #' + r.upTo + '. The sender gets no ACK for #' + r.missing[0] + ', times out, and will resend it. Press step 5.';
  else t += 'Everything arrived. Receiver ACKs all packets.';
  say(t);
};
$('retx').onclick = () => {
  const p = pk.find(x => x.n === dropped);
  received.push(p); resent = dropped; const n = dropped; render(); reassemble();
  say('Packet #' + n + ' was retransmitted and arrived. The receiver now has everything and ACKs all packets. The message is complete.');
};
render();

/* ---- Handshake ---- */
const hsText = ['Press "Next step".',
 'Step 1, SYN: the client says "I want to connect" and offers a starting sequence number.',
 'Step 2, SYN-ACK: the server says "OK, I got that, and here is my starting number".',
 'Step 3, ACK: the client says "Got it". The connection is established. Data can now flow.'];
let hs = 0;
function hsShow() {
  for (let i = 1; i <= 3; i++) $('hs' + i).classList.toggle('on', i <= hs);
  $('hsCap').textContent = hsText[hs]; $('hsBtn').disabled = hs === 3;
}
$('hsBtn').onclick = () => { hs = Math.min(3, hs + 1); hsShow(); };
$('hsReset').onclick = () => { hs = 0; hsShow(); };
hsShow();

/* ---- IPv4 converter ---- */
function ipRender() {
  const v = Net.parse($('ip').value);
  const box = $('ipBin');
  if (v === null) { box.innerHTML = '<p>Enter four numbers from 0 to 255, separated by dots.</p>'; return; }
  const oct = [24, 16, 8, 0].map(s => (v >>> s) & 255);
  box.innerHTML = '<table><tr><th scope="row">Decimal</th>' + oct.map(o => '<td class="mono">' + o + '</td>').join('') + '</tr><tr><th scope="row">Binary</th>' + oct.map(o => '<td class="mono">' + o.toString(2).padStart(8, '0') + '</td>').join('') + '</tr></table><p class="legend">32-bit number: ' + v.toLocaleString('en-US') + '</p>';
}
$('ip').addEventListener('input', ipRender); ipRender();

/* ---- Subnet calculator ---- */
function bitsRow(n, p, withLetters) {
  const b = Net.bin(n).replace(/\./g, '');
  let a = '', l = '';
  for (let i = 0; i < 32; i++) {
    const net = i < p;
    a += '<span class="bit ' + (net ? 'net' : 'host') + '">' + b[i] + '</span>';
    l += net ? 'N' : 'H';
    if (i % 8 === 7 && i < 31) { a += '.'; l += '.'; }
  }
  return a;
}
function subRender() {
  const p = +$('pre').value;
  $('preVal').textContent = p; $('pre').setAttribute('aria-valuetext', '/' + p);
  const ip = Net.parse($('subIp').value);
  const box = $('subBits'), tbl = $('subTbl');
  if (ip === null) { box.textContent = 'Enter a valid IPv4 address.'; tbl.innerHTML = ''; return; }
  const r = Net.info(ip, p);
  const letters = Array.from({length: 32}, (_, i) => (i < p ? 'N' : 'H') + (i % 8 === 7 && i < 31 ? '.' : '')).join('');
  box.innerHTML = '<div>Address &nbsp;&nbsp;' + bitsRow(ip, p) + '</div><div>Mask &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + bitsRow(r.mask, p) + '</div><div>AND result ' + bitsRow(r.network, p) + '</div><div>Bit type &nbsp;' + letters + '</div>';
  const rows = [['Mask', Net.str(r.mask)], ['Network address (address AND mask)', Net.str(r.network)], ['Broadcast address', Net.str(r.broadcast)], ['First usable host', Net.str(r.first)], ['Last usable host', Net.str(r.last)], ['Total addresses', r.total.toLocaleString('en-US')], ['Usable hosts', r.usable.toLocaleString('en-US')]];
  tbl.innerHTML = rows.map(x => '<tr><th scope="row">' + x[0] + '</th><td class="mono">' + x[1] + '</td></tr>').join('');
}
$('pre').addEventListener('input', subRender); $('subIp').addEventListener('input', subRender); subRender();

/* ---- Web request animation ---- */
const P = {L: [65, 110], R: [300, 110], S: [535, 110], D: [300, 220]};
const web = [
 {w: 'LRD', c: 'DNS lookup: the laptop asks the DNS server for the IP address of the site name.'},
 {w: 'DRL', c: 'DNS answer: the DNS server replies with an IP address (for example 203.0.113.10).'},
 {w: 'LRSRLRS', c: 'TCP handshake: SYN to the server, SYN-ACK back, then ACK.'},
 {w: 'LRS', c: 'HTTP request: the laptop sends "GET the page".'},
 {w: 'SRL', c: 'HTTP response: the server sends the page back as packets. Done!'}
];
let ws = 0, timers = [];
function moveDot(k) { const d = $('dot'); d.setAttribute('cx', P[k][0]); d.setAttribute('cy', P[k][1]); }
function webStep() {
  timers.forEach(clearTimeout); timers = [];
  const s = web[ws];
  $('webCap').textContent = 'Step ' + (ws + 1) + ' of ' + web.length + '. ' + s.c;
  if (reduce()) moveDot(s.w[s.w.length - 1]);
  else { moveDot(s.w[0]); for (let i = 1; i < s.w.length; i++) timers.push(setTimeout(() => moveDot(s.w[i]), i * 700)); }
  ws++;
  $('webBtn').disabled = ws >= web.length;
}
$('webBtn').onclick = webStep;
$('webReset').onclick = () => { timers.forEach(clearTimeout); ws = 0; moveDot('L'); $('webCap').textContent = 'Press "Next step".'; $('webBtn').disabled = false; };

/* ---- Quiz ---- */
const quiz = [
 ['How many bits are in an IPv4 address?', ['8', '32', '64', '128'], 1, 'IPv4 addresses are 32 bits (4 octets of 8 bits).'],
 ['Which layer splits data into segments and uses ports?', ['Application', 'Transport', 'Internet', 'Link'], 1, 'The Transport layer (TCP or UDP) uses ports.'],
 ['What is the order of the TCP 3-way handshake?', ['ACK, SYN, SYN-ACK', 'SYN, ACK, SYN-ACK', 'SYN, SYN-ACK, ACK', 'SYN-ACK, SYN, ACK'], 2, 'SYN, then SYN-ACK, then ACK.'],
 ['How many usable host addresses are in a /24 network?', ['256', '255', '254', '253'], 2, '256 total minus the network and broadcast addresses = 254.'],
 ['What does a missing ACK tell a TCP sender?', ['Data may be lost, so resend it', 'The connection is faster', 'Switch to UDP', 'Nothing'], 0, 'No ACK in time means the data may be lost, so TCP retransmits.'],
 ['Which is a private IPv4 range?', ['8.8.0.0/16', '172.16.0.0/12', '203.0.113.0/24', '1.1.0.0/16'], 1, '172.16.0.0/12 is private (RFC 1918).'],
 ['Which port does HTTPS normally use?', ['80', '22', '53', '443'], 3, 'HTTPS uses port 443. HTTP is 80, SSH 22, DNS 53.'],
 ['What is the data unit at the Link layer called?', ['Segment', 'Packet', 'Frame', 'Message'], 2, 'Link layer data units are frames.']
];
const form = $('quizForm'); let answered = 0, correct = 0;
quiz.forEach((q, i) => {
  const fs = document.createElement('fieldset');
  fs.innerHTML = '<legend>' + (i + 1) + '. ' + esc(q[0]) + '</legend>' + q[1].map((o, j) => '<label><input type="radio" name="q' + i + '" value="' + j + '"> ' + esc(o) + '</label>').join('') + '<p class="fb" id="fb' + i + '" aria-live="polite"></p>';
  form.appendChild(fs);
  fs.addEventListener('change', e => {
    const j = +e.target.value, ok = j === q[2], fb = $('fb' + i);
    if (!fs.dataset.done) { fs.dataset.done = 1; answered++; if (ok) correct++; }
    fb.textContent = (ok ? 'Correct. ' : 'Not quite. ') + q[3];
    $('score').textContent = 'Score: ' + correct + ' of ' + quiz.length + ' (' + answered + ' answered).';
  });
});
})();
