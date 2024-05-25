import { useState, useMemo } from 'react'
import './App.css'
import { CellManager } from './DataManager'
import { CellDisplay } from './CellDisplay'
import { SectionManager } from './SectionManager'
import { Navbar, NavbarBrand } from '@nextui-org/react'
import { findErrorsInSection, processCell } from './utils'
import { CellProperties } from './CellProperties'

function App() {
  const [convolution, setConvolution] = useState(1);
  const [samplingRate, setSamplingRate] = useState<number>(1.1);
  const [baselineSamples, setBaselineSamples] = useState(30);
  const [baselineEnabled, setBaselineEnabled] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedCell, setSelectedCell] = useState<Cell | undefined>()
  const [updateCell, setUpdateCell] = useState<(update: (c: Cell) => Cell) => void>(() => {})
  const [goPrevious, setGoPrevious] = useState<() => void>(() => {})
  const [goNext, setGoNext] = useState<() => void>(() => {})

  const processedCellData = useMemo(
    () => selectedCell ? processCell(selectedCell, baselineEnabled, baselineSamples, convolution, samplingRate) : [],
    [selectedCell, baselineEnabled, baselineSamples, convolution, samplingRate]
  );

  const validSections = useMemo(() => sections.filter(s => findErrorsInSection(s).length === 0), [sections]);

  return (
    <>
      <Navbar isBordered>
        <NavbarBrand>
          <p className="text-xl">Calcium Transient Business</p>
        </NavbarBrand>
      </Navbar>
      <div className="container mx-auto">
        <div className="flex flex-row flex-wrap py-4">
          <aside className="w-full sm:w-1/3 md:w-1/4 px-2">
            <div className="sticky top-0 p-4 w-full">
              <CellManager 
                setData={setSelectedCell} setUpdateCell={setUpdateCell} 
                sampleRate={samplingRate} setSampleRate={setSamplingRate}
                baselineSamples={baselineSamples} setBaselineSamples={setBaselineSamples}
                baselineEnabled={baselineEnabled} setBaselineEnabled={setBaselineEnabled}
                convolution={convolution}
                sections={validSections}
                setGoPrevious={setGoPrevious}
                setGoNext={setGoNext}
              />
            </div>
          </aside>
          <main role="main" className="w-full sm:w-2/3 md:w-3/4 pt-1 px-2">
            <CellDisplay 
              cell={selectedCell} 
              mappedData={processedCellData}
              samplingRate={1.1} 
              convolutionWidth={convolution} 
              sections={validSections} 
              updateCell={updateCell}
            />
            <div className="flex gap-5">
              <SectionManager sections={sections} setSections={setSections} sampleRate={samplingRate} />
              <CellProperties 
                cell={selectedCell} updateCell={updateCell} 
                convolution={convolution} setConvolution={setConvolution} 
                sections={sections} 
                mappedData={processedCellData} 
                goPrevious={goPrevious}
                goNext={goNext}
              />
            </div>
          </main>
        </div>
      </div>
      <div className="p-8 max-w-screen-xl m-auto">
      </div>
    </>
  )
}

export default App
