import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type MathFieldAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  value?: string
  'read-only'?: boolean | string
  'virtual-keyboard-mode'?: 'off' | 'manual' | 'onfocus' | 'auto'
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': MathFieldAttributes
    }
  }
}
