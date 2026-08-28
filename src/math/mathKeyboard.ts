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

type EditableMathField = HTMLElement & {
  menuItems?: readonly unknown[]
}

const electronicsLayout: VirtualKeyboardLayout = {
  label: 'Electronics',
  tooltip: 'Common electronics formula keys',
  rows: [
    ['7', '8', '9', '+', '-', '=', '[backspace]'],
    ['4', '5', '6', '\\times', '\\frac{#@}{#?}', '(', ')'],
    ['1', '2', '3', 'V', 'I', 'R', 'P'],
    ['0', '.', 'C', 'L', 'f', '#@_{#?}', '#@^{#?}'],
  ],
}

const advancedElectronicsLayout: VirtualKeyboardLayout = {
  label: 'Advanced',
  tooltip: 'AC, calculus and advanced electronics symbols',
  rows: [
    ['\\pi', '\\omega', '\\varphi', '\\theta', 'j', 'Z', 'X'],
    ['\\sqrt{#0}', '\\sin', '\\cos', '\\tan', '\\ln', '\\log', 'e^{#?}'],
    [
      '\\sum',
      '\\int',
      { latex: '\\frac{d\\Box}{d\\Box}', insert: '\\frac{d#?}{d#?}', width: 1.5 },
      '\\Delta',
      '\\tau',
      '\\varepsilon',
      '\\mu',
    ],
    ['\\rho', '\\alpha', '\\beta', '\\lambda', '\\approx', '\\infty', '[backspace]'],
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

function disableMathFieldContextMenu(mathfield: HTMLElement) {
  ;(mathfield as EditableMathField).menuItems = []
}

export function openMathKeyboard(mathfield: HTMLElement) {
  disableMathFieldContextMenu(mathfield)
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
