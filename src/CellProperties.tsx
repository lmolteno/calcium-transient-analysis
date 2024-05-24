import { Divider, Slider, Checkbox, Button } from "@nextui-org/react";
import { integrateSamples } from "./utils";
import { useCallback, useMemo } from "react";
import leftChevron from "./assets/left.svg?raw"
import rightChevron from "./assets/right.svg?raw"
import { getSectionColour } from "./constants";

interface CellPropertiesProps {
  cell?: Cell;
  convolution: number;
  setConvolution: (conv: number) => void;
  updateCell: (updateFunc: (c: Cell) => Cell) => void
  sections: Section[];
  mappedData: Datum[];
  goPrevious: () => void;
  goNext: () => void;
}

export const CellProperties = ({ cell, updateCell, convolution, setConvolution, sections, mappedData, goPrevious, goNext }: CellPropertiesProps) => {
  const sectionsWithArea = useMemo(() => {
    return sections.map(s => {
      const samples = (mappedData ?? []).filter(d => d[0] <= s.end && d[0] >= s.start)
      return {...s, area: integrateSamples(samples, cell?.baseline ?? 1)}
    })
  }, [sections, mappedData, cell?.baseline])

  const updateBaseline = useCallback((bl: number) => {
    updateCell(c => ({...c, baseline: bl}))
  }, [updateCell]);

  const updateExcluded = useCallback((excluded: boolean) => {
    updateCell(c => ({...c, excluded }))
  }, [updateCell]);

  return (
    <div className="w-6/12">
      <h1 className="py-3 text-center">cell</h1>
      <Divider />
      { cell ?
      <div className="py-3 grid grid-cols-1 gap-3">
      {false && 
        <Slider
          label="Convolution width" 
          value={convolution} 
          minValue={1} 
          step={2}
          maxValue={99} 
          onChange={e => setConvolution(e as number)}
        />}
        <div className="grid grid-cols-2 gap-3">
          {
            sectionsWithArea.map(s => <div className="py-3 flex flex-row items-center gap-2"><p className="size-4 rounded-md" style={{ backgroundColor: getSectionColour(s.name) }}></p><p><strong>{s.name}</strong>: {s.area.toFixed(3)}</p></div>)
          }
        </div>
        <Slider
          label="baseline" 
          value={cell?.baseline} 
          marks={[{ value: 0, label: '0' }, { value: 1, label: '1' }, { value: 2, label: '2' }]}
          minValue={0} 
          step={0.01}
          maxValue={2} 
          onChange={e => updateBaseline(e as number)}
        />
        <Checkbox isSelected={cell.excluded} onValueChange={updateExcluded}>Excluded</Checkbox>
        <div className="grid grid-cols-2 gap-3">
          <Button color="primary" onPress={goPrevious} startContent={<span className="stroke-white" dangerouslySetInnerHTML={{ __html: leftChevron }}></span>}>previous</Button>
          <Button color="primary" onPress={goNext} endContent={<span className="stroke-white" dangerouslySetInnerHTML={{ __html: rightChevron }}></span>}>next</Button>
        </div>
      </div>
      : <p className="text-content4 text-center py-3">select a cell to continue</p>
      }
    </div>
  );
};
