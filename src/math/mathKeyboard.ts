type VirtualKeyboardKeycap =
  | string
  | {
      latex?: string
      insert?: string
      command?: string
      width?: number
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

type WindowWithMathKeyboard = Window & {
  mathVirtualKeyboard?: MathVirtualKeyboard
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
      { latex: '\\frac{d\\Box}{d\\Box}', insert: '\\frac{d#?}{d#?}', width: 1.4 },
      '\\Delta',
      '\\theta',
      '\\alpha',
      '\\beta',
      '\\mu',
      '\\varepsilon',
    ],
  ],
}

function keyboard() {
  return (window as WindowWithMathKeyboard).mathVirtualKeyboard
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
