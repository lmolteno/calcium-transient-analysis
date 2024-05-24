import { Input, Tabs, Tab, Divider } from "@nextui-org/react";
import { findErrorsInSection, formatSeconds } from "./utils";

interface SectionManagerProps {
  sections: Section[]
  setSections: (sections: Section[] | ((old: Section[]) => Section[])) => void
}

export const SectionManager = ({ sections, setSections }: SectionManagerProps) => {
  return (
    <div className="w-6/12">
      <h1 className="py-3 text-center">Sections</h1>
      <Divider />
      <Tabs aria-label="Sections" items={[{label: 'aCSF'}, {label: '4-AP'}]} className="py-3 content-center">
        {(sectionName) => {
          const section: Partial<Section> = sections.find(s => s.name == sectionName.label) ?? { name: sectionName.label };
          const updateSection = (newSection: Section) => setSections(old => [...old.filter(s => s.name !== sectionName.label), newSection])
          const errors = findErrorsInSection(section);
          return (
            <Tab key={sectionName.label} title={sectionName.label}>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  type="number" label="Start (seconds)" 
                  value={section.start?.toString()} onValueChange={v => updateSection({...section, start: parseFloat(v)})} 
                />
                <Input type="number" label="End (seconds)" value={section.end?.toString()} onValueChange={v => updateSection({...section, end: parseFloat(v)})} />
                {section.start ? <p>Start: {formatSeconds(section.start)}</p> : <p>Specify start</p>}
                {section.end ? <p>End: {formatSeconds(section.end)}</p> : <p>Specify end</p>}
              </div>
              {errors.map(e => <p className="text-danger">{e}</p>)}
            </Tab>
          )
        }}
      </Tabs>
    </div>
  );
};


// aCSF and 4-AP
