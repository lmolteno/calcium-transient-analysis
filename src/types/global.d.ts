interface Cell {
  id: number,
  name: string,
  data: number[],
  baseline: number,
  excluded: boolean
}

interface Section {
  name: string
  start: number
  end: number
}

type Datum = [number, number]
