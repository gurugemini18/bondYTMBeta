import React, { useMemo, useState, useEffect } from 'react';
import { BondInputState, PayoutDataPoint } from '../types';

interface PayoutTimelineProps {
    bondInputs: BondInputState;
    quantity: number;
}

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const PayoutTimeline: React.FC<PayoutTimelineProps> = ({ bondInputs, quantity }) => {
    const payoutData: PayoutDataPoint[] = useMemo(() => {
        const { maturityDate, faceValue, couponRate, couponFrequency } = bondInputs;
        if (!maturityDate || couponFrequency <= 0 || !isFinite(faceValue) || !isFinite(couponRate) || !isFinite(quantity) || quantity <= 0) {
            return [];
        }

        const maturity = new Date(maturityDate + 'T00:00:00'); 
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (maturity <= today) {
            return [];
        }

        const monthsBetweenPayments = 12 / couponFrequency;
        const couponPaymentAmount = (faceValue * (couponRate / 100)) / couponFrequency;

        const paymentDates: Date[] = [];
        let currentPaymentDate = new Date(maturity);

        while (currentPaymentDate > today) {
            paymentDates.unshift(new Date(currentPaymentDate)); 
            currentPaymentDate.setMonth(currentPaymentDate.getMonth() - monthsBetweenPayments);
        }
        
        if (paymentDates.length === 0) {
             return [{
                payoutDate: maturity,
                interest: 0,
                principal: faceValue * quantity,
            }];
        }

        return paymentDates.map((date) => {
            const isFinalPayment = date.getTime() === maturity.getTime();
            return {
                payoutDate: date,
                interest: couponPaymentAmount * quantity,
                principal: isFinalPayment ? faceValue * quantity : 0,
            };
        });

    }, [bondInputs, quantity]);

    const payoutsByYear = useMemo(() => {
        return payoutData.reduce((acc, payout) => {
            const year = payout.payoutDate.getFullYear().toString();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(payout);
            return acc;
        }, {} as Record<string, PayoutDataPoint[]>);
    }, [payoutData]);

    const years = useMemo(() => Object.keys(payoutsByYear).sort((a, b) => parseInt(a) - parseInt(b)), [payoutsByYear]);
    const [openYear, setOpenYear] = useState<string | null>(null);

    useEffect(() => {
        if (years.length > 0) {
            setOpenYear(years[0]);
        } else {
            setOpenYear(null);
        }
    }, [years]);


    if (years.length === 0) {
        return <p className="text-center text-slate-500 dark:text-night-text-light py-8">No future payouts to display for the selected maturity date.</p>;
    }

    const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-2">
            {years.map((year) => {
                const isOpen = openYear === year;
                const yearlyPayouts = payoutsByYear[year];
                const yearlyTotal = yearlyPayouts.reduce((sum, p) => sum + p.interest + p.principal, 0);

                return (
                    <div key={year} className="border border-slate-200 dark:border-night-border rounded-lg overflow-hidden transition-all duration-300">
                        <button
                            className="w-full flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                            onClick={() => setOpenYear(isOpen ? null : year)}
                            aria-expanded={isOpen}
                            aria-controls={`payouts-${year}`}
                        >
                            <span className="font-semibold text-lg text-slate-800 dark:text-white">{`Year ${year}`}</span>
                            <div className="flex items-center space-x-4">
                                <span className="text-slate-600 dark:text-night-text-light font-medium">{formatCurrency(yearlyTotal)}</span>
                                <ChevronIcon open={isOpen} />
                            </div>
                        </button>
                        <div
                            id={`payouts-${year}`}
                            className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
                        >
                            <div className="bg-white dark:bg-night-card p-4 border-t border-slate-200 dark:border-night-border">
                                <div className="grid grid-cols-4 gap-4 text-xs font-bold text-slate-500 dark:text-night-text-light mb-2 px-2">
                                   <div className="text-left">Date</div>
                                   <div className="text-right">Interest</div>
                                   <div className="text-right">Principal</div>
                                   <div className="text-right">Total Payout</div>
                                </div>
                                <div className="space-y-1">
                                {yearlyPayouts.map((payout, index) => (
                                     <div key={index} className="grid grid-cols-4 gap-4 items-center p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/20">
                                        <div className="text-sm font-medium text-slate-700 dark:text-night-text">
                                            {payout.payoutDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </div>
                                        <div className="text-sm text-right text-slate-600 dark:text-night-text-light">{formatCurrency(payout.interest)}</div>
                                        <div className="text-sm text-right text-slate-600 dark:text-night-text-light">{formatCurrency(payout.principal)}</div>
                                        <div className="text-sm font-semibold text-right text-slate-800 dark:text-white">{formatCurrency(payout.interest + payout.principal)}</div>
                                     </div>
                                ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PayoutTimeline;