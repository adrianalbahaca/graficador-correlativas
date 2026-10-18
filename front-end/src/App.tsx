import { useState, createContext, useContext, useEffect } from 'react'
import { ReactFlow, type Node, type Edge, type NodeProps, Background, Handle, Position } from '@xyflow/react'
import { type Materia } from './types/Materia.ts'
import '@xyflow/react/dist/style.css'
import './Mapa.css'
import dagre from '@dagrejs/dagre'


const ancho = 200;
const alto = 260;

interface Acciones {
  aprobar: (codigo: string) => void,
  regularizar: (codigo: string) => void
  estadoVisual: (materia: Materia) => estadoVisual
}

interface MateriaApi {
  codigo: string
  nombre: string
  correlativas: string[]
}

type materiaNode = Node<{ materia: Materia }, 'materiaNode'>;

type estadoVisual = 'bloqueada' | 'cursable' | 'aprobada' | 'regular'

const nodeTypes = { 'materiaNode': NodoMateria }

const AccionesContext = createContext<Acciones>({
  aprobar: () => { },
  regularizar: () => { },
  estadoVisual: () => { return 'bloqueada' }
})

// Cálculo automático de edges según las correlativas correspondientes
function calcularEdges(nodos : materiaNode[]) : Edge[] {
  return nodos.flatMap((nodo) => {
    return nodo.data.materia.correlativas.flatMap((c) => {
      const origen = nodos.find(elem => { return elem.data.materia.codigo === c });
      if (origen) {
        const id = `ed${origen.id}-${nodo.id}`

        if (origen.data.materia.aprobada === 'aprobada' || origen.data.materia.aprobada === 'regular')
          return [{ id: id, source: origen.id, target: nodo.id }]
        else
          return [{ id: id, source: origen.id, target: nodo.id, style: { strokeDasharray: '5 5' } }]
      }
      else {
        return []
      }
    })
  });
}

/**
 * TODO: Organizar código ahora que se entiende el orden de las cosas
 * @returns 
 */

function App() {

  const [materias, setMaterias] = useState<materiaNode[]>([]);
  const [nodosConPosicion, setNodosConPosicion] = useState<materiaNode[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/materias/")
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP: ${response.status}`);
        }
        return response.json()})
      .then((datos: MateriaApi[]) => {
        const nodos : materiaNode[] = [];
        for (let i = 0; i < datos.length; i++) {
          nodos.push({
            id: datos[i].codigo,
            type: 'materiaNode',
            position: { x: 0, y: 0 },
            data: {
              materia: {
                id: i,
                nombre: datos[i].nombre,
                codigo: datos[i].codigo,
                correlativas: datos[i].correlativas,
                aprobada: 'pendiente'
              }
            }
          })
        }

        setMaterias(nodos);
      })
      .catch(error => console.error(error))
  }, [])


  // Función de cursable
  function esCursable(materia: Materia): boolean {
    return materia.correlativas.every((c) => {
      const m = nodosConPosicion.find(elem => { return elem.data.materia.codigo === c });
      return m?.data.materia.aprobada === 'regular' || m?.data.materia.aprobada === 'aprobada'
    })
  }

  // Función para determinar estado
  function estadoMateria(materia: Materia): estadoVisual {
    if (esCursable(materia)) {
      switch (materia.aprobada) {
        case 'aprobada':
          return 'aprobada'
        case 'regular':
          return 'regular'
        default:
          return 'cursable'
      }
    }
    else return 'bloqueada'
  }

  // Función que determina si una materia puede marcarse como aprobada
  function marcarAprobada(codigo: string) {
    const materiaNodo = nodosConPosicion.find((nodo) => { return nodo.data.materia.codigo === codigo })
    const materia = materiaNodo?.data.materia

    if (materia != undefined && esCursable(materia))
      setNodosConPosicion((prevMaterias) => prevMaterias.map(m => m.data.materia.codigo === codigo ? { ...m, data: { ...m.data, materia: { ...m.data.materia, aprobada: 'aprobada' } } } : m));
  }

  // Función que determina si una materia puede marcarse como regular
  function marcarRegularizada(codigo: string) {
    const materiaNodo = nodosConPosicion.find((nodo) => { return nodo.data.materia.codigo === codigo });
    const materia = materiaNodo?.data.materia

    if (materia != undefined && esCursable(materia) && materia.aprobada != 'aprobada')
      setNodosConPosicion((prevMaterias) => prevMaterias.map(m => m.data.materia.codigo === codigo ? { ...m, data: { ...m.data, materia: { ...m.data.materia, aprobada: 'regular' } } } : m));
  }

  // Cálculo automático de posiciones de los nodos
  useEffect(
    () => {

      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({ rankdir: 'TB' });

      materias.forEach((node) => {
        dagreGraph.setNode(node.id, { width: ancho, height: alto })
      });

      const edges : Edge[] = calcularEdges(materias);

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target)
      });

      dagre.layout(dagreGraph);

      const nodosNuevos = materias.map((node) => {
        const posicionCalculada = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: posicionCalculada.x - ancho / 2,
            y: posicionCalculada.y - alto / 2
          }
        }
      })

      setNodosConPosicion(nodosNuevos);
    }, [materias]);

  // Grafo mostrado en pantalla en sí
  return (
    <>
      <AccionesContext.Provider value={{ aprobar: marcarAprobada, regularizar: marcarRegularizada, estadoVisual: estadoMateria }}>
        <div style={{ height: '100vh' }}>
          <ReactFlow nodes={nodosConPosicion} edges={calcularEdges(nodosConPosicion)} nodeTypes={nodeTypes}>
            <Background />
          </ReactFlow>
        </div>
      </AccionesContext.Provider>
    </>
  )
}

// Nodo de una materia en estatus inicial
function NodoMateria({ data }: NodeProps<materiaNode>) {
  const accion = useContext(AccionesContext);
  return (
    <>
      <div className={`nodo-materia nodo-materia--${accion.estadoVisual(data.materia)}`}>
        <Handle type='target' position={Position.Top} />
        <p>{data.materia.nombre}</p>
        <button onClick={() => accion.aprobar(data.materia.codigo)}> Marcar Aprobada </button>
        <button onClick={() => accion.regularizar(data.materia.codigo)}> Marcar Regularizada </button>
        <Handle type='source' position={Position.Bottom} />
      </div>
    </>
  )
}

export default App
