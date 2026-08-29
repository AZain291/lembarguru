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
  // Bangun ruang -- pseudo-3D sederhana (bukan render 3D asli), cukup untuk
  // memberi gambaran bentuk + label ukuran.
  | { type: 'cube'; side: number; unit?: string }
  | { type: 'cuboid'; length: number; width: number; height: number; unit?: string }
  | { type: 'cylinder'; radius: number; height: number; unit?: string }
  | { type: 'cone'; radius: number; height: number; unit?: string }
  | { type: 'sphere'; radius: number; unit?: string }
  // Template generik "beri label bagian-bagian X" lintas mapel non-matematika
  // (lihat FRACTION_RULES-sejenis di generate/route.ts untuk kapan dipakai):
  // lingkaran konsentris (sel, atom), rantai/bintang bersambung (molekul,
  // rangkaian proses), kotak berlabel (bagian mesin, alur/tahapan).
  | { type: 'concentric'; layers: { label: string }[]; points?: { label?: string; layerIndex: number }[] }
  | { type: 'chain'; nodes: { label: string }[]; bonds?: { from: number; to: number }[] }
  | { type: 'labeled_boxes'; items: string[]; flow?: boolean }

const KNOWN_TYPES = new Set([
  'triangle', 'rectangle', 'circle', 'number_line', 'bar_chart', 'long_division',
  'cube', 'cuboid', 'cylinder', 'cone', 'sphere',
  'concentric', 'chain', 'labeled_boxes',
])

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0
}

