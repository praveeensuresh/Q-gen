declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }

  interface PDFParseOptions {
    max?: number;
    version?: string;
  }

  function pdf(buffer: Buffer, options?: PDFParseOptions): Promise<PDFData>;
  export = pdf;
}
