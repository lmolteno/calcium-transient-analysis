interface Cell {
  id: number,
  name: string,
  data: number[],
  baseline: number
}

interface Section {
  name: string
  start: number
  end: number
}

type Datum = [number, number]
