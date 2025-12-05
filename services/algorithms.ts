
import { CompressionResult } from "../types";

// --- RLE (Run-Length Encoding) ---
export const compressRLE = (input: string): CompressionResult => {
  if (!input) return { encoded: '', originalSize: 0, compressedSize: 0, ratio: 0, steps: [] };

  let encoded = '';
  let steps = [];
  let count = 1;
  
  for (let i = 0; i < input.length; i++) {
    if (i < input.length - 1 && input[i] === input[i + 1]) {
      count++;
    } else {
      encoded += `${count}${input[i]}`;
      steps.push({ char: input[i], count: count, code: `${count}${input[i]}` });
      count = 1;
    }
  }

  const originalSize = input.length * 8; 
  const compressedSize = steps.length * 16; 

  return {
    encoded,
    originalSize,
    compressedSize,
    ratio: (1 - compressedSize / originalSize) * 100,
    steps
  };
};

// --- Huffman Coding ---
interface HuffmanNode {
  char: string | null;
  freq: number;
  left?: HuffmanNode;
  right?: HuffmanNode;
  id: string;
}

export const compressHuffman = (input: string): CompressionResult => {
  if (!input) return { encoded: '', originalSize: 0, compressedSize: 0, ratio: 0, steps: [] };

  const freqs: Record<string, number> = {};
  for (const char of input) freqs[char] = (freqs[char] || 0) + 1;

  let nodes: HuffmanNode[] = Object.entries(freqs).map(([char, freq], idx) => ({ 
    char, 
    freq, 
    id: `leaf-${char}-${idx}` 
  }));

  const codes: Record<string, string> = {};
  let root: HuffmanNode | undefined;

  if (nodes.length === 1) {
    const char = nodes[0].char!;
    codes[char] = "0";
    root = nodes[0];
  } else {
    let internalIdCounter = 0;
    while (nodes.length > 1) {
      nodes.sort((a, b) => a.freq - b.freq);
      
      const left = nodes.shift()!;
      const right = nodes.shift()!;
      
      const newNode: HuffmanNode = {
        char: null,
        freq: left.freq + right.freq,
        left,
        right,
        id: `internal-${internalIdCounter++}`
      };
      nodes.push(newNode);
    }
    root = nodes[0];
    
    const generateCodes = (node: HuffmanNode | undefined, code: string) => {
        if (!node) return;
        if (node.char !== null) {
          codes[node.char] = code;
          return;
        }
        generateCodes(node.left, code + '0');
        generateCodes(node.right, code + '1');
    };

    generateCodes(root, "");
  }

  let encoded = "";
  for (const char of input) encoded += codes[char];

  const originalSize = input.length * 8;
  const compressedSize = encoded.length;

  return {
    encoded,
    originalSize,
    compressedSize,
    ratio: (1 - compressedSize / originalSize) * 100,
    steps: Object.entries(codes).map(([char, code]) => ({ char, code, freq: freqs[char] })),
    tree: root,
    dictionary: codes
  };
};

// --- LZW (Lempel-Ziv-Welch) ---
export const compressLZW = (input: string): CompressionResult => {
  if (!input) return { encoded: '', originalSize: 0, compressedSize: 0, ratio: 0, steps: [] };

  const dictionary: Record<string, number> = {};
  for (let i = 0; i < 256; i++) {
    dictionary[String.fromCharCode(i)] = i;
  }

  let w = "";
  const result: number[] = [];
  const steps = [];
  let dictSize = 256;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    const wc = w + c;
    
    if (dictionary.hasOwnProperty(wc)) {
      w = wc;
    } else {
      result.push(dictionary[w]);
      steps.push({ 
        step: steps.length + 1, 
        w: w, 
        k: c,
        output: dictionary[w], 
        addedToDict: wc, 
        newCode: dictSize 
      });
      
      dictionary[wc] = dictSize++;
      w = c;
    }
  }
  
  if (w !== "") {
    result.push(dictionary[w]);
    steps.push({ 
      step: steps.length + 1, 
      w: w, 
      k: "EOF",
      output: dictionary[w], 
      addedToDict: "-", 
      newCode: "-" 
    });
  }

  // Encoded output for LZW is the sequence of codes
  const encodedStr = result.join(" ");
  
  const originalSize = input.length * 8;
  // Standard LZW often assumes 12-bit fixed codes for simple implementations (like GIF's max 4096)
  const compressedSize = result.length * 12;

  return {
    encoded: encodedStr,
    originalSize,
    compressedSize,
    ratio: (1 - compressedSize / originalSize) * 100,
    steps
  };
};

