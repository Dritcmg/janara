import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
        secondary: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 border",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={cn(
                "inline-flex items-center justify-center rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors",
                variants[variant || 'primary'],
                sizes[size || 'md'],
                (disabled || loading) && "opacity-50 cursor-not-allowed",
                className
            )}
            {...props}
        >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = "Button";

export { Button };
