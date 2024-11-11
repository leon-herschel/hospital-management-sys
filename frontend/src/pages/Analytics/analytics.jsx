import { useEffect, useState, useMemo } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/firebase";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const Analytics = () => {
  const [medicinesData, setMedicinesData] = useState([]);
  const [suppliesData, setSuppliesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsageData = async () => {
      setLoading(true); // Set loading state
      try {
        const patientsRef = ref(database, "patient");
        const snapshot = await get(patientsRef);

        if (snapshot.exists()) {
          const patients = snapshot.val();
          const medicineUsage = {};
          const supplyUsage = {};

          // Iterate over each patient to collect medicine and supply usage
          Object.values(patients).forEach((patient) => {
            if (patient.medUse) {
              Object.values(patient.medUse).forEach((medicine) => {
                const { name, quantity } = medicine;
                if (medicineUsage[name]) {
                  medicineUsage[name] += quantity;
                } else {
                  medicineUsage[name] = quantity;
                }
              });
            }
            if (patient.suppliesUsed) {
              Object.values(patient.suppliesUsed).forEach((supply) => {
                const { name, quantity } = supply;
                if (supplyUsage[name]) {
                  supplyUsage[name] += quantity;
                } else {
                  supplyUsage[name] = quantity;
                }
              });
            }
          });

          // Convert usage objects to sorted arrays
          const sortedMedicines = Object.entries(medicineUsage)
            .map(([name, quantity]) => ({ name, value: quantity }))
            .sort((a, b) => b.value - a.value);

          const sortedSupplies = Object.entries(supplyUsage)
            .map(([name, quantity]) => ({ name, value: quantity }))
            .sort((a, b) => b.value - a.value);

          setMedicinesData(sortedMedicines);
          setSuppliesData(sortedSupplies);
        }
      } catch (error) {
        console.error("Error fetching usage data: ", error);
      } finally {
        setLoading(false); // Stop loading state
      }
    };

    fetchUsageData();
  }, []);

  // Memoize the color array and chart data to prevent unnecessary recalculations
  const COLORS = useMemo(
    () => ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"],
    []
  );

  // Memoize the chart content
  const renderMedicineChart = useMemo(() => (
    <PieChart width={500} height={500}>
      <Pie
        data={medicinesData}
        cx={250}
        cy={250}
        label={({ name, value }) => `${name}: ${value}`}
        labelLine={false}
        outerRadius={150}
        fill="#8884d8"
        dataKey="value"
      >
        {medicinesData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  ), [medicinesData, COLORS]);

  const renderSuppliesChart = useMemo(() => (
    <BarChart
      width={400}
      height={300}
      data={suppliesData}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" fill="#8884d8" />
    </BarChart>
  ), [suppliesData]);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "20px" }}>
      {/* Medicines Pie Chart */}
      <div>
        <h3>Most Used Medicines</h3>
        {renderMedicineChart}
      </div>

      {/* Supplies Bar Chart */}
      <div>
        <h3>Most Used Supplies</h3>
        {renderSuppliesChart}
      </div>
    </div>
  );
};

export default Analytics;
