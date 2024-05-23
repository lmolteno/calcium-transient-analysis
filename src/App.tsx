import { useState, useMemo } from 'react'
import './App.css'
import { CellManager } from './DataManager'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { CellDisplay } from './CellDisplay'
import { SectionManager } from './SectionManager'
import { Input, Navbar, NavbarBrand, Slider } from '@nextui-org/react'
import { calculateBaseline, convolveData } from './utils'
import { CellProperties } from './CellProperties'

function App() {
  const [convolution, setConvolution] = useState(1);
  const [samplingRate, setSamplingRate] = useState(1.1);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedCell, setSelectedCell] = useState<Cell | undefined>()
  const [updateCell, setUpdateCell] = useState<(update: (c: Cell) => Cell) => void>(() => {})

  const baselined = useMemo(
    () => calculateBaseline(selectedCell?.data.map((d, i) => [i, d] as Datum) ?? [], 30),
    [selectedCell?.data]
  );

  const convolved = useMemo(
    () => convolveData(baselined, convolution, 1), 
    [baselined, convolution]
  );

  const withTime = useMemo(
    () => convolved.map(d => [d[0] * samplingRate, d[1]] as Datum),
    [convolved, samplingRate]
  );

  return (
    <>
      <Navbar isBordered>
        <NavbarBrand>
          <p className="text-xl">Calcium Transient Business</p>
        </NavbarBrand>
      </Navbar>
      <div className="p-8 max-w-screen-xl m-auto">
        <CellDisplay 
          cell={selectedCell} 
          mappedData={withTime}
          samplingRate={1.1} 
          convolutionWidth={convolution} 
          sections={sections} 
          updateCell={updateCell}
        />
        <div className="flex gap-5">
          <CellManager setData={setSelectedCell} setUpdateCell={setUpdateCell} />
          <SectionManager sections={sections} setSections={setSections} />
          <CellProperties cell={selectedCell} convolution={convolution} setConvolution={setConvolution} sections={sections} mappedData={withTime} />
        </div>
      </div>
    </>
  )
}

export default App
