/**
 * 通用按钮组件
 */
import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white',
  secondary: 'bg-surface-light border border-gray-600 hover:bg-surface text-gray-200',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-surface-light text-gray-300',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`font-medium transition ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
