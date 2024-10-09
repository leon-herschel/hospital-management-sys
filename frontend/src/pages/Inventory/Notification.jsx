import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { BellIcon, BellAlertIcon } from "@heroicons/react/16/solid";
import { getAuth } from "firebase/auth";

const Modal = ({ isOpen, onClose, notifications }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">Notifications</h2>

        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="notification-item mb-4 p-4 bg-blue-100 rounded border border-blue-200"
            >
              {notification.message}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-600">No new notifications</div>
        )}
      </div>
    </div>
  );
};

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const itemsTrackedRef = useRef({});
  const [modal, setModal] = useState(false);
  const [department, setDepartment] = useState("");

  const auth = getAuth();
  const user = auth.currentUser;

  const toggleModal = () => {
    setModal((prev) => !prev);
  };

  // Fetch user department
  useEffect(() => {
    if (user) {
      const userDepartmentRef = ref(database, `users/${user.uid}/department`);
      onValue(userDepartmentRef, (snapshot) => {
        const departmentData = snapshot.val();
        if (departmentData) {
          setDepartment(departmentData);
        }
      });
    }
  }, [user]);

  // Listen for inventory updates
  useEffect(() => {
    if (department) {
      const inventoryRef = ref(database, `departments/${department}/localMeds`);
      const suppliesRef = ref(database, `departments/${department}/localSupplies`);

      const notifyLowStock = (data) => {
        const newNotifications = [];
        const updatedItemsTracked = { ...itemsTrackedRef.current };

        for (const key in data) {
          const item = data[key];
          console.log(`Checking item: ${item.itemName}, Status: ${item.status}`);

          // Notify if the status is "Very Low" and not already tracked
          if (item.status === "Very Low" && !updatedItemsTracked[key]) {
            console.log(
              `Notifying about low stock: ${item.itemName}, Status: ${item.status}`
            );
            newNotifications.push({
              id: key,
              message: `${item.itemName} is ${item.status}`,
            });
            updatedItemsTracked[key] = true;
          }
          // Remove from notifications if status is now "Good"
          else if (
            updatedItemsTracked[key] &&
            (item.status === "Good" || item.status === "Low")
          ) {
            console.log(
              `Status improved for: ${item.itemName}, Status: ${item.status}`
            );
            delete updatedItemsTracked[key];

            // Remove the notification for the improved item
            setNotifications((prevNotifications) =>
              prevNotifications.filter((notif) => notif.id !== key)
            );
          }
        }

        itemsTrackedRef.current = updatedItemsTracked;
        return newNotifications.filter(
          (newNotif) =>
            !notifications.some(
              (existingNotif) => existingNotif.id === newNotif.id
            )
        );
      };

      const updateNotifications = (data) => {
        const lowStockNotifications = notifyLowStock(data);
        if (lowStockNotifications.length > 0) {
          setNotifications((prevNotifications) => [
            ...prevNotifications,
            ...lowStockNotifications,
          ]);
        }
      };

      const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          updateNotifications(data);
        }
      });

      const unsubscribeSupplies = onValue(suppliesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          updateNotifications(data);
        }
      });

      // Cleanup listeners on component unmount
      return () => {
        unsubscribeInventory();
        unsubscribeSupplies();
      };
    }
  }, [department, notifications]);

  return (
    <div className="notification-container relative">
      <button
        className="notification-bell relative"
        onClick={toggleModal}
        aria-label="View notifications"
      >
        {notifications.length > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-slate-800 hover:text-slate-900" />
        ) : (
          <BellIcon className="h-6 w-6 text-slate-800 hover:text-slate-900" />
        )}

        {notifications.length > 0 && (
          <span className="notification-count absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      <Modal
        isOpen={modal}
        onClose={toggleModal}
        notifications={notifications}
      />
    </div>
  );
}

export default Notification;
