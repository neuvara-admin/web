/**
 * Generates a one-page PLACEHOLDER PDF in the browser so the "Download report"
 * flow can be tried with the test login. Nothing is fetched or stored.
 *
 * Replace with a download from private storage once a backend exists.
 */

function toAscii(text: string) {
  return text
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[\\()]/g, (character) => `\\${character}`);
}

function buildPdf(title: string, lines: string[]) {
  const content = [
    "BT",
    "/F1 18 Tf",
    "56 770 Td",
    `(${toAscii(title)}) Tj`,
    "/F1 11 Tf",
    ...lines.flatMap((line) => ["0 -22 Td", `(${toAscii(line)}) Tj`]),
    "ET"
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return pdf;
}

export function downloadPlaceholderReport({
  fileName,
  model,
  version,
  organisation
}: {
  fileName: string;
  model: string;
  version: string;
  organisation: string;
}) {
  const pdf = buildPdf("PLACEHOLDER AUDIT REPORT", [
    `${model} v${version} - ${organisation}`,
    "",
    "This file is a placeholder generated for testing the dashboard.",
    "It is not a real audit report and contains no audit results.",
    "",
    "Real reports will be uploaded by Neuvara once storage is set up."
  ]);

  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