// Validasi BENERAN per tipe, bukan cuma cek "type" dikenal -- AI kadang
// menyimpang dari skema (mis. pernah kejadian labeled_boxes.items dikirim
// sebagai [{label,desc}] alih-alih string[] mentah), dan kalau lolos ke
// render function apa adanya, hasilnya bukan crash tapi teks sampah macam
// "[object Object]" yang tampil ke user. Mending ditolak di sini (soal
// tetap tampil, cuma tanpa ilustrasi) daripada tampil rusak.
export function isIllustrationSpec(value: unknown): value is IllustrationSpec {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  const type = v.type
  if (typeof type !== 'string' || !KNOWN_TYPES.has(type)) return false

  switch (type) {
    case 'triangle':
      return (v.sideAB === undefined || isFiniteNumber(v.sideAB))
        && (v.sideBC === undefined || isFiniteNumber(v.sideBC))
        && (v.sideCA === undefined || isFiniteNumber(v.sideCA))
    case 'rectangle':
      return isFiniteNumber(v.width) && isFiniteNumber(v.height)
    case 'circle':
      return (v.radius === undefined || isFiniteNumber(v.radius)) && (v.diameter === undefined || isFiniteNumber(v.diameter))
    case 'number_line':
      return isFiniteNumber(v.min) && isFiniteNumber(v.max) && Array.isArray(v.points)
        && v.points.every((p) => p && typeof p === 'object' && isFiniteNumber((p as Record<string, unknown>).value))
    case 'bar_chart':
      return Array.isArray(v.data) && v.data.length > 0
        && v.data.every((d) => d && typeof d === 'object' && isNonEmptyString((d as Record<string, unknown>).label) && isFiniteNumber((d as Record<string, unknown>).value))
    case 'long_division':
      return isFiniteNumber(v.dividend) && isFiniteNumber(v.divisor)
    case 'cube':
      return isFiniteNumber(v.side)
    case 'cuboid':
      return isFiniteNumber(v.length) && isFiniteNumber(v.width) && isFiniteNumber(v.height)
    case 'cylinder':
    case 'cone':
      return isFiniteNumber(v.radius) && isFiniteNumber(v.height)
    case 'sphere':
      return isFiniteNumber(v.radius)
    case 'concentric':
      return Array.isArray(v.layers) && v.layers.length > 0
        && v.layers.every((l) => l && typeof l === 'object' && isNonEmptyString((l as Record<string, unknown>).label))
        && (v.points === undefined || (Array.isArray(v.points) && v.points.every((p) => p && typeof p === 'object' && isFiniteNumber((p as Record<string, unknown>).layerIndex))))
    case 'chain':
      return Array.isArray(v.nodes) && v.nodes.length > 0
        && v.nodes.every((n) => n && typeof n === 'object' && isNonEmptyString((n as Record<string, unknown>).label))
        && (v.bonds === undefined || (Array.isArray(v.bonds) && v.bonds.every((b) => b && typeof b === 'object' && isFiniteNumber((b as Record<string, unknown>).from) && isFiniteNumber((b as Record<string, unknown>).to))))
    case 'labeled_boxes':
      return Array.isArray(v.items) && v.items.length > 0 && v.items.every((i) => isNonEmptyString(i))
    default:
      return false
  }
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

// ── Bangun ruang (pseudo-3D sederhana) ──────────────────────────────────────
// Bukan render 3D asli -- cuma trik visual umum di buku pelajaran: sisi
// depan digambar utuh, sisi atas/kanan sebagai jajar genjang hasil offset,
// supaya kelihatan seperti bentuk ruang tanpa perlu engine 3D.
function pseudo3DBox(fx: number, fy: number, fw: number, fh: number, dx: number, dy: number): string {
  const TL = { x: fx, y: fy }, TR = { x: fx + fw, y: fy }, BR = { x: fx + fw, y: fy + fh }
  const TLb = { x: fx + dx, y: fy - dy }, TRb = { x: fx + fw + dx, y: fy - dy }, BRb = { x: fx + fw + dx, y: fy + fh - dy }
  return `
    <polygon points="${TL.x},${TL.y} ${TR.x},${TR.y} ${TRb.x},${TRb.y} ${TLb.x},${TLb.y}" fill="#dbeafe" stroke="${STROKE}" stroke-width="1.5"/>
    <polygon points="${TR.x},${TR.y} ${BR.x},${BR.y} ${BRb.x},${BRb.y} ${TRb.x},${TRb.y}" fill="#bfdbfe" stroke="${STROKE}" stroke-width="1.5"/>
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>
  `
}

function renderCube(spec: Extract<IllustrationSpec, { type: 'cube' }>): string {
  const fw = 120, fh = 120, dx = 36, dy = 26
  const fx = 76, fy = 46
  const unit = spec.unit ? ' ' + escapeXml(spec.unit) : ''
  return svgWrap(`
    ${pseudo3DBox(fx, fy, fw, fh, dx, dy)}
    <text x="${fx + fw / 2}" y="${fy + fh + 20}" text-anchor="middle" font-size="13" fill="${TEXT}">s = ${fmtNum(spec.side)}${unit}</text>
  `)
}

function renderCuboid(spec: Extract<IllustrationSpec, { type: 'cuboid' }>): string {
  const maxDim = Math.max(spec.length, spec.width, spec.height, 0.001)
  const scale = 130 / maxDim
  const fw = Math.max(30, spec.length * scale)
  const fh = Math.max(30, spec.height * scale)
  const depthPx = Math.max(18, spec.width * scale)
  const dx = depthPx * 0.75, dy = depthPx * 0.55
  const fx = 60, fy = 50
  const unit = spec.unit ? ' ' + escapeXml(spec.unit) : ''
  return svgWrap(`
    ${pseudo3DBox(fx, fy, fw, fh, dx, dy)}
    <text x="${fx + fw / 2}" y="${fy + fh + 20}" text-anchor="middle" font-size="12" fill="${TEXT}">p = ${fmtNum(spec.length)}${unit}</text>
    <text x="${fx - 8}" y="${fy + fh / 2}" text-anchor="end" font-size="12" fill="${TEXT}" transform="rotate(-90 ${fx - 8} ${fy + fh / 2})">t = ${fmtNum(spec.height)}${unit}</text>
    <text x="${fx + fw + dx / 2 + 6}" y="${fy - dy / 2 - 4}" font-size="12" fill="${TEXT}">l = ${fmtNum(spec.width)}${unit}</text>
  `)
}

function renderCylinder(spec: Extract<IllustrationSpec, { type: 'cylinder' }>): string {
  const rx = 70, ry = 20, bodyH = 120
  const cx = WIDTH / 2, topY = 52, bottomY = topY + bodyH
  const unit = spec.unit ? ' ' + escapeXml(spec.unit) : ''
  return svgWrap(`
    <ellipse cx="${cx}" cy="${bottomY}" rx="${rx}" ry="${ry}" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>
    <line x1="${cx - rx}" y1="${topY}" x2="${cx - rx}" y2="${bottomY}" stroke="${STROKE}" stroke-width="2"/>
    <line x1="${cx + rx}" y1="${topY}" x2="${cx + rx}" y2="${bottomY}" stroke="${STROKE}" stroke-width="2"/>
    <ellipse cx="${cx}" cy="${topY}" rx="${rx}" ry="${ry}" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>
    <line x1="${cx}" y1="${topY}" x2="${cx + rx}" y2="${topY}" stroke="${STROKE}" stroke-width="1"/>
    <text x="${cx + rx / 2}" y="${topY - 6}" text-anchor="middle" font-size="12" fill="${TEXT}">r = ${fmtNum(spec.radius)}${unit}</text>
    <text x="${cx + rx + 10}" y="${(topY + bottomY) / 2}" font-size="12" fill="${TEXT}">t = ${fmtNum(spec.height)}${unit}</text>
  `)
}

function renderCone(spec: Extract<IllustrationSpec, { type: 'cone' }>): string {
  const rx = 70, ry = 20, bodyH = 120
  const cx = WIDTH / 2, apexY = 52, bottomY = apexY + bodyH
  const unit = spec.unit ? ' ' + escapeXml(spec.unit) : ''
  return svgWrap(`
    <ellipse cx="${cx}" cy="${bottomY}" rx="${rx}" ry="${ry}" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>
    <line x1="${cx}" y1="${apexY}" x2="${cx - rx}" y2="${bottomY}" stroke="${STROKE}" stroke-width="2"/>
    <line x1="${cx}" y1="${apexY}" x2="${cx + rx}" y2="${bottomY}" stroke="${STROKE}" stroke-width="2"/>
    <text x="${cx + rx / 2}" y="${bottomY + 16}" text-anchor="middle" font-size="12" fill="${TEXT}">r = ${fmtNum(spec.radius)}${unit}</text>
    <text x="${cx + rx / 2 + 12}" y="${(apexY + bottomY) / 2}" font-size="12" fill="${TEXT}">t = ${fmtNum(spec.height)}${unit}</text>
  `)
}

function renderSphere(spec: Extract<IllustrationSpec, { type: 'sphere' }>): string {
  const r = 70, cx = WIDTH / 2, cy = HEIGHT / 2
  const unit = spec.unit ? ' ' + escapeXml(spec.unit) : ''
  return svgWrap(`
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.3}" fill="none" stroke="${STROKE}" stroke-width="1.2" stroke-dasharray="3,2"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${STROKE}" stroke-width="1.5"/>
    <text x="${cx + r / 2}" y="${cy - 8}" text-anchor="middle" font-size="13" fill="${TEXT}">r = ${fmtNum(spec.radius)}${unit}</text>
  `)
}

// ── Template generik lintas mapel ────────────────────────────────────────
const PALETTE = ['#93c5fd', '#86efac', '#fde047', '#f9a8d4', '#c4b5fd', '#fdba74']

function concentricDimensions(spec: Extract<IllustrationSpec, { type: 'concentric' }>): { width: number; height: number } {
  const legendH = Math.max(spec.layers.length, 1) * 18 + 16
  return { width: WIDTH, height: Math.max(190, legendH + 60) }
}

function renderConcentric(spec: Extract<IllustrationSpec, { type: 'concentric' }>): string {
  const { height } = concentricDimensions(spec)
  const n = Math.max(spec.layers.length, 1)
  const cx = 105, cy = height / 2
  const maxR = Math.min(cx - 15, cy - 15)

  const rings = spec.layers.map((_, i) => maxR * (i + 1) / n)
  const circles = spec.layers.map((_, i) => {
    const idx = n - 1 - i // gambar dari terluar ke terdalam
    const r = rings[idx]
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${PALETTE[idx % PALETTE.length]}" stroke="${STROKE}" stroke-width="1"/>`
  }).join('')

  const points = (spec.points ?? []).map((p) => {
    const layerCount = (spec.points ?? []).filter((q) => q.layerIndex === p.layerIndex).length
    const indexInLayer = (spec.points ?? []).filter((q) => q.layerIndex === p.layerIndex).indexOf(p)
    const r = rings[Math.min(Math.max(p.layerIndex, 0), n - 1)] ?? maxR
    const angle = (2 * Math.PI * indexInLayer) / Math.max(layerCount, 1) - Math.PI / 2
    const px = cx + r * Math.cos(angle), py = cy + r * Math.sin(angle)
    const label = p.label ? escapeXml(p.label) : ''
    return `<circle cx="${px}" cy="${py}" r="4" fill="#dc2626" stroke="#ffffff" stroke-width="1"/>` +
      (label ? `<text x="${px}" y="${py - 8}" text-anchor="middle" font-size="10" font-weight="700" fill="#dc2626">${label}</text>` : '')
  }).join('')

  const legendX = cx + maxR + 30
  const legendY0 = cy - ((n - 1) * 18) / 2
  const legend = spec.layers.map((layer, i) => {
    const y = legendY0 + i * 18
    return `
      <rect x="${legendX}" y="${y - 9}" width="11" height="11" fill="${PALETTE[i % PALETTE.length]}" stroke="${STROKE}" stroke-width="1"/>
      <text x="${legendX + 16}" y="${y}" font-size="11" fill="${TEXT}">${escapeXml(layer.label)}</text>
    `
  }).join('')

  return svgWrap(`${circles}${points}${legend}`, WIDTH, height)
}

function chainLayout(spec: Extract<IllustrationSpec, { type: 'chain' }>) {
  const n = spec.nodes.length
  const edges = spec.bonds && spec.bonds.length > 0 ? spec.bonds : spec.nodes.slice(0, -1).map((_, i) => ({ from: i, to: i + 1 }))
  const degree = new Array(n).fill(0)
  edges.forEach((e) => { if (degree[e.from] !== undefined) degree[e.from]++; if (degree[e.to] !== undefined) degree[e.to]++ })
  let hub = -1, maxDeg = 0
  degree.forEach((d, i) => { if (d > maxDeg) { maxDeg = d; hub = i } })

  const cx = WIDTH / 2, cy = HEIGHT / 2
  const positions: { x: number; y: number }[] = new Array(n)
  if (maxDeg >= 3 && hub >= 0) {
    positions[hub] = { x: cx, y: cy }
    const others = [...Array(n).keys()].filter((i) => i !== hub)
    const R = 85
    others.forEach((idx, k) => {
      const angle = (2 * Math.PI * k) / others.length - Math.PI / 2
      positions[idx] = { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) }
    })
  } else {
    const gap = n > 1 ? (WIDTH - 80) / (n - 1) : 0
    spec.nodes.forEach((_, i) => { positions[i] = { x: 40 + gap * i, y: cy } })
  }
  return { positions, edges }
}

