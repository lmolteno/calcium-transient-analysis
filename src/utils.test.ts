import { expect, test } from 'vitest'
import { calculatePeaks, filterPeaksToSection } from './utils';

test('peak calculation', () => {
  const testData: Datum[] = [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0], [5, 1]]
  expect(calculatePeaks(testData, 0.5)).toStrictEqual([{start: 0.5, end: 1.5, length: 1}, {
    start: 2.5,
    end: 3.5,
    length: 1
  }])
});

test('peak calculation with multiple points above peak', () => {
  const testData: Datum[] = [[0, 1], [1, 3], [2, 3], [3, 1], [4, 1], [5, 2]]
  expect(calculatePeaks(testData, 1.5)).toStrictEqual([{start: 0.25, end: 2.75, length: 2.5}])
});

test('peak calculation starting and ending above threhsold', () => {
  const testData: Datum[] = [[0, 2], [1, 1], [2, 1], [3, 1], [4, 1], [5, 2]]
  expect(calculatePeaks(testData, 1.5)).toStrictEqual([{start: 0, end: 0.5, length: 0.5}, { start: 4.5, end: 5, length: 0.5 }])
});

test('peak calculation starting and ending above threhsold after multiple points above', () => {
  const testData: Datum[] = [[0, 2], [1, 1], [2, 1], [3, 1], [4, 2], [5, 2]]
  expect(calculatePeaks(testData, 1.5)).toStrictEqual([{start: 0, end: 0.5, length: 0.5}, { start: 3.5, end: 5, length: 1.5 }])
});

test('funky data', () => {
  const testData: Datum[] = [
    [8.8, 0.9757259522012046],
    [9.9, 0.9155004412192704],
    [11.0, 1.6210810374770346],
    [12.1, 1.1598478939779144],
    [13.2, 0.901648191197142],
    [14.3, 0.9885145683271989]
  ];
  const peaks = calculatePeaks(testData, 1.4)
    console.log(peaks);
})

test('intersection filtering', () => {
  const peaks: Peak[] = [
    {start: -1.5, end: -0.5, length: 1},
    {start: 0.5, end: 1.5, length: 1},
    {start: 2.5, end: 3.5, length: 1},
    {start: 4.5, end: 5.5, length: 1},
  ];
  const section: Section = {name: 'bob', start: 0.7, end: 5, startString: '0.7', endString: '5'};
  expect(filterPeaksToSection(peaks, section)).toStrictEqual([
    {start: 0.7, end: 1.5, length: 0.8},
    {start: 2.5, end: 3.5, length: 1},
    {start: 4.5, end: 5, length: 0.5},
  ])
});

