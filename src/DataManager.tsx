import { ChangeEventHandler, Dispatch, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Divider, Input, Radio, RadioGroup, Switch } from "@nextui-org/react";
import { integrateSamples, processCell } from "./utils";

const parseCsv = (csv: string): Cell[] => {
  let records: Cell[] = []
  csv.split('\n').map(line => {
    const cells = line.split(',')

    // header row
    if (cells.some(cell => isNaN(cell as unknown as number)) && records.length == 0) {
      records = cells.map((c, idx) => ({ 
        id: idx, 
        name: c.length > 0 ? c : `Record ${idx + 1}`, 
        data: [],
        baseline: 1,
        excluded: false
      }))
      return
    } else if (records.length == 0) {
      records = cells.map((_, idx) => ({ 
        id: idx, 
        name: `Record ${idx + 1}`, 
        data: [], 
        baseline: 1,
        excluded: false
      }))
    }
    
    cells
      .filter(c => !isNaN(parseFloat(c)))
      .forEach((c, i) => records[i].data = [...records[i].data, parseFloat(c)])
  })
  return records
}

type CellUpdateFunc = (c: Cell) => Cell

interface CellManagerProps { 
  setData: (c: Cell | undefined) => void
  setUpdateCell: Dispatch<(update: CellUpdateFunc) => void>,
  setSampleRate: (sample: number) => void
  sampleRate: number
  setBaselineSamples: (sample: number) => void
  baselineSamples: number
  setBaselineEnabled: (disabled: boolean) => void
  baselineEnabled: boolean
  convolution: number
  sections: Section[]
}

export const CellManager = ({ setData, setUpdateCell, sampleRate, setSampleRate, baselineSamples, setBaselineSamples, baselineEnabled, setBaselineEnabled, convolution, sections }: CellManagerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [selectedCell, setSelectedCell] = useState<Cell | undefined>();
  const [cells, setCells] = useState<Cell[]>([]);

  const inputRef = useRef(null);

  const orderedCells = useMemo(() => [...cells].sort((a, b) => a.id - b.id), [cells]);

  useEffect(() => {
    setData(selectedCell)
    // @ts-ignore
    setUpdateCell((old) => {
      return (update: CellUpdateFunc) => {
        if (!selectedCell) {
          return
        }
        setCells(oldCells => [...oldCells.filter(c => c.id !== selectedCell?.id), update(selectedCell)])
        setSelectedCell(update(selectedCell))
      }
    });
  }, [selectedCell, setData]);

  const onFileChange: ChangeEventHandler<HTMLInputElement> = useCallback(e => {
    if (e.target.files?.length === 1) {
      setSelectedFile(e.target.files[0])
    }
  }, [setSelectedFile])

  const cellQuery = useQuery<Cell[]>({ 
    queryKey: ['read-file', selectedFile?.name], 
    queryFn: () => new Promise((res, rej) => {
      if (!selectedFile) {
        res([])
        return
      }
      const reader = new FileReader()
      reader.readAsText(selectedFile)
      reader.onload = () => {
        res(parseCsv(reader.result as string))
      }
      reader.onerror = (ev) => {
        rej(ev)
      }
    })
  });

  useEffect(() => {
    const newCells = cellQuery.data ?? []
    setCells(newCells)
    if (newCells.length > 0) {
      setSelectedCell(newCells[0])
    }
  }, [setCells, cellQuery.data]);

  const onCellSelect  = useCallback((v: string) => {
    const selected = cells.find(c => `${c.id}` === v)
    if (selected) {
      setSelectedCell(selected)
    }
  }, [setSelectedCell, cells])

  const cellsWithAreas = useQuery({
    queryKey: 
      ['sectionsWithArea', baselineEnabled, baselineSamples, convolution, sampleRate, cells, sections],
    queryFn: () => {
      return cells
        .map(c => {
          const processed = processCell(c, baselineEnabled, baselineSamples, convolution, sampleRate)
          console.log(baselineEnabled, baselineSamples, convolution, sampleRate)
          return {
            cell: c, 
            sections: sections.map(s => {
            const samples = processed.filter(d => d[0] <= s.end && d[0] >= s.start)
            return {...s, area: integrateSamples(samples, c.baseline)}
          })
         }
        });
    }
  })
  console.log(cellsWithAreas.data)

  return (
    <div className="w-full">
      <div className="flex justify-between w-full items-center pb-3">
        Slice Upload
        <input className="hidden" type="file" ref={inputRef} onChange={onFileChange} />
        <Button onClick={() => inputRef.current?.click()}>select file</Button>
      </div>
      <Divider />
      <div className="py-4 grid grid-cols-2 gap-4">
        <Input
          type="number" 
          label="samples for baseline"
          min={1}
          value={baselineSamples.toString()}
          disabled={!baselineEnabled}
          onValueChange={v => !isNaN(parseInt(v)) ? setBaselineSamples(parseInt(v)) : {} } 
        />
        <Switch isSelected={baselineEnabled} onValueChange={setBaselineEnabled}>calculate baseline</Switch>
        <Input
          className="col-span-2"
          type="number" 
          label="sampling rate"
          value={sampleRate.toString()}
          onValueChange={v => !isNaN(parseFloat(v)) && parseFloat(v) > 0 ? setSampleRate(parseFloat(v)) : {} } 
        />
      </div>
      <Divider />
        {!selectedFile && 
          <p className="text-content4 text-center py-3">Select a file to continue</p>}
        {!!cells.length && 
          <RadioGroup 
            className="w-full pt-3"
            value={`${selectedCell?.id}`}
            onValueChange={onCellSelect}>
              <div className="flex flex-row gap-2 w-full pe-4 text-default-500">
                <p className="flex-grow">{selectedFile?.name}</p>
                {sections.map(s => <p className="w-16 text-default-500 text-right">{s.name}</p>)}
              </div>
              {orderedCells.map(c => {
                const cellWithArea = cellsWithAreas.data?.find(cwa => cwa.cell.id === c.id);
                const sections = cellWithArea?.sections ?? []
                return (
              <Radio
                classNames={{
                  base: "w-full max-w-none",
                  labelWrapper: "w-full",
                  label: "w-full justify-end"
                }} 
                value={`${c.id}`}>
                  <div className={"flex flex-row gap-2 justify-end w-full" + (c.excluded ? " text-default-500" : '')}>
                    <p className="flex-grow">{c.name}</p>
                    {sections.map(s => <p className={"w-16 text-right" + (c.excluded ? " line-through" : '')}>{s.area.toFixed(2)}</p>)}
                  </div>
               </Radio>)
                }
              )}
          </RadioGroup>
        }
    </div>
  )
};
