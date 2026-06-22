import type { ReactNode } from "react";

export function DataTable({
  columns,
  rows
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-[#fbfaf7] text-left text-xs font-black uppercase tracking-normal text-gray-500">
            <tr>
              {columns.map((column) => (
                <th className="whitespace-nowrap px-4 py-3" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, index) => (
              <tr className="hover:bg-[#fbfaf7]" key={index}>
                {row.map((cell, cellIndex) => (
                  <td className="whitespace-nowrap px-4 py-3 align-middle" key={cellIndex}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
