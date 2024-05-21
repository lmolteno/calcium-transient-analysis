import { useState, useMemo } from 'react'
import './App.css'
import { CellManager } from './DataManager'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { CellDisplay } from './CellDisplay'
import { SectionManager } from './SectionManager'

const queryClient = new QueryClient()

function App() {
  const [convolution, setConvolution] = useState(1);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedCell, setSelectedCell] = useState<Cell | undefined>()
  const [updateCell, setUpdateCell] = useState<(update: (c: Cell) => Cell) => void>(() => {})

  return (
    <QueryClientProvider client={queryClient}>
      <div className="header">
        <h1>Calcium Transient Business</h1>
      </div>
      <div className="flex gap-5">
        <input 
          type="range" 
          value={convolution} 
          min={1} 
          step={2}
          max={99} 
          onChange={e => setConvolution(parseInt(e.target.value, 10))}
          />
        <p>convolution width: {convolution}</p>
      </div>
      <div className="flex gap-5">
        <CellManager setData={setSelectedCell} setUpdateCell={setUpdateCell} />
        <SectionManager sections={sections} setSections={setSections} />
      </div>
      {selectedCell 
      ? <CellDisplay 
          cell={selectedCell} 
          samplingRate={1.1} 
          convolutionWidth={convolution} 
          sections={sections} 
          updateCell={updateCell}
          />
      : <p>Select a cell</p>}
    </QueryClientProvider>
  )
}

export default App
