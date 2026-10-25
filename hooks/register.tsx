import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Agente, Avance } from '../types'

const PANE = 'avance-de-agente'
const ORDEN = ['p', '0', '5a', '1', '2', '3', '4', '5b', '6']

const avance = atom({ plugin: 'avance-de-agente', key: 'avance' } as const, null, {
  shape: 'avance-1',
})

// La investigación con el progreso más reciente: cada agente escribe su propio
// progreso/<rol>.json, para que los que corren en paralelo no se pisen
const buscar = async ($: any, RAIZ: string): Promise<Avance | null> => {
  const carpetas = await $.fs.list(RAIZ).catch(() => [])
  let mejor: { carpeta: string; mtime: number; archivos: any[] } | null = null
  for (const c of carpetas) {
    if (c.kind !== 'dir') continue
    const archivos = (await $.fs.list(`${RAIZ}/${c.name}/progreso`).catch(() => []))
      .filter((x: any) => x.kind === 'file' && x.name.endsWith('.json'))
    const mtime = Math.max(0, ...archivos.map((x: any) => x.mtimeMs))
    if (archivos.length > 0 && (!mejor || mtime > mejor.mtime)) mejor = { carpeta: c.name, mtime, archivos }
  }
  if (!mejor) return null
  const agentes: Agente[] = []
  for (const x of mejor.archivos) {
    try {
      const a = JSON.parse(await $.fs.read(`${RAIZ}/${mejor.carpeta}/progreso/${x.name}`))
      agentes.push({
        id: x.name.replace(/\.json$/, ''),
        hecho: Number(a.hecho) || 0,
        total: Number(a.total) || 0,
        estado: String(a.estado ?? ''),
        nota: String(a.nota ?? ''),
      })
    } catch {
      // un archivo a medio escribir se lee en la próxima vuelta
    }
  }
  {
    const rango = (id: string) => {
      const i = ORDEN.indexOf(id.split('-')[0] ?? '')
      return i < 0 ? 99 : i
    }
    agentes.sort((a, b) => rango(a.id) - rango(b.id))
    return { carpeta: mejor.carpeta, tema: mejor.carpeta, actualizado: mejor.mtime, agentes }
  }
}

const barra = (hecho: number, total: number, ancho: number) => {
  const p = total > 0 ? Math.min(1, hecho / total) : 0
  const llenos = Math.round(p * ancho)
  return '█'.repeat(llenos) + '░'.repeat(ancho - llenos)
}

export const register: Register = (on, options) => {
  const raiz = String(options?.carpeta ?? 'lineamientos/investigaciones').replace(/[\\/]+$/, '')

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'avance',
      description: 'Muestra el avance de cada agente de la investigación en curso',
    })
    // Lo escrito antes de arrancar la sesión no abre el panel
    let ultimo = Date.now()
    $.clock.every(3000, async () => {
      const a = await buscar($, raiz)
      const previo = await read($, avance)
      if (JSON.stringify(a) !== JSON.stringify(previo)) await update($, avance, () => a)
      // Se abre solo cuando una investigación escribe progreso nuevo
      if (a && a.actualizado > ultimo) {
        if (a.agentes.some(x => x.estado !== 'listo')) {
          void $.ui.open({ id: PANE, title: 'Avance' })
        }
        ultimo = a.actualizado
      }
    })

    return next(e)
  })

  on('command.run', { command: 'avance' }, async $ => {
    const a = await buscar($, raiz)
    await update($, avance, () => a)
    await $.ui.open({ id: PANE, title: 'Avance' })

    return { text: a ? `Avance de ${a.tema}.` : `No hay progreso en ninguna carpeta de ${raiz}/.` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const a = await read($, avance)
    if (!a) return <Text dimColor>Sin investigación en curso.</Text>
    const ancho = Math.max(8, Math.min(30, (e.viewport?.columns ?? 40) - 26))

    return (
      <Box flexDirection="column">
        <Text bold>{a.tema}</Text>
        {a.agentes.map(x => {
          const pct = x.total > 0 ? Math.round((100 * x.hecho) / x.total) : 0
          const listo = x.estado === 'listo'
          return (
            <Box flexDirection="column">
              <Text dimColor={listo}>
                {x.id.padEnd(16).slice(0, 16)} {barra(listo ? 1 : x.hecho, listo ? 1 : x.total, ancho)} {listo ? 'listo' : `${pct}%`}
              </Text>
              {!listo && x.nota !== '' && <Text dimColor>  {x.nota}</Text>}
            </Box>
          )
        })}
      </Box>
    )
  })
}
