import { convolve } from './utils/convolve'

// samples the first `baselineSample` points - to calculate the baseline (denominator of result)
export const calculateBaseline = (data: Datum[], samples: number): Datum[] => {
  const baselineSample = data.slice(0, samples).map(d => d[1])
  const baseline = baselineSample.reduce((d, i) => i + d, 0) / samples
  return data.map(d => [d[0], d[1] / baseline] as Datum)
};

export const convolveData = (data: Datum[], convolution: number, offset: number): Datum[] => {
  const window = Array.from(Array(convolution)).map(() => 1 / convolution);
  return convolve(
    data
      .map(d => d[1] - offset), window)
      .map((d, i) => [i, d + offset] as Datum)
};

export const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const leftOverSeconds = seconds - (minutes * 60)
  return [String(minutes), String(leftOverSeconds.toFixed(2)).padStart(2, '0')].filter(d => d).join(":")
}

// returns area in units of yx - i.e. expects samples to be in time-domain
export const integrateSamples = (samples: Datum[], baseline: number) => {
  return samples
    .map(d => [d[0], Math.max(0, d[1] - baseline)])
    .reduce((acc, curr, idx, arr) => {
      const next = idx < arr.length ? arr[idx + 1] : undefined
      if (!next) return acc;
      return acc + (next[0] - curr[0]) * ((curr[1] + next[1]) / 2)
    }, 0)
};

export const processCell = (cell: Cell, baselineAdjust: boolean, baselineSamples: number, convolution: number, samplingRate: number) => {
  const data = cell.data.map((d, i) => [i, d] as Datum);
  const baselined = baselineAdjust ? calculateBaseline(data, baselineSamples) : data

  const convolved = convolveData(baselined, convolution, 1)
  return convolved.map(d => [d[0] * samplingRate, d[1]] as Datum)
}
  

export const findErrorsInSection = (section: Partial<Section>): string[] => {
  let errors: string[] = []
  if (section.end == undefined) {
    errors = [...errors, 'end must be specified']
  }
  if (section.start == undefined) {
    errors = [...errors, 'start must be specified']
  }
  if (section.start && section.end && section.start >= section.end) {
    errors = [...errors, 'start must be before end']
  }
  return errors
}

interface CellAndSections {
  cell: Cell
  sections: (Section & { area: number })[]
}

const updateFilename = (filename: string): string => {
  return filename.replace('.csv', '') + '_processed.csv'
}

export const exportCells = (filename: string, cellsAndSections: CellAndSections[]) => {
  const filteredSections = cellsAndSections.filter(c => !c.cell.excluded)
  if (filteredSections.length === 0) {
    return
  }
  const sectionNames = filteredSections[0].sections.map(s => s.name)
  const csvContent = "data:text/csv;charset=utf-8,"
    + `"Cell Name","${sectionNames.join('","')}"\n`
    + filteredSections.map(c => [c.cell.name, ...c.sections.map(s => s.area.toString())].join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  window.open(encodedUri);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", updateFilename(filename));
  document.body.appendChild(link); // Required for FF
  
  link.click(); // This will download the data file named "my_data.csv".
}
