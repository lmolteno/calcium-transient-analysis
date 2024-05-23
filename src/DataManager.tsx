import { ChangeEventHandler, Dispatch, useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardBody, CardHeader, Divider, Radio, RadioGroup } from "@nextui-org/react";

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
        baseline: 1
      }))
      return
    } else if (records.length == 0) {
      records = cells.map((_, idx) => ({ 
        id: idx, 
        name: `Record ${idx + 1}`, 
        data: [], 
        baseline: 1 
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
  setUpdateCell: Dispatch<(update: CellUpdateFunc) => void>
}

export const CellManager = ({ setData, setUpdateCell }: CellManagerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [selectedCell, setSelectedCell] = useState<Cell | undefined>();
  const [cells, setCells] = useState<Cell[]>([]);
  const inputRef = useRef(null);

  useEffect(() => {
    setData(selectedCell)
    // @ts-ignore
    setUpdateCell((old) => {
      return (update: CellUpdateFunc) => {
        if (!selectedCell) {
          return
        }
        console.log('updating cell to', update(selectedCell))
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

  return (
    <div className="w-4/12">
      <h1 className="py-3 text-center">Slice</h1>
      <Divider />
      <div className="flex justify-between w-full items-center py-4">
        Cell selection
        <input className="hidden" type="file" ref={inputRef} onChange={onFileChange} />
        <Button onClick={() => inputRef.current?.click()}>Select File</Button>
      </div>
      <Divider />
        {!selectedFile && 
          <p className="text-content4 text-center py-3">Select a file to continue</p>}
        {!!cells.length && 
          <RadioGroup 
            label={`Select cell from ${selectedFile?.name}`} 
            value={`${selectedCell?.id}`}
            onValueChange={onCellSelect}>
              {cells.map(c => (<Radio value={`${c.id}`}>{c.name}</Radio>))}
          </RadioGroup>
        }
    </div>
  )
};
