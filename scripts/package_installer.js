const axios = require('axios');
const fs = require('fs');
const readline = require("readline");

function ask(q) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(res => {
    rl.question(q, (ans) => {
      res(ans);
      rl.close();
    });
  });
}

function sortVersion(a, b) {
  if (a.match(/release|rc|\.preview\./) || b.match(/release|rc|\.preview\./)) {
    const va = a.match(/\d+\.\d+\.\d+/g)[1]; // x.y.z
    const vb = b.match(/\d+\.\d+\.\d+/g)[1];
    const vaPreview = a.match(/\d{2}$/g); // p
    const vbPreview = b.match(/\d{2}$/g);
    if (!va || !vb) return a.localeCompare(b);
    const versionA = va + (vaPreview ? `.${vaPreview[0]}` : ''); // x.y.z or x.y.z.p
    const versionB = vb + (vbPreview ? `.${vbPreview[0]}` : '');
    return versionA.localeCompare(versionB);
  }
  return a.localeCompare(b);
}

// 1.4.0-beta.1.20.10-stable 1.0.0-beta.release.1.19.40
const stableBetaRegex = /\d+\.\d+\.\d+-beta\.(?:\d+\.\d+\.\d+-stable|release\.\d+\.\d+\.\d+)/
// 1.6.0-beta.1.20.30-preview.20 1.0.0-beta.preview.1.19.50.20
const previewBetaRegex = /\d+\.\d+\.\d+-beta\.(?:\d+\.\d+\.\d+-preview\.\d+|preview\.\d+\.\d+\.\d+\.\d+)/
const previewRcRegex = /\d+\.\d+\.\d+-rc\.\d+\.\d+\.\d+-preview\.\d+/
const releaseRegex = /^\d+\.\d+\.\d+$/

async function main() {
  const { data } = await axios.get('https://registry.npmjs.org/@minecraft/server');
  const versions = Object.keys(data.versions)
    .filter(x => !x.includes('internal'))
    .sort(sortVersion);
  const stableBeta = versions.filter(x => stableBetaRegex.test(x));
  const previewBeta = versions.filter(x => previewBetaRegex.test(x));
  const rc = versions.filter(x => previewRcRegex.test(x));
  const release = versions.filter(x => releaseRegex.test(x));
  const packages = {
    'stable-beta': stableBeta.reverse(),
    'preview-beta': previewBeta.reverse(),
    'stable-release': release.reverse(),
    'preview-rc': rc.reverse()
  }
  
  const type = await ask(`what type? [${Object.keys(packages).join(', ')}]: `);
  if (!(type in packages)) throw Error('Invalid package type');
  const packageList = packages[type];
  console.log(`[${type}]\n${packageList.slice(0, 16).map((v, i) => `${i}: ${v}`).join('\n')}`);
  const selection = await ask(`what version?: `);
  const version = packageList[Number(selection)];
  if (!version) throw Error('Invalid module selection');
  console.log(`Downloading @minecraft/server@${version}...`);
  
  const url = data.versions[version].dist.tarball;
  const { data: archive } = await axios.get(url, { responseType: 'arraybuffer' })
  fs.writeFileSync(`${version}.tgz`, archive);
  console.log('success!');
}
main().catch(console.error)