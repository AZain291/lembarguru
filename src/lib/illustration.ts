// Ilustrasi soal -- diagram/grafik SEDERHANA yang dibuat dari data soal itu
// sendiri (bukan gambar AI/foto), supaya akurat (angka & proporsi sesuai
// soal) dan gratis (tidak perlu API image-generation eksternal). Dipakai di
// dua tempat dengan SATU fungsi yang sama (illustrationSvg): preview di web
// (LembarGuruApp.tsx, lewat dangerouslySetInnerHTML) dan export .docx
// (export-docx/route.ts, di-convert ke PNG lewat @resvg/resvg-wasm karena
// Word butuh fallback raster untuk gambar SVG). Karena dipakai lewat
// dangerouslySetInnerHTML, semua teks yang berasal dari AI (label) WAJIB
// di-escape lewat escapeXml() sebelum masuk ke string SVG -- jangan pernah
// interpolasi string mentah ke svgParts.

export type IllustrationSpec =
  | { type: 'triangle'; sideAB?: number; sideBC?: number; sideCA?: number; labelA?: string; labelB?: string; labelC?: string; rightAngleAt?: 'A' | 'B' | 'C'; unit?: string }
  | { type: 'rectangle'; width: number; height: number; unit?: string }
  | { type: 'circle'; radius?: number; diameter?: number; unit?: string }
  | { type: 'number_line'; min: number; max: number; points: { value: number; label?: string }[] }
  | { type: 'bar_chart'; data: { label: string; value: number }[]; yLabel?: string }
  | { type: 'long_division'; dividend: number; divisor: number }

const KNOWN_TYPES = new Set(['triangle', 'rectangle', 'circle', 'number_line', 'bar_chart', 'long_division'])

export function isIllustrationSpec(value: unknown): value is IllustrationSpec {
  if (!value || typeof value !== 'object') return false
  const type = (value as { type?: unknown }).type
  return typeof type === 'string' && KNOWN_TYPES.has(type)
}

export function escapeXml(text: string): string {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!))
}

const WIDTH = 320
const HEIGHT = 220
const STROKE = '#374151'
const FILL = '#eff6ff'
const TEXT = '#111827'

