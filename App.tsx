
import React, { useState, useEffect } from 'react';
import { AlgorithmType, CompressionResult, AlgorithmInfo } from './types';
import { compressRLE, compressHuffman, compressLZW, compressGolomb, compressArithmetic, compressTunstall } from './services/algorithms';
import Visualizer from './components/Visualizer';

const ALGORITHM_DETAILS: Record<AlgorithmType, AlgorithmInfo> = {
  [AlgorithmType.HUFFMAN]: {
    name: "Huffman Kodlaması",
    description: "Karakterlerin kullanım sıklığına göre değişken uzunluklu kodlar atar.",
    howItWorks: "Metindeki karakterlerin frekansını hesaplar. En az geçen karakterleri birleştirerek bir ikili ağaç (binary tree) oluşturur. Ağacın sol dalları '0', sağ dalları '1' kodunu alır. Sık geçen karakterler köke yakın olduğu için kısa kod, az geçenler uzun kod alır.",
    bestCase: "Karakter dağılımının dengesiz olduğu metinler (örn: Doğal diller).",
    complexity: "O(n log n)"
  },
  [AlgorithmType.RLE]: {
    name: "Run-Length Encoding (RLE)",
    description: "Ardışık tekrar eden verileri sıkıştırır.",
    howItWorks: "Veri akışında arka arkaya gelen aynı değerleri (run) tek bir değer ve tekrar sayısı olarak saklar. Örneğin 'AAAAA' yerine '5A' yazar.",
    bestCase: "Uzun tekrar eden diziler içeren veriler (örn: Basit bitmap görseller, siyah beyaz fax taramaları).",
    complexity: "O(n)"
  },
  [AlgorithmType.GOLOMB]: {
    name: "Golomb Kodlaması",
    description: "Geometrik dağılıma sahip pozitif tamsayılar için entropi kodlaması.",
    howItWorks: "Bir sayıyı (n) ayarlanabilir bir M parametresine böler. Bölüm (Quotient) Unary kod ile, Kalan (Remainder) ise Truncated Binary kod ile ifade edilir. Küçük sayıların sık, büyük sayıların seyrek olduğu durumlarda etkilidir.",
    bestCase: "Video sıkıştırmada hareket vektörleri, ses sıkıştırmada hata değerleri.",
    complexity: "O(n)"
  },
  [AlgorithmType.LZW]: {
    name: "Lempel-Ziv-Welch (LZW)",
    description: "Sözlük tabanlı, kayıpsız bir sıkıştırma algoritmasıdır (GIF, TIFF, ZIP).",
    howItWorks: "Başlangıçta sadece temel karakter seti (ASCII) sözlükte vardır. Algoritma veriyi okudukça yeni karşılaştığı karakter dizilerini dinamik olarak sözlüğe ekler ve bunlara yeni kodlar verir. Tekrar eden diziler tek bir kodla temsil edilir.",
    bestCase: "Tekrar eden kelime ve desenlerin çok olduğu uzun metinler veya veriler.",
    complexity: "O(n)"
  },
  [AlgorithmType.ARITHMETIC]: {
    name: "Aritmetik Kodlama",
    description: "Tüm mesajı 0.0 ile 1.0 arasında tek bir ondalık sayı olarak kodlar.",
    howItWorks: "Her karakterin olasılığına göre bir aralık (interval) belirlenir. Her yeni karakter okunduğunda mevcut aralık, o karakterin olasılık aralığına göre daraltılır. Sonuçta oluşan aralığın içinden bir sayı mesajı temsil eder.",
    bestCase: "Huffman'ın yetersiz kaldığı (bir karakterin 1 bitten az bilgi taşıdığı) durumlar.",
    complexity: "O(n)"
  },
  [AlgorithmType.TUNSTALL]: {
    name: "Tunstall Kodlaması",
    description: "Değişken uzunluklu girdileri sabit uzunluklu kodlara eşler.",
    howItWorks: "Huffman'ın tersi gibidir. Huffman sabit girdiye (harf) değişken kod verirken; Tunstall değişken girdiye (harf dizisi) sabit kod verir. Yüksek olasılıklı karakter dizilerini sözlüğe ekleyerek ilerler.",
    bestCase: "Olasılık dağılımının çok çarpık olduğu (skewed) veriler.",
    complexity: "O(n)"
  }
};

