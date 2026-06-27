const sharp = require('sharp')
const path = require('path')

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#3D5A5C"/>
  <rect x="140" y="120" width="200" height="32" rx="16" fill="rgba(255,255,255,0.25)"/>
  <text x="256" y="310" font-family="Arial, sans-serif" font-size="240" font-weight="700" fill="white" text-anchor="middle">D</text>
  <circle cx="370" cy="360" r="60" fill="#D4A373"/>
  <text x="370" y="378" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="white" text-anchor="middle">ت</text>
</svg>
`)

async function generate() {
  const pub = path.join(__dirname, '..', 'public')
  await sharp(svg).resize(192, 192).png().toFile(path.join(pub, 'icon-192.png'))
  await sharp(svg).resize(512, 512).png().toFile(path.join(pub, 'icon-512.png'))
  await sharp(svg).resize(180, 180).png().toFile(path.join(pub, 'apple-touch-icon.png'))
  console.log('Icons generated!')
}

generate().catch(console.error)
