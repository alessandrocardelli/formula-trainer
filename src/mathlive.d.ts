import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type MathFieldAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  value?: string
  'read-only'?: boolean | string
  'math-virtual-keyboard-policy'?: 'auto' | 'manual' | 'sandboxed'
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': MathFieldAttributes
    }
  }
}
