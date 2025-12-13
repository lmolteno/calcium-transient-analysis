export const processCell = (
  cell: Cell,
  baselineAdjust: boolean,
  baselineSamples: number,
  convolution: number,
  samplingRate: number
): Datum[] => {
  const rawData = cell.data; // Assuming this is number[]
  const len = rawData.length;

  // 1. Calculate Baseline (Scalar)
  // No arrays created, just a simple loop sum.
  let baselineDenominator = 1;

  if (baselineAdjust && len > 0) {
    let sum = 0;
    // Cap samples at array length to avoid out-of-bounds
    const limit = Math.min(len, baselineSamples);

    for (let i = 0; i < limit; i++) {
      sum += rawData[i];
    }
    // If we have 0 samples, avoid divide by zero (though len > 0 checks this)
    baselineDenominator = limit > 0 ? sum / limit : 1;
  }

  // 2. Sliding Window Convolution (The "Boxcar" Filter)
  // We compute the average in a single pass O(N) instead of O(N * WindowSize)

  const result = new Array(len); // Pre-allocate the result array for performance
  let currentWindowSum = 0;

  // To match standard convolution behavior (same length), we need to handle the start.
  // This implementation assumes a "Trailing Window" (average of previous N points).
  // If you need "Centered", you shift the read/write indices by convolution / 2.

  for (let i = 0; i < len; i++) {
    // A. Apply Baseline Adjustment on the fly
    const val = rawData[i] / baselineDenominator;

    // B. Add new value to window
    currentWindowSum += val;

    // C. Subtract old value that fell out of the window
    if (i >= convolution) {
      const oldVal = rawData[i - convolution] / baselineDenominator;
      currentWindowSum -= oldVal;
    }

    // D. Calculate Average
    // For the first few items (ramp up), we average by (i + 1)
    // Once window is full, we average by `convolution`
    const count = Math.min(i + 1, convolution);
    const average = currentWindowSum / count;

    // E. Construct Final Datum directly
    // [Time, Value]
    result[i] = [i * samplingRate, average];
  }

  return result;
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
  sections: (Section & { area: number, peaks: number, totalPeakTime: number, proportionPeakTime: number })[]
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
    + `"Cell Name","${sectionNames.flatMap(n => [`${n} area`, `${n} peaks`, `${n} peak time`, `${n} peak proportion`]).join('","')}"\n`
    + filteredSections.map(c => [
      c.cell.name, 
      ...c.sections.flatMap(s => 
        [s.area.toString(), s.peaks.toString(), s.totalPeakTime.toString(), s.proportionPeakTime.toString()]
      )].join(","))
      .join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", updateFilename(filename));

  document.body.appendChild(link);
  
  link.click();
}

// Calculates x where y crosses the threshold between (x1,y1) and (x2,y2)
const getIntersectionX = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold: number
): number => {
  return x1 + (x2 - x1) * ((threshold - y1) / (y2 - y1));
};

export const calculatePeaks = (data: Datum[], threshold = 1): Peak[] => {
  const peaks: Peak[] = [];
  const len = data.length;

  if (len === 0) return peaks;

  // 1. Handle the start (Index 0)
  // If the first point is already above threshold, we start a peak immediately.
  if (data[0][1] > threshold) {
    peaks.push({ start: data[0][0], end: -1, length: 0 });
  }

  // 2. Iterate through the data (starting from index 1)
  for (let i = 1; i < len; i++) {
    const prev = data[i - 1];
    const curr = data[i];

    const prevX = prev[0];
    const prevY = prev[1];
    const currX = curr[0];
    const currY = curr[1];

    // Rising Edge: We crossed from below to above
    if (prevY < threshold && currY > threshold) {
      const intersection = getIntersectionX(prevX, prevY, currX, currY, threshold);
      peaks.push({ start: intersection, end: -1, length: 0 });
    }

    // Falling Edge: We crossed from above to below
    else if (prevY > threshold && currY < threshold) {
      const lastPeak = peaks[peaks.length - 1];
      if (lastPeak && lastPeak.end === -1) { // Ensure we have an open peak
        const intersection = getIntersectionX(prevX, prevY, currX, currY, threshold);

        // Mutate the existing object instead of slicing/copying array
        lastPeak.end = intersection;
        lastPeak.length = intersection - lastPeak.start;
      }
    }
  }

  // 3. Handle the end (Last Index)
  // If we are still "inside" a peak at the end of the data, clamp it to the last x value.
  const lastPeak = peaks[peaks.length - 1];
  if (lastPeak && lastPeak.end === -1) {
    const lastX = data[len - 1][0];
    lastPeak.end = lastX;
    lastPeak.length = lastX - lastPeak.start;
  }

  return peaks;
};

export const filterPeaksToSection = (peaks: Peak[], section: Section) => peaks.flatMap(p => {
  const startIncluded = p.start >= section.start && p.start <= section.end;
  const endIncluded = p.end <= section.end && p.end >= section.start;

  if (endIncluded && startIncluded) return [p];
  if (!endIncluded && startIncluded) return [{ ...p, end: section.end, length: section.end - p.start }];
  if (endIncluded && !startIncluded) return [{ ...p, start: section.start, length: p.end - section.start }];
  return []
});