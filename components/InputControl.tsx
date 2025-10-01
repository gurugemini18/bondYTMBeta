import React from 'react';

interface InputControlProps {
    label: string;
    name: string;
    value: number | string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    as?: 'input' | 'select';
    type?: string;
    step?: number;
    min?: number;
    options?: { label: string; value: number }[];
    hideLabel?: boolean;
}

const InputControl: React.FC<InputControlProps> = ({ label, name, value, onChange, as = 'input', type = 'number', step = 0.01, min, options = [], hideLabel = false }) => {
    const commonClasses = "w-full p-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-night-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 text-slate-800 dark:text-white";
    const labelClasses = `block text-sm font-medium text-slate-600 dark:text-night-text-light mb-1 ${hideLabel ? 'sr-only' : ''}`;

    return (
        <div>
            <label htmlFor={name} className={labelClasses}>{label}</label>
            {as === 'select' ? (
                <select id={name} name={name} value={value} onChange={onChange} className={commonClasses}>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            ) : (
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    step={step}
                    min={min}
                    placeholder={hideLabel ? label : ''}
                    aria-label={label}
                    className={commonClasses}
                />
            )}
        </div>
    );
};

export default InputControl;