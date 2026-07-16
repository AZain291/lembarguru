// Generate template Excel/Word untuk halaman /materi (Download Material).
// Dijalankan sekali secara manual (bukan build step) -- output-nya file statis
// di public/materi/, di-commit ke repo seperti aset lain.
//   node scripts/generate-materi.mjs
import ExcelJS from 'exceljs';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, BorderStyle, WidthType, VerticalAlign,
  ShadingType, Header as DocxHeader, Footer,
} from 'docx';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'public', 'materi');
await mkdir(OUT_DIR, { recursive: true });

const BRAND_ARGB = 'FF2563EB';
const BRAND_HEX = '2563EB';
const THIN = { style: 'thin', color: { argb: 'FFB7C3D6' } };
const CELL_BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function styleHeaderRow(row, colCount) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_ARGB } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = CELL_BORDER;
  }
  row.height = 28;
}

function borderRow(row, colCount) {
  for (let i = 1; i <= colCount; i++) row.getCell(i).border = CELL_BORDER;
}

function titleBlock(ws, title, colCount, meta = []) {
  ws.mergeCells(1, 1, 1, colCount);
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font = { bold: true, size: 15, color: { argb: BRAND_ARGB } };
  t.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  let r = 2;
  for (const line of meta) {
    ws.mergeCells(r, 1, r, colCount);
    const c = ws.getCell(r, 1);
    c.value = line;
    c.font = { size: 10, color: { argb: 'FF475569' } };
    c.alignment = { horizontal: 'left', vertical: 'middle' };
    r++;
  }
  return r + 1; // baris kosong lalu baris berikutnya siap dipakai
}

async function saveWorkbook(wb, fileName) {
  await wb.xlsx.writeFile(path.join(OUT_DIR, fileName));
  console.log('✓', fileName);
}

async function saveDoc(doc, fileName) {
  const buffer = await Packer.toBuffer(doc);
  await writeFile(path.join(OUT_DIR, fileName), buffer);
  console.log('✓', fileName);
}

// ── 1. Jadwal Pelajaran ────────────────────────────────────────────────────
async function buildJadwalPelajaran() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Jadwal Pelajaran');
  const cols = ['Jam Ke', 'Waktu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  ws.columns = cols.map((_, i) => ({ width: i === 0 ? 9 : i === 1 ? 14 : 18 }));

  const headerRowIdx = titleBlock(ws, 'JADWAL PELAJARAN', cols.length, [
    'Nama Sekolah: ______________________     Kelas: __________     Tahun Ajaran: __________',
  ]);
  const header = ws.getRow(headerRowIdx);
  cols.forEach((c, i) => (header.getCell(i + 1).value = c));
  styleHeaderRow(header, cols.length);

  for (let jam = 1; jam <= 10; jam++) {
    const row = ws.getRow(headerRowIdx + jam);
    row.getCell(1).value = jam;
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).value = '';
    borderRow(row, cols.length);
  }
  await saveWorkbook(wb, 'jadwal-pelajaran.xlsx');
}

