declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: unknown);
    pipe<T>(destination: T): T;
    fontSize(size: number): this;
    text(text: string, options?: unknown): this;
    text(text: string, x?: number, y?: number, options?: unknown): this;
    moveDown(lines?: number): this;
    font(fontName: string): this;
    addPage(options?: unknown): this;
    end(): void;
    y: number;
  }
  namespace PDFDocument {
    type PDFDocument = import('pdfkit').PDFDocument;
  }
  export = PDFDocument;
}