import { useState, createContext, useContext } from 'react'
import { ReactFlow, type Node, type Edge, type NodeProps, Background, Handle, Position } from '@xyflow/react'
import { type Materia } from './types/Materia.ts'
import '@xyflow/react/dist/style.css'

type materiaNode = Node<{ materia: Materia }, 'materiaNode'>;

const nodeTypes = { 'materiaNode': NodoMateria }

const AprobarContext = createContext<(codigo: string) => void>(() => { })

function App() {

  const nodes: materiaNode[] = [
    { id: '1', type: 'materiaNode', position: { x: 0, y: 0 }, data: { materia: { id: 111, nombre: "Programación I", codigo: "R-111", correlativas: [], aprobada: false } } },
    { id: '2', type: 'materiaNode', position: { x: 0, y: 250 }, data: { materia: { id: 112, nombre: "Programación II", codigo: "R-121", correlativas: [], aprobada: true } } }
  ];

  const edges: Edge[] = [
    { id: 'ed1-2', source: '1', target: '2' }
  ]

  const [materias, setMaterias] = useState<materiaNode[]>(nodes);

  function marcarAprobada(codigo: string) {
    setMaterias((prevMaterias) => prevMaterias.map(m => m.data.materia.codigo === codigo ? { ...m, data: { ...m.data, materia: { ...m.data.materia, aprobada: true } } } : m));
  }

  return (
    <>
      <AprobarContext.Provider value={marcarAprobada}>
        <div style={{ height: '100vh' }}>
          <ReactFlow nodes={materias} edges={edges} nodeTypes={nodeTypes}>
            <Background />
          </ReactFlow>
        </div>
      </AprobarContext.Provider>
    </>
  )
}

function NodoMateria({ data }: NodeProps<materiaNode>) {
  const onAprobar = useContext(AprobarContext);
  return (
    <>
      <Handle type='target' position={Position.Top} />
      <h1>{data.materia.nombre}</h1>
      <button onClick={() => onAprobar(data.materia.codigo)}> Marcar Aprobada </button>
      <Handle type='source' position={Position.Bottom} />
    </>
  )
}

export default App
