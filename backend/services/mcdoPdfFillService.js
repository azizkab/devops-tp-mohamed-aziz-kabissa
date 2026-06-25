const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const pdfCoordinates = require("../config/pdfCoordinates");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const dataUrlToBuffer = (dataUrl) => {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  return Buffer.from(base64, "base64");
};

const formatDate = (date = new Date()) => {
  return new Date(date).toLocaleDateString("fr-FR");
};

const drawTextAt = (pages, font, text, position, size = 10) => {
  if (!position) return;

  pages[position.page].drawText(text || "", {
    x: position.x,
    y: position.y,
    size,
    font,
    color: rgb(0, 0, 0),
  });
};

const drawImageAt = async (pdfDoc, pages, dataUrl, position) => {
  if (!dataUrl || !position) return;

  const imageBuffer = dataUrlToBuffer(dataUrl);
  const image = await pdfDoc.embedPng(imageBuffer);

  pages[position.page].drawImage(image, {
    x: position.x,
    y: position.y,
    width: position.width,
    height: position.height,
  });
};

const drawChecks = (pages, font, reponses = [], checks = []) => {
  const checkColor = rgb(1, 1, 1);

  reponses.forEach((rep, index) => {
    const position = checks[index];

    if (rep.valide && position) {
      pages[position.page].drawText("X", {
        x: position.x,
        y: position.y,
        size: 12,
        font,
        color: checkColor,
      });
    }
  });
};

const fillFormationPDF = async ({
  formationCode,
  equipier,
  formateur,
  signatureEquipier,
  signatureFormateur,
  reponses = [],
  dateValidation = new Date(),
}) => {
  const config = pdfCoordinates[formationCode];

  if (!config) {
    throw new Error(
      `Coordonnées PDF manquantes pour la formation : ${formationCode}`,
    );
  }

  const originalPdfPath = path.join(
    __dirname,
    "../uploads/formations",
    config.fileName,
  );

  if (!fs.existsSync(originalPdfPath)) {
    throw new Error(`PDF original introuvable : ${originalPdfPath}`);
  }

  const completedDir = path.join(__dirname, "../uploads/formations-completed");
  ensureDir(completedDir);

  const outputPath = path.join(
    completedDir,
    `${formationCode}-${equipier._id}-${Date.now()}.pdf`,
  );

  const pdfBytes = fs.readFileSync(originalPdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const equipierName = `${equipier.prenom || ""} ${equipier.nom || ""}`.trim();
  const formateurName =
    `${formateur.prenom || ""} ${formateur.nom || ""}`.trim();

  drawChecks(pages, font, reponses, config.checks);

  drawTextAt(pages, font, formatDate(dateValidation), config.date);
  drawTextAt(pages, font, formateurName || "Formateur", config.formateur);
  drawTextAt(pages, font, equipierName || "Équipier", config.equipier);

  await drawImageAt(
    pdfDoc,
    pages,
    signatureFormateur,
    config.signatureFormateur,
  );
  await drawImageAt(pdfDoc, pages, signatureEquipier, config.signatureEquipier);

  const completedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, completedPdfBytes);

  return outputPath;
};

module.exports = {
  fillFormationPDF,
};