// ── 2. Daftar Nilai Otomatis ────────────────────────────────────────────────
async function buildDaftarNilai() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Daftar Nilai');
  const cols = ['No', 'Nama Siswa', 'NISN', 'Tugas 1', 'Tugas 2', 'UH 1', 'UH 2', 'PTS', 'PAS', 'Rata-rata', 'Predikat', 'Keterangan'];
  ws.columns = [6, 24, 12, 9, 9, 9, 9, 9, 9, 10, 10, 14].map((width) => ({ width }));

  ws.mergeCells('A1:L1');
  ws.getCell('A1').value = 'DAFTAR NILAI OTOMATIS';
  ws.getCell('A1').font = { bold: true, size: 15, color: { argb: BRAND_ARGB } };
  ws.getCell('A1').alignment = { horizontal: 'center' };
  ws.getRow(1).height = 26;

  ws.getCell('A2').value = 'Mata Pelajaran:';
  ws.getCell('B2').value = '______________';
  ws.getCell('D2').value = 'Kelas:';
  ws.getCell('E2').value = '_______';
  ws.getCell('G2').value = 'Semester:';
  ws.getCell('H2').value = '_______';
  ws.getCell('A2').font = ws.getCell('D2').font = ws.getCell('G2').font = { size: 10, bold: true, color: { argb: 'FF475569' } };

  ws.getCell('A3').value = 'KKM:';
  ws.getCell('A3').font = { size: 10, bold: true, color: { argb: 'FF475569' } };
  ws.getCell('B3').value = 75;
  ws.getCell('B3').font = { bold: true, color: { argb: BRAND_ARGB } };
  ws.getCell('B3').alignment = { horizontal: 'center' };
  ws.getCell('B3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE7FB' } };
  ws.getCell('C3').value = '(ubah angka ini, seluruh kolom Keterangan menyesuaikan otomatis)';
  ws.getCell('C3').font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } };

  const headerRowIdx = 5;
  const header = ws.getRow(headerRowIdx);
  cols.forEach((c, i) => (header.getCell(i + 1).value = c));
  styleHeaderRow(header, cols.length);

  const firstDataRow = headerRowIdx + 1;
  const lastDataRow = firstDataRow + 24; // 25 siswa
  for (let r = firstDataRow; r <= lastDataRow; r++) {
    const row = ws.getRow(r);
    row.getCell(1).value = r - firstDataRow + 1;
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(10).value = { formula: `IFERROR(AVERAGE(D${r}:I${r}),"")` };
    row.getCell(10).numFmt = '0.0';
    row.getCell(11).value = { formula: `IF(J${r}="","",IF(J${r}>=90,"A",IF(J${r}>=80,"B",IF(J${r}>=70,"C","D"))))` };
    row.getCell(11).alignment = { horizontal: 'center' };
    row.getCell(12).value = { formula: `IF(J${r}="","",IF(J${r}>=$B$3,"Tuntas","Belum Tuntas"))` };
    borderRow(row, cols.length);
  }
  await saveWorkbook(wb, 'daftar-nilai-otomatis.xlsx');
}

// ── 3. Format Presensi / Absensi ────────────────────────────────────────────
async function buildPresensi() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Presensi');
  const dayCount = 31;
  const cols = ['No', 'Nama Siswa', ...Array.from({ length: dayCount }, (_, i) => String(i + 1)), 'H', 'S', 'I', 'A'];
  ws.columns = [6, 24, ...Array(dayCount).fill(4), 6, 6, 6, 6].map((width) => ({ width }));

  const totalCols = cols.length;
  const headerRowIdx = titleBlock(ws, 'FORMAT PRESENSI SISWA', totalCols, [
    'Nama Sekolah: ______________________     Kelas: __________     Bulan: __________',
  ]);
  const header = ws.getRow(headerRowIdx);
  cols.forEach((c, i) => (header.getCell(i + 1).value = c));
  styleHeaderRow(header, totalCols);

  const firstDataRow = headerRowIdx + 1;
  const lastDataRow = firstDataRow + 29; // 30 siswa
  for (let r = firstDataRow; r <= lastDataRow; r++) {
    const row = ws.getRow(r);
    row.getCell(1).value = r - firstDataRow + 1;
    row.getCell(1).alignment = { horizontal: 'center' };
    borderRow(row, totalCols);
  }

  const legendRow = ws.getRow(lastDataRow + 2);
  legendRow.getCell(1).value = 'Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alpa';
  legendRow.getCell(1).font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } };
  await saveWorkbook(wb, 'format-presensi.xlsx');
}

// ── 4. Kalender Pendidikan ──────────────────────────────────────────────────
async function buildKalenderPendidikan() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Kalender Pendidikan');
  const cols = ['Bulan', 'Jumlah Hari Efektif', 'Kegiatan / Libur', 'Tanggal Penting', 'Keterangan'];
  ws.columns = [14, 16, 32, 20, 24].map((width) => ({ width }));

  const headerRowIdx = titleBlock(ws, 'KALENDER PENDIDIKAN', cols.length, [
    'Satuan Pendidikan: ______________________     Tahun Ajaran: __________ / __________',
  ]);
  const header = ws.getRow(headerRowIdx);
  cols.forEach((c, i) => (header.getCell(i + 1).value = c));
  styleHeaderRow(header, cols.length);

  const months = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
  months.forEach((m, i) => {
    const row = ws.getRow(headerRowIdx + 1 + i);
    row.getCell(1).value = m;
    borderRow(row, cols.length);
  });
  await saveWorkbook(wb, 'kalender-pendidikan.xlsx');
}

