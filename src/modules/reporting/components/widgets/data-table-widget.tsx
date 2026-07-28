interface DataTableWidgetProps {
  title: string;
  headers: string[];
  rows: string[][];
  emptyMessage?: string;
}

export function DataTableWidget({ title, headers, rows, emptyMessage }: DataTableWidgetProps) {
  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyMessage ?? "No data yet."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                {headers.map((header) => (
                  <th key={header} className="pr-4 pb-2 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="py-2 pr-4">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
