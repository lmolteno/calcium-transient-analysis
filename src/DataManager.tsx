import { ChangeEventHandler, Dispatch, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Divider, Input, Radio, RadioGroup, Switch } from "@nextui-org/react";
import { exportCells, integrateSamples, processCell } from "./utils";
import { getSectionColour } from "./constants";

const notFloatRegex = /[^\d\.]/
const mod = (n: number, m: number) => (n % m + m) % m;

const parseCsv = (csv: string): Cell[] => {
  let records: Cell[] = []
  csv.split('\n').map(line => {
    const cells = line.split(',')

    // header row
    if (cells.some(cell => isNaN(cell as unknown as number)) && records.length == 0) {
      records = cells.map((c, idx) => ({ 
        id: idx, 
        name: c.length > 0 ? c : `Cell ${idx + 1}`, 
        data: [],
        baseline: 1,
        excluded: false
      }))
      return
    } else if (records.length == 0) {
      records = cells.map((_, idx) => ({ 
        id: idx, 
        name: `Cell ${idx + 1}`, 
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
  setGoPrevious: Dispatch<() => void>
  setGoNext: Dispatch<() => void>
}

export const CellManager = ({ 
  setData, setUpdateCell, 
  sampleRate, setSampleRate, 
  baselineSamples, setBaselineSamples, 
  baselineEnabled, setBaselineEnabled, 
  convolution, sections, 
  setGoNext, setGoPrevious }: CellManagerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [selectedCell, setSelectedCell] = useState<Cell | undefined>();
  const [cells, setCells] = useState<Cell[]>([]);
  const [sampleRateString, setSampleRateString] = useState(sampleRate.toString());
  const [sampleRateError, setSampleRateError] = useState("");
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

  const onCellSelect = useCallback((v: string) => {
    const selected = cells.find(c => `${c.id}` === v)
    const selectedIndex = cells.findIndex(c => `${c.id}` === v)
    if (selected && selectedIndex !== -1) {
      setSelectedCell(selected)
    }
  }, [setSelectedCell, cells, setGoPrevious, setGoNext])

  useEffect(() => {
    setGoPrevious(() => () => {
      const selectedIndex = orderedCells.findIndex(c => c.id === selectedCell?.id)
      setSelectedCell(orderedCells[mod((selectedIndex - 1), orderedCells.length)])
    });
    setGoNext(() => () => {
      const selectedIndex = orderedCells.findIndex(c => c.id === selectedCell?.id)
      setSelectedCell(orderedCells[(selectedIndex + 1) % orderedCells.length])
    });
  }, [selectedCell, setSelectedCell, setGoNext, setGoPrevious]);

  const cellsWithAreas = useQuery({
    queryKey: ['sectionsWithArea', baselineEnabled, baselineSamples, convolution, sampleRate, orderedCells, sections],
    queryFn: () => {
      return orderedCells
        .map(c => {
          const processed = processCell(c, baselineEnabled, baselineSamples, convolution, sampleRate)
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

  useEffect(() => {
    const parsedSampleRate = parseFloat(sampleRateString);
    if (isNaN(parsedSampleRate) || notFloatRegex.test(sampleRateString)) {
      setSampleRateError("enter a valid number");
      return;
    }
    if (parsedSampleRate <= 0) {
      setSampleRateError("enter a number above 0");
      return;
    }
    setSampleRate(parsedSampleRate);
    setSampleRateError("");
  }, [sampleRateString, setSampleRate])

  return (
    <div className="w-full">
      <div className="flex justify-between w-full items-center pb-3">
        slice upload
        <input className="hidden" type="file" ref={inputRef} onChange={onFileChange} />
        {/* @ts-ignore */}
        <Button onClick={() => inputRef.current?.click()} color="primary">select file</Button>
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
          label="sampling rate"
          isInvalid={sampleRateError !== ""}
          errorMessage={sampleRateError}
          value={sampleRateString}
          onValueChange={setSampleRateString} 
        />
      </div>
      <Divider />
        {!selectedFile && 
          <p className="text-content4 text-center py-3">select a file to continue</p>}
        {!!cells.length && 
        <>
          <RadioGroup 
            className="w-full pt-3"
            value={`${selectedCell?.id}`}
            onValueChange={onCellSelect}>
              <div className="flex flex-row gap-2 w-full pe-4 text-default-500">
                <p className="flex-grow">{selectedFile?.name}</p>
                {sections.map(s => <div className="w-16 flex-row flex items-center gap-2 justify-end"><p className="size-4 rounded-md" style={{ backgroundColor: getSectionColour(s.name) }}> </p><p className="text-default-500 text-right">{s.name}</p></div>)}
              </div>
              {orderedCells.map(c => {
                const cellWithArea = cellsWithAreas.data?.find(cwa => cwa.cell.id === c.id);
                const sections = cellWithArea?.sections ?? []
                return (
              <Radio
                key={c.id}
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
          <p className="text-default-500 text-right pe-4">Areas are in (Δf/f)·s</p>
          <Button className="w-full mt-3" color="primary" onPress={() => exportCells(selectedFile?.name ?? '', cellsWithAreas.data ?? [])}>export</Button>
        </>
        }
    </div>
  )
};
