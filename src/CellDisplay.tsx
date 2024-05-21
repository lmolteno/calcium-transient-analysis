import { useState, useMemo, useCallback } from "react"
import LineChart from "./charts/LineChart"
import BrushChart from "./charts/Brush"
import { calculateBaseline, convolveData, integrateSamples } from "./utils";

interface CellDisplayProps { 
  cell: Cell, 
  updateCell: (updateFunc: (c: Cell) => Cell) => void
  samplingRate?: number,
  convolutionWidth?: number,
  sections?: Section[]
}

export const CellDisplay = ({ 
  cell, 
  updateCell,
  samplingRate = 1.1,
  convolutionWidth = 1,
  sections = [],
}: CellDisplayProps) => {
  const [extent, setExtent] = useState<[number, number] | undefined>();
  const [reset, setResetFunc] = useState<() => void>();

  const baselined = useMemo(
    () => calculateBaseline(cell.data.map((d, i) => [i, d] as Datum), 30),
    [cell.data]
  );

  const convolved = useMemo(
    () => convolveData(baselined, convolutionWidth, 1), 
    [baselined, convolutionWidth]
  );

  const withTime = useMemo(
    () => convolved.map(d => [d[0] * samplingRate, d[1]] as Datum),
    [convolved, samplingRate]
  );

  const updateBaseline = useCallback((bl: number) => {
    updateCell(c => ({...c, baseline: bl}))
  }, [updateCell]);

  const sectionsWithArea = useMemo(() => {
    return sections.map(s => {
      const samples = withTime.filter(d => d[0] <= s.end && d[0] >= s.start)
      return {...s, area: integrateSamples(samples, cell.baseline)}
    })
  }, [sections, withTime, cell.baseline])
  
  return (
    <div>
      <div className="h-96">
        <LineChart data={withTime} setBaseline={updateBaseline} baseline={cell.baseline} extent={extent} sections={sections} />
      </div>
      <div className="h-24">
        <BrushChart data={withTime} baseline={cell.baseline} setExtent={setExtent} setResetFunc={setResetFunc} />
      </div>
      <button onClick={reset} disabled={extent === undefined}>Reset Zoom</button>
      <p>Baseline: {cell.baseline.toFixed(2)}</p>
      {sectionsWithArea.map(s => <p>{s.name}: {s.area}</p>)}
    </div>
  )
}
