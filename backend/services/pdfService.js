const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  accent: "#E63946",
  accentDark: "#C1121F",
  accentLight: "#FDECEA",
  ink: "#0D1117",
  inkMid: "#374151",
  inkSoft: "#6B7280",
  inkFaint: "#9CA3AF",
  surface: "#F9FAFB",
  surfaceCard: "#FFFFFF",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  green: "#059669",
  greenBg: "#ECFDF5",
  blue: "#2563EB",
  blueBg: "#EFF6FF",
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Utilities ────────────────────────────────────────────────────────────────
const ensureExportDir = () => {
  const dir = path.join(__dirname, "../exports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const val = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
};

// ─── Page Management ──────────────────────────────────────────────────────────
const needsNewPage = (doc, height = 80) => {
  const bottomLimit = PAGE_H - 70;
  const currentY = doc.y || MARGIN;

  // Si on est déjà en haut d'une page, on n'ajoute jamais une nouvelle page
  if (currentY <= MARGIN + 10) {
    return false;
  }

  if (currentY + height > bottomLimit) {
    doc.addPage();
    doc.y = MARGIN;
    return true;
  }

  return false;
};

const addFooter = (doc) => {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const y = PAGE_H - 36;
    doc.rect(MARGIN, y - 8, CONTENT_W, 0.5).fill(C.border);
    doc
      .fillColor(C.inkFaint)
      .font("Helvetica")
      .fontSize(7.5)
      .text(
        `Document généré automatiquement  ·  ${new Date().toLocaleString("fr-FR")}`,
        MARGIN,
        y,
        { width: CONTENT_W - 50, align: "left" },
      );
    doc
      .fillColor(C.inkFaint)
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(`${i + 1} / ${range.count}`, MARGIN, y, {
        width: CONTENT_W,
        align: "right",
      });
  }
  //eviter le saut de page inutille à la fin du document
  doc.switchToPage(range.start + range.count - 1);
  doc.y = PAGE_H - 60;
};

// ─── Header ───────────────────────────────────────────────────────────────────
const drawHeader = (doc, { title, subtitle, tag, tagColor }) => {
  const H = 108;
  doc.rect(0, 0, PAGE_W, H).fill(C.ink);
  doc.rect(0, 0, 5, H).fill(tagColor === "blue" ? C.blue : C.accent);

  doc
    .fillColor(C.surfaceCard)
    .font("Helvetica-Bold")
    .fontSize(25)
    .text(title, 22, 24, { characterSpacing: 0.8 });

  doc
    .fillColor(C.inkFaint)
    .font("Helvetica")
    .fontSize(10)
    .text(subtitle, 22, 60);

  if (tag) {
    const tc = tagColor === "blue" ? C.blue : C.accent;
    const bw = 68,
      bh = 24,
      bx = PAGE_W - bw - 22,
      by = 34;
    doc.roundedRect(bx, by, bw, bh, 5).fill(tc);
    doc
      .fillColor(C.surfaceCard)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(tag, bx, by + 7, { width: bw, align: "center" });
  }

  doc.y = H + 20;
};

// ─── Section Title ────────────────────────────────────────────────────────────
const sectionTitle = (doc, title) => {
  needsNewPage(doc, 50);
  doc.moveDown(0.3);
  const y = doc.y;
  doc.rect(MARGIN, y, 3, 22).fill(C.accent);
  doc
    .fillColor(C.ink)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(title.toUpperCase(), MARGIN + 12, y + 5, { characterSpacing: 0.7 });
  doc.y = y + 30;
  doc.rect(MARGIN, doc.y - 2, CONTENT_W, 0.5).fill(C.border);
  doc.y += 10;
};

