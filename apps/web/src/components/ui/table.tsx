import React from 'react';

export const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full overflow-auto">
    <table className="w-full caption-bottom text-sm">{children}</table>
  </div>
);

export const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="[&_tr]:border-b">{children}</thead>
);

export const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
);

export const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100">{children}</tr>
);

export const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">{children}</th>
);

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

export const TableCell = ({ children, className = '', colSpan }: TableCellProps) => (
  <td className={`p-4 align-middle ${className}`} colSpan={colSpan}>{children}</td>
);