import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Analytics = () => {
  // Data for the pie chart (Medicines)
  const medicineData = [
    { name: 'Ibuprofen', value: 33.7 },
    { name: 'Cephalexin', value: 21.4 },
    { name: 'Melatonin', value: 14.3 },
    { name: 'Amoxicillin', value: 17.6 },
    { name: 'Naproxen', value: 10.7 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Data for the bar chart (Equipments)
  const equipmentData = [
    { name: 'Hypodermic needles', currentMonth: 5, lastMonth: 3 },
    { name: 'Glove', currentMonth: 10, lastMonth: 8 },
    { name: 'Gauze', currentMonth: 15, lastMonth: 12 }
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '20px' }}>
      {/* Medicines Pie Chart */}
      <div>
        <h3>Medicines</h3>
        <PieChart width={500} height={500}>
          <Pie
            data={medicineData}
            cx={250}
            cy={250}
            label={({ name, value }) => `${name}: ${value}%`}  // Custom label showing name and value
            labelLine={false}
            outerRadius={150}  // Increased radius for better spacing
            fill="#8884d8"
            dataKey="value"
          >
            {medicineData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </div>

      {/* Equipments Bar Chart */}
      <div>
        <h3>Equipments</h3>
        <BarChart
          width={400}
          height={300}
          data={equipmentData}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="currentMonth" fill="#8884d8" />
          <Bar dataKey="lastMonth" fill="#82ca9d" />
        </BarChart>
      </div>
    </div>
  );
}

export default Analytics;
