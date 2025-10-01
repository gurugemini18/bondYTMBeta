import React, { useState } from 'react';
import YtmCalculator from './components/YtmCalculator';
import { BondInputState } from './types';

function App() {
  const [bondInputs, setBondInputs] = useState<BondInputState>({
    faceValue: 1000,
    marketPrice: 994,
    couponRate: 9,
    couponFrequency: 12,
    maturityDate: '2026-01-01',
    tdsRate: 10,
  });

  const parts = bondInputs.maturityDate.split('-').map(p => parseInt(p, 10));
  const maturityDateUTC = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = maturityDateUTC.getUTCDate();
  const month = maturityDateUTC.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const year = maturityDateUTC.getUTCFullYear().toString().slice(-2);
  const formattedMaturityDate = `${day}-${month}-${year}`;
  const headerSubText = `${bondInputs.couponRate}% BOND ${formattedMaturityDate}`;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 dark:text-night-text">
      <header className="p-4 flex items-center space-x-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200 dark:border-night-border">
        <button aria-label="Go back">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
            <h1 className="font-bold text-lg flex items-center">
                BOND INVESTMENT
                <span className="ml-2 inline-block px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded-full">LIVE</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-night-text-light">{headerSubText}</p>
        </div>
      </header>
      
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <YtmCalculator bondInputs={bondInputs} setBondInputs={setBondInputs} />
        </div>
      </main>
    </div>
  );
}

export default App;