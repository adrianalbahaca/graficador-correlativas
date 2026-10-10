import { useState, createContext, useContext, useEffect } from 'react'
import { ReactFlow, type Node, type Edge, type NodeProps, Background, Handle, Position } from '@xyflow/react'
import { type Materia, type Estado } from './types/Materia.ts'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'

const ancho = 200;
const alto = 260;

interface Acciones {
  aprobar: (codigo:string) => void,
  regularizar: (codigo:string) => void
  estadoVisual: (materia: Materia) => estadoVisual
}

type materiaNode = Node<{ materia: Materia }, 'materiaNode'>;

type estadoVisual = 'bloqueada' | 'cursable' | 'aprobada' | 'regular'

const nodeTypes = { 'materiaNode': NodoMateria }

const AccionesContext = createContext<Acciones>({
  aprobar: () => {},
  regularizar: () =>{},
  estadoVisual: () => { return 'bloqueada' }
})

function App() {

  // Hardcodeo de ejemplo de materias
  const nodes: materiaNode[] = [
    { id: '1', type: 'materiaNode', position: { x: 0, y: 0 }, data: { materia: { id: 111, nombre: "Programación I", codigo: "R-111", correlativas: [], aprobada: 'pendiente' } } },
    { id: '2', type: 'materiaNode', position: { x: 0, y: 250 }, data: { materia: { id: 112, nombre: "Programación II", codigo: "R-112", correlativas: [], aprobada: 'pendiente' } } },
    { id: '3', type: 'materiaNode', position: { x: 0, y: 500 }, data: { materia: {id: 113, nombre: "Análisis Matemático I", codigo: "R-113", correlativas: [], aprobada: 'aprobada'}}},
    { id: '4', type: 'materiaNode', position: { x: 0, y: 750 }, data: { materia: {id: 121, nombre: "Análisis Matemático II", codigo: "R-121", correlativas: ["R-113"], aprobada: 'regular'}}},
    { id: '5', type: 'materiaNode', position: { x: 0, y: 1000}, data: { materia: {id: 122, nombre: "Estructura de Datos y Algoritmos I", codigo: "R-122", correlativas: ["R-113", "R-112"], aprobada: 'pendiente'}}},
    { id: '6', type: 'materiaNode', position: { x: 0, y: 1250}, data: { materia: {id: 123, nombre: "Lenguajes Formales y Computabilidad", codigo: "R-123", correlativas: [], aprobada: 'pendiente'}}},
  ];

  // Cálculo automático de bordes

  // Función de cursable
  function esCursable(materia : Materia) : boolean {
    return materia.correlativas.every((c) => {
      const m = nodosConPosicion.find(elem => { return elem.data.materia.codigo === c});
      return m?.data.materia.aprobada === 'regular' || m?.data.materia.aprobada === 'aprobada'
    })
  }

  function estadoMateria(materia : Materia) : estadoVisual {
    if (esCursable(materia)) {
      switch(materia.aprobada) {
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

    // useState necesarios
  const [materias, setMaterias] = useState<materiaNode[]>(nodes);
  const [nodosConPosicion, setNodosConPosicion] = useState<materiaNode[]>(nodes);

  // Función que cambia el estado dependiendo si 
  function marcarAprobada(codigo: string) {
    const materiaNodo = nodosConPosicion.find((nodo) => {return nodo.data.materia.codigo === codigo})
    const materia = materiaNodo?.data.materia

    if (materia != undefined && esCursable(materia) )
      setNodosConPosicion((prevMaterias) => prevMaterias.map(m => m.data.materia.codigo === codigo ? { ...m, data: { ...m.data, materia: { ...m.data.materia, aprobada: 'aprobada' } } } : m));
  }

  function marcarRegularizada(codigo: string) {
    const materiaNodo = nodosConPosicion.find((nodo) => { return nodo.data.materia.codigo === codigo });
    const materia = materiaNodo?.data.materia

    if (materia != undefined && esCursable(materia) && materia.aprobada != 'aprobada')
      setNodosConPosicion((prevMaterias) => prevMaterias.map(m => m.data.materia.codigo === codigo ? { ... m, data: { ... m.data, materia: { ... m.data.materia, aprobada: 'regular'}}} : m));
  }

  const edges: Edge[] = nodosConPosicion.flatMap( (nodo) => {
    return nodo.data.materia.correlativas.flatMap((c) => {
      const origen = nodosConPosicion.find(elem => { return elem.data.materia.codigo === c});
      if (origen) {
        const id = `ed${origen.id}-${nodo.id}`
        
        if (origen.data.materia.aprobada === 'aprobada' || origen.data.materia.aprobada === 'regular')
          return [{id: id, source: origen.id, target: nodo.id}]
        else
          return [{id: id, source: origen.id, target: nodo.id, style: { strokeDasharray: '5 5'}}]
      }
      else {
        return []
      }
    })
  });

  useEffect(
    () => {

      const dagreGraph = new dagre.graphlib.Graph()
      dagreGraph.setDefaultEdgeLabel(() => ({}))
      dagreGraph.setGraph({rankdir: 'TB'})

      materias.forEach((node) => {
        dagreGraph.setNode(node.id, { width: ancho, height: alto})
      })

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target)
      })

      dagre.layout(dagreGraph);

      const nodosNuevos = materias.map((node) => {
        const posicionCalculada = dagreGraph.node(node.id);
        return {
          ... node,
          position: {
            x: posicionCalculada.x - ancho / 2, 
            y: posicionCalculada.y - alto / 2
          }
        }
      })

      setNodosConPosicion(nodosNuevos);
    }, []);

  return (
    <>
      <AccionesContext.Provider value={{aprobar: marcarAprobada, regularizar: marcarRegularizada, estadoVisual: estadoMateria}}>
          <div style={{ height: '100vh' }}>
            <ReactFlow nodes={nodosConPosicion} edges={edges} nodeTypes={nodeTypes}>
              <Background />
            </ReactFlow>
          </div>
      </AccionesContext.Provider>
    </>
  )
}

function NodoMateria({ data }: NodeProps<materiaNode>) {
  const accion = useContext(AccionesContext);
  return (
    <>
      <div className={`nodo-materia nodo-materia--${accion.estadoVisual(data.materia)}`} 
      style={{width: ancho, height: alto, border: '1px solid black'}}>
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
