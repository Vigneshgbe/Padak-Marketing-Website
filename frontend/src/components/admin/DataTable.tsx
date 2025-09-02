// src/components/admin/DataTable.tsx
import React from 'react';

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
  }[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
}

function DataTable<T extends { id: number }>({ data, columns, onRowClick, actions }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column, i) => (
              <th
                key={i}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item) => (
            <tr
              key={item.id}
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column, i) => {
                const cellContent = typeof column.accessor === 'function'
                  ? column.accessor(item)
                  : item[column.accessor as keyof T];

                return (
                  <td
                    key={i}
                    className={`px-4 py-3 whitespace-nowrap ${column.className || ''}`}
                  >
                    {cellContent as React.ReactNode}
                  </td>
                );
              })}
              {actions && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div onClick={(e) => e.stopPropagation()}>
                    {actions(item)}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;