// ─── Info Grid ────────────────────────────────────────────────────────────────
// KEY FIX: rowY captured ONCE per row — all cards in the same row share identical Y
const infoGrid = (doc, items, columns = 2) => {
  const GAP = 10;
  const CW = (CONTENT_W - GAP * (columns - 1)) / columns;
  const CH = 52;

  // Pre-split into rows
  const rows = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  rows.forEach((row) => {
    needsNewPage(doc, CH + 14);
    const rowY = doc.y; // ← single Y for every card in this row

    row.forEach((item, col) => {
      const x = MARGIN + col * (CW + GAP);

      // Shadow rect
      doc.roundedRect(x + 1, rowY + 1, CW, CH, 7).fill(C.borderLight);
      // Card
      doc
        .roundedRect(x, rowY, CW, CH, 7)
        .fillAndStroke(C.surfaceCard, C.border);

      // Label
      doc
        .fillColor(C.inkSoft)
        .font("Helvetica")
        .fontSize(7.5)
        .text(item.label.toUpperCase(), x + 12, rowY + 10, {
          width: CW - 24,
          characterSpacing: 0.3,
        });

      // Value
      doc
        .fillColor(C.ink)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(val(item.value), x + 12, rowY + 28, { width: CW - 24 });
    });

    doc.y = rowY + CH + 12; // advance Y once after the whole row
  });
};

// ─── Stat Row (KPI Pills) ─────────────────────────────────────────────────────
// Same fix: single rowY for all pills
const statRow = (doc, items) => {
  const count = items.length;
  const GAP = 10;
  const W = (CONTENT_W - GAP * (count - 1)) / count;
  const H = 62;

  needsNewPage(doc, H + 14);
  const rowY = doc.y; // ← single Y for every pill

  items.forEach((item, i) => {
    const x = MARGIN + i * (W + GAP);
    doc.roundedRect(x + 1, rowY + 1, W, H, 8).fill(C.borderLight);
    doc.roundedRect(x, rowY, W, H, 8).fill(item.bg || C.blueBg);

    doc
      .fillColor(item.color || C.blue)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(val(item.value), x, rowY + 10, { width: W, align: "center" });

    doc
      .fillColor(item.color || C.blue)
      .font("Helvetica")
      .fontSize(7.5)
      .text(item.label.toUpperCase(), x, rowY + 38, {
        width: W,
        align: "center",
        characterSpacing: 0.3,
      });
  });

  doc.y = rowY + H + 12;
};

// ─── Text Block ───────────────────────────────────────────────────────────────
const textBlock = (doc, label, text) => {
  const content = val(text);
  const innerW = CONTENT_W - 28;
  const textH = doc.heightOfString(content, { width: innerW });
  const boxH = Math.max(50, textH + 26);

  needsNewPage(doc, boxH + 32);

  doc
    .fillColor(C.inkSoft)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(label.toUpperCase(), MARGIN, doc.y, { characterSpacing: 0.4 });
  doc.y += 13;

  const bx = MARGIN,
    by = doc.y;

  doc.roundedRect(bx + 1, by + 1, CONTENT_W, boxH, 8).fill(C.borderLight);
  doc
    .roundedRect(bx, by, CONTENT_W, boxH, 8)
    .fillAndStroke(C.surfaceCard, C.border);
  // Left stripe
  doc.roundedRect(bx, by, 3, boxH, 3).fill(C.accentLight);
  doc.rect(bx, by + 3, 3, boxH - 6).fill(C.accentLight);

  doc
    .fillColor(C.inkMid)
    .font("Helvetica")
    .fontSize(9.5)
    .text(content, bx + 18, by + 13, { width: innerW });

  doc.y = by + boxH + 14;
};