function svgWrap(inner: string, width = WIDTH, height = HEIGHT): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>` +
    inner +
    `</svg>`
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

function renderTriangle(spec: Extract<IllustrationSpec, { type: 'triangle' }>): string {
  const a = spec.sideBC ?? 4  // sisi di depan A (BC)
  const b = spec.sideCA ?? 4  // sisi di depan B (CA)
  const c = spec.sideAB ?? 4  // sisi di depan C (AB)

  // Posisikan B di origin, C di (a, 0), lalu cari A pakai hukum cosinus
  // (SSS) supaya proporsi segitiga di gambar sesuai panjang sisi asli --
  // bukan cuma segitiga generik.
  let xA = (c * c + a * a - b * b) / (2 * a)
  let yA = Math.sqrt(Math.max(0, c * c - xA * xA))
  if (!Number.isFinite(xA) || !Number.isFinite(yA)) { xA = a / 2; yA = a * 0.8 }

  const rawB = { x: 0, y: 0 }, rawC = { x: a, y: 0 }, rawA = { x: xA, y: yA }
  const minX = Math.min(rawA.x, rawB.x, rawC.x), maxX = Math.max(rawA.x, rawB.x, rawC.x)
  const minY = 0, maxY = Math.max(rawA.y, 0.001)
  const pad = 40
  const scale = Math.min((WIDTH - pad * 2) / (maxX - minX || 1), (HEIGHT - pad * 2 - 20) / (maxY - minY || 1))

  const toSvg = (p: { x: number; y: number }) => ({
    x: pad + (p.x - minX) * scale,
    y: HEIGHT - pad - (p.y - minY) * scale, // flip y, kasih ruang label di bawah
  })
  const A = toSvg(rawA), B = toSvg(rawB), C = toSvg(rawC)

  const labelA = escapeXml(spec.labelA || 'A')
  const labelB = escapeXml(spec.labelB || 'B')
  const labelC = escapeXml(spec.labelC || 'C')
  const unit = spec.unit ? ' ' + escapeXml(spec.unit) : ''

  let rightAngleMark = ''
  if (spec.rightAngleAt) {
    const corner = spec.rightAngleAt === 'A' ? A : spec.rightAngleAt === 'B' ? B : C
    rightAngleMark = `<rect x="${corner.x - 6}" y="${corner.y - 6}" width="12" height="12" fill="none" stroke="${STROKE}" stroke-width="1.5"/>`
  }

  const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
  const midBC = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }
  const midCA = { x: (C.x + A.x) / 2, y: (C.y + A.y) / 2 }

  return svgWrap(`
    <polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>
    ${rightAngleMark}
    <text x="${A.x}" y="${A.y - 10}" text-anchor="middle" font-size="14" font-weight="700" fill="${TEXT}">${labelA}</text>
    <text x="${B.x - 12}" y="${B.y + 16}" text-anchor="middle" font-size="14" font-weight="700" fill="${TEXT}">${labelB}</text>
    <text x="${C.x + 12}" y="${C.y + 16}" text-anchor="middle" font-size="14" font-weight="700" fill="${TEXT}">${labelC}</text>
    ${spec.sideAB ? `<text x="${midAB.x + 10}" y="${midAB.y}" font-size="12" fill="${TEXT}">${fmtNum(spec.sideAB)}${unit}</text>` : ''}
    ${spec.sideBC ? `<text x="${midBC.x}" y="${midBC.y + 16}" text-anchor="middle" font-size="12" fill="${TEXT}">${fmtNum(spec.sideBC)}${unit}</text>` : ''}
    ${spec.sideCA ? `<text x="${midCA.x - 10}" y="${midCA.y}" text-anchor="end" font-size="12" fill="${TEXT}">${fmtNum(spec.sideCA)}${unit}</text>` : ''}
  `)
}

function renderRectangle(spec: Extract<IllustrationSpec, { type: 'rectangle' }>): string {
  const w = Math.max(spec.width, 0.001), h = Math.max(spec.height, 0.001)
  const pad = 50
  const scale = Math.min((WIDTH - pad * 2) / w, (HEIGHT - pad * 2) / h)
  const rw = w * scale, rh = h * scale
  const x = (WIDTH - rw) / 2, y = (HEIGHT - rh) / 2
  const unit = spec.unit ? ' ' + escapeXml(spec.unit) : ''

  return svgWrap(`
    <rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>
    <text x="${x + rw / 2}" y="${y - 10}" text-anchor="middle" font-size="13" fill="${TEXT}">${fmtNum(spec.width)}${unit}</text>
    <text x="${x - 10}" y="${y + rh / 2}" text-anchor="end" font-size="13" fill="${TEXT}" transform="rotate(-90 ${x - 10} ${y + rh / 2})">${fmtNum(spec.height)}${unit}</text>
  `)
}

function renderCircle(spec: Extract<IllustrationSpec, { type: 'circle' }>): string {
  const r = spec.radius ?? (spec.diameter ? spec.diameter / 2 : 3)
  const cx = WIDTH / 2, cy = HEIGHT / 2
  const maxR = Math.min(WIDTH, HEIGHT) / 2 - 40
  const px = maxR // radius piksel tetap (fokusnya proporsi visual, bukan skala presisi lintas soal)
  const unit = spec.unit ? ' ' + escapeXml(spec.unit) : ''
  const label = spec.diameter && !spec.radius ? `d = ${fmtNum(spec.diameter)}${unit}` : `r = ${fmtNum(r)}${unit}`

  return svgWrap(`
    <circle cx="${cx}" cy="${cy}" r="${px}" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + px}" y2="${cy}" stroke="${STROKE}" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="2" fill="${STROKE}"/>
    <text x="${cx + px / 2}" y="${cy - 8}" text-anchor="middle" font-size="13" fill="${TEXT}">${escapeXml(label)}</text>
  `)
}

function renderNumberLine(spec: Extract<IllustrationSpec, { type: 'number_line' }>): string {
  const min = Math.min(spec.min, spec.max), max = Math.max(spec.min, spec.max)
  const pad = 30
  const y = HEIGHT / 2
  const scale = (WIDTH - pad * 2) / (max - min || 1)
  const toX = (v: number) => pad + (v - min) * scale

  const step = Math.max(1, Math.round((max - min) / 10))
  const ticks: string[] = []
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) {
    const x = toX(v)
    ticks.push(`<line x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}" stroke="${STROKE}" stroke-width="1"/>`)
    ticks.push(`<text x="${x}" y="${y + 22}" text-anchor="middle" font-size="10" fill="${TEXT}">${fmtNum(v)}</text>`)
  }

  const points = spec.points.map((p, i) => {
    const x = toX(Math.min(Math.max(p.value, min), max))
    const label = p.label ? escapeXml(p.label) : ''
    return `<circle cx="${x}" cy="${y}" r="5" fill="#dc2626"/>` +
      (label ? `<text x="${x}" y="${y - 14 - (i % 2) * 14}" text-anchor="middle" font-size="12" font-weight="700" fill="#dc2626">${label}</text>` : '')
  }).join('')

  return svgWrap(`
    <line x1="${pad}" y1="${y}" x2="${WIDTH - pad}" y2="${y}" stroke="${STROKE}" stroke-width="2" marker-end="url(#arrow)"/>
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${STROKE}"/></marker></defs>
    ${ticks.join('')}
    ${points}
  `)
}

