import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { hapticImpact } from '@/lib/haptics'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  haptic?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', haptic = true, onClick, children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (haptic && !props.disabled) {
        hapticImpact('light')
      }
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium font-mono transition-all duration-150 ease-ios',
          'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-accent text-white hover:bg-accent-hover': variant === 'primary',
            'bg-surface text-text-primary hover:bg-border': variant === 'secondary',
            'bg-transparent text-text-primary hover:bg-surface': variant === 'ghost',
            'px-3 py-1.5 text-sm rounded-lg': size === 'sm',
            'px-4 py-2 text-base rounded-xl': size === 'md',
            'px-6 py-3 text-lg rounded-xl': size === 'lg',
          },
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
