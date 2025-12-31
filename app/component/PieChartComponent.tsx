"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { name: "Product A", value: 40 },
  { name: "Product B", value: 30 },
  { name: "Product C", value: 20 },
  { name: "Product D", value: 10 },
];

const COLORS = ["#CD95F9", "#86F3A6", "#C6F7FE", "#FBCFEE"];

const SemiCircleChart: React.FC = () => {
  return (
    <div className="w-full h-[200px] flex justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%" // Moves the center downward to create a semi-circle effect
            startAngle={180} // Starts from the left
            endAngle={0} // Ends at the right
            innerRadius={60} // Creates a donut effect
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="top" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SemiCircleChart;
