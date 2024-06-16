import { expect, test } from 'vitest'
import { calculatePeaks, filterPeaksToSection } from './utils';

test('peak calculation', () => {
    const testData: Datum[] = [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0], [5, 1]]
    expect(calculatePeaks(testData, 0.5)).toStrictEqual([{ start: 0.5, end: 1.5, length: 1 }, { start: 2.5, end: 3.5, length: 1 }])
});

test('intersection filtering', () => {
    const peaks: Peak[] = [
        { start: -1.5, end: -0.5, length: 1 },
        { start: 0.5, end: 1.5, length: 1 },
        { start: 2.5, end: 3.5, length: 1 },
        { start: 4.5, end: 5.5, length: 1 },
    ];
    const section: Section = { name: 'bob', start: 0.7, end: 5, startString: '0.7', endString: '5' };
    expect(filterPeaksToSection(peaks, section)).toStrictEqual([
        { start: 0.7, end: 1.5, length: 0.8 },
        { start: 2.5, end: 3.5, length: 1 },
        { start: 4.5, end: 5, length: 0.5 },
    ])
});

