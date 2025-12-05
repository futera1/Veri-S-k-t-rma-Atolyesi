
export enum AlgorithmType {
  HUFFMAN = 'HUFFMAN',
  RLE = 'RLE',
  GOLOMB = 'GOLOMB',
  TUNSTALL = 'TUNSTALL',
  ARITHMETIC = 'ARITHMETIC',
  LZW = 'LZW'
}

export interface CompressionResult {
  encoded: string;
  originalSize: number; // in bits
  compressedSize: number; // in bits
  ratio: number;
  steps: any[]; // Algorithm specific step data for visualization
  dictionary?: Record<string, string | number>;
  tree?: any;
}

export interface AlgorithmInfo {
  name: string;
  description: string;
  howItWorks: string;
  bestCase: string;
  complexity: string;
}