const SCENARIOS: Record<AlgorithmType, string> = {
  [AlgorithmType.HUFFMAN]: "kese sene keke ekle", 
  [AlgorithmType.RLE]: "AAAAAAABBBCCDDDDDDEEE", 
  [AlgorithmType.GOLOMB]: "42, 10, 5, 0, 12, 55", 
  [AlgorithmType.LZW]: "taka tuka taka tuka taka tuka taka tuka taka tuka", // Uzatılmış metin
  [AlgorithmType.ARITHMETIC]: "BABA", 
  [AlgorithmType.TUNSTALL]: "AAABAAACAAADAAAA" 
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AlgorithmType>(AlgorithmType.HUFFMAN);
  const [input, setInput] = useState<string>(SCENARIOS[AlgorithmType.HUFFMAN]);
  const [golombM, setGolombM] = useState<number>(4);
  const [result, setResult] = useState<CompressionResult | null>(null);

  // Auto-compress on input change
  useEffect(() => {
    try {
      let res: CompressionResult;
      // Defensive: Ensure input exists
      if (!input) {
          setResult(null);
          return;
      }

      switch (activeTab) {
        case AlgorithmType.RLE: res = compressRLE(input); break;
        case AlgorithmType.HUFFMAN: res = compressHuffman(input); break;
        case AlgorithmType.LZW: res = compressLZW(input); break;
        case AlgorithmType.GOLOMB: res = compressGolomb(input, golombM); break;
        case AlgorithmType.ARITHMETIC: res = compressArithmetic(input); break;
        case AlgorithmType.TUNSTALL: res = compressTunstall(input); break;
        default: res = compressHuffman(input);
      }
      setResult(res);
    } catch (e) {
      console.error(e);
      setResult(null);
    }
  }, [input, activeTab, golombM]);

  const handleLoadScenario = () => {
    setInput(SCENARIOS[activeTab]);
    if (activeTab === AlgorithmType.GOLOMB) setGolombM(5);
  };

  const currentInfo = ALGORITHM_DETAILS[activeTab];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-200">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col shrink-0 z-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">VA</div>
          <h1 className="font-bold text-slate-100 tracking-tight leading-tight">Veri Sıkıştırma<br/>Atölyesi</h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          {Object.entries(ALGORITHM_DETAILS).map(([id, info]) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id as AlgorithmType); setInput(""); setResult(null); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                activeTab === id 
                ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="font-semibold block">{info.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">{currentInfo.name}</h2>
            <p className="text-slate-400 text-sm">Algoritma parametrelerini değiştir ve sonucu incele.</p>
          </div>
          <button 
            onClick={handleLoadScenario}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 px-4 py-2 rounded-lg text-sm border border-slate-700 transition-colors"
          >
            <span>⚡ Örnek Senaryo</span>
          </button>
        </header>

        {/* Algorithm Info Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 mb-8 shadow-lg">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div className="md:col-span-2">
                    <h4 className="text-cyan-500 font-bold mb-2 uppercase text-xs tracking-wider">Nasıl Çalışır?</h4>
                    <p className="text-slate-300 leading-relaxed">{currentInfo.howItWorks}</p>
                </div>
                <div>
                    <h4 className="text-green-500 font-bold mb-2 uppercase text-xs tracking-wider">En İyi Durum (Best Case)</h4>
                    <p className="text-slate-300 leading-relaxed">{currentInfo.bestCase}</p>
                </div>
                <div>
                    <h4 className="text-purple-500 font-bold mb-2 uppercase text-xs tracking-wider">Karmaşıklık</h4>
                    <div className="inline-block bg-slate-950 px-2 py-1 rounded border border-slate-700 font-mono text-slate-200">
                        {currentInfo.complexity}
                    </div>
                </div>
             </div>
        </div>

        {/* Input Area */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-600"></div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Girdi Verisi</label>
            {activeTab === AlgorithmType.GOLOMB && (
               <label className="text-xs text-slate-400">Bölen (M): {golombM}</label>
            )}
          </div>
          
          <div className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeTab === AlgorithmType.GOLOMB ? "Pozitif sayıları virgülle ayırın (örn: 42, 10, 5)" : "Metin girin..."}
                className="flex-1 bg-slate-950 text-white p-4 rounded-lg border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono transition-all placeholder:text-slate-700"
              />
              {activeTab === AlgorithmType.GOLOMB && (
                  <input 
                    type="number" 
                    min="1" 
                    max="64" 
                    value={golombM} 
                    onChange={(e) => setGolombM(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 bg-slate-950 text-white p-4 rounded-lg border border-slate-700 text-center font-mono focus:border-cyan-500 outline-none"
                  />
              )}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between items-center">
             <span>Veri Uzunluğu: {input.length}</span>
             {activeTab === AlgorithmType.ARITHMETIC && input.length > 15 && (
                 <span className="text-yellow-500 font-bold">⚠️ Uyarı: JavaScript Floating Point hassasiyeti için giriş 15 karakterle sınırlandırıldı.</span>
             )}
          </div>
        </div>

        {/* Visualization Area */}
        {result && <Visualizer algorithm={activeTab} result={result} />}
        
        {!result && input && (
           <div className="text-center py-12 text-slate-600">
              Veri işlenemedi. Lütfen formatı kontrol edin.
           </div>
        )}

      </main>
    </div>
  );
};

export default App;
