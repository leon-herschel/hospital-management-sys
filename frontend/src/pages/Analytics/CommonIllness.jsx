import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/firebase";
import { useAuth } from "../../context/authContext/authContext"; 
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
  ResponsiveContainer
} from "recharts";

const CommonIllnessChart = ({ selectedClinic = null, userRole = null, userClinicAffiliation = null, clinicsData = null }) => {
  const { currentUser } = useAuth();
  const [illnessData, setIllnessData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalConsultations, setTotalConsultations] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState(userRole);
  const [currentUserClinic, setCurrentUserClinic] = useState(userClinicAffiliation);
  const [clinics, setClinics] = useState(clinicsData || {});

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff69b4"];

  // Fetch user data if not provided as props
  useEffect(() => {
    const fetchUserData = async () => {
      if (userRole && userClinicAffiliation) {
        setCurrentUserRole(userRole);
        setCurrentUserClinic(userClinicAffiliation);
        if (clinicsData) {
          setClinics(clinicsData);
        }
        return;
      }

      if (!currentUser?.uid) return;
      
      try {
        const userSnapshot = await get(ref(database, `users/${currentUser.uid}`));
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          setCurrentUserRole(userData.role);
          setCurrentUserClinic(userData.clinicAffiliation);
        }

        // Fetch clinics data if not provided and user is superadmin
        if (!clinicsData && userData?.role === 'superadmin') {
          const clinicsSnapshot = await get(ref(database, "clinics"));
          if (clinicsSnapshot.exists()) {
            setClinics(clinicsSnapshot.val());
          }
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };

    fetchUserData();
  }, [currentUser, userRole, userClinicAffiliation, clinicsData]);

  // Filter medical history data by clinic affiliation
  const filterMedicalHistoryByClinic = async (medicalHistoryData) => {
    try {
      // First, get patient data to check clinicsVisited
      const patientsSnapshot = await get(ref(database, "patients"));
      const patientsData = patientsSnapshot.exists() ? patientsSnapshot.val() : {};

      if (currentUserRole === 'superadmin') {
        if (selectedClinic === 'all' || !selectedClinic) {
          return medicalHistoryData;
        }
        // Filter by selected clinic
        return Object.fromEntries(
          Object.entries(medicalHistoryData).filter(([patientId, patientData]) => {
            // Check if patient has visited the selected clinic
            const patient = patientsData[patientId];
            const hasVisitedClinic = patient?.clinicsVisited?.[selectedClinic];
            
            if (!hasVisitedClinic) return false;
            
            // Also check if any entry in the patient's history belongs to the selected clinic
            if (patientData.entries) {
              return Object.values(patientData.entries).some(entry => 
                entry.clinicId === selectedClinic
              );
            }
            return false;
          })
        );
      } else {
        // For admin and other roles, filter by their clinic affiliation
        return Object.fromEntries(
          Object.entries(medicalHistoryData).filter(([patientId, patientData]) => {
            // Check if patient has visited the user's clinic
            const patient = patientsData[patientId];
            const hasVisitedClinic = patient?.clinicsVisited?.[currentUserClinic];
            
            if (!hasVisitedClinic) return false;
            
            if (patientData.entries) {
              return Object.values(patientData.entries).some(entry => 
                entry.clinicId === currentUserClinic
              );
            }
            return false;
          })
        );
      }
    } catch (error) {
      console.error("Error filtering medical history by clinic:", error);
      return medicalHistoryData; // Return unfiltered data on error
    }
  };

  // Additional filtering for entries within selected patients
  const filterEntriesByClinic = (entries) => {
    if (currentUserRole === 'superadmin') {
      if (selectedClinic === 'all' || !selectedClinic) {
        return entries;
      }
      return Object.fromEntries(
        Object.entries(entries).filter(([entryId, entry]) => 
          entry.clinicId === selectedClinic
        )
      );
    } else {
      return Object.fromEntries(
        Object.entries(entries).filter(([entryId, entry]) => 
          entry.clinicId === currentUserClinic
        )
      );
    }
  };

  useEffect(() => {
    const fetchIllnessData = async () => {
      if (!currentUserRole) return;
      
      setLoading(true);
      try {
        const medicalHistorySnapshot = await get(ref(database, "patientMedicalHistory"));
        
        if (medicalHistorySnapshot.exists()) {
          const medicalHistoryData = medicalHistorySnapshot.val();
          
          // Filter medical history data by clinic (now async)
          const filteredMedicalHistory = await filterMedicalHistoryByClinic(medicalHistoryData);
          
          const diagnosisCount = {};
          let totalDiagnoses = 0;

          // Process each patient's medical history - focus only on diagnosis
          Object.values(filteredMedicalHistory).forEach(patient => {
            if (patient.entries) {
              // Further filter entries by clinic
              const filteredEntries = filterEntriesByClinic(patient.entries);
              
              Object.values(filteredEntries).forEach(entry => {
                // Only process diagnosis field
                if (Array.isArray(entry.diagnosis)) {
                  entry.diagnosis.forEach(diagnosis => {
                    let diagnosisName = diagnosis.description?.trim();
                    
                    // Clean up and normalize diagnosis names
                    if (diagnosisName && diagnosisName.length > 1) {
                      // Convert to title case for consistency
                      diagnosisName = diagnosisName
                        .toLowerCase()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                      
                      // Skip test entries, empty descriptions, or generic entries
                      if (!diagnosisName.toLowerCase().includes('test') && 
                          diagnosisName !== 'Unknown' && 
                          diagnosisName !== 'N/A' &&
                          diagnosisName !== '-') {
                        diagnosisCount[diagnosisName] = (diagnosisCount[diagnosisName] || 0) + 1;
                        totalDiagnoses++;
                      }
                    }
                  });
                }
              });
            }
          });

          // Convert to chart-friendly format and sort by frequency
          const sortedIllnessData = Object.entries(diagnosisCount)
            .map(([illness, count]) => ({
              name: illness.length > 25 ? illness.substring(0, 25) + '...' : illness,
              fullName: illness,
              value: count,
              percentage: totalDiagnoses > 0 ? ((count / totalDiagnoses) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 most common diagnoses

          setIllnessData(sortedIllnessData);
          setTotalConsultations(totalDiagnoses);
        }
      } catch (error) {
        console.error("Error fetching diagnosis data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIllnessData();
  }, [currentUserRole, currentUserClinic, selectedClinic]);

  // Custom tooltip for pie chart
  const IllnessPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '12px', 
          border: '1px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '250px'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '14px' }}>
            {data.fullName}
          </p>
          <p style={{ margin: '0 0 2px 0', color: '#0088FE', fontSize: '13px' }}>
            Diagnoses: {data.value}
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
            {data.percentage}% of all diagnoses
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const IllnessBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '12px', 
          border: '1px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '250px'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '14px' }}>
            {data.fullName}
          </p>
          <p style={{ margin: '0 0 2px 0', color: '#0088FE', fontSize: '13px' }}>
            Diagnoses: {data.value}
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
            {data.percentage}% of all diagnoses
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading diagnosis data...
      </div>
    );
  }

  if (illnessData.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px', 
        color: '#666',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#333', marginBottom: '10px' }}>Common Illnesses</h3>
        <p>No diagnosis data available yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Card */}
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        textAlign: "center",
        marginBottom: "30px"
      }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Total Diagnoses</h3>
        <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#0088FE" }}>
          {totalConsultations.toLocaleString()}
        </p>
        <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
          Unique illness types: {illnessData.length}
        </p>
        {currentUserRole === 'superadmin' && selectedClinic && selectedClinic !== 'all' && (
          <p style={{ margin: "5px 0 0 0", color: "#888", fontSize: "12px", fontStyle: 'italic' }}>
            Filtered by selected clinic
          </p>
        )}
        {currentUserRole !== 'superadmin' && currentUserClinic && (
          <p style={{ margin: "5px 0 0 0", color: "#888", fontSize: "12px", fontStyle: 'italic' }}>
            Showing data for: {clinics[currentUserClinic]?.name || 'your clinic'}
          </p>
        )}
      </div>

      {/* Charts Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", 
        gap: "30px"
      }}>
        
        {/* Pie Chart */}
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
            Common Illnesses Distribution
          </h3>
          <ResponsiveContainer width="100%" height={450}>
            <PieChart>
              <Pie
                data={illnessData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={140}
                fill="#8884d8"
                dataKey="value"
              >
                {illnessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<IllnessPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
            Most Common Illnesses
          </h3>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart 
              data={illnessData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={11}
                interval={0}
              />
              <YAxis 
                label={{ value: 'Number of Cases', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<IllnessBarTooltip />} />
              <Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]}>
                {illnessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginTop: "30px"
      }}>
        <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
          Detailed Diagnosis Statistics
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  Rank
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  Illness/Diagnosis
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                  Diagnoses
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody>
              {illnessData.map((illness, index) => (
                <tr key={illness.fullName} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: COLORS[index % COLORS.length] }}>
                    #{index + 1}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {illness.fullName}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                    {illness.value}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {illness.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommonIllnessChart;