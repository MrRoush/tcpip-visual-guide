/* Pure IPv4 helpers, shared by app.js and tests.html */
const Net = {
  parse(s) {
    const m = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/.exec(s);
    if (!m) return null;
    const o = m.slice(1).map(Number);
    if (o.some(x => x > 255)) return null;
    return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
  },
  str(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); },
  mask(p) { return p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0; },
  bin(n) { return [24, 16, 8, 0].map(s => ((n >>> s) & 255).toString(2).padStart(8, '0')).join('.'); },
  info(ip, p) {
    const mask = Net.mask(p);
    const network = (ip & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = Math.pow(2, 32 - p);
    const usable = p >= 31 ? (p === 31 ? 2 : 1) : total - 2;
    const first = p >= 31 ? network : network + 1;
    const last = p >= 31 ? broadcast : broadcast - 1;
    return { mask, network, broadcast, total, usable, first, last };
  }
};
if (typeof module !== 'undefined') module.exports = Net;
