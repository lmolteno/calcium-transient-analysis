import { Divider, Slider, Checkbox } from "@nextui-org/react";
import { integrateSamples } from "./utils";
import { useCallback, useMemo } from "react";

interface CellPropertiesProps {
  cell?: Cell;
  convolution: number;
  setConvolution: (conv: number) => void;
  updateCell: (updateFunc: (c: Cell) => Cell) => void
  sections: Section[];
  mappedData: Datum[];
}

export const CellProperties = ({ cell, updateCell, convolution, setConvolution, sections, mappedData }: CellPropertiesProps) => {
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
      <h1 className="py-3 text-center">Cell</h1>
      <Divider />
      { cell ?
      <div className="py-3">
      {false && 
        <Slider
          label="Convolution width" 
          value={convolution} 
          minValue={1} 
          step={2}
          maxValue={99} 
          onChange={e => setConvolution(e as number)}
        />}
        <Slider
          label="Baseline" 
          value={cell?.baseline} 
          marks={[{ value: 1, label: '1' }]}
          minValue={0} 
          step={0.01}
          maxValue={2} 
          onChange={e => updateBaseline(e as number)}
        />
        <Checkbox isSelected={cell.excluded} onValueChange={updateExcluded}>Excluded</Checkbox>
        {
          sectionsWithArea.map(s => <p>{s.name}: {s.area}</p>)
        }
      </div>
      : <p className="text-content4 text-center py-3">Select a cell to continue</p>
      }
    </div>
  );
};
