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
  addEventListener: (type: string, callback: EventListenerOrEventListenerObject | null) => void
  layouts: readonly (string | VirtualKeyboardLayout)[] | string
  editToolbar?: string
}

type EditableMathField = HTMLElement & {
  menuItems?: readonly unknown[]
}

const equalsKey: VirtualKeyboardKeycap = {
  latex: '=',
  variants: ['\\approx', '\\neq', '<', '>', '\\le', '\\ge'],
}

const squareBracketsKey: VirtualKeyboardKeycap = {
  latex: '[\\Box]',
  insert: '\\left[#?\\right]',
}

const electronicsLayout: VirtualKeyboardLayout = {
  label: 'Electronics',
  tooltip: 'Common electronics formula keys',
  rows: [
    ['7', '8', '9', '+', '-', equalsKey, '[backspace]'],
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
    ['\\rho', '\\alpha', '\\beta', '\\eta', '\\lambda', squareBracketsKey, '[backspace]'],
  ],
}

const customLayouts: readonly (string | VirtualKeyboardLayout)[] = [
  electronicsLayout,
  'alphabetic',
  advancedElectronicsLayout,
]

let keyboardInitialized = false

function keyboard(): MathVirtualKeyboard | undefined {
  return (window as unknown as { mathVirtualKeyboard?: MathVirtualKeyboard }).mathVirtualKeyboard
}

function configureElectronicsKeyboard(virtualKeyboard: MathVirtualKeyboard) {
  virtualKeyboard.layouts = customLayouts
  virtualKeyboard.editToolbar = 'none'
}

function prepareMathField(mathfield: HTMLElement) {
  ;(mathfield as EditableMathField).menuItems = []
}

export function initializeMathKeyboard(attempt = 0) {
  if (keyboardInitialized) {
    return
  }

  const virtualKeyboard = keyboard()
  if (!virtualKeyboard) {
    if (attempt < 8) {
      window.requestAnimationFrame(() => initializeMathKeyboard(attempt + 1))
    }
    return
  }

  configureElectronicsKeyboard(virtualKeyboard)

  virtualKeyboard.addEventListener('before-virtual-keyboard-toggle', (event) => {
    const detail = (event as CustomEvent<{ visible?: boolean }>).detail
    if (detail?.visible) {
      configureElectronicsKeyboard(virtualKeyboard)
    }
  })

  keyboardInitialized = true
}

function showElectronicsKeyboard(attempt = 0) {
  const virtualKeyboard = keyboard()

  if (!virtualKeyboard) {
    if (attempt < 8) {
      window.requestAnimationFrame(() => showElectronicsKeyboard(attempt + 1))
    }
    return
  }

  configureElectronicsKeyboard(virtualKeyboard)
  virtualKeyboard.show()
}

export function openMathKeyboard(mathfield: HTMLElement) {
  prepareMathField(mathfield)
  showElectronicsKeyboard()

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
