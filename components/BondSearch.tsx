import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BondSearchResult } from '../types';

interface BondSearchProps {
    onBondSelect: (bond: BondSearchResult) => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-4">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const BondSearch: React.FC<BondSearchProps> = ({ onBondSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [maturityYear, setMaturityYear] = useState('');
    const [results, setResults] = useState<BondSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setError('Please enter a search term.');
            return;
        }

        setIsSearching(true);
        setError(null);
        setResults([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const prompt = `You are a financial data service. Find bond details for "${searchTerm}" maturing around ${maturityYear || 'any year'}. Use Google Search for the most up-to-date information.
Return a JSON array of objects with the following keys: "isin", "name", "faceValue", "marketPrice", "couponRate", "couponFrequency" (1 for annual, 2 for semi-annual, 4 for quarterly, 12 for monthly), and "maturityDate" (in "YYYY-MM-DD" format).
If you cannot find a value, use a reasonable default or null. Ensure the response is ONLY the JSON array inside a JSON code block. Example:
\`\`\`json
[
  {
    "isin": "INE020B08AL0",
    "name": "REC 8.75 2024",
    "faceValue": 1000,
    "marketPrice": 1001.5,
    "couponRate": 8.75,
    "couponFrequency": 1,
    "maturityDate": "2024-12-21"
  }
]
\`\`\`
`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{googleSearch: {}}],
                },
            });
            
            const textResponse = response.text;
            const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
            
            if (jsonMatch && jsonMatch[1]) {
                const parsedResults = JSON.parse(jsonMatch[1]);
                if (Array.isArray(parsedResults) && parsedResults.length > 0) {
                     setResults(parsedResults);
                } else {
                    setError('No bonds found matching your criteria.');
                }
            } else {
                setError('Could not parse bond data from the response. Please try again.');
            }

        } catch (err) {
            console.error('Error fetching bond details:', err);
            setError('An error occurred while fetching bond details. Please check your connection and try again.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="bg-white dark:bg-night-card shadow-xl rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Find a Bond</h2>
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label htmlFor="searchTerm" className="block text-sm font-medium text-slate-600 dark:text-night-text-light mb-1">ISIN or Bond Name</label>
                        <input
                            id="searchTerm"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="e.g., IN0020180017"
                            className="w-full p-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-night-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 text-slate-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="maturityYear" className="block text-sm font-medium text-slate-600 dark:text-night-text-light mb-1">Maturity Year</label>
                         <input
                            id="maturityYear"
                            type="number"
                            value={maturityYear}
                            onChange={(e) => setMaturityYear(e.target.value)}
                            placeholder="e.g., 2028"
                            min="1900"
                            max="2100"
                            className="w-full p-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-night-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
            </form>
            <div className="mt-4">
                {isSearching && <LoadingSpinner />}
                {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
                {results.length > 0 && (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        <h3 className="text-base font-semibold text-slate-700 dark:text-night-text">Search Results</h3>
                        {results.map((bond) => (
                            <div key={bond.isin} className="p-4 border border-slate-200 dark:border-night-border rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{bond.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-night-text-light">{bond.isin} &bull; Matures {new Date(bond.maturityDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                </div>
                                <button
                                    onClick={() => onBondSelect(bond)}
                                    className="bg-brand-cyan/20 hover:bg-brand-cyan/40 text-brand-cyan-700 dark:text-brand-cyan dark:bg-brand-cyan/10 dark:hover:bg-brand-cyan/20 font-bold py-1.5 px-4 text-sm rounded-full transition duration-200"
                                >
                                    Select
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BondSearch;