// ── 5. Buku Induk Siswa ─────────────────────────────────────────────────────
async function buildBukuIndukSiswa() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Buku Induk');
  const cols = ['No', 'No Induk', 'NISN', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Agama', 'Nama Ayah', 'Nama Ibu', 'Alamat', 'No HP Orang Tua', 'Tanggal Masuk', 'Kelas', 'Keterangan'];
  ws.columns = [6, 10, 12, 22, 16, 14, 12, 10, 18, 18, 26, 16, 14, 8, 16].map((width) => ({ width }));

  const headerRowIdx = titleBlock(ws, 'BUKU INDUK SISWA', cols.length, [
    'Nama Sekolah: ______________________     Tahun Ajaran: __________',
  ]);
  const header = ws.getRow(headerRowIdx);
  cols.forEach((c, i) => (header.getCell(i + 1).value = c));
  styleHeaderRow(header, cols.length);

  const firstDataRow = headerRowIdx + 1;
  const lastDataRow = firstDataRow + 29; // 30 siswa
  for (let r = firstDataRow; r <= lastDataRow; r++) {
    const row = ws.getRow(r);
    row.getCell(1).value = r - firstDataRow + 1;
    row.getCell(1).alignment = { horizontal: 'center' };
    borderRow(row, cols.length);
  }
  await saveWorkbook(wb, 'buku-induk-siswa.xlsx');
}

// ── docx helpers ─────────────────────────────────────────────────────────
const DOCX_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'B7C3D6' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'B7C3D6' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'B7C3D6' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'B7C3D6' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'B7C3D6' },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'B7C3D6' },
};

function hCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: BRAND_HEX },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })] })],
  });
}

function dCell(text = '', width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
    ...opts,
  });
}

function metaParagraphs(lines) {
  return lines.map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 20 })], spacing: { after: 80 } }));
}

function docTitle(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } });
}

function blankCell(width, lines = 3) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    children: Array.from({ length: lines }, () => new Paragraph({ text: '', spacing: { after: 60 } })),
  });
}

// Footer halus bermerek -- dipakai KHUSUS di lembar yang dibawa pulang
// siswa/orang tua (bukan dokumen administrasi internal guru), supaya nama
// LembarGuru ikut terlihat tiap kali lembar itu dicetak/dibagikan, tanpa
// perlu bikin produk terpisah untuk orang tua.
function brandedFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
        spacing: { before: 120 },
        children: [
          new TextRun({ text: 'Dibuat dengan ', size: 15, color: '94A3B8', italics: true }),
          new TextRun({ text: 'LembarGuru', size: 15, color: BRAND_HEX, bold: true, italics: true }),
          new TextRun({ text: ' • lembarguru.com', size: 15, color: '94A3B8', italics: true }),
        ],
      }),
    ],
  });
}

// ── 6. Daftar Hadir Rapat/Kegiatan ─────────────────────────────────────────
async function buildDaftarHadir() {
  const widths = [700, 3200, 2600, 2600];
  const headers = ['No', 'Nama', 'Jabatan / Unit Kerja', 'Tanda Tangan'];
  const rows = [new TableRow({ children: headers.map((h, i) => hCell(h, widths[i])), tableHeader: true })];
  for (let i = 1; i <= 25; i++) {
    rows.push(new TableRow({ children: [dCell(String(i), widths[0], { verticalAlign: VerticalAlign.CENTER }), dCell('', widths[1]), dCell('', widths[2]), dCell('', widths[3])] }));
  }

  const doc = new Document({
    sections: [{
      children: [
        docTitle('DAFTAR HADIR'),
        ...metaParagraphs([
          'Nama Kegiatan  : ______________________________________',
          'Hari / Tanggal   : ______________________________________',
          'Tempat             : ______________________________________',
          'Waktu               : ______________________________________',
        ]),
        new Paragraph({ text: '', spacing: { after: 120 } }),
        new Table({ width: { size: 9100, type: WidthType.DXA }, borders: DOCX_BORDERS, rows }),
        new Paragraph({ text: '', spacing: { before: 400 } }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '__________________, __________________' })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Mengetahui,' })], spacing: { before: 100 } }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Kepala Sekolah' })], spacing: { before: 800 } }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '( _________________________ )' })], spacing: { before: 100 } }),
      ],
    }],
  });
  await saveDoc(doc, 'daftar-hadir.docx');
}