// --- Golomb Coding ---
export const compressGolomb = (inputStr: string, mParam: number = 4): CompressionResult => {
  const numbers = inputStr.split(/[\s,]+/).map(n => parseInt(n)).filter(n => !isNaN(n) && n >= 0);
  if (numbers.length === 0) return { encoded: '', originalSize: 0, compressedSize: 0, ratio: 0, steps: [] };

  const M = Math.max(1, Math.floor(mParam)); 
  const b = Math.ceil(Math.log2(M));
  const cutoff = Math.pow(2, b) - M; 

  let encodedStream = "";
  const steps = [];

  for (const n of numbers) {
    const q = Math.floor(n / M);
    const r = n % M;
    
    const unary = "1".repeat(q) + "0";
    
    let binary = "";
    if (M === 1) {
        binary = ""; 
    } else if (r < cutoff) {
        binary = r.toString(2).padStart(b - 1, '0');
    } else {
        binary = (r + cutoff).toString(2).padStart(b, '0');
    }

    encodedStream += unary + binary;
    steps.push({ number: n, q, r, unary, binary, code: unary + binary });
  }

  const originalSize = numbers.length * 32;
  const compressedSize = encodedStream.length;

  return {
    encoded: encodedStream,
    originalSize,
    compressedSize,
    ratio: (1 - compressedSize / originalSize) * 100,
    steps
  };
};

// --- Arithmetic Coding ---
export const compressArithmetic = (input: string): CompressionResult => {
    if (!input) return { encoded: '', originalSize: 0, compressedSize: 0, ratio: 0, steps: [] };
    
    const safeInput = input.slice(0, 15); 
    const isTruncated = input.length > 15;

    const freqs: Record<string, number> = {};
    for (const char of safeInput) freqs[char] = (freqs[char] || 0) + 1;
    
    const sortedChars = Object.keys(freqs).sort();
    const probs: Record<string, { start: number, end: number, p: number }> = {};
    let currentStart = 0;
    
    for (const char of sortedChars) {
        const p = freqs[char] / safeInput.length;
        probs[char] = { start: currentStart, end: currentStart + p, p };
        currentStart += p;
    }

    let low = 0.0;
    let high = 1.0;
    const rangeSteps = [];
    
    for (const char of safeInput) {
        const range = high - low;
        const newHigh = low + range * probs[char].end;
        const newLow = low + range * probs[char].start;
        
        rangeSteps.push({ 
            char, 
            low: newLow, 
            high: newHigh, 
            rangeStr: `[${newLow.toFixed(6)}, ${newHigh.toFixed(6)})` 
        });
        
        low = newLow;
        high = newHigh;
    }

    const tag = (low + high) / 2;

    let entropy = 0;
    for (const char of sortedChars) {
        const p = freqs[char] / safeInput.length;
        entropy -= p * Math.log2(p);
    }
    const theoreticalBits = Math.ceil(safeInput.length * entropy);

    return {
        encoded: tag.toFixed(10) + (isTruncated ? "..." : ""),
        originalSize: safeInput.length * 8,
        compressedSize: theoreticalBits, 
        ratio: (1 - theoreticalBits / (safeInput.length * 8)) * 100,
        steps: rangeSteps,
        dictionary: probs as any
    };
};

// --- Tunstall Coding ---
export const compressTunstall = (input: string): CompressionResult => {
    if(!input) return { encoded: '', originalSize: 0, compressedSize: 0, ratio: 0, steps: [] };

    const freqs: Record<string, number> = {};
    for (const char of input) freqs[char] = (freqs[char] || 0) + 1;
    const alphabet = Object.keys(freqs);
    const total = input.length;

    let dictionary: { seq: string, prob: number }[] = alphabet.map(char => ({
        seq: char,
        prob: freqs[char] / total
    }));

    const BIT_WIDTH = 4; 
    const MAX_DICT_SIZE = Math.pow(2, BIT_WIDTH);

    while (dictionary.length + alphabet.length - 1 <= MAX_DICT_SIZE) {
        dictionary.sort((a, b) => b.prob - a.prob);
        const best = dictionary.shift(); 
        
        if (!best) break;

        for (const char of alphabet) {
            const charProb = freqs[char] / total;
            dictionary.push({
                seq: best.seq + char,
                prob: best.prob * charProb
            });
        }
    }

    const codeMap: Record<string, string> = {};
    dictionary.forEach((item, index) => {
        codeMap[item.seq] = index.toString(2).padStart(BIT_WIDTH, '0');
    });

    const sortedKeys = Object.keys(codeMap).sort((a, b) => b.length - a.length);

    let encoded = "";
    const steps = [];
    let i = 0;
    
    while (i < input.length) {
        let matchFound = false;
        
        for (const seq of sortedKeys) {
            if (input.startsWith(seq, i)) {
                encoded += codeMap[seq];
                steps.push({ seq, code: codeMap[seq] });
                i += seq.length;
                matchFound = true;
                break;
            }
        }
        
        if (!matchFound) {
            const char = input[i];
            encoded += "ERR";
            steps.push({ seq: char, code: "ERR" });
            i++;
        }
    }

    return {
        encoded,
        originalSize: input.length * 8,
        compressedSize: encoded.length,
        ratio: (1 - encoded.length / (input.length * 8)) * 100,
        steps,
        dictionary: codeMap
    };
}
