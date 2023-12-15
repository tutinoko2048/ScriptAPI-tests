const text = '';
const durations = {
  y: {
    time: 365 * 24 * 60 * 60 * 1000,
    long: 'year'
  },
  w: {
    time: 7 * 24 * 60 * 60 * 1000,
    long: 'week'
  },
  d: {
    time: 24 * 60 * 60 * 1000,
    long: 'day'
  },
  h: {
    time: 60 * 60 * 1000,
    long: 'hour'
  },
  m: {
    time: 60 * 1000,
    long: 'minute'
  },
  s: {
    time: 1000,
    long: 'second'
  },
  ms: {
    time: 1,
    long: 'millisecond'
  }
};
text.replace(/\s+/g, '').match(RegExp(Object.entries(durations).reduce((p, [short, { long }]) => p + `((?<${short}>-?(\\d*\\.\\d+|\\d+))(${short}|${long}))?`, '') + '$', 'i'));