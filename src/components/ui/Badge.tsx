import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'yellow' | 'gray' | 'blue'
  size?: 'sm' | 'md'
  className?: string
}

export default function Badge({ children, variant = 'green', size = 'md', className }: BadgeProps) {
  const variants = {
    green: 'badge-green',
    red: 'badge-red',
    yellow: 'badge-yellow',
    gray: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700',
    blue: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700',
  }

  return (
    <span className={cn(variants[variant], size === 'sm' && 'text-[10px] px-2 py-0.5', className)}>
      {children}
    </span>
  )
}
