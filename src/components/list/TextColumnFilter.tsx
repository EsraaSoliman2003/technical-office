"use client";

import ColumnValueFilter, { type ColumnFilterOption } from "./ColumnValueFilter";

type TextColumnFilterProps = {
  label: string;
  options: ColumnFilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
};

export default function TextColumnFilter({
  label,
  options,
  selectedValues,
  onChange,
}: TextColumnFilterProps) {
  return (
    <ColumnValueFilter
      label={label}
      options={options}
      selectedValues={selectedValues}
      onChange={onChange}
    />
  );
}