// ─── Table ────────────────────────────────────────────────────────────────────
const table = (doc, title, columns, rows) => {
  sectionTitle(doc, title);

  const RH = 28;
  const CW = CONTENT_W / columns.length;

  needsNewPage(doc, RH * 2 + 10);
  const hy = doc.y;

  // Header
  doc.roundedRect(MARGIN, hy, CONTENT_W, RH, 5).fill(C.ink);
  columns.forEach((col, i) => {
    doc
      .fillColor(C.surfaceCard)
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(col.toUpperCase(), MARGIN + i * CW + 8, hy + 9, {
        width: CW - 16,
        characterSpacing: 0.2,
      });
  });
  doc.y = hy + RH;

  // Body — each row has its own captured Y
  rows.forEach((row, ri) => {
    needsNewPage(doc, RH + 4);
    const ry = doc.y;
    const fill = ri % 2 === 0 ? C.surfaceCard : C.surface;

    doc.rect(MARGIN, ry, CONTENT_W, RH).fillAndStroke(fill, C.border);

    row.forEach((cell, ci) => {
      doc
        .fillColor(ci === 0 ? C.inkMid : C.ink)
        .font(ci === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8.5)
        .text(val(cell), MARGIN + ci * CW + 8, ry + 8, { width: CW - 16 });
    });

    doc.y = ry + RH;
  });

  doc.rect(MARGIN, doc.y, CONTENT_W, 1).fill(C.border);
  doc.y += 16;
};

// ─── Divider ──────────────────────────────────────────────────────────────────
const divider = (doc) => {
  doc.rect(MARGIN, doc.y, CONTENT_W, 1).fill(C.borderLight);
  doc.y += 14;
};

