import { CSVImport } from "../CSVImport";

export default function CSVImportExample() {
  return (
    <div className="p-4 max-w-xl">
      <CSVImport onImport={(data) => console.log("Imported:", data.length, "rows")} />
    </div>
  );
}
