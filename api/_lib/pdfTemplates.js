import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { SULTAN_SIGNATURE_B64, AHMED_SIGNATURE_B64 } from "./signatures.js";

const RED = rgb(0.882, 0.114, 0.18);
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(0.65, 0.65, 0.65);
const BLACK = rgb(0.039, 0.039, 0.039);

function wrapLines(text, font, size, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    const trial = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawCentered(page, text, font, size, y, pageWidth, color) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (pageWidth - width) / 2, y, size, font, color });
}

// N monogram, drawn as three SVG-path quads, matching the approved brand mark.
function drawLogo(page, x, y, scale) {
  const paths = [
    "M40,40 L80,40 L80,180 L40,180 Z",
    "M160,40 L200,40 L200,180 L160,180 Z",
    "M40,40 L80,40 L200,180 L160,180 Z",
  ];
  for (const d of paths) {
    page.drawSvgPath(d, { x, y: y + 200 * scale, scale, color: RED });
  }
}

export async function buildCertificatePdf({ name, domain, certCode, issueDate, cohort = "August 2026" }) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landscape, points
  const { width: W, height: H } = page.getSize();

  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: BLACK });
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: RED, borderWidth: 2 });
  page.drawRectangle({ x: 34, y: 34, width: W - 68, height: H - 68, borderColor: GRAY, borderWidth: 0.5 });

  drawLogo(page, W / 2 - 70, H - 150, 0.34);
  page.drawText("NEXORA", { x: W / 2 + 10, y: H - 100, size: 22, font: helvBold, color: WHITE });
  page.drawText("LABS", { x: W / 2 + 12, y: H - 118, size: 9, font: helvBold, color: RED });

  drawCentered(page, "CERTIFICATE OF COMPLETION", helvBold, 30, H - 178, W, WHITE);
  drawCentered(page, "This certificate is proudly presented to", helv, 13, H - 208, W, GRAY);

  drawCentered(page, name, helvBold, 40, H - 258, W, RED);
  const nameWidth = helvBold.widthOfTextAtSize(name, 40);
  page.drawLine({
    start: { x: W / 2 - nameWidth / 2 - 20, y: H - 270 },
    end: { x: W / 2 + nameWidth / 2 + 20, y: H - 270 },
    thickness: 1,
    color: RED,
  });

  const body = `for successfully completing the Nexora Labs Internship Program in the ${domain} track, held August 3 - September 3, 2026, including all assigned tasks and the domain certification assessment, passed with distinction.`;
  const lines = wrapLines(body, helv, 13, 480);
  let y = H - 308;
  for (const line of lines) {
    drawCentered(page, line, helv, 13, y, W, WHITE);
    y -= 20;
  }

  // signatures — real signature images, printed name + title below each
  const sultanPng = await doc.embedPng(Buffer.from(SULTAN_SIGNATURE_B64, "base64"));
  const ahmedPng = await doc.embedPng(Buffer.from(AHMED_SIGNATURE_B64, "base64"));
  const sigH = 34;
  const sultanW = sigH * (1081 / 346);
  const ahmedW = sigH * (1285 / 268);

  const sigY = 150;
  page.drawImage(sultanPng, { x: 240 - sultanW / 2, y: sigY + 4, width: sultanW, height: sigH });
  page.drawImage(ahmedPng, { x: W - 240 - ahmedW / 2, y: sigY + 4, width: ahmedW, height: sigH });

  page.drawLine({ start: { x: 140, y: sigY }, end: { x: 340, y: sigY }, thickness: 0.75, color: GRAY });
  page.drawLine({ start: { x: W - 340, y: sigY }, end: { x: W - 140, y: sigY }, thickness: 0.75, color: GRAY });
  drawCentered2(page, "Malik Sultan Ali", helvBold, 12, sigY - 16, 240, WHITE);
  drawCentered2(page, "Ahmed Shaheer", helvBold, 12, sigY - 16, W - 240, WHITE);
  drawCentered2(page, "Founder, Nexora Labs", helv, 10, sigY - 30, 240, RED);
  drawCentered2(page, "CEO, Nexora Labs", helv, 10, sigY - 30, W - 240, RED);

  page.drawText(`Certificate ID: ${certCode}`, { x: 70, y: 90, size: 10, font: helv, color: GRAY });
  const issuedText = `Issued: ${issueDate}`;
  const issuedWidth = helv.widthOfTextAtSize(issuedText, 10);
  page.drawText(issuedText, { x: W - 70 - issuedWidth, y: 90, size: 10, font: helv, color: GRAY });
  const cohortText = `Cohort: ${cohort}`;
  const cohortWidth = helv.widthOfTextAtSize(cohortText, 10);
  page.drawText(cohortText, { x: W - 70 - cohortWidth, y: 76, size: 10, font: helv, color: GRAY });

  return doc.save();
}

function drawCentered2(page, text, font, size, y, centerX, color) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - width / 2, y, size, font, color });
}

