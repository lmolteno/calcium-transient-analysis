import { useState } from "react";

interface SectionManagerProps {
  sections: Section[]
  setSections: (sections: Section[] | ((old: Section[]) => Section[])) => void
}

export const SectionManager = ({ sections, setSections }: SectionManagerProps) => {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  
  return (
    <div className="flex flex-col">
      <div className="border rounded p-3">
        <div className="flex flex-col">
          {sections.map(s => (
           <div className="flex justify-between">
             <p>{s.name}</p>
             <p>{s.start}</p>
             <p>{s.end}</p>
           </div>)
          )}
          {editing 
            ? <div className="flex flex-col justify-between gap-3">
                <input id="section-name" type="text" placeholder="name"></input>
                <div className="flex gap-3">
                  <input id="section-start" className="w-24" type="number" placeholder="start"></input>
                  <input id="section-end" className="w-24" type="number" placeholder="end"></input>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => {
                    const start = parseFloat((document.getElementById("section-start") as HTMLInputElement)?.value);
                    const end = parseFloat((document.getElementById("section-end") as HTMLInputElement)?.value);
                    const name = (document.getElementById("section-name") as HTMLInputElement)?.value;
                    if (end < start) {
                      setError("start must be before end!!!")
                    } else {
                      setError("")
                      setSections(sections => [...sections, { start, end, name }])
                    }
                  }}>add</button>
                  <button onClick={() => setEditing(false)}>discard</button>
                </div>
              </div>
            : <div className="flex justify-between gap-3">
                <p>Create a new section</p>
                <button onClick={() => setEditing(true)}>+</button>
              </div>
          }
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    </div>
  );
};


// aCSF and 4-AP