function renderChain(spec: Extract<IllustrationSpec, { type: 'chain' }>): string {
  const { positions, edges } = chainLayout(spec)
  const bonds = edges.map((e) => {
    const a = positions[e.from], b = positions[e.to]
    if (!a || !b) return ''
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${STROKE}" stroke-width="2"/>`
  }).join('')
  const nodes = spec.nodes.map((node, i) => {
    const p = positions[i]
    if (!p) return ''
    return `
      <circle cx="${p.x}" cy="${p.y}" r="22" fill="${PALETTE[i % PALETTE.length]}" stroke="${STROKE}" stroke-width="1.5"/>
      <text x="${p.x}" y="${p.y + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="${TEXT}">${escapeXml(node.label)}</text>
    `
  }).join('')
  return svgWrap(`${bonds}${nodes}`)
}

function labeledBoxesDimensions(spec: Extract<IllustrationSpec, { type: 'labeled_boxes' }>): { width: number; height: number } {
  const n = Math.max(spec.items.length, 1)
  if (spec.flow) return { width: Math.max(280, n * 95 - 20), height: 130 }
  const cols = Math.min(3, n)
  const rows = Math.ceil(n / cols)
  return { width: 320, height: Math.max(130, rows * 68 + 30) }
}

function renderLabeledBoxes(spec: Extract<IllustrationSpec, { type: 'labeled_boxes' }>): string {
  const { width, height } = labeledBoxesDimensions(spec)
  const items = spec.items.slice(0, 12)

  if (spec.flow) {
    const boxW = 72, boxH = 48, gap = 23
    const y = (height - boxH) / 2
    const boxes = items.map((label, i) => {
      const x = 20 + i * (boxW + gap)
      const arrow = i < items.length - 1
        ? `<line x1="${x + boxW}" y1="${y + boxH / 2}" x2="${x + boxW + gap - 4}" y2="${y + boxH / 2}" stroke="${STROKE}" stroke-width="1.5" marker-end="url(#flowArrow)"/>`
        : ''
      return `
        <rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="6" fill="${PALETTE[i % PALETTE.length]}" stroke="${STROKE}" stroke-width="1.5"/>
        <text x="${x + boxW / 2}" y="${y + boxH / 2 + 4}" text-anchor="middle" font-size="10.5" fill="${TEXT}">${escapeXml(label)}</text>
        ${arrow}
      `
    }).join('')
    return svgWrap(`
      <defs><marker id="flowArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${STROKE}"/></marker></defs>
      ${boxes}
    `, width, height)
  }

  const cols = Math.min(3, items.length || 1)
  const boxW = (width - 40 - (cols - 1) * 10) / cols
  const boxH = 50
  const boxes = items.map((label, i) => {
    const row = Math.floor(i / cols), col = i % cols
    const x = 20 + col * (boxW + 10)
    const y = 20 + row * (boxH + 15)
    return `
      <rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="6" fill="${PALETTE[i % PALETTE.length]}" stroke="${STROKE}" stroke-width="1.5"/>
      <text x="${x + boxW / 2}" y="${y + boxH / 2 + 4}" text-anchor="middle" font-size="10.5" fill="${TEXT}">${escapeXml(label)}</text>
    `
  }).join('')
  return svgWrap(boxes, width, height)
}

