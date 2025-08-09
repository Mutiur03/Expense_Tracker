import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Transaction } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function exportToCSV(data: Transaction[], filename: string) {
  if (!data || data.length === 0) {
    return;
  }

  const headers = [
    "id",
    "date",
    "description",
    "category",
    "amount",
    "type",
    "profile",
  ];
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          const value = row[fieldName as keyof Transaction];
          const stringValue = String(value);
          if (stringValue.includes(",")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ];

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
