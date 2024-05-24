export const sectionAcsf = 'aCSF';
export const section4ap = '4-AP'

export const section4apColour = "#b369a2";
export const sectionAcsfColour = "#697ab3";

export const getSectionColour = (name: string) => {
  if (name === section4ap) return section4apColour;
  if (name === sectionAcsf) return sectionAcsfColour;
  return '#ff0000'
}
