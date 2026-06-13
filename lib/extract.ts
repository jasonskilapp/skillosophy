import mammoth from "mammoth";

/**
 * Extract plain text from an uploaded resume.
 * Supports PDF (via unpdf), Word .docx (via mammoth), and plain text.
 */
export async function extractResumeText(
  buffer: Buffer,
  fileName: string,
  mimeType?: string,
): Promise<string> {
  const lower = fileName.toLowerCase();
  const isPdf = mimeType === "application/pdf" || lower.endsWith(".pdf");
  const isDocx =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx");

  let text: string;
  if (isPdf) {
    text = await extractPdf(buffer);
  } else if (isDocx) {
    const { value } = await mammoth.extractRawText({ buffer });
    text = value;
  } else {
    // Plain text / fallback.
    text = buffer.toString("utf-8");
  }

  return normalize(text);
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // unpdf bundles a serverless build of pdf.js; import lazily to keep it off
  // the client and out of cold-start paths that don't need it.
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Rough guard: is there enough text to analyze? */
export function hasUsableText(text: string): boolean {
  return text.replace(/\s/g, "").length >= 200;
}
