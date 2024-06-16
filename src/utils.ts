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

export const formatSeconds = (seconds: number, decimalPrecision = 0) => {
  const minutes = Math.floor(seconds / 60)
  const leftOverSeconds = seconds - (minutes * 60)
  return [String(minutes), String(leftOverSeconds.toFixed(decimalPrecision)).padStart(2, '0')].filter(d => d).join(":")
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
  sections: (Section & { area: number, totalPeakTime: number, proportionPeakTime: number })[]
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
    + `"Cell Name","${sectionNames.flatMap(n => [`${n} area`, `${n} peak time`, `${n} peak proportion`]).join('","')}"\n`
    + filteredSections.map(c => [c.cell.name, ...c.sections.flatMap(s => [s.area.toString(), s.totalPeakTime.toString(), s.proportionPeakTime.toString()])].join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", updateFilename(filename));

  document.body.appendChild(link); // Required for FF
  
  link.click();
}

const lerp = (a: number, b: number, alpha: number) => a + alpha * (b - a);


export const calculatePeaks = (data: Datum[], threshold = 1): Peak[] => data.reduce((accumulator, current, idx, arr) => {
  if (idx == 0) { return accumulator; }
  const previous = arr[idx - 1];
  if (previous[1] < threshold && current[1] > threshold) {
    return [...accumulator, { start: lerp(previous[0], current[0], current[1] - threshold), end: -1, length: 0 }];
  } else if (previous[1] > threshold && current[1] < threshold) {
    const currentIntersection = accumulator[accumulator.length - 1]
    if (currentIntersection) {
      const end = lerp(current[0], previous[0], previous[1] - threshold)
      return [...accumulator.slice(0, -1), { ...currentIntersection, end, length: end - currentIntersection.start }];
    }
  }
  return accumulator
}, [] as Peak[]).filter(p => p.end !== -1);

export const filterPeaksToSection = (peaks: Peak[], section: Section) => peaks.flatMap(p => {
  const startIncluded = p.start >= section.start && p.start <= section.end;
  const endIncluded = p.end <= section.end && p.end >= section.start;

  if (endIncluded && startIncluded) return [p];
  if (!endIncluded && startIncluded) return [{ ...p, end: section.end, length: section.end - p.start }];
  if (endIncluded && !startIncluded) return [{ ...p, start: section.start, length: p.end - section.start }];
  return []
});