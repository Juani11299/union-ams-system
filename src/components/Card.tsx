import type { ElementType, ComponentPropsWithoutRef, ReactNode } from 'react'

type CardProps<T extends ElementType> = {
  as?: T
  children: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function Card<T extends ElementType = 'div'>({
  as,
  children,
  className = '',
  ...rest
}: CardProps<T>) {
  const Component = as ?? 'div'
  return (
    <Component
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
      {...rest}
    >
      {children}
    </Component>
  )
}
