import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { useSize } from "ahooks";
import { formatSeconds } from "../utils";
import { generateTickValues } from "./LineChart";

export type Datum = [number, number];
const margin = { top: 10, right: 30, bottom: 10, left: 40 };

interface BrushProps { 
  data: Datum[], 
  baseline: number, 
  setExtent: (r?: [number, number]) => void,
  setResetFunc: (reset: () => void) => void
}

const Brush = ({ data, baseline, setExtent, setResetFunc } : BrushProps) => {
  const containerRef = useRef<HTMLDivElement>();
  const size = useSize(containerRef);
  
  useEffect(() => {
    if (!size) {
      return
    }

    const width = size.width - (margin.left + margin.right);
    const height = size.height - (margin.top + margin.bottom) - 10;

    const svg = d3.select("#brushChart")
      .attr("width", size.width)
      .attr("height", size.height - 10)

    const xs = data.map(d => d[0])
    const ys = data.map(d => d[1])
    const xExtent = [d3.min(xs)!, d3.max(xs)!]
    const x = d3.scaleLinear()
      .domain(xExtent)
      .range([margin.left, width + margin.left]);

    const y = d3.scaleLinear()
      .domain([d3.min(ys)!, d3.max(ys)!])
      .range([height, margin.bottom]);

    // @ts-ignore
    const onBrushed = ({ selection }) => {
      setExtent(selection?.map(x.invert, x));
     };

    svg.select(".axisBottom")
      .attr("transform", `translate(0, ${height})`)
      // @ts-ignore
      .call(d3.axisBottom(x).tickValues(generateTickValues(xExtent)).tickFormat(formatSeconds));

    svg.select(".area")
      .attr("d", d3.area()
        .x(d => x(d[0]))
        .y1(d => y(d[1]))
        .y0(y(d3.min(ys)!))(data)
      );

      const brush = d3.brushX()
          .extent([[margin.left, margin.top], [size.width - margin.right, height]])
          .on("brush", onBrushed);

      svg.select(".brush")
        // @ts-ignore
        .call(brush);

    setResetFunc(() => () => {
      svg.select(".brush")
        // @ts-ignore
        .call(brush.clear);
    });
  }, [data, size, baseline])

  return (
    // @ts-ignore
    <div className="size-full" ref={containerRef}>
      <svg id="brushChart">
        <path className="area" fill="#69b3a23f" stroke="#69b3a2"></path>
        <g className="brush"></g>
        <g className="axisBottom"></g>
      </svg>
    </div>
  );
};

export default Brush;
