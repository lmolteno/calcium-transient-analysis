# Calcium Transient Analysis

This is a webapp developed to help researchers at the University of Otago analyse time-series data to extract meaningful results. It has been tailored for their particular use-case, while remaining relatively general under the hood. As it is frontend-only, it is hosted on GitHub Pages and can be accessed at [lmolteno.github.io/calcium-transient-analysis](https://lmolteno.github.io/calcium-transient-analysis/). Sample data can be downloaded from the repository, under the data directory.

## Usage
![image](https://github.com/user-attachments/assets/48da0888-9d21-4c86-bde1-04b63584012d)
1. There are multiple cells per csv that is uploaded (each csv represents a slice)
2. Per-slice one can set the sections, which themselves represent times when the cell in question was exposed to a particular chemical, either 4-AP or aCSF)
3. Per-cell one can set the baseline (for calculating the area), and the peak threshold.
   - The peak threshold is currently the main purpose of the app, so it is what is shown on the left panel per-cell.
   - As the peak threshold is adjusted, the proportion of time spent above the threshold per section is shown and updated in real-time.
4. The user can then run through all the cells to adjust the peak threshold and baseline, or exclude the cell entirely if it shown to be dead.
5. Once all cells have been confirmed, then the user can export the data for further analysis to work out trends between cells and how they respond to 4-AP and aCSF.
