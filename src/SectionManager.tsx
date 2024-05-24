import { Input, Tabs, Tab, Divider } from "@nextui-org/react";
import { findErrorsInSection, formatSeconds } from "./utils";
import { getSectionColour } from "./constants";

interface SectionManagerProps {
  sections: Section[]
  setSections: (sections: Section[] | ((old: Section[]) => Section[])) => void
}

export const SectionManager = ({ sections, setSections }: SectionManagerProps) => {
  return (
    <div className="w-6/12">
      <h1 className="py-3 text-center">sections</h1>
      <Divider />
      <Tabs aria-label="sections" items={[{label: 'aCSF'}, {label: '4-AP'}]} className="content-center pt-3" size="lg">
        {(sectionTab) => {
          const section: Partial<Section> = sections.find(s => s.name == sectionTab.label) ?? { name: sectionTab.label };
          const updateSection = (newSection: Section) => setSections(old => [...old.filter(s => s.name !== sectionTab.label), newSection])
          const errors = findErrorsInSection(section);
          return (
            <Tab key={sectionTab.label} title={sectionTab.label}>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  type="number" label="start (seconds)" 
                  value={section.start?.toString()} 
                  // @ts-ignore
                  onValueChange={v => updateSection({...section, start: parseFloat(v)})} 
                />
                <Input 
                  type="number" label="end (seconds)" 
                  value={section.end?.toString()} 
                  // @ts-ignore
                  onValueChange={v => updateSection({...section, end: parseFloat(v)})} 
                />
                {section.start && <p>start: {formatSeconds(section.start)}</p>}
                {section.end && <p>end: {formatSeconds(section.end)}</p>}
              </div>
              {errors.map(e => <p className="text-danger">{e}</p>)}
              <div className="flex flex-row items-center gap-3 pt-3">
                <p className="w-full h-10 rounded-md" style={{ backgroundColor: getSectionColour(sectionTab.label) }}> </p>
              </div>
            </Tab>
          )
        }}
      </Tabs>
    </div>
  );
};


// aCSF and 4-AP
