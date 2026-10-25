export type Agente = {
  id: string
  hecho: number
  total: number
  estado: string
  nota: string
}

export type Avance = {
  carpeta: string
  tema: string
  actualizado: number
  agentes: Agente[]
}

declare module 'claude-code' {
  interface PluginState {
    'avance-de-agente': { avance: Shaped<Avance | null> }
  }
}