// ── 7. Program Tahunan (Prota) ──────────────────────────────────────────────
async function buildProta() {
  const widths = [600, 1400, 4200, 1600, 1300];
  const headers = ['No', 'Semester', 'Bab / Kompetensi Dasar', 'Alokasi Waktu (JP)', 'Keterangan'];
  const rows = [new TableRow({ children: headers.map((h, i) => hCell(h, widths[i])), tableHeader: true })];
  for (let i = 1; i <= 15; i++) {
    rows.push(new TableRow({ children: [dCell(String(i), widths[0]), dCell('', widths[1]), dCell('', widths[2]), dCell('', widths[3]), dCell('', widths[4])] }));
  }

  const doc = new Document({
    sections: [{
      children: [
        docTitle('PROGRAM TAHUNAN (PROTA)'),
        ...metaParagraphs([
          'Nama Sekolah      : ______________________________________',
          'Mata Pelajaran     : ______________________________________',
          'Kelas                    : ______________________________________',
          'Tahun Ajaran        : ______________________________________',
        ]),
        new Paragraph({ text: '', spacing: { after: 120 } }),
        new Table({ width: { size: 9100, type: WidthType.DXA }, borders: DOCX_BORDERS, rows }),
        new Paragraph({ text: '', spacing: { before: 500 } }),
        new Paragraph({ children: [new TextRun({ text: 'Mengetahui,' })] }),
        new Paragraph({ children: [new TextRun({ text: 'Kepala Sekolah' })], spacing: { before: 800 } }),
        new Paragraph({ children: [new TextRun({ text: '( _________________________ )' })], spacing: { before: 100 } }),
      ],
    }],
  });
  await saveDoc(doc, 'program-tahunan.docx');
}

// ── 8. Program Semester (Promes) ────────────────────────────────────────────
async function buildPromes() {
  const monthLabels = ['Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const widths = [500, 3200, 900, ...monthLabels.map(() => 700), 1200]; // total 10000 DXA
  const headers = ['No', 'Kompetensi Dasar / Materi', 'Alokasi (JP)', ...monthLabels, 'Keterangan'];
  const rows = [new TableRow({ children: headers.map((h, i) => hCell(h, widths[i])), tableHeader: true })];
  for (let i = 1; i <= 15; i++) {
    rows.push(new TableRow({
      children: [
        dCell(String(i), widths[0]),
        dCell('', widths[1]),
        dCell('', widths[2]),
        ...monthLabels.map((_, mi) => dCell('', widths[3 + mi])),
        dCell('', widths[widths.length - 1]),
      ],
    }));
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: [
        docTitle('PROGRAM SEMESTER (PROMES)'),
        ...metaParagraphs([
          'Nama Sekolah      : ______________________________________',
          'Mata Pelajaran     : ______________________________________',
          'Kelas / Semester  : ______________________________________',
          'Tahun Ajaran        : ______________________________________',
        ]),
        new Paragraph({ text: '', spacing: { after: 120 } }),
        new Table({ width: { size: 10000, type: WidthType.DXA }, borders: DOCX_BORDERS, rows }),
        new Paragraph({ children: [new TextRun({ text: 'Beri tanda (✓) pada kolom bulan saat materi tersebut diajarkan.', italics: true, size: 18 })], spacing: { before: 150 } }),
      ],
    }],
  });
  await saveDoc(doc, 'program-semester.docx');
}

