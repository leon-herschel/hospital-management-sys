import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { get, ref } from "firebase/database"; // Import necessary Firebase functions
import { database } from "../../firebase/firebase";

const Analytics = () => {
  const [inventoryHistory, setInventoryHistory] = useState([]); // State to hold fetched data

  useEffect(() => {
    const inventoryRef = ref(database, "inventoryHistory"); // Reference to the inventoryHistory collection

    // Fetch the data
    get(inventoryRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Convert the object to an array
          const items = Object.values(data);
          setInventoryHistory(items); // Update the state with fetched data
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  }, []);

  // Process data for the pie chart (Medicines)
  const medicineData = inventoryHistory.reduce((acc, item) => {
    // Check if the item is a medicine
    if (item.type === "medicines") {
      const existingItem = acc.find((data) => data.name === item.itemName);
      if (existingItem) {
        existingItem.value += item.quantity; // Aggregate quantity
      } else {
        acc.push({ name: item.itemName, value: item.quantity }); // Add new item
      }
    }
    return acc;
  }, []);

  // Process data for the bar chart (Supplies)
  const suppliesData = inventoryHistory.reduce((acc, item) => {
    // Check if the item is a supply
    if (item.type === "supplies") {
      const existingItem = acc.find((data) => data.name === item.itemName);
      if (existingItem) {
        existingItem.value += item.quantity; // Aggregate quantity
      } else {
        acc.push({ name: item.itemName, value: item.quantity }); // Add new item
      }
    }
    return acc;
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        padding: "20px",
      }}
    >
      {/* Medicines Pie Chart */}
      <div>
        <h3>Medicines</h3>
        <PieChart width={500} height={500}>
          <Pie
            data={medicineData}
            cx={250}
            cy={250}
            label={({ name, value }) => `${name}: ${value}`} // Custom label showing name and value
            labelLine={false}
            outerRadius={150} // Increased radius for better spacing
            fill="#8884d8"
            dataKey="value"
          >
            {medicineData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </div>

      {/* Supplies Bar Chart */}
      <div>
        <h3>Supplies</h3>
        <BarChart
          width={400}
          height={300}
          data={suppliesData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </div>
    </div>
  );
};

export default Analytics;
