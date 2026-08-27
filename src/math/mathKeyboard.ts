type MathVirtualKeyboard = {
  show: () => void
  hide: () => void
}

type WindowWithMathKeyboard = Window & {
  mathVirtualKeyboard?: MathVirtualKeyboard
}

function keyboard() {
  return (window as WindowWithMathKeyboard).mathVirtualKeyboard
}

export function openMathKeyboard(mathfield: HTMLElement) {
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
