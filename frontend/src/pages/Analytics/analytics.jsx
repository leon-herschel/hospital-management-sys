import { useEffect, useState, useMemo } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/firebase";
import { useAuth } from "../../context/authContext/authContext"; // Assuming you have an auth context
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
  LineChart,
  Line, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import CommonIllnessChart from "./CommonIllness";

const Analytics = () => {
  const { currentUser } = useAuth(); // Get current user from auth context
  const [userRole, setUserRole] = useState(null);
  const [userClinicAffiliation, setUserClinicAffiliation] = useState(null);
  const [clinicsData, setClinicsData] = useState({});
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [salesData, setSalesData] = useState({ daily: 0, monthly: 0 });
  const [salesItemsData, setSalesItemsData] = useState([]);
  const [medicineUsageData, setMedicineUsageData] = useState([]);
  const [supplyUsageData, setSupplyUsageData] = useState([]);
  const [labRequestsData, setLabRequestsData] = useState([]);
  const [inventoryTransactionsData, setInventoryTransactionsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = useMemo(
    () => ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"],
    []
  );

  // Fetch user role and clinic affiliation
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userSnapshot = await get(ref(database, `users/${currentUser.uid}`));
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          setUserRole(userData.role);
          setUserClinicAffiliation(userData.clinicAffiliation);
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Fetch clinics data for superadmin
  useEffect(() => {
    const fetchClinics = async () => {
      if (userRole !== 'superadmin') return;
      
      try {
        const clinicsSnapshot = await get(ref(database, "clinics"));
        if (clinicsSnapshot.exists()) {
          setClinicsData(clinicsSnapshot.val());
        }
      } catch (error) {
        console.error("Error fetching clinics: ", error);
      }
    };

    if (userRole) {
      fetchClinics();
    }
  }, [userRole]);

  // Filter data by clinic affiliation with patient clinic visits consideration
  const filterDataByClinic = async (data, clinicField = 'clinicId', checkPatients = false) => {
    try {
      let patientsData = {};
      
      // Fetch patients data if we need to check clinic visits
      if (checkPatients) {
        const patientsSnapshot = await get(ref(database, "patients"));
        patientsData = patientsSnapshot.exists() ? patientsSnapshot.val() : {};
      }

      if (userRole === 'superadmin') {
        if (selectedClinic === 'all') {
          return data;
        }
        
        const filtered = Object.fromEntries(
          Object.entries(data).filter(([key, value]) => {
            // Primary filter by clinicId
            const matchesClinic = value[clinicField] === selectedClinic;
            
            // Secondary filter by patient clinic visits if needed
            if (checkPatients && value.patientId) {
              const patient = patientsData[value.patientId];
              const hasVisitedClinic = patient?.clinicsVisited?.[selectedClinic];
              return matchesClinic && hasVisitedClinic;
            }
            
            return matchesClinic;
          })
        );
        
        return filtered;
      } else {
        // For admin and other roles, filter by their clinic affiliation
        const filtered = Object.fromEntries(
          Object.entries(data).filter(([key, value]) => {
            // Primary filter by clinicId
            const matchesClinic = value[clinicField] === userClinicAffiliation;
            
            // Secondary filter by patient clinic visits if needed
            if (checkPatients && value.patientId) {
              const patient = patientsData[value.patientId];
              const hasVisitedClinic = patient?.clinicsVisited?.[userClinicAffiliation];
              return matchesClinic && hasVisitedClinic;
            }
            
            return matchesClinic;
          })
        );
        
        return filtered;
      }
    } catch (error) {
      console.error("Error filtering data by clinic:", error);
      return data; // Return unfiltered data on error
    }
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!userRole) return;
      
      setLoading(true);
      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const today = now.toISOString().split('T')[0];

        let dailySales = 0;
        let monthlySales = 0;
        const salesByService = {};

        // ======================
        // 1. Fetch clinicBilling for sales totals
        // ======================
        const billingSnapshot = await get(ref(database, "clinicBilling"));
        let billingData = {};
        if (billingSnapshot.exists()) {
          billingData = billingSnapshot.val();
          // Filter billing data by clinic (with patient clinic visits check if needed)
          const filteredBilling = await filterDataByClinic(billingData, 'clinicId', true);
          
          Object.values(filteredBilling).forEach(billing => {
            if (billing.status === "paid") {
              const amount = parseFloat(billing.amount || 0);
              const paidDate = billing.paidDate ? new Date(billing.paidDate) : null;

              if (amount > 0 && paidDate) {
                const paidDateStr = paidDate.toISOString().split("T")[0];

                if (paidDateStr === today) dailySales += amount;
                if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
                  monthlySales += amount;
                }

                // Track billed items in salesByService
                if (Array.isArray(billing.billedItems)) {
                  billing.billedItems.forEach(item => {
                    const name = item.itemName || "Unknown Item";
                    salesByService[name] = (salesByService[name] || 0) + (item.totalPrice || 0);
                  });
                }
              }
            }
          });
        }

        // ======================
        // 2. Fetch clinicLabRequests to still track service sales
        // ======================
        const labSnapshot = await get(ref(database, "clinicLabRequests"));
        if (labSnapshot.exists()) {
          const labRequestsData = labSnapshot.val();
          const filteredLabRequests = await filterDataByClinic(labRequestsData, 'clinicId', true);
          
          Object.values(filteredLabRequests).forEach(request => {
            const serviceFee = parseFloat(request.serviceFee || 0);
            const requestDate = request.createdAt?.date || request.requestDate;

            if (serviceFee > 0) {
              const serviceName = request.labTestName || 'Unknown Service';
              salesByService[serviceName] = (salesByService[serviceName] || 0) + serviceFee;

              if (requestDate === today) dailySales += serviceFee;
              if (requestDate &&
                new Date(requestDate).getMonth() === currentMonth &&
                new Date(requestDate).getFullYear() === currentYear) {
                monthlySales += serviceFee;
              }
            }
          });
        }

        // ======================
        // 3. Fetch inventory items for usage categorization
        // ======================
        const itemsSnapshot = await get(ref(database, "inventoryItems"));
        let inventoryItems = {};
        if (itemsSnapshot.exists()) {
          inventoryItems = itemsSnapshot.val();
          // Filter inventory items by clinic
          inventoryItems = await filterDataByClinic(inventoryItems, 'clinicId');
        }

        // ======================
        // 4. Fetch inventoryTransactions for medicine/supply usage
        // ======================
        const transactionsSnapshot = await get(ref(database, "inventoryTransactions"));
        const medicineUsage = {};
        const supplyUsage = {};
        const transactionsByType = {};

        if (transactionsSnapshot.exists()) {
          const transactionsData = transactionsSnapshot.val();
          const filteredTransactions = await filterDataByClinic(transactionsData, 'clinicId');
          
          Object.values(filteredTransactions).forEach(transaction => {
            const type = transaction.transactionType || 'unknown';
            const quantity = Math.abs(transaction.quantityChanged || 0);
            const itemId = transaction.itemId;
            const itemName = transaction.itemName || 'Unknown Item';

            transactionsByType[type] = (transactionsByType[type] || 0) + quantity;

            if (type.toLowerCase() === 'usage') {
              const itemDetails = inventoryItems[itemId];
              const itemCategory = itemDetails?.itemCategory || '';
              const displayName = itemDetails?.itemName || itemName;
              const genericName = itemDetails?.genericName;
              const finalDisplayName =
                genericName && itemCategory.toLowerCase().includes('medicine')
                  ? `${genericName} (${itemDetails.brand || displayName})`
                  : displayName;

              const itemGroup = itemDetails?.itemGroup?.toLowerCase() || '';

              if (
                itemGroup === 'medicine' ||
                itemCategory.toLowerCase().includes('medicine') ||
                itemCategory.toLowerCase().includes('tablet') ||
                itemCategory.toLowerCase().includes('capsule')
              ) {
                medicineUsage[finalDisplayName] = (medicineUsage[finalDisplayName] || 0) + quantity;
              } else if (
                itemGroup === 'supply' ||
                itemCategory.toLowerCase().includes('supply') ||
                itemCategory.toLowerCase().includes('equipment') ||
                itemCategory.toLowerCase().includes('consumable')
              ) {
                supplyUsage[finalDisplayName] = (supplyUsage[finalDisplayName] || 0) + quantity;
              } else {
                if (
                  finalDisplayName.toLowerCase().includes('paracetamol') ||
                  finalDisplayName.toLowerCase().includes('medicine') ||
                  finalDisplayName.toLowerCase().includes('tablet') ||
                  finalDisplayName.toLowerCase().includes('capsule')
                ) {
                  medicineUsage[finalDisplayName] = (medicineUsage[finalDisplayName] || 0) + quantity;
                } else {
                  supplyUsage[finalDisplayName] = (supplyUsage[finalDisplayName] || 0) + quantity;
                }
              }
            }
          });
        }

        // ======================
        // 5. Convert to chart-friendly data
        // ======================
        const sortedSalesItems = Object.entries(salesByService)
          .map(([name, amount]) => ({ name, value: amount, sales: `₱${amount.toLocaleString()}` }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        const sortedMedicineUsage = Object.entries(medicineUsage)
          .map(([name, qty]) => ({ name, value: qty, usage: `${qty} units` }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);

        const sortedSupplyUsage = Object.entries(supplyUsage)
          .map(([name, qty]) => ({ name, value: qty, usage: `${qty} units` }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);

        const transactionsData = Object.entries(transactionsByType)
          .map(([type, qty]) => ({
            name: type.replace(/_/g, ' ').toUpperCase(),
            value: qty
          }));

        // ======================
        // 6. Set state
        // ======================
        setSalesData({ daily: dailySales, monthly: monthlySales });
        setSalesItemsData(sortedSalesItems);
        setMedicineUsageData(sortedMedicineUsage);
        setSupplyUsageData(sortedSupplyUsage);
        setInventoryTransactionsData(transactionsData);

      } catch (error) {
        console.error("Error fetching analytics data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [userRole, userClinicAffiliation, selectedClinic]);

  // Get clinic name by ID
  const getClinicName = (clinicId) => {
    return clinicsData[clinicId]?.name || clinicId;
  };

  // Custom tooltip for sales items
  const SalesItemTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0, color: '#0088FE' }}>
            Sales: ₱{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for supply usage
  const SupplyUsageTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].name}</p>
          <p style={{ margin: 0, color: '#FFBB28' }}>
            Used: {payload[0].value} units
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
        fontSize: '18px',
        color: '#666'
      }}>
        Loading Analytics...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
        Healthcare Analytics Dashboard
        {userRole !== 'superadmin' && userClinicAffiliation && (
          <div style={{ fontSize: "16px", color: "#666", marginTop: "10px" }}>
            {getClinicName(userClinicAffiliation)}
          </div>
        )}
      </h1>

      {/* Clinic Selector for Superadmin */}
      {userRole === 'superadmin' && Object.keys(clinicsData).length > 0 && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          marginBottom: "30px" 
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
          }}>
            <label style={{ marginRight: "10px", fontWeight: "bold" }}>
              Select Clinic:
            </label>
            <select 
              value={selectedClinic} 
              onChange={(e) => setSelectedClinic(e.target.value)}
              style={{
                padding: "8px 15px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                fontSize: "14px"
              }}
            >
              <option value="all">All Clinics</option>
              {Object.entries(clinicsData).map(([clinicId, clinic]) => (
                <option key={clinicId} value={clinicId}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sales Overview Cards */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "20px", 
        marginBottom: "40px" 
      }}>
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          textAlign: "center",
          minWidth: "200px"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#0088FE" }}>Today's Sales</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#333" }}>
            ₱{salesData.daily.toLocaleString()}
          </p>
        </div>
        
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          textAlign: "center",
          minWidth: "200px"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#00C49F" }}>Monthly Sales</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#333" }}>
            ₱{salesData.monthly.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Common Illness Section */}
      <div style={{ marginBottom: "40px" }}>
        <CommonIllnessChart 
          selectedClinic={selectedClinic}
          userRole={userRole}
          userClinicAffiliation={userClinicAffiliation}
          clinicsData={clinicsData}
        />
      </div>

      {/* Charts Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", 
        gap: "30px",
        marginBottom: "30px"
      }}>
        
        {/* Sales by Service - Bar Chart */}
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
            Top Services by Sales Revenue
          </h3>
          {salesItemsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesItemsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis tickFormatter={(value) => `₱${value.toLocaleString()}`} />
                <Tooltip content={<SalesItemTooltip />} />
                <Bar dataKey="value" fill="#0088FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
              No sales data available
            </div>
          )}
        </div>

        {/* Medicine Usage - Pie Chart */}
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
            Most Used Medicines
          </h3>
          {medicineUsageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={medicineUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name.length > 15 ? name.substring(0, 15) + '...' : name}: ${value}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {medicineUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} units`, 'Usage']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
              No medicine usage data available
            </div>
          )}
        </div>

        {/* Supply Usage - Bar Chart */}
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
            Most Used Supplies
          </h3>
          {supplyUsageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={supplyUsageData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} units`, 'Used']} />
                <Bar dataKey="value" fill="#FFBB28" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
              No supply usage data available
            </div>
          )}
        </div>

      </div>

      {/* Inventory Transactions Overview */}
      {inventoryTransactionsData.length > 0 && (
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          marginBottom: "30px"
        }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
            Inventory Transaction Types
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={inventoryTransactionsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Statistics */}
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
          Quick Statistics
        </h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "20px",
          textAlign: "center"
        }}>
          <div>
            <h4 style={{ margin: "0 0 10px 0", color: "#0088FE" }}>Total Services</h4>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
              {salesItemsData.length}
            </p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 10px 0", color: "#00C49F" }}>Medicines Used</h4>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
              {medicineUsageData.length}
            </p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 10px 0", color: "#FFBB28" }}>Supplies Used</h4>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
              {supplyUsageData.length}
            </p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 10px 0", color: "#FF8042" }}>Transaction Types</h4>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
              {inventoryTransactionsData.length}
            </p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 10px 0", color: "#8884d8" }}>Avg Daily Revenue</h4>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
              ₱{Math.round(salesData.monthly / 30).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;