const sharp = require('sharp');
const path = require('path');

const dir = 'C:/Users/mehul/Documents/AISteth/AISTETHLanding-V2/AISTETHLanding-V2/client/src/assets';
const files = ['hero-ots', 'patient-warm', 'consult-warm', 'glasses-hero'];
const widths = [960, 1440, 1920];

(async () => {
  for (const f of files) {
    const src = path.join(dir, f + '.png');
    for (const w of widths) {
      await sharp(src).resize(w).avif({ quality: 52 }).toFile(path.join(dir, f + '-' + w + '.avif'));
      await sharp(src).resize(w).webp({ quality: 78 }).toFile(path.join(dir, f + '-' + w + '.webp'));
    }
    // last-resort fallback for engines without webp/avif
    await sharp(src).resize(1600).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(dir, f + '.jpg'));
    console.log('done', f);
  }
})();
