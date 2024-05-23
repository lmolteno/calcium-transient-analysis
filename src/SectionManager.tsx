import { Button, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Input, Tooltip, Autocomplete, AutocompleteItem, Tabs, Tab } from "@nextui-org/react";
import { useCallback, useState } from "react";
import deleteIcon from "./assets/delete.svg?raw"
import editIcon from "./assets/edit.svg?raw"
import saveIcon from "./assets/save.svg?raw"
import clearIcon from "./assets/clear.svg?raw"

interface SectionManagerProps {
  sections: Section[]
  setSections: (sections: Section[] | ((old: Section[]) => Section[])) => void
}

export const SectionManager = ({ sections, setSections }: SectionManagerProps) => {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [sectionInProgress, setSectionInProgress] = useState<Partial<Section> | undefined>();

  const tryToAddSection = useCallback(() => {
    if (!sectionInProgress) { return }
    const { start, end, name } = sectionInProgress
    if (start == undefined) {
      setError("must specify start")
      return
    }
    if (end == undefined) {
      setError("must specify end")
      return
    }
    if (name == undefined) {
      setError("must specify name")
      return
    }

     if (end < start) {
       setError("start must be before end!!!")
     } else if (sections.some(s => s.name === name)) {
       setError("name must not already be used!!!")
     } else {
       setError("");
       setSections(sections => [...sections, { start, end, name }]);
       setSectionInProgress(undefined);
     }
  }, [sectionInProgress]);

  
  return (
    <>
    <div className="w-4/12">
      <h1 className="py-3 text-center">Sections</h1>
      <Table removeWrapper>
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>START</TableColumn>
          <TableColumn>END</TableColumn>
          <TableColumn className="text-center">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {sections.map(s => (
          <TableRow key={s.name}>
            <TableCell>{s.name}</TableCell>
            <TableCell>{s.start}s</TableCell>
            <TableCell>{s.end}s</TableCell>
            <TableCell align="center">
            <div className="flex">
              <div className="flex-grow" />
              <Tooltip content="Delete">
                <span 
                  className="stroke-danger cursor-pointer active:opacity-50" 
                  onClick={() => setSections(old => old.filter(os => os.name !== s.name))} 
                  dangerouslySetInnerHTML={{ __html: deleteIcon }}>
               </span>
              </Tooltip>
              <Tooltip content="Edit">
                <span 
                  className="stroke-primary cursor-pointer active:opacity-50" 
                  onClick={() => { setSectionInProgress(s); setSections(old => old.filter(os => os.name !== s.name)); }} 
                  dangerouslySetInnerHTML={{ __html: editIcon }}>
               </span>
              </Tooltip>
              <div className="flex-grow" />
              </div>
            </TableCell>
          </TableRow>))}
         {sectionInProgress 
         ? <TableRow>
            <TableCell>
              <Autocomplete 
                allowsCustomValue 
                className="w-24"
                selectedKey={sectionInProgress.name} 
                onSelectionChange={key => setSectionInProgress(old => ({...old, name: key?.toString() ?? undefined}))}
                defaultItems={[{ key: 'aCSF', value: 'aCSF'}, { key: '4-AP', value: '4-AP' }]}
              >
                {(item) => <AutocompleteItem key={item.key}>{item.value}</AutocompleteItem>}
              </Autocomplete>
            </TableCell>
            <TableCell>
              <Input 
                type="number" value={sectionInProgress.start?.toString()} onValueChange={v => setSectionInProgress(old => ({...old, start: parseFloat(v)}))} />
            </TableCell>
            <TableCell> 
              <Input type="number" value={sectionInProgress.end?.toString()} onValueChange={v => setSectionInProgress(old => ({...old, end: parseFloat(v)}))} />
            </TableCell>
            <TableCell> 
              <div className="flex">
                <div className="flex-grow" />
                <Tooltip content="Save">
                  <span 
                    onClick={() => tryToAddSection()}
                    className="stroke-primary cursor-pointer hover:opacity-50 transition-opacity" 
                    dangerouslySetInnerHTML={{ __html: saveIcon }}>
                 </span>
                </Tooltip>
                <Tooltip content="Cancel">
                  <span 
                    onClick={() => setSectionInProgress(undefined)}
                    className="stroke-danger cursor-pointer hover:opacity-50 transition-opacity" 
                    dangerouslySetInnerHTML={{ __html: clearIcon }}>
                 </span>
                </Tooltip>
                <div className="flex-grow" />
              </div>
            </TableCell>
          </TableRow>
         : <TableRow>
            <TableCell colSpan={4}>
              <Button onPress={() => setSectionInProgress({})}>New Section</Button>
            </TableCell>
            <TableCell className="hidden"> </TableCell>
            <TableCell className="hidden"> </TableCell>
            <TableCell className="hidden"> </TableCell>
          </TableRow>
         }
        </TableBody>
      </Table>
      {error && <p className="text-danger">{error}</p>}
    </div>
    </>
  );
};


// aCSF and 4-AP
