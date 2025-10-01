import React, { useState, useEffect, useMemo } from 'react';
import { BondDetails, YtmResult, CouponFrequencyOptions, BondInputState, BondSearchResult } from '../types';
import { calculateYTM } from '../services/bondCalculator';
import InputControl from './InputControl';
import PayoutTimeline from './PayoutTimeline';
import BondSearch from './BondSearch';

interface YtmCalculatorProps {
    bondInputs: BondInputState;
    setBondInputs: React.Dispatch<React.SetStateAction<BondInputState>>;
}

const InfoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const DetailRow: React.FC<{ label: string; value?: string; description?: string; children?: React.ReactNode; info?: boolean }> = ({ label, value, description, info, children }) => (
    <div>
        <div className="flex justify-between items-center py-4">
            <p className="text-slate-600 dark:text-night-text-light">{label} {info && <InfoIcon />}</p>
            {children || <p className="font-semibold text-slate-800 dark:text-white">{value}</p>}
        </div>
        {description && <p className="text-xs text-slate-500 dark:text-night-text-light -mt-3 pb-3 max-w-sm">{description}</p>}
    </div>
);

const YtmCalculator: React.FC<YtmCalculatorProps> = ({ bondInputs, setBondInputs }) => {
    const [quantity, setQuantity] = useState(1);
    const [isReceivableOpen, setIsReceivableOpen] = useState(true);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    
    const [result, setResult] = useState<YtmResult | null>(null);

    useEffect(() => {
        const maturityTime = new Date(bondInputs.maturityDate).getTime();
        const nowTime = new Date().getTime();
        const yearsToMaturity = (maturityTime - nowTime) / (1000 * 60 * 60 * 24 * 365.25);

        if (yearsToMaturity > 0) {
            const newBondDetails: BondDetails = {
                faceValue: bondInputs.faceValue,
                marketPrice: bondInputs.marketPrice,
                couponRate: bondInputs.couponRate,
                couponFrequency: bondInputs.couponFrequency,
                yearsToMaturity: yearsToMaturity,
            };
            const calculatedResult = calculateYTM(newBondDetails);
            setResult(calculatedResult);
        } else {
            setResult(null);
        }
    }, [bondInputs]);

    const maturityDuration = useMemo(() => {
        if (!bondInputs.maturityDate) return '';
        
        const maturityDate = new Date(bondInputs.maturityDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (maturityDate < today) {
            return "Matured";
        }
        if (maturityDate.getTime() === today.getTime()){
            return "Matures Today";
        }

        let years = maturityDate.getFullYear() - today.getFullYear();
        let months = maturityDate.getMonth() - today.getMonth();
        let days = maturityDate.getDate() - today.getDate();

        if (days < 0) {
            months--;
            const prevMonthLastDay = new Date(maturityDate.getFullYear(), maturityDate.getMonth(), 0).getDate();
            days += prevMonthLastDay;
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        const parts = [];
        if (years > 0) parts.push(`${years} ${years > 1 ? 'yrs' : 'yr'}`);
        if (months > 0) parts.push(`${months} ${months > 1 ? 'mos' : 'mo'}`);
        if (days > 0) parts.push(`${days} ${days > 1 ? 'days' : 'day'}`);
        
        return parts.join(', ');
    }, [bondInputs.maturityDate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' && value !== '' ? parseFloat(value) : value;
        setBondInputs(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (value >= 1) {
            setQuantity(value);
        } else {
            setQuantity(1);
        }
    };
    
    const handleBondSelect = (bond: BondSearchResult) => {
        // The AI model can sometimes return null or incorrectly formatted data.
        // This function sanitizes the selected bond data before updating the state
        // to ensure the application remains stable.
        if (!bond) return;

        const parseNumericInput = (value: any, defaultValue: number): number => {
            if (value === null || typeof value === 'undefined') {
                return defaultValue;
            }
            const num = parseFloat(value);
            return isNaN(num) ? defaultValue : num;
        };

        setBondInputs(prev => ({
            ...prev,
            faceValue: parseNumericInput(bond.faceValue, prev.faceValue),
            marketPrice: parseNumericInput(bond.marketPrice, prev.marketPrice),
            couponRate: parseNumericInput(bond.couponRate, prev.couponRate),
            couponFrequency: parseNumericInput(bond.couponFrequency, prev.couponFrequency),
            maturityDate: (bond.maturityDate && typeof bond.maturityDate === 'string') ? bond.maturityDate : prev.maturityDate,
        }));
        setIsAdvancedOpen(true);
    };

    const displayValues = useMemo(() => {
        if (!result) return { amountToInvest: 0, totalCouponPayments: 0, tdsAmount: 0, maturityAmount: 0, totalReceivable: 0, profit: 0, monthlyRate: 0 };
        
        const amountToInvest = bondInputs.marketPrice * quantity;
        const totalCouponPayments = result.totalCouponPayments * quantity;
        const tdsAmount = totalCouponPayments * (bondInputs.tdsRate / 100);
        const maturityAmount = bondInputs.faceValue * quantity;
        const totalReceivable = (totalCouponPayments - tdsAmount) + maturityAmount;
        const profit = totalReceivable - amountToInvest;
        const monthlyRate = (Math.pow(1 + result.ytmEffectiveAnnual, 1/12) - 1);

        return { amountToInvest, totalCouponPayments, tdsAmount, maturityAmount, totalReceivable, profit, monthlyRate };
    }, [result, quantity, bondInputs]);
    
    const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-8">
            <div className="lg:grid lg:grid-cols-5 lg:gap-8 lg:items-start">
                {/* Left Column */}
                <div className="lg:col-span-2">
                    <div className="sticky top-24 bg-white dark:bg-night-card shadow-xl rounded-2xl p-6 space-y-4 divide-y divide-slate-200 dark:divide-night-border">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order Details</h2>
            
                        <div className="pt-4">
                            <DetailRow label="Amount to Invest" value={formatCurrency(displayValues.amountToInvest)} info />
                            <DetailRow label="Ask Rate (Annual)" value={result ? `${(result.ytmAnnual * 100).toFixed(2)}% p.a.` : 'N/A'} />
                            <DetailRow label="Ask Rate (Monthly)" value={result ? `${(displayValues.monthlyRate * 100).toFixed(2)}% p.m.` : 'N/A'} />
                            <DetailRow label="Maturing on">
                                <div className="flex flex-col items-end">
                                    <input
                                        type="date"
                                        name="maturityDate"
                                        value={bondInputs.maturityDate}
                                        onChange={handleInputChange}
                                        className="font-semibold bg-transparent text-right text-slate-800 dark:text-white focus:outline-none"
                                        aria-label="Maturity Date"
                                    />
                                    {maturityDuration && <p className="text-xs text-slate-500 dark:text-night-text-light mt-1">{maturityDuration}</p>}
                                </div>
                            </DetailRow>
                        </div>

                        <div className="pt-4">
                            <button className="w-full flex justify-between items-center" onClick={() => setIsReceivableOpen(!isReceivableOpen)}>
                                <span className="font-semibold text-brand-blue">Total Amount receivable</span>
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(displayValues.totalReceivable)}</span>
                                    <ChevronIcon open={isReceivableOpen} />
                                </div>
                            </button>
                            {isReceivableOpen && (
                                <div className="mt-4 pl-2 border-l-2 border-slate-200 dark:border-night-border space-y-2">
                                    <DetailRow label="Coupon Payments" value={formatCurrency(displayValues.totalCouponPayments)} description="Bond coupon payments with TDS deducted to be credited directly to your bank account." />
                                    <DetailRow label={`${bondInputs.tdsRate}% TDS`} value={formatCurrency(displayValues.tdsAmount)} description={`The issuer will withhold ${bondInputs.tdsRate}% Tax Deducted at Source (TDS) from the coupon payment amount.`} />
                                    <DetailRow label="Maturity Amount" value={formatCurrency(displayValues.maturityAmount)} description="Amount the investor will receive on the maturity date." />
                                    <DetailRow label="Profit" value={formatCurrency(displayValues.profit)} description="The total pre-tax gain on your investment (Total Coupons + Maturity Amount - Amount to Invest)." />
                                </div>
                            )}
                        </div>

                        <div className="pt-4">
                            <DetailRow label="Quantity">
                                <div className="flex items-center space-x-4">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 text-lg font-bold disabled:opacity-50" disabled={quantity <= 1}>-</button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={handleQuantityInputChange}
                                        min="1"
                                        className="h-8 w-20 text-center font-bold text-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-night-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        aria-label="Quantity"
                                    />
                                    <button onClick={() => setQuantity(q => q + 1)} className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 text-lg font-bold">+</button>
                                </div>
                            </DetailRow>
                        </div>
                    </div>
                </div>

                 {/* Right Column */}
                <div className="lg:col-span-3 mt-6 lg:mt-0 space-y-6">
                    <BondSearch onBondSelect={handleBondSelect} />

                    <div className="bg-white dark:bg-night-card shadow-xl rounded-2xl">
                         <button
                            className="w-full flex justify-between items-center p-6"
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            aria-expanded={isAdvancedOpen}
                            aria-controls="advanced-settings"
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Advanced Settings</h3>
                            <ChevronIcon open={isAdvancedOpen} />
                        </button>
                        <div
                            id="advanced-settings"
                            className={`transition-all duration-300 ease-in-out overflow-hidden ${isAdvancedOpen ? 'max-h-screen' : 'max-h-0'}`}
                        >
                            <div className="p-6 border-t border-slate-200 dark:border-night-border space-y-4">
                                <p className="text-sm text-slate-500 dark:text-night-text-light">Manually adjust the bond parameters below to see how it affects the yield and returns.</p>
                                <InputControl label="Investment Amount (per unit)" name="marketPrice" value={bondInputs.marketPrice} onChange={handleInputChange} />
                                <InputControl label="Face Value (per unit)" name="faceValue" value={bondInputs.faceValue} onChange={handleInputChange} />
                                <InputControl label="Annual Coupon Rate (%)" name="couponRate" value={bondInputs.couponRate} onChange={handleInputChange} step={0.01} min={0} />
                                <InputControl as="select" label="Coupon Frequency" name="couponFrequency" value={bondInputs.couponFrequency} onChange={handleInputChange} options={CouponFrequencyOptions} />
                                <InputControl label="TDS Rate (%)" name="tdsRate" value={bondInputs.tdsRate} onChange={handleInputChange} min={0} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
             {/* Payout Schedule Section */}
            <div className="bg-white dark:bg-night-card shadow-xl rounded-2xl p-6 mt-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Payout Schedule</h2>
                <PayoutTimeline bondInputs={bondInputs} quantity={quantity} />
            </div>
        </div>
    );
};

export default YtmCalculator;