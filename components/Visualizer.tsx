
import React from 'react';
import { AlgorithmType, CompressionResult } from '../types';
import { BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Bar } from 'recharts';

interface Props {
  algorithm: AlgorithmType;
  result: CompressionResult;
}

const Visualizer: React.FC<Props> = ({ algorithm, result }) => {
  // Defensive check
  if (!result) return null;

  const renderStats = () => (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg">
        <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Orijinal Boyut</p>
        <p className="text-2xl font-bold text-white">{result.originalSize} <span className="text-xs font-normal text-slate-500">bits</span></p>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg">
        <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Sıkıştırılmış</p>
        <p className="text-2xl font-bold text-cyan-400">{result.compressedSize} <span className="text-xs font-normal text-slate-500">bits</span></p>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg relative overflow-hidden">
        <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Kazanç Oranı</p>
        <p className={`text-2xl font-bold ${result.ratio > 0 ? 'text-green-400' : 'text-red-400'}`}>
          %{result.ratio ? result.ratio.toFixed(2) : "0.00"}
        </p>
        {result.ratio < 0 && (
            <div className="absolute top-2 right-2 text-red-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
        )}
      </div>
    </div>
  );

  const renderOutputBlock = () => (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 mb-6 flex flex-col">
        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Sıkıştırılmış Çıktı Verisi (Output)</h4>
        <div className="bg-slate-950 p-3 rounded border border-slate-800/50 font-mono text-cyan-300 text-sm break-all leading-relaxed shadow-inner">
            {result.encoded || <span className="text-slate-600 italic">Veri yok...</span>}
        </div>
        
        {/* Academic Warning for Negative Compression */}
        {result.ratio < 0 && (
            <div className="mt-3 p-3 bg-red-900/10 border border-red-900/30 rounded text-xs text-red-300 flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                    <span className="font-bold block mb-1">Neden Negatif Kazanç?</span>
                    <p className="opacity-80">
                        Veri boyutu arttı (Genişleme). 
                        {algorithm === AlgorithmType.LZW && " LZW algoritması karakter başına 8-bit alır ancak çıktı olarak 12-bit kod üretir. Kısa metinlerde sözlük yeterince dolup uzun desenleri tek kodla ifade edemediği için başlangıçtaki bu bit farkı zarara yol açar."}
                        {algorithm === AlgorithmType.RLE && " RLE algoritması tekrarlanmayan her karakterin yanına '1' eklediği için, tekrarı olmayan verilerde boyutu 2 katına çıkarır."}
                        {algorithm !== AlgorithmType.LZW && algorithm !== AlgorithmType.RLE && " Seçilen algoritma bu veri tipi veya dağılımı için uygun değil. Başlık (header) veya sözlük maliyeti veri boyutunu aştı."}
                    </p>
                </div>
            </div>
        )}

        {algorithm === AlgorithmType.LZW && result.ratio >= 0 && (
            <p className="text-[10px] text-slate-500 mt-2">
                * LZW çıktısı, sözlükteki indeks numaralarından oluşur.
            </p>
        )}
    </div>
  );

  const renderContent = () => {
    switch (algorithm) {
      case AlgorithmType.RLE:
        return (
          <div className="flex flex-wrap gap-2">
            {result.steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center bg-slate-800 p-3 rounded-md border border-slate-700 min-w-[4rem]">
                <div className="flex items-end gap-1 mb-2">
                   <span className="text-3xl font-bold text-white leading-none">{step.count}</span>
                   <span className="text-sm text-slate-400 mb-1">tane</span>
                </div>
                <div className="w-full text-center bg-slate-900 py-1 rounded text-cyan-300 font-mono text-lg border border-slate-700">
                    {step.char === ' ' ? 'Boşluk' : step.char}
                </div>
              </div>
            ))}
          </div>
        );

      case AlgorithmType.HUFFMAN:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Karakter Frekans Analizi</h4>
                {/* 
                   FIX: Added w-full, h-64 and style={{ minWidth: 0 }} 
                   to ensure Recharts calculates dimensions correctly inside Grid/Flex 
                */}
                <div className="h-64 w-full" style={{ minWidth: 0 }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.steps} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="char" 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickFormatter={(val) => val === ' ' ? 'SPACE' : val} 
                        />
                        <YAxis 
                            stroke="#64748b" 
                            fontSize={12} 
                            allowDecimals={false}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} 
                            cursor={{fill: '#1e293b'}}
                            formatter={(value: number) => [value, 'Frekans']}
                        />
                        <Bar dataKey="freq" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Frekans">
                           {result.steps.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#06b6d4' : '#3b82f6'} />
                            ))}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
             <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Oluşturulan Sözlük</h4>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {result.steps.map((s: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-slate-800 px-3 py-2 rounded border border-slate-700 text-xs">
                            <span className="text-white font-bold">{s.char === ' ' ? 'SPACE' : s.char}</span>
                            <span className="text-green-400 font-mono bg-green-900/30 px-1.5 py-0.5 rounded">{s.code}</span>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        );

      case AlgorithmType.LZW:
        return (
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Mevcut (w)</th>
                  <th className="px-4 py-3">Sıradaki (k)</th>
                  <th className="px-4 py-3 text-right">Çıktı Kodu</th>
                  <th className="px-4 py-3 text-center">Sözlüğe Eklenen</th>
                  <th className="px-4 py-3">Yeni İndeks</th>
                </tr>
              </thead>
              <tbody>
                {result.steps.map((step: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors font-mono text-xs md:text-sm">
                    <td className="px-4 py-2 text-slate-500">{step.step}</td>
                    <td className="px-4 py-2 text-cyan-300">"{step.w}"</td>
                    <td className="px-4 py-2 text-slate-400">{step.k === "EOF" ? <span className="text-red-400">EOF</span> : `"${step.k}"`}</td>
                    <td className="px-4 py-2 text-right font-bold text-green-400">{step.output}</td>
                    <td className="px-4 py-2 text-center text-yellow-200">{step.addedToDict === '-' ? '-' : `"${step.addedToDict}"`}</td>
                    <td className="px-4 py-2 text-purple-400">{step.newCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case AlgorithmType.GOLOMB:
        return (
           <div className="space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                   {result.steps.map((s: any, i: number) => (
                       <div key={i} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                           <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 text-6xl font-bold text-white transition-opacity">{s.number}</div>
                           
                           <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Input: <span className="text-white font-bold text-sm">{s.number}</span></div>
                           
                           <div className="flex justify-between text-xs text-slate-500 mb-2 border-b border-slate-700 pb-2">
                               <span>q = {s.q}</span>
                               <span>r = {s.r}</span>
                           </div>
                           
                           <div className="flex items-center gap-1 font-mono text-sm mt-auto">
                               <div className="flex flex-col">
                                   <span className="text-blue-400 font-bold">{s.unary}</span>
                                   <span className="text-[10px] text-blue-500/70">Unary</span>
                               </div>
                               <span className="text-slate-600">|</span>
                               <div className="flex flex-col">
                                   <span className="text-pink-400 font-bold">{s.binary}</span>
                                   <span className="text-[10px] text-pink-500/70">Binary</span>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
        );

      case AlgorithmType.ARITHMETIC:
          return (
              <div className="space-y-6">
                  <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-3">Karakter</th>
                                <th className="px-6 py-3">Aralık (Low - High)</th>
                                <th className="px-6 py-3 w-1/3">Görsel Aralık</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.steps.map((s:any, i:number) => (
                                <tr key={i} className="border-b border-slate-800 font-mono hover:bg-slate-800/30">
                                    <td className="px-6 py-3 text-cyan-300 font-bold text-lg">{s.char}</td>
                                    <td className="px-6 py-3 text-slate-400 text-xs">{s.rangeStr}</td>
                                    <td className="px-6 py-3">
                                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative">
                                            <div 
                                                className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-70"
                                                style={{ 
                                                    left: `${s.low * 100}%`, 
                                                    width: `${Math.max(0.5, (s.high - s.low) * 100)}%` 
                                                }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          );
      
      case AlgorithmType.TUNSTALL:
          return (
              <div className="space-y-6">
                  {/* Dictionary Visual */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                      <h5 className="text-slate-400 mb-3 text-xs uppercase tracking-wider font-bold">Oluşturulan Tunstall Sözlüğü</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {Object.entries(result.dictionary || {}).map(([key, val]: any, i) => (
                              <div key={i} className="flex justify-between items-center bg-slate-800 px-3 py-2 rounded border border-slate-700 group hover:border-cyan-500/50 transition-colors">
                                  <span className="text-white font-mono font-bold">"{key}"</span>
                                  <span className="font-mono text-purple-400 text-xs bg-purple-900/20 px-2 py-0.5 rounded">{val}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Encoded Sequence */}
                  <div>
                      <h5 className="text-slate-400 mb-3 text-xs uppercase tracking-wider font-bold">Kodlama Adımları</h5>
                      <div className="flex flex-wrap gap-2">
                        {result.steps.map((s:any, i:number) => (
                            <div key={i} className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-center min-w-[3rem] flex flex-col justify-center">
                                <div className="text-white font-bold text-sm mb-1">{s.seq}</div>
                                <div className="text-[10px] font-mono text-cyan-400 bg-slate-900 rounded px-1">{s.code}</div>
                            </div>
                        ))}
                      </div>
                  </div>
              </div>
          );

      default:
        return <p className="text-slate-500 italic">Görselleştirme hazırlanıyor...</p>;
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {renderStats()}
      <div className="bg-slate-800/20 p-1 rounded-2xl border border-slate-700/50 shadow-xl backdrop-blur-sm">
         <div className="bg-slate-900/80 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
            <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            Analiz Sonuçları
            </h3>
            {renderOutputBlock()}
            {renderContent()}
         </div>
      </div>
    </div>
  );
};

export default Visualizer;