export async function buildOfferLetterPdf({ name, domain, internId, whatsappLink, date }) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter, points
  const { width: W, height: H } = page.getSize();

  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: BLACK });
  page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: rgb(0.07, 0.07, 0.07) });
  page.drawLine({ start: { x: 0, y: H - 110 }, end: { x: W, y: H - 110 }, thickness: 1.5, color: RED });

  drawLogo(page, 50, H - 80, 0.22);
  page.drawText("NEXORA", { x: 100, y: H - 55, size: 15, font: helvBold, color: WHITE });
  page.drawText("LABS", { x: 101, y: H - 68, size: 7, font: helvBold, color: RED });

  page.drawText("nexoralabs.com", { x: W - 50 - helv.widthOfTextAtSize("nexoralabs.com", 9), y: H - 60, size: 9, font: helv, color: GRAY });
  page.drawText("team@nexoralabs.com", { x: W - 50 - helv.widthOfTextAtSize("team@nexoralabs.com", 9), y: H - 74, size: 9, font: helv, color: GRAY });

  let y = H - 150;
  page.drawText(`Date: ${date}`, { x: 50, y, size: 10, font: helv, color: GRAY });
  y -= 30;
  page.drawText(`Dear ${name},`, { x: 50, y, size: 11, font: helv, color: WHITE });
  y -= 26;
  page.drawText(`Subject: Offer of Internship - ${domain} Track`, { x: 50, y, size: 13, font: helvBold, color: RED });
  y -= 26;

  const body1 = `Congratulations! We are pleased to offer you a place in the Nexora Labs Internship Program, ${domain} track, for the August 2026 cohort running from August 3 to September 3, 2026. This offer follows a review of your application and CV.`;
  y = drawParagraph(page, body1, helv, 10.5, 50, y, 500, 16, WHITE);
  y -= 10;

  const body2 = `Your Intern ID is ${internId}. You will have access to your personal dashboard where weekly tasks, submissions, badges, and progress are tracked. Interns who complete a week's tasks early may move ahead of schedule. On completing all tasks for your track, you will be eligible to take the domain certification quiz, after which a certificate of completion - signed by both founders - will be issued.`;
  y = drawParagraph(page, body2, helv, 10.5, 50, y, 500, 16, WHITE);
  y -= 10;

  const body3 = "Please join our official WhatsApp group using the link below to receive further instructions, connect with your cohort, and get started.";
  y = drawParagraph(page, body3, helv, 10.5, 50, y, 500, 16, WHITE);
  y -= 6;

  page.drawText(`Join the WhatsApp group: ${whatsappLink}`, { x: 50, y, size: 10.5, font: helvBold, color: RED });
  y -= 26;

  page.drawText("We look forward to having you build with us.", { x: 50, y, size: 10.5, font: helv, color: WHITE });
  y -= 40;
  page.drawText("Warm regards,", { x: 50, y, size: 10.5, font: helv, color: WHITE });
  y -= 50;

  page.drawLine({ start: { x: 50, y }, end: { x: 220, y }, thickness: 0.75, color: GRAY });
  page.drawLine({ start: { x: 320, y }, end: { x: 490, y }, thickness: 0.75, color: GRAY });

  const sultanPng2 = await doc.embedPng(Buffer.from(SULTAN_SIGNATURE_B64, "base64"));
  const ahmedPng2 = await doc.embedPng(Buffer.from(AHMED_SIGNATURE_B64, "base64"));
  const sigH2 = 28;
  const sultanW2 = sigH2 * (1081 / 346);
  const ahmedW2 = sigH2 * (1285 / 268);
  page.drawImage(sultanPng2, { x: 50, y: y + 4, width: sultanW2, height: sigH2 });
  page.drawImage(ahmedPng2, { x: 320, y: y + 4, width: ahmedW2, height: sigH2 });

  page.drawText("Malik Sultan Ali", { x: 50, y: y - 16, size: 11, font: helvBold, color: WHITE });
  page.drawText("Ahmed Shaheer", { x: 320, y: y - 16, size: 11, font: helvBold, color: WHITE });
  page.drawText("Founder, Nexora Labs", { x: 50, y: y - 30, size: 9.5, font: helv, color: RED });
  page.drawText("CEO, Nexora Labs", { x: 320, y: y - 30, size: 9.5, font: helv, color: RED });

  page.drawLine({ start: { x: 0, y: 40 }, end: { x: W, y: 40 }, thickness: 1, color: RED });
  const footer = "Nexora Labs  -  team@nexoralabs.com  -  nexoralabs.com";
  drawCentered(page, footer, helv, 8, 26, W, GRAY);

  return doc.save();
}

function drawParagraph(page, text, font, size, x, y, maxWidth, leading, color) {
  const lines = wrapLines(text, font, size, maxWidth);
  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color });
    y -= leading;
  }
  return y;
}