function renderBarChart(spec: Extract<IllustrationSpec, { type: 'bar_chart' }>): string {
  const data = spec.data.slice(0, 8) // batasi biar tidak terlalu padat
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const padL = 40, padB = 40, padT = 20, padR = 20
  const chartW = WIDTH - padL - padR, chartH = HEIGHT - padT - padB
  const barGap = 12
  const barW = (chartW - barGap * (data.length - 1)) / data.length

  const bars = data.map((d, i) => {
    const barH = (Math.max(d.value, 0) / maxVal) * chartH
    const x = padL + i * (barW + barGap)
    const y = padT + (chartH - barH)
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#60a5fa" stroke="${STROKE}" stroke-width="1"/>
      <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="${TEXT}">${fmtNum(d.value)}</text>
      <text x="${x + barW / 2}" y="${HEIGHT - padB + 14}" text-anchor="middle" font-size="10" fill="${TEXT}">${escapeXml(d.label)}</text>
    `
  }).join('')

  return svgWrap(`
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${HEIGHT - padB}" stroke="${STROKE}" stroke-width="1.5"/>
    <line x1="${padL}" y1="${HEIGHT - padB}" x2="${WIDTH - padR}" y2="${HEIGHT - padB}" stroke="${STROKE}" stroke-width="1.5"/>
    ${bars}
    ${spec.yLabel ? `<text x="${padL - 30}" y="${padT + 10}" font-size="10" fill="${TEXT}">${escapeXml(spec.yLabel)}</text>` : ''}
  `)
}

// Hitung ULANG pembagian bersusun (porogapit) sendiri dari dividend/divisor
// mentah -- BUKAN dari langkah-langkah yang "diceritakan" AI -- supaya
// diagramnya selalu benar secara matematis meski AI-nya salah hitung di
// teks Pembahasan (lihat catatan di NOTASI_RULES soal Haiku kadang
// nyasar). Sama persis dengan algoritma pembagian bersusun yang diajarkan
// di SD: proses digit dividend satu-satu dari kiri, digit hasil bagi
// "disembunyikan" (bukan ditulis 0) selama nilai berjalan masih < divisor.
function computeLongDivision(dividend: number, divisor: number) {
  const digits = String(Math.abs(Math.trunc(dividend))).split('').map(Number)
  const d = Math.max(1, Math.abs(Math.trunc(divisor)))

  const quotientDigits: (number | null)[] = []
  const steps: { col: number; subtract: number; remainder: number }[] = []
  let current = 0
  let started = false

  for (let i = 0; i < digits.length; i++) {
    current = current * 10 + digits[i]
    if (current < d && !started) {
      quotientDigits.push(null)
      continue
    }
    started = true
    const q = Math.floor(current / d)
    const subtract = q * d
    const remainder = current - subtract
    quotientDigits.push(q)
    steps.push({ col: i, subtract, remainder })
    current = remainder
  }

  return {
    digits,
    quotientDigits,
    steps,
    divisor: d,
    remainder: current,
    quotientValue: started ? Number(quotientDigits.map((q) => (q === null ? '' : q)).join('')) : 0,
  }
}

const DIV_COL_W = 22
const DIV_STEP_H = 40

function longDivisionDimensions(spec: Extract<IllustrationSpec, { type: 'long_division' }>): { width: number; height: number } {
  const { digits, steps } = computeLongDivision(spec.dividend, spec.divisor)
  const bracketX = 60
  const dividendStartX = bracketX + 16
  const dividendY = 56
  const width = Math.max(220, dividendStartX + digits.length * DIV_COL_W + 30)
  const height = dividendY + 24 + Math.max(steps.length, 1) * DIV_STEP_H + 30
  return { width, height }
}

function renderLongDivision(spec: Extract<IllustrationSpec, { type: 'long_division' }>): string {
  const { width, height } = longDivisionDimensions(spec)
  const { digits, quotientDigits, steps, divisor, remainder } = computeLongDivision(spec.dividend, spec.divisor)

  const bracketX = 60
  const dividendStartX = bracketX + 16
  const dividendY = 56
  const quotientY = dividendY - 24
  const topLineY = dividendY - 16
  const rightEdge = (col: number) => dividendStartX + (col + 1) * DIV_COL_W

  const quotientText = quotientDigits.map((q, i) => q === null ? '' : `<text x="${dividendStartX + i * DIV_COL_W + DIV_COL_W / 2}" y="${quotientY}" text-anchor="middle" font-size="15" font-weight="700" fill="${TEXT}">${q}</text>`).join('')
  const dividendText = digits.map((digit, i) => `<text x="${dividendStartX + i * DIV_COL_W + DIV_COL_W / 2}" y="${dividendY}" text-anchor="middle" font-size="15" fill="${TEXT}">${digit}</text>`).join('')

  const stepsSvg = steps.map((step, k) => {
    const x = rightEdge(step.col)
    const subtractStr = `-${fmtNum(step.subtract)}`
    const remainderStr = fmtNum(step.remainder)
    const lineWidth = (Math.max(subtractStr.length, remainderStr.length) + 0.5) * (DIV_COL_W * 0.72)
    const rowTop = dividendY + 22 + k * DIV_STEP_H
    const subtractY = rowTop
    const lineY = subtractY + 6
    const remainderY = lineY + 20
    return `
      <text x="${x}" y="${subtractY}" text-anchor="end" font-size="13" fill="${TEXT}">${subtractStr}</text>
      <line x1="${x - lineWidth}" y1="${lineY}" x2="${x}" y2="${lineY}" stroke="${STROKE}" stroke-width="1.5"/>
      <text x="${x}" y="${remainderY}" text-anchor="end" font-size="13" fill="${TEXT}">${remainderStr}</text>
    `
  }).join('')

  const bracketRight = dividendStartX + digits.length * DIV_COL_W + 6
  const sisaY = dividendY + 22 + Math.max(steps.length, 1) * DIV_STEP_H + 10
  const sisaLabel = remainder === 0 ? 'Habis dibagi (sisa 0)' : `Sisa: ${fmtNum(remainder)}`

  return svgWrap(`
    ${quotientText}
    <line x1="${bracketX}" y1="${topLineY}" x2="${bracketRight}" y2="${topLineY}" stroke="${STROKE}" stroke-width="2"/>
    <line x1="${bracketX}" y1="${topLineY}" x2="${bracketX}" y2="${dividendY + 8}" stroke="${STROKE}" stroke-width="2"/>
    <text x="${bracketX - 8}" y="${dividendY}" text-anchor="end" font-size="15" fill="${TEXT}">${divisor}</text>
    ${dividendText}
    ${stepsSvg}
    <text x="${dividendStartX}" y="${sisaY}" font-size="12" fill="${TEXT}">${escapeXml(sisaLabel)}</text>
  `, width, height)
}

export function illustrationSvg(spec: IllustrationSpec): string {
  switch (spec.type) {
    case 'triangle': return renderTriangle(spec)
    case 'rectangle': return renderRectangle(spec)
    case 'circle': return renderCircle(spec)
    case 'number_line': return renderNumberLine(spec)
    case 'bar_chart': return renderBarChart(spec)
    case 'long_division': return renderLongDivision(spec)
  }
}

export function illustrationDimensions(spec: IllustrationSpec): { width: number; height: number } {
  if (spec.type === 'long_division') return longDivisionDimensions(spec)
  return { width: WIDTH, height: HEIGHT }
}

export const ILLUSTRATION_WIDTH = WIDTH
export const ILLUSTRATION_HEIGHT = HEIGHT
