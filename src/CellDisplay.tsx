import { useState, useMemo, useCallback } from "react"
import LineChart from "./charts/LineChart"
import BrushChart from "./charts/Brush"
import { Button, Card, Divider } from "@nextui-org/react";

interface CellDisplayProps { 
  cell?: Cell, 
  mappedData?: Datum[]
  updateCell: (updateFunc: (c: Cell) => Cell) => void
  samplingRate?: number,
  convolutionWidth?: number,
  sections?: Section[]
}

export const CellDisplay = ({ 
  cell, 
  updateCell,
  mappedData,
  sections = [],
}: CellDisplayProps) => {
  const [extent, setExtent] = useState<[number, number] | undefined>();
  const [reset, setResetFunc] = useState<() => void>();

  const updateBaseline = useCallback((bl: number) => {
    updateCell(c => ({...c, baseline: bl}))
  }, [updateCell]);
  
  return (
    <div>
      <Card>
        <div className="h-96 flex justify-center">
          {mappedData && cell
            ? <LineChart data={mappedData} setBaseline={updateBaseline} baseline={cell.baseline} extent={extent} sections={sections} />
            : <p className="my-auto text-content4">Select a cell</p>}
        </div>
        <Divider />
        <div className="h-24 flex justify-center">
          {mappedData && cell
            ? <BrushChart data={mappedData} baseline={cell.baseline} setExtent={setExtent} setResetFunc={setResetFunc} />
            : <p className="my-auto text-content4">Select a cell</p>}
        </div>
      </Card>
      <Button onClick={reset} disabled={extent === undefined}>
        Reset Zoom
      </Button>
    </div>
  )
}