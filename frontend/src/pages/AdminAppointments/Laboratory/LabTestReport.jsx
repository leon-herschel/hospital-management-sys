import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getDatabase, ref, onValue } from "firebase/database";

const LabTestReport = () => {
  const chartRef = useRef();
  const pieChartRef = useRef();
  const timelineRef = useRef();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from clinicLabRequests node
  useEffect(() => {
    const fetchLabData = () => {
      try {
        const database = getDatabase(); // Initialize database
        const labRequestsRef = ref(database, "clinicLabRequests");

        // Use onValue for real-time updates
        const unsubscribe = onValue(
          labRequestsRef,
          (snapshot) => {
            const firebaseData = snapshot.val();
            console.log("Raw Firebase data:", firebaseData); // Debug log

            if (firebaseData) {
              const processedData = Object.entries(firebaseData).map(
                ([key, value]) => ({
                  id: key,
                  ...value,
                })
              );
              console.log("Processed data:", processedData); // Debug log
              setData(processedData);
            } else {
              console.log("No data found in clinicLabRequests");
              setData([]);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching lab data:", error);
            setError(error.message);
            setLoading(false);
          }
        );

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up Firebase listener:", error);
        setError(error.message);
        setLoading(false);
        return null;
      }
    };

    const unsubscribe = fetchLabData();

    // Cleanup on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // Create bar chart for lab test frequency
  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    // Count lab test frequency
    const testCounts = d3.rollup(
      data,
      (v) => v.length,
      (d) => d.labTestName || d.testName || "Unknown Test" // Handle different field names
    );
    const chartData = Array.from(testCounts, ([test, count]) => ({
      test,
      count,
    }));

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.bottom - margin.top;

    const x = d3
      .scaleBand()
      .domain(chartData.map((d) => d.test))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.count)])
      .nice()
      .range([height, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add bars
    g.selectAll(".bar")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.test))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => height - y(d.count))
      .attr("fill", "#4f46e5")
      .attr("rx", 4);

    // Add value labels on bars
    g.selectAll(".label")
      .data(chartData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.test) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.count) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text((d) => d.count);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    g.append("g").call(d3.axisLeft(y));

    // Add labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Number of Tests");

    g.append("text")
      .attr(
        "transform",
        `translate(${width / 2}, ${height + margin.bottom - 10})`
      )
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Lab Test Types");
  }, [data]);

  // Create pie chart for test status distribution
  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(pieChartRef.current);
    svg.selectAll("*").remove();

    const statusCounts = d3.rollup(
      data,
      (v) => v.length,
      (d) => d.status || "Unknown Status" // Handle missing status
    );
    const pieData = Array.from(statusCounts, ([status, count]) => ({
      status,
      count,
    }));

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const color = d3
      .scaleOrdinal()
      .domain(pieData.map((d) => d.status))
      .range(["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]);

    const pie = d3.pie().value((d) => d.count);

    const arc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(radius - 10);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const arcs = g
      .selectAll(".arc")
      .data(pie(pieData))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.status));

    arcs
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .text((d) => `${d.data.status}\n(${d.data.count})`);
  }, [data]);

  // Calculate statistics
  const totalTests = data.length;
  const completedTests = data.filter((d) => d.status === "Completed").length;
  const pendingTests = data.filter((d) => d.status === "Pending").length;
  const inProgressTests = data.filter((d) => d.status === "In Progress").length;
  const totalRevenue = data.reduce(
    (sum, d) => sum + (parseFloat(d.serviceFee) || parseFloat(d.fee) || 0),
    0
  );

  // Get unique clinics for debugging
  const uniqueClinics = [
    ...new Set(data.map((d) => d.clinic || d.clinicName).filter(Boolean)),
  ];
  console.log("Unique clinics found:", uniqueClinics); // Debug log

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lab test data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-600 font-semibold">Error loading data</p>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lab Test Analytics Report
          </h1>
          <p className="text-gray-600">
            Comprehensive analysis of clinic lab requests and test performance
          </p>
          {/* Debug info */}
          <div className="mt-2 text-sm text-gray-500">
            Total records: {data.length} | Clinics:{" "}
            {uniqueClinics.length > 0
              ? uniqueClinics.join(", ")
              : "No clinics found"}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{totalTests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedTests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingTests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Lab Test Frequency
            </h3>
            <svg ref={chartRef} width="600" height="400"></svg>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Test Status Distribution
            </h3>
            <div className="flex justify-center">
              <svg ref={pieChartRef} width="300" height="300"></svg>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Lab Requests
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lab Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clinic
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((request, index) => (
                  <tr key={request.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {request.labTestName || request.testName || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">
                        {request.patientName || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : request.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {request.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ₱
                      {parseFloat(
                        request.serviceFee || request.fee || 0
                      ).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {request.clinic || request.clinicName || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabTestReport;
