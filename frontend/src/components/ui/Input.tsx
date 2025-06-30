import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', value, ...props }, ref) => {
    const hasValue = typeof value === 'string' ? value.length > 0 : value !== undefined && value !== null;
    return (
      <div className={`relative mb-4 ${className}`}>
        <input
          ref={ref}
          className="block w-full px-4 py-3 text-base bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 peer"
          placeholder=" "
          value={value}
          {...props}
        />
        <label
          className={`absolute right-4 top-3 text-gray-500 text-right duration-200 transform bg-white px-2 py-0.5 rounded-md pointer-events-none
            ${hasValue ? '-translate-y-5 scale-90 text-blue-700 font-medium' : 'peer-focus:-translate-y-5 peer-focus:scale-90 peer-focus:text-blue-700 peer-focus:font-medium'}
          `}
        >
          {label}
        </label>
      </div>
    );
  }
);
Input.displayName = 'Input'; 