// ── 9. Agenda Harian Mengajar ───────────────────────────────────────────────
async function buildAgendaHarian() {
  const widths = [500, 1400, 700, 700, 2200, 2200, 1500, 1500]; // total 10700 DXA
  const headers = ['No', 'Hari / Tanggal', 'Kelas', 'Jam Ke', 'Kompetensi Dasar / Materi', 'Kegiatan Pembelajaran', 'Siswa Tidak Hadir', 'Catatan'];
  const rows = [new TableRow({ children: headers.map((h, i) => hCell(h, widths[i])), tableHeader: true })];
  for (let i = 1; i <= 20; i++) {
    rows.push(new TableRow({ children: widths.map((w, ci) => dCell(ci === 0 ? String(i) : '', w)) }));
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: [
        docTitle('AGENDA HARIAN MENGAJAR'),
        ...metaParagraphs([
          'Nama Guru           : ______________________________________',
          'Mata Pelajaran     : ______________________________________',
          'Tahun Ajaran        : ______________________________________',
        ]),
        new Paragraph({ text: '', spacing: { after: 120 } }),
        new Table({ width: { size: 10700, type: WidthType.DXA }, borders: DOCX_BORDERS, rows }),
      ],
    }],
  });
  await saveDoc(doc, 'agenda-harian-mengajar.docx');
}

// ── 10. Lembar PR Mingguan (dibawa pulang) ──────────────────────────────────
async function buildLembarPRMingguan() {
  const widths = [1100, 2200, 3400, 2200]; // total 8900 DXA
  const headers = ['Hari', 'Mata Pelajaran', 'Tugas / PR', 'Tanda Tangan Orang Tua'];
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const rows = [new TableRow({ children: headers.map((h, i) => hCell(h, widths[i])), tableHeader: true })];
  for (const day of days) {
    rows.push(new TableRow({
      children: [
        dCell(day, widths[0], { verticalAlign: VerticalAlign.CENTER }),
        blankCell(widths[1], 2),
        blankCell(widths[2], 2),
        blankCell(widths[3], 2),
      ],
    }));
  }

  const doc = new Document({
    sections: [{
      footers: { default: brandedFooter() },
      children: [
        docTitle('LEMBAR PR MINGGUAN'),
        ...metaParagraphs([
          'Nama Siswa   : ______________________________________',
          'Kelas             : ______________________________________',
          'Minggu Ke     : __________     Tanggal: __________ s/d __________',
        ]),
        new Paragraph({ text: '', spacing: { after: 120 } }),
        new Table({ width: { size: 8900, type: WidthType.DXA }, borders: DOCX_BORDERS, rows }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({ text: 'Orang tua/wali mohon memberi tanda tangan di kolom paling kanan setelah PR dikerjakan dan diperiksa di rumah.', italics: true, size: 18, color: '64748B' })],
        }),
      ],
    }],
  });
  await saveDoc(doc, 'lembar-pr-mingguan.docx');
}

// ── 11. Lembar Latihan Mandiri (dibawa pulang) ──────────────────────────────
async function buildLembarLatihanMandiri() {
  const widths = [500, 4700, 3700]; // total 8900 DXA
  const headers = ['No', 'Soal / Latihan', 'Jawaban'];
  const rows = [new TableRow({ children: headers.map((h, i) => hCell(h, widths[i])), tableHeader: true })];
  for (let i = 1; i <= 10; i++) {
    rows.push(new TableRow({
      children: [
        dCell(String(i), widths[0], { verticalAlign: VerticalAlign.CENTER }),
        blankCell(widths[1], 3),
        blankCell(widths[2], 3),
      ],
    }));
  }

  const doc = new Document({
    sections: [{
      footers: { default: brandedFooter() },
      children: [
        docTitle('LEMBAR LATIHAN MANDIRI'),
        ...metaParagraphs([
          'Nama Siswa       : ______________________________________',
          'Kelas                 : ______________________________________',
          'Mata Pelajaran  : ______________________________________',
          'Topik                 : ______________________________________     Tanggal: __________',
        ]),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'Kerjakan latihan berikut secara mandiri di rumah. Tanyakan ke guru atau orang tua kalau ada yang belum dipahami.', italics: true, size: 18, color: '64748B' })],
        }),
        new Table({ width: { size: 8900, type: WidthType.DXA }, borders: DOCX_BORDERS, rows }),
      ],
    }],
  });
  await saveDoc(doc, 'lembar-latihan-mandiri.docx');
}

await buildJadwalPelajaran();
await buildDaftarNilai();
await buildPresensi();
await buildKalenderPendidikan();
await buildBukuIndukSiswa();
await buildDaftarHadir();
await buildProta();
await buildPromes();
await buildAgendaHarian();
await buildLembarPRMingguan();
await buildLembarLatihanMandiri();

console.log('Selesai. File tersimpan di', OUT_DIR);