export function illustrationSvg(spec: IllustrationSpec): string {
  switch (spec.type) {
    case 'triangle': return renderTriangle(spec)
    case 'rectangle': return renderRectangle(spec)
    case 'circle': return renderCircle(spec)
    case 'number_line': return renderNumberLine(spec)
    case 'bar_chart': return renderBarChart(spec)
    case 'long_division': return renderLongDivision(spec)
    case 'cube': return renderCube(spec)
    case 'cuboid': return renderCuboid(spec)
    case 'cylinder': return renderCylinder(spec)
    case 'cone': return renderCone(spec)
    case 'sphere': return renderSphere(spec)
    case 'concentric': return renderConcentric(spec)
    case 'chain': return renderChain(spec)
    case 'labeled_boxes': return renderLabeledBoxes(spec)
  }
}

export function illustrationDimensions(spec: IllustrationSpec): { width: number; height: number } {
  if (spec.type === 'long_division') return longDivisionDimensions(spec)
  if (spec.type === 'concentric') return concentricDimensions(spec)
  if (spec.type === 'labeled_boxes') return labeledBoxesDimensions(spec)
  return { width: WIDTH, height: HEIGHT }
}

export const ILLUSTRATION_WIDTH = WIDTH
export const ILLUSTRATION_HEIGHT = HEIGHT
