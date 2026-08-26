import type { ComputeEngine as ComputeEngineInstance } from '@cortex-js/compute-engine'

declare global {
  interface Window {
    ComputeEngine?: {
      ComputeEngine: new () => ComputeEngineInstance
    }
  }
}

export {}
