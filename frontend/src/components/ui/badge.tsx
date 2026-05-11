import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
        positive: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
        negative: 'bg-red-50 text-red-600 ring-1 ring-red-100',
        neutral: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100',
        warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
        outline: 'border border-gray-200 text-gray-600 bg-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
