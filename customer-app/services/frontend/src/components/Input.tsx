// src/components/Input.tsx
import type { InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg'
}

export default function Input({ size = 'md', className, ...rest }: InputProps) {
  const classes = [styles.input, styles[size], className].filter(Boolean).join(' ')
  return <input className={classes} {...rest} />
}
