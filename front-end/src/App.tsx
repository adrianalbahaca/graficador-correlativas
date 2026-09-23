import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { type Materia } from './types/Materia.ts'

function App() {
  const [materias, setMaterias] = useState<Materia[]>([
    { id: 5501, nombre: "Programación I", codigo: "PROGI", correlativas: [], aprobada: true },
    { id: 5502, nombre: "Programación II", codigo: "PROGII", correlativas: ["PROGI"], aprobada: false },
  ])

  function marcarAprobada(codigo: string) {
    setMaterias(prevMaterias => prevMaterias.map(m => m.codigo === codigo ? { ...m, aprobada: true } : m))
  }

  return (
    <>
      {materias.map(m => <NodoMateria key={m.codigo} materia={m} onAprobar={(c) => marcarAprobada(c)} />)}
    </>
  )
}

// destructuring de objeto para cada componente
interface NodoMateriaProps {
  materia: Materia;
  onAprobar: (codigo: string) => void;
}

function NodoMateria({ materia, onAprobar }: NodoMateriaProps) {
  return (
    <>
      <h1>{materia.nombre}</h1>
      <button onClick={() => onAprobar(materia.codigo)}> Marcar Aprobada </button>
    </>
  )
}

export default App
