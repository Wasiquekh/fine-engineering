"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type DatePickerInputProps = {
  name: string;
  value: Date | null;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;

  placeholderText?: string;
  dateFormat?: string;
};

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  name,
  value,
  setFieldValue,
  placeholderText = "yyyy-mm-dd",
  dateFormat = "yyyy-MM-dd",
}) => {
  return (
    <DatePicker
      selected={value}
      onChange={(date: Date | null) => setFieldValue(name, date)}
      name={name}
      dateFormat={dateFormat}
      placeholderText={placeholderText}
      className="hover:shadow-hoverInputShadow focus-border-primary 
        !w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 
        font-medium placeholder-[#717171] py-4 px-4 bg-white shadow-sm"
      popperClassName="custom-datepicker"
      dayClassName={(date) => {
        const today = new Date().toDateString();
        const selectedDate = value ? new Date(value).toDateString() : null;

        if (today === date.toDateString()) return "bg-[#FFF0F1] text-[#A3000E]";
        if (selectedDate === date.toDateString()) return "bg-[#A3000E] text-white";
        return "hover:bg-[#FFCCD0] hover:text-[#A3000E]";
      }}
    />
  );
};

export default DatePickerInput;