// ─── PDF Factory ─────────────────────────────────────────────────────────────
const createPdf = (filename, callback) => {
  return new Promise((resolve, reject) => {
    const dir = ensureExportDir();
    const filePath = path.join(dir, `${filename}-${Date.now()}.pdf`);
    const doc = new PDFDocument({
      size: "A4",
      margin: MARGIN,
      bufferPages: true,
      autoFirstPage: true,
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    callback(doc);
    addFooter(doc);
    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

// ─── Brief PDF ───────────────────────────────────────────────────────────────
const generateBriefPDF = (brief) => {
  return createPdf("brief", (doc) => {
    const isMidi = brief.rushDu === "midi";

    drawHeader(doc, {
      title: "BRIEF RUSH",
      subtitle: brief.restaurant || "Restaurant de Sèvres",
      tag: isMidi ? "MIDI" : "SOIR",
      tagColor: isMidi ? "blue" : "accent",
    });

    sectionTitle(doc, "Informations générales");
    infoGrid(doc, [
      {
        label: "Restaurant",
        value: brief.restaurant || "Restaurant de Sèvres",
      },
      {
        label: "Manager",
        value:
          `${brief.managerPrenom || "Utilisateur"} ${brief.managerNom || ""}`.trim(),
      },
      { label: "Date du rush", value: formatDate(brief.dateRush) },
      { label: "Service", value: isMidi ? "Midi" : "Soir" },
    ]);

    sectionTitle(doc, "Contexte");
    infoGrid(doc, [
      { label: "Jour de référence 1", value: formatDate(brief.jourReference1) },
      { label: "Jour de référence 2", value: formatDate(brief.jourReference2) },
    ]);
    textBlock(doc, "Événements", brief.evenements);

    sectionTitle(doc, "Conditions du rush");
    statRow(doc, [
      {
        label: "CA — Heure +",
        value: `${brief.heurePlusForte?.ca || 0} €`,
        bg: C.blueBg,
        color: C.blue,
      },
      {
        label: "CA — 1/4 +",
        value: `${brief.quartHeurePlusFort?.ca || 0} €`,
        bg: C.blueBg,
        color: C.blue,
      },
      {
        label: "GC — Heure +",
        value: brief.heurePlusForte?.gc || 0,
        bg: C.greenBg,
        color: C.green,
      },
    ]);
    statRow(doc, [
      {
        label: "GC — 1/4 +",
        value: brief.quartHeurePlusFort?.gc || 0,
        bg: C.greenBg,
        color: C.green,
      },
      {
        label: "CA — Canal +",
        value: `${brief.canalVentePlusFort?.ca || 0} €`,
        bg: C.blueBg,
        color: C.blue,
      },
      {
        label: "GC — Canal +",
        value: brief.canalVentePlusFort?.gc || 0,
        bg: C.greenBg,
        color: C.green,
      },
    ]);
    infoGrid(doc, [
      { label: "Pic", value: brief.pic },
      { label: "Staffing", value: brief.staffing },
      { label: "Nombre de niveaux", value: brief.nombreDeNiveau || 0 },
      { label: "Nombre de lignes", value: brief.nombreDeLigne || 0 },
    ]);

    divider(doc);
    textBlock(doc, "Zone de danger", brief.zoneDeDanger);
    textBlock(doc, "Solution", brief.solution);

    sectionTitle(doc, "Temps de service");
    statRow(doc, [
      {
        label: "Initiation",
        value: val(brief.tempsInitiation),
        bg: C.accentLight,
        color: C.accentDark,
      },
      {
        label: "R2P",
        value: val(brief.tempsR2P),
        bg: C.accentLight,
        color: C.accentDark,
      },
      {
        label: "LAD",
        value: val(brief.tempsLAD),
        bg: C.accentLight,
        color: C.accentDark,
      },
    ]);

    sectionTitle(doc, "Objectifs SMART");
    textBlock(doc, "Objectif salle", brief.objectifSalle);
    textBlock(doc, "Objectif production", brief.objectifProduction);
    textBlock(doc, "Objectif formation", brief.objectifFormation);
  });
};

// ─── Debrief PDF ─────────────────────────────────────────────────────────────
const generateDebriefPDF = (debrief) => {
  return createPdf("debrief", (doc) => {
    const isMidi = debrief.rushDu === "midi";

    drawHeader(doc, {
      title: "DÉBRIEF RUSH",
      subtitle: debrief.restaurant || "Restaurant de Sèvres",
      tag: isMidi ? "MIDI" : "SOIR",
      tagColor: isMidi ? "blue" : "accent",
    });

    sectionTitle(doc, "Informations générales");
    infoGrid(doc, [
      {
        label: "Restaurant",
        value: debrief.restaurant || "Restaurant de Sèvres",
      },
      {
        label: "Manager",
        value:
          `${debrief.managerPrenom || "Utilisateur"} ${debrief.managerNom || ""}`.trim(),
      },
      { label: "Date du rush", value: formatDate(debrief.dateRush) },
      { label: "Service", value: isMidi ? "Midi" : "Soir" },
    ]);

    sectionTitle(doc, "Analyse quart");
    statRow(doc, [
      {
        label: "Chiffre d'affaires",
        value: `${debrief.analyseQuart?.ca || 0} €`,
        bg: C.blueBg,
        color: C.blue,
      },
      {
        label: "Transactions",
        value: debrief.analyseQuart?.transaction || 0,
        bg: C.greenBg,
        color: C.green,
      },
      {
        label: "Staffing",
        value: debrief.analyseQuart?.staffing || 0,
        bg: C.accentLight,
        color: C.accentDark,
      },
    ]);

    table(
      doc,
      "Analyse par tranche horaire",
      [
        "Créneau",
        "CA (€)",
        "TAC",
        "Staff.",
        "R2P",
        "Init L1",
        "Init L2",
        "Init L3",
      ],
      (debrief.creneaux || []).map((c) => [
        c.label,
        c.ca || 0,
        c.tac || 0,
        c.staffing || 0,
        `${c.tempsR2P?.min || 0}m${c.tempsR2P?.sec || 0}s`,
        c.initiation?.L1 ?? "—",
        c.initiation?.L2 ?? "—",
        c.initiation?.L3 ?? "—",
      ]),
    );

    sectionTitle(doc, "Informations complémentaires");
    infoGrid(doc, [
      { label: "Écart caisse", value: debrief.ecartCaisse || 0 },
      { label: "Absent(s)", value: debrief.absent || 0 },
      { label: "Nbre HelloMcDo", value: debrief.nbreHelloMcDo || 0 },
      { label: "Nbre formation", value: debrief.nbreFormation || 0 },
    ]);

    divider(doc);
    textBlock(doc, "Détail formation", debrief.detailFormation);
    textBlock(doc, "Remarque", debrief.remarque);
  });
};

module.exports = { generateBriefPDF, generateDebriefPDF };
