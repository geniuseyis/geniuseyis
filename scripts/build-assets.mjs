// profildeki svg'leri ve README.md'yi uretir: npm run assets
// metinler path'e cevriliyor, boylece her cihazda ayni font gorunuyor
import { readFile, writeFile } from 'node:fs/promises'
import opentype from 'opentype.js'

const root = new URL('../', import.meta.url)
const SITE = 'https://geniuseyis.github.io'
const INSTAGRAM = 'https://www.instagram.com/babyodaonduty/'
const GITHUB = 'https://github.com/geniuseyis'

const THEMES = {
  dark: { bg: '#0e0f13', panel: '#16181e', line: '#2b2e37', thread: '#4a4e5a', text: '#efebe2', muted: '#a6a6ae', accent: '#f0a945', onAccent: '#0e0f13' },
  light: { bg: '#f7f4ec', panel: '#ffffff', line: '#d9d4c7', thread: '#a39d8f', text: '#14151a', muted: '#5c5c64', accent: '#a9680f', onAccent: '#ffffff' },
}

async function loadFamily(pkg, name, weight) {
  const load = async (subset) => {
    const file = await readFile(new URL(`node_modules/@fontsource/${pkg}/files/${name}-${subset}-${weight}-normal.woff`, root))
    return opentype.parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength))
  }
  return [await load('latin'), await load('latin-ext')]
}

const FONTS = {
  display: await loadFamily('bricolage-grotesque', 'bricolage-grotesque', 800),
  title: await loadFamily('bricolage-grotesque', 'bricolage-grotesque', 700),
  body: await loadFamily('bricolage-grotesque', 'bricolage-grotesque', 500),
  mono: await loadFamily('jetbrains-mono', 'jetbrains-mono', 500),
}

function layout(text, family, size, spacing = 0) {
  let x = 0
  let previous = null
  const glyphs = [...text].map((char) => {
    const font = family.find((f) => f.charToGlyphIndex(char) > 0) ?? family[0]
    const glyph = font.charToGlyph(char)
    const scale = size / font.unitsPerEm
    if (previous?.font === font) x += font.getKerningValue(previous.glyph, glyph) * scale
    const placed = { glyph, x }
    x += glyph.advanceWidth * scale + spacing
    previous = { font, glyph }
    return placed
  })
  return { glyphs, width: x - spacing }
}

const textWidth = (text, font, size, spacing) => layout(text, FONTS[font], size, spacing).width

function textPath(text, font, size, x, y, fill, spacing = 0) {
  const { glyphs } = layout(text, FONTS[font], size, spacing)
  const d = glyphs.map((g) => g.glyph.getPath(x + g.x, y, size).toPathData(1)).join('')
  return `<path fill="${fill}" d="${d}"/>`
}

