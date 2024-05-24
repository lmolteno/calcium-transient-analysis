import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { useSize } from "ahooks";
import { formatSeconds } from "../utils";
import { getSectionColour, section4ap, section4apColour, sectionAcsf, sectionAcsfColour } from "../constants";

export type Datum = [number, number];
const margin = { top: 20, right: 30, bottom: 30, left: 40 };

interface LineChartProps { 
  data: Datum[], 
  sections: Section[]
  baseline: number, 
  setBaseline: (bl: number) => void,
  extent: [number, number] | undefined,
}

export const generateTickValues = (extent: [number, number]) => {
  const rawTicks = () => {
    const minutesInRange = (extent[1] - extent[0]) / 60
    if (minutesInRange > 16) {
      return Array.from(Array(Math.ceil(minutesInRange / 2) + 1)).map((_, i) => (extent[0] - (extent[0] % 120)) + i * 120)
    }
    if (minutesInRange > 8) {
      return Array.from(Array(Math.ceil(minutesInRange) + 1)).map((_, i) => (extent[0] - (extent[0] % 60)) + i * 60)
    }
    if (minutesInRange > 4) {
      return Array.from(Array(Math.ceil(minutesInRange * 2) + 1)).map((_, i) => (extent[0] - (extent[0] % 30)) + i * 30)
    }
    return Array.from(Array(Math.ceil(minutesInRange * 4) + 1)).map((_, i) => (extent[0] - (extent[0] % 15)) + i * 15)
  }
  return rawTicks().filter(t => extent[0] <= t && extent[1] >= t)
}

const LineChart = ({ data, setBaseline, baseline, extent, sections } : LineChartProps) => {
  const containerRef = useRef<HTMLDivElement>();
  const size = useSize(containerRef);
  
  useEffect(() => {
    if (!size) {
      return
    }

    const filteredData = data.filter(d => !extent || (extent[0] <= d[0] && d[0] <= extent[1]));

    const width = size.width - (margin.left + margin.right);
    const height = size.height - (margin.top + margin.bottom) - 10;

    const svg = d3.select("#lineChart")
      .attr("width", size.width)
      .attr("height", size.height - 10)


    const xs = filteredData.map(d => d[0])
    const ys = filteredData.map(d => d[1])

    const xExtent = [d3.min(xs)!, d3.max(xs)!] as [number, number]
    const x = d3.scaleLinear()
      .domain(xExtent)
      .range([margin.left, width + margin.left]);

    const y = d3.scaleLinear()
      .domain([d3.min(ys)!, d3.max(ys)!])
      .range([height + margin.top, margin.top]);

    svg.select(".axisBottom")
      .attr("transform", `translate(0, ${height + margin.top})`)
      // @ts-ignore
      .call(d3.axisBottom(x).tickValues(generateTickValues(xExtent)).tickFormat(formatSeconds));

    svg.select(".axisLeft")
      .attr("transform", `translate(${margin.left}, 0)`)
      // @ts-ignore
      .call(d3.axisLeft(y));

    svg.select(".area")
      .attr("d", d3.area()
        .x(d => x(d[0]))
        .y1(d => Math.min(y(baseline), y(d[1])))
        .y0(y(baseline))(filteredData)
      );

    svg.select(".baseline-drag")
      .attr('x', margin.left)
      .attr('width', width)
      .attr('y',  y(baseline) - 2.5)
      .attr('height', 5)
      // @ts-ignore
      .call(d3.drag().on('drag', (e) => setBaseline(y.invert(e.y))))

    svg.select(".dots")
      .selectAll(".dot")
      .data(filteredData)
      .join("circle")
        .classed('dot', true)
        .attr("cx", d => x(d[0]) )
        .attr("cy", d => y(d[1]) )
        .attr("r", 2)
        .attr("fill", "#69b3a2");

    svg.select(".sections")
      .selectAll(".section")
      // @ts-ignore
      .data(sections, (d: Section) => d.name)
      .join("rect")
        .classed("section", true)
        .attr("fill", d => getSectionColour(d.name))
        .attr("x", d => Math.max(margin.left, x(d.start)))
        .attr("y", margin.top)
        .attr("width", d => Math.min(x(d.end), size.width - margin.right) - Math.max(margin.left, x(d.start)))
        .attr("height", height);
  }, [data, size, baseline, extent, sections, setBaseline])

  return (
    <div className="h-full w-full" ref={containerRef}>
      <svg id="lineChart">
        <g className="sections" opacity={0.5}></g>
        <g className="dots"></g>
        <path className="area" fill="#69b3a23f" stroke="#69b3a2"></path>
        <rect className="baseline-drag cursor-n-resize" opacity={0}></rect>
        <g className="axisBottom"></g>
        <g className="axisLeft"></g>
      </svg>
    </div>
  );
};

export default LineChart;
