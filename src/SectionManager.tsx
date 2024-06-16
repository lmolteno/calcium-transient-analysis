import { Input, Tabs, Tab, Divider } from "@nextui-org/react";
import { findErrorsInSection, formatSeconds } from "./utils";
import { getSectionColour } from "./constants";
import { useEffect } from "react";

interface SectionManagerProps {
  sections: Partial<Section>[]
  setSections: (sections: Section[] | ((old: Section[]) => Section[])) => void
  sampleRate: number
}

export const SectionManager = ({ sections, setSections, sampleRate }: SectionManagerProps) => {
  useEffect(() => {
    setSections(old => old.map(s => ({
      ...s,
      startSampleString: s.start ? (s.start / sampleRate).toFixed(2) : undefined,
      endSampleString: s.end ? (s.end / sampleRate).toFixed(2) : undefined,
    })));
  }, [sampleRate, setSections])
  return (
    <div className="w-6/12">
      <h1 className="py-3 text-center">sections</h1>
      <Divider />
      <Tabs aria-label="sections" items={[{label: 'aCSF'}, {label: '4-AP'}]} className="pt-3" size="lg">
        {(sectionTab) => {
          const section: Partial<Section> = sections.find(s => s.name == sectionTab.label) ?? { name: sectionTab.label };

          const sectionStartSamples = section.startSampleString !== undefined ? section.startSampleString : (section.start ? (section.start / sampleRate).toFixed(2) : undefined)
          const parsedStartSamples = parseFloat(sectionStartSamples ?? '-1')
          const startSampleErrors = (Number.isNaN(parsedStartSamples) || parsedStartSamples < 0) ? "enter a valid positive number" : undefined

          const sectionEndSamples = section.endSampleString ?? (section.end ? (section.end / sampleRate).toFixed(2) : undefined)
          const parsedEndSamples = parseFloat(sectionEndSamples ?? '-1')
          const endSampleErrors = (Number.isNaN(parsedEndSamples) || parsedEndSamples < 0) ? "enter a valid positive number" : undefined

          const parsedStartString = parseFloat(section.startString ?? '-1')
          const parsedEndString = parseFloat(section.endString ?? '-1')
          const startStringErrors = (Number.isNaN(parsedStartString) || parsedStartString < 0) ? "enter a valid positive number" : undefined
          const endStringErrors = (Number.isNaN(parsedEndString) || parsedEndString < 0) ? "enter a valid positive number" : undefined

          // @ts-ignore
          const updateSection = (newSection: Partial<Section>) => setSections(old => [...old.filter(s => s.name !== sectionTab.label), newSection])
          const errors = findErrorsInSection(section);
          return (
            <Tab key={sectionTab.label} title={
              <div className="flex flex-row items-center gap-2">
                <p className="size-4 rounded-md" style={{ backgroundColor: getSectionColour(sectionTab.label) }}></p><p><strong>{sectionTab.label}</strong></p>
              </div>
            }>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="start (seconds)" 
                  value={section.startString ?? ''} 
                  isInvalid={!!startStringErrors}
                  errorMessage={startStringErrors}
                  onValueChange={v => {
                    const parsed = parseFloat(v)
                    if (!Number.isNaN(parsed) && parsed >= 0) {
                      updateSection({...section, startString: v, start: parsed, startSampleString: (parsed / sampleRate).toFixed(2)})
                    } else {
                      updateSection({...section, startString: v });
                    }
                  }}
                />
                <Input 
                  label="end (seconds)" 
                  value={section.endString ?? ''} 
                  isInvalid={!!endStringErrors}
                  errorMessage={endStringErrors}
                  onValueChange={v => {
                    const parsed = parseFloat(v)
                    if (!Number.isNaN(parsed) && parsed >= 0) {
                      updateSection({...section, endString: v, end: parsed, endSampleString: (parsed / sampleRate).toFixed(2)})
                    } else {
                      updateSection({...section, endString: v });
                    }
                  }}
                />
                <Input 
                  label="start (samples)" 
                  value={sectionStartSamples ?? ''} 
                  isInvalid={!!startSampleErrors}
                  errorMessage={startSampleErrors}
                  onValueChange={v => {
                    const parsed = parseFloat(v)
                    if (!Number.isNaN(parsed) && parsed >= 0) {
                      updateSection({...section, startSampleString: v, start: parsed * sampleRate, startString: (parsed * sampleRate).toFixed(2)})
                    } else {
                      updateSection({...section, startSampleString: v });
                    }
                  }}
                />
                <Input 
                  label="end (samples)" 
                  value={sectionEndSamples} 
                  isInvalid={!!endSampleErrors}
                  errorMessage={endSampleErrors}
                  onValueChange={v => {
                    const parsed = parseFloat(v)
                    if (!Number.isNaN(parsed) && parsed >= 0) {
                      updateSection({...section, endSampleString: v, end: parsed * sampleRate, endString: (parsed * sampleRate).toFixed(2)})
                    } else {
                      updateSection({...section, endSampleString: v });
                    }
                  }}
                />
                {section.start && <p>start: {formatSeconds(section.start)}</p>}
                {section.end && <p>end: {formatSeconds(section.end)}</p>}
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
