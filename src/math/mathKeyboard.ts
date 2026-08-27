type VirtualKeyboardKeycap =
  | string
  | {
      latex?: string
      insert?: string
      command?: string
      width?: 0.5 | 1 | 1.5 | 2 | 5
      variants?: string[]
    }

type VirtualKeyboardLayout = {
  label: string
  tooltip?: string
  rows: VirtualKeyboardKeycap[][]
}

type MathVirtualKeyboard = {
  show: () => void
  hide: () => void
  layouts: readonly (string | VirtualKeyboardLayout)[] | string
  editToolbar?: string
}

const electronicsLayout: VirtualKeyboardLayout = {
  label: 'Electronics',
  tooltip: 'Common electronics formula keys',
  rows: [
    ['7', '8', '9', '+', '-', '=', '[backspace]'],
    ['4', '5', '6', '\\times', '\\frac{#@}{#?}', '(', ')'],
    ['1', '2', '3', 'V', 'I', 'R', 'P'],
    ['0', '.', 'C', 'L', 'f', 'q', 't'],
  ],
}

const advancedElectronicsLayout: VirtualKeyboardLayout = {
  label: 'Advanced',
  tooltip: 'AC, calculus and advanced symbols',
  rows: [
    ['\\pi', '\\omega', '\\varphi', 'j', 'e', '\\sqrt{#0}', '#@^{#?}'],
    ['\\sin', '\\cos', '\\tan', '\\ln', '\\log', '_', '[backspace]'],
    [
      { latex: '\\frac{d\\Box}{d\\Box}', insert: '\\frac{d#?}{d#?}', width: 1.5 },
      '\\Delta',
      '\\theta',
      '\\alpha',
      '\\beta',
      '\\mu',
      '\\varepsilon',
    ],
  ],
}

function keyboard(): MathVirtualKeyboard | undefined {
  return (window as unknown as { mathVirtualKeyboard?: MathVirtualKeyboard }).mathVirtualKeyboard
}

function configureElectronicsKeyboard() {
  const virtualKeyboard = keyboard()
  if (!virtualKeyboard) {
    return
  }

  virtualKeyboard.layouts = [electronicsLayout, 'alphabetic', advancedElectronicsLayout]
  virtualKeyboard.editToolbar = 'none'
}

export function openMathKeyboard(mathfield: HTMLElement) {
  configureElectronicsKeyboard()
  keyboard()?.show()

  window.setTimeout(() => {
    mathfield.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, 180)
}

export function hideMathKeyboard() {
  keyboard()?.hide()

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}
