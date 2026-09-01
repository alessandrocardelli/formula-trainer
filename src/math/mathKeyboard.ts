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
  mathVirtualKeyboardPolicy?: 'auto' | 'manual' | 'sandboxed'
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

function keyboard(): MathVirtualKeyboard | undefined {
  return (window as unknown as { mathVirtualKeyboard?: MathVirtualKeyboard }).mathVirtualKeyboard
}

function configureElectronicsKeyboard(virtualKeyboard: MathVirtualKeyboard) {
  virtualKeyboard.layouts = [electronicsLayout, 'alphabetic', advancedElectronicsLayout]
  virtualKeyboard.editToolbar = 'none'
}

function prepareMathField(mathfield: HTMLElement) {
  const editableMathField = mathfield as EditableMathField
  editableMathField.menuItems = []
  editableMathField.mathVirtualKeyboardPolicy = 'manual'
  mathfield.setAttribute('math-virtual-keyboard-policy', 'manual')
}

function showElectronicsKeyboard(mathfield: HTMLElement, attempt = 0) {
  const virtualKeyboard = keyboard()

  if (!virtualKeyboard) {
    if (attempt < 4) {
      window.requestAnimationFrame(() => showElectronicsKeyboard(mathfield, attempt + 1))
    }
    return
  }

  // A MathLive keyboard can already be mounted before our click handler runs.
  // Hide it first so the shared keyboard is rebuilt from our layouts instead
  // of keeping the default numeric/symbol/alphabetic/greek panel alive.
  virtualKeyboard.hide()
  configureElectronicsKeyboard(virtualKeyboard)
  virtualKeyboard.show()
}

export function openMathKeyboard(mathfield: HTMLElement) {
  prepareMathField(mathfield)
  showElectronicsKeyboard(mathfield)

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
