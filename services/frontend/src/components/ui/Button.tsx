import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'default' | 'primary' | 'ai' | 'ghost' | 'danger'
export type ButtonSize = 'default' | 'sm' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  children?: ReactNode
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  bordered?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'default',
  size = 'default',
  block = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const cls = [
    'btn',
    variant !== 'default' ? variant : '',
    size !== 'default' ? size : '',
    block ? 'block' : '',
    className,
  ].filter(Boolean).join(' ')

  return <button className={cls} {...props}>{children}</button>
}

export function IconButton({ bordered = false, className = '', children, ...props }: IconButtonProps) {
  const cls = ['iconbtn', bordered ? 'bordered' : '', className].filter(Boolean).join(' ')
  return <button className={cls} {...props}>{children}</button>
}
