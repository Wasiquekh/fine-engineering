"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DataPoint {
  name: string;
  value1: number;
  value2: number;
}

const data: DataPoint[] = [
  { name: "Jan", value1: 10, value2: 5 },
  { name: "Feb", value1: 40, value2: 30 },
  { name: "Mar", value1: 50, value2: 20 },
  { name: "Apr", value1: 70, value2: 40 },
  { name: "May", value1: 20, value2: 40 },
  { name: "Jun", value1: 50, value2: 20 },
  { name: "Jul", value1: 60, value2: 40 },
  { name: "Aug", value1: 35, value2: 20 },
  { name: "Sep", value1: 80, value2: 40 },
  { name: "Oct", value1: 12, value2: 30 },
  { name: "Nov", value1: 64, value2: 50 },
  { name: "Dec", value1: 48, value2: 20 },
];

const AreaChartComponent: React.FC = () => {
  return (
    <div className="w-full h-[300px] md:h-[530px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 7, left: -20, bottom: 15 }}>
          <defs>
            {/* Gradient for Product A */}
            <linearGradient id="colorValue1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8571F4" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.1} />
            </linearGradient>
            {/* Gradient for Product B */}
            <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C686F8" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#D9E1E7" strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: "#999" }} />
          <YAxis tick={{ fill: "#999" }} domain={[0, 100]} tickCount={6} tickFormatter={(value) => `${value}k`} />
          <Tooltip content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-2 shadow-md rounded-md text-gray-700 text-sm">
                  <p className="font-semibold">{label}</p>
                  {payload.map((entry, index) => (
                    <p key={index} className="text-xs font-medium text-primary-600">
                      {entry.name}: {entry.value}k
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          }} />
          <Legend />
          {/* White Shadow Effect - Slightly larger stroke */}
          <Area type="linear" dataKey="value1" stroke="white" strokeWidth={10} fill="none" opacity={0.3} />
          <Area type="linear" dataKey="value2" stroke="white" strokeWidth={10} fill="none" opacity={0.3} />

          {/* Actual Areas */}
          <Area type="linear" dataKey="value1" stroke="#8571F4" fill="url(#colorValue1)" fillOpacity={1} name="Product A" />
          <Area type="linear" dataKey="value2" stroke="#C686F8" fill="url(#colorValue2)" fillOpacity={1} name="Product B" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaChartComponent;
