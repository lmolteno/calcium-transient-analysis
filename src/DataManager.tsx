import { ChangeEventHandler, Dispatch, useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

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

  useEffect(() => setCells(cellQuery.data ?? []), [setCells, cellQuery.data]);

  const onCellSelect: ChangeEventHandler<HTMLInputElement> = useCallback(e => {
    if (e.target?.value) {
      const selected = cells.find(c => `${c.id}` === e.target.value)
      if (selected) {
        setSelectedCell(selected)
      }
    }
  }, [setSelectedCell, cells])

  return (
    <div className="flex flex-col">
      <div className="border p-3">
        <input type="file" onChange={onFileChange}/>
      </div>
      <div className="border p-3">
        {!cellQuery.data 
          ? <p>Loading...</p> 
          : <div className="flex flex-col" onChange={onCellSelect}>
            {cellQuery.data.map(c => (
            <div className="flex justify-between">
              <p>{c.name}</p>
              <input type="radio" id={`cell-${c.id}`} name="selectedCell" value={`${c.id}`} />
            </div>))}
          </div>}
      </div>
    </div>
  )
};