const svg = (w, h, title, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">${extra}${body}</svg>\n`

async function save(name, build) {
  for (const [mode, theme] of Object.entries(THEMES)) {
    await writeFile(new URL(`assets/${name}-${mode}.svg`, root), build(theme))
  }
}

// hero: uygulama ikonlari iplerden sarkiyor
const ARMS = [
  { id: 'ringify', label: 'Ringify', x: 770, len: 118, dur: 4.2, deg: 3.4, delay: -0.4 },
  { id: 'plumbline', label: 'Plumbline', x: 905, len: 232, dur: 5.4, deg: 2.4, delay: -2.1 },
  { id: 'finansim', label: 'Finansım', x: 1040, len: 76, dur: 3.7, deg: 3.8, delay: -1.2 },
  { id: 'afet', label: 'Afet Yardım', x: 1175, len: 176, dur: 4.8, deg: 2.8, delay: -3 },
]

const icons = Object.fromEntries(await Promise.all(ARMS.map(async (arm) => {
  const file = await readFile(new URL(`assets/icons/${arm.id}.png`, root))
  return [arm.id, `data:image/png;base64,${file.toString('base64')}`]
})))

await save('hero', (t) => {
  const W = 1280
  const H = 440
  const icon = 92
  const style = `<style>${ARMS.map((a, i) => `@keyframes s${i}{from{transform:rotate(-${a.deg}deg)}to{transform:rotate(${a.deg}deg)}}.a${i}{transform-origin:${a.x}px -10px;animation:s${i} ${a.dur}s ease-in-out ${a.delay}s infinite alternate}`).join('')}@media (prefers-reduced-motion:reduce){g{animation:none!important}}</style>`
  const defs = `<defs><clipPath id="panel"><rect width="${W}" height="${H}" rx="20"/></clipPath>${ARMS.map((a) => `<clipPath id="c-${a.id}"><rect x="${a.x - icon / 2}" y="${a.len + 6}" width="${icon}" height="${icon}" rx="21"/></clipPath>`).join('')}</defs>`
  const arms = ARMS.map((a, i) => {
    const label = textWidth(a.label, 'mono', 13)
    return `<g class="a${i}"><path d="M${a.x} -10V${a.len}" stroke="${t.thread}" stroke-width="1.2"/><circle cx="${a.x}" cy="${a.len + 1}" r="3.5" fill="${t.accent}"/><image href="${icons[a.id]}" x="${a.x - icon / 2}" y="${a.len + 6}" width="${icon}" height="${icon}" clip-path="url(#c-${a.id})"/>${textPath(a.label, 'mono', 13, a.x - label / 2, a.len + icon + 28, t.muted)}</g>`
  }).join('')
  const body = `<g clip-path="url(#panel)"><rect width="${W}" height="${H}" fill="${t.bg}"/>${arms}${textPath('Mobil uygulama geliştirici · İstanbul', 'mono', 17, 56, 112, t.accent)}${textPath('Seyit', 'display', 96, 52, 208, t.text, -3)}${textPath('Baltacıoğlu', 'display', 96, 52, 298, t.text, -3)}<circle cx="${52 + textWidth('Baltacıoğlu', 'display', 96, -3) + 10}" cy="289" r="9" fill="${t.accent}"/>${textPath('Swift, Flutter ve React Native ile iOS ve Android', 'body', 22, 56, 358, t.muted)}${textPath('uygulamaları geliştiriyorum.', 'body', 22, 56, 388, t.muted)}</g><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="19.5" fill="none" stroke="${t.line}"/>`
  return svg(W, H, 'Seyit Baltacıoğlu, mobil uygulama geliştirici', body, style + defs)
})

// bolum basliklari
const TITLES = [['01', 'Hakkımda'], ['02', 'Seçili işler'], ['03', 'Araç kutusu'], ['04', 'Commit günlüğü'], ['05', 'İletişim']]
for (const [number, title] of TITLES) {
  await save(`title-${number}`, (t) => svg(1280, 92, `${number} ${title}`,
    `${textPath(number, 'mono', 18, 2, 62, t.accent)}${textPath(title, 'title', 56, 50, 66, t.text, -1.4)}<path d="M0 90.5H1280" stroke="${t.line}"/>`))
}

// butonlar
const BUTTONS = [
  { id: 'portfolyo', text: 'Portfolyoyu aç', solid: true },
  { id: 'instagram', text: 'Instagram' },
  { id: 'github', text: 'GitHub' },
  { id: 'depo', text: 'Depoyu aç' },
]
for (const button of BUTTONS) {
  await save(`btn-${button.id}`, (t) => {
    const width = Math.ceil(textWidth(button.text, 'title', 18)) + 44
    const fill = button.solid ? t.accent : 'none'
    const stroke = button.solid ? t.accent : t.thread
    const color = button.solid ? t.onAccent : t.text
    return svg(width, 46, button.text, `<rect x=".75" y=".75" width="${width - 1.5}" height="44.5" rx="22.25" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${textPath(button.text, 'title', 18, 22, 29, color)}`)
  })
}

// arac kutusu
const TOOLKIT = [
  ['Diller', ['Swift', 'Dart', 'JavaScript', 'TypeScript', 'Java', 'Python', 'C#', 'C++', 'SQL']],
  ['Mobil', ['SwiftUI', 'Flutter', 'React Native', 'Expo', 'Riverpod', 'Skia', 'AVFoundation', 'StoreKit 2']],
  ['Sunucu ve veri', ['Firebase', 'Cloud Functions', 'Firestore', 'SwiftData', 'Hive', 'MMKV', 'Spring Boot', 'SQL Server']],
  ['Test ve araçlar', ['XCTest', 'flutter_test', 'Vitest', 'GitHub Actions', 'EAS Build', 'XcodeGen', 'Git']],
]
await save('toolkit', (t) => {
  const W = 1280
  const left = 230
  const chipH = 44
  const gap = 10
  let y = 12
  let body = ''
  for (const [group, items] of TOOLKIT) {
    let x = left
    let row = y
    body += textPath(group, 'mono', 17, 2, y + 28, t.accent)
    for (const item of items) {
      const width = Math.ceil(textWidth(item, 'body', 19)) + 32
      if (x + width > W) {
        x = left
        row += chipH + gap
      }
      body += `<rect x="${x + 0.5}" y="${row + 0.5}" width="${width - 1}" height="${chipH - 1}" rx="10" fill="${t.panel}" stroke="${t.line}"/>${textPath(item, 'body', 19, x + 16, row + 29, t.text)}`
      x += width + gap
    }
    y = row + chipH + 26
  }
  return svg(W, y - 14, 'Swift, Dart, TypeScript, SwiftUI, Flutter, React Native, Firebase ve diğer araçlar', body)
})

// README
const pic = (name, alt, attrs = 'width="100%"') =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg"><source media="(prefers-color-scheme: light)" srcset="assets/${name}-light.svg"><img src="assets/${name}-dark.svg" alt="${alt}" ${attrs}></picture>`
const button = (id, alt, href) => `<a href="${href}">${pic(`btn-${id}`, alt, 'height="46"')}</a>`
const title = (number, text) => `<br>\n\n${pic(`title-${number}`, `${number} ${text}`)}\n`
const raw = `https://raw.githubusercontent.com/geniuseyis/geniuseyis/output`

const PROJECTS = [
  {
    id: 'ringify', name: 'Ringify', kind: 'iOS · ses stüdyosu', repo: 'ringify',
    alt: 'Ringify ekranlarını gösteren üç telefon',
    text: 'Bir videodan, şarkıdan ya da kendi sesinden 1–29 saniyelik iPhone zil sesleri hazırlayan, çevrimdışı çalışan bir ses stüdyosu. Tüm ses işleme cihazda yapılıyor; hesap, analitik ya da izleme yok.',
    proof: '136 birim testi ve uçtan uca arayüz akışı · Swift 6 tam katı eşzamanlılık',
    tech: 'Swift 6 · SwiftUI · AVFoundation · SwiftData · StoreKit 2',
    status: 'Sırada cihaz testi ve App Store',
  },
  {
    id: 'plumbline', name: 'Plumbline', kind: 'iOS ve Android · fizik oyunu', repo: 'CityStacker',
    alt: 'Plumbline oyununu gösteren üç telefon',
    text: 'Vinçte sallanan katı doğru anda bırakıp kuleni yükselttiğin, gerçek fizikle çalışan bir kule oyunu. Motor deterministik: aynı seed ve aynı bırakma anları hep aynı skoru veriyor, kayıtlar baştan oynatılıp doğrulanabiliyor.',
    proof: '120 Hz sabit adımlı fizik · AES-256 şifreli kayıtlar · hesap ve sunucu yok',
    tech: 'React Native · Expo SDK 58 · TypeScript · Skia · Reanimated',
    status: 'Sırada mağaza entegrasyonu',
  },
  {
    id: 'finansim', name: 'Finansım', kind: 'iOS ve Android · kişisel finans', repo: 'finansim',
    alt: 'Finansım ekranlarını gösteren üç telefon',
    text: 'Gelir, gider, bütçe ve birikim hedeflerini tek yerde toplayan, verileri cihazda şifreleyen kişisel finans uygulaması. Makbuzları cihaz üzerinde okuyor, TCMB kurlarını çekiyor.',
    proof: '113 birim testi, her push’ta CI · 25+ ekran · Clean Architecture',
    tech: 'Flutter · Riverpod · Firebase · Hive · ML Kit',
    status: 'Sırada cihaz testi ve mağazalar',
  },
  {
    id: 'afet', name: 'Afet Yardım Sistemi', kind: 'iOS ve Android · gerçek zamanlı koordinasyon', repo: 'afet-yardim',
    alt: 'Afet Yardım ekranlarını gösteren üç telefon',
    text: 'Deprem ve sel gibi afetlerde afetzedeyi, gönüllüyü ve koordinatörü aynı gerçek zamanlı platformda buluşturan mobil uygulama. Rol ve onay sunucuda denetleniyor, yapay zeka anahtarları uygulamaya girmiyor.',
    proof: '22 güvenlik kuralı testi · 3 rol · sunucu tarafı yetki ve kota',
    tech: 'React Native · Expo SDK 54 · TypeScript · Firestore · Cloud Functions',
    status: 'Sırada cihaz testi ve mağazalar',
  },
]

const projectBlock = (p) => `<a href="https://github.com/geniuseyis/${p.repo}"><img src="assets/${p.id}.jpg" alt="${p.alt}" width="100%"></a>

### ${p.name}
<sub>${p.kind}</sub>

${p.text}

**${p.proof}**
<br><sub>${p.tech} · ${p.status}</sub>

${button('depo', `${p.name} deposunu aç`, `https://github.com/geniuseyis/${p.repo}`)}
`

const readme = `<a href="${SITE}">${pic('hero', 'Seyit Baltacıoğlu, mobil uygulama geliştirici. Swift, Flutter ve React Native ile iOS ve Android uygulamaları geliştiriyor.')}</a>

<p>
${button('portfolyo', 'Portfolyoyu aç', SITE)}
${button('instagram', 'Instagram', INSTAGRAM)}
</p>

${title('01', 'Hakkımda')}
İstanbul'da yaşıyorum. Swift, Flutter ve React Native ile iOS ve Android uygulamaları geliştiriyorum. Üç şeye dikkat ediyorum:

- **Veri cihazda kalır.** Mümkün olan her şeyi cihazda işliyor, yerel veriyi AES-256 ile şifreliyorum.
- **Platformun diliyle konuşur.** Apple HIG, 44 pt dokunma alanları, Dynamic Type ve VoiceOver.
- **Çalıştığı testle görünür.** Ürün kurallarını arayüzden ayırıyor, birim testleriyle koruyorum.

${title('02', 'Seçili işler')}
${PROJECTS.map(projectBlock).join('\n<br>\n\n')}
${title('03', 'Araç kutusu')}
${pic('toolkit', 'Diller: Swift, Dart, JavaScript, TypeScript, Java, Python, C#, C++, SQL. Mobil: SwiftUI, Flutter, React Native, Expo, Riverpod, Skia, AVFoundation, StoreKit 2. Sunucu ve veri: Firebase, Cloud Functions, Firestore, SwiftData, Hive, MMKV, Spring Boot, SQL Server. Test ve araçlar: XCTest, flutter_test, Vitest, GitHub Actions, EAS Build, XcodeGen, Git.')}

${title('04', 'Commit günlüğü')}
<picture><source media="(prefers-color-scheme: dark)" srcset="${raw}/github-snake-dark.svg"><source media="(prefers-color-scheme: light)" srcset="${raw}/github-snake.svg"><img src="${raw}/github-snake-dark.svg" alt="GitHub katkı grafiğini yiyen yılan animasyonu" width="100%"></picture>

${title('05', 'İletişim')}
${button('portfolyo', 'Portfolyoyu aç', SITE)}
${button('instagram', 'Instagram', INSTAGRAM)}
${button('github', 'GitHub', GITHUB)}
`

await writeFile(new URL('README.md', root), readme)
console.log('assets ve README.md hazir')
