interface Cell {
  id: number,
  name: string,
  data: number[],
  baseline: number,
  peakThreshold: number,
  excluded: boolean
}

interface Section {
  name: string
  start: number
  end: number
  startString: string
  endString: string
  startSampleString?: string
  endSampleString?: string
}

type Datum = [number, number]
