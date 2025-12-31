"use client";

import React from "react";
import Select from "react-select";

type Option = {
  value: string | number;
  label: string;
};

type SelectInputProps = {
  name: string;
  value: string | number;
  options: Option[];
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;

  placeholder?: string;
  isClearable?: boolean;
};

const SelectInput: React.FC<SelectInputProps> = ({
  name,
  value,
  options,
  setFieldValue,
  placeholder = "Select",
  isClearable = true,
}) => {
  const selected =
    options.find((opt) => String(opt.value) === String(value)) || null;

  return (
    <Select
      value={selected}
      onChange={(selectedOption) =>
        setFieldValue(name, selectedOption ? selectedOption.value : "")
      }
      options={options}
      placeholder={placeholder}
      isClearable={isClearable}
      classNames={{
        control: ({ isFocused }) =>
          `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
            isFocused ? "!border-primary-500" : "!border-[#DFEAF2]"
          }`,
      }}
      styles={{
        menu: (base) => ({
          ...base,
          borderRadius: "4px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
        }),
        option: (base, { isFocused, isSelected }) => ({
          ...base,
          backgroundColor: isSelected
            ? "var(--primary-500)"
            : isFocused
            ? "var(--primary-100)"
            : "#fff",
          color: isSelected ? "#fff" : "#333",
          cursor: "pointer",
        }),
      }}
    />
  );
};

export default SelectInput;
