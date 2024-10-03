import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { BellIcon, BellAlertIcon } from '@heroicons/react/16/solid';

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

  const toggleModal = () => {
    setModal((prev) => !prev);
  };

  useEffect(() => {
    const inventoryRef = ref(database, "medicine");
    const suppliesRef = ref(database, "supplies");

    const notifyLowStock = (data) => {
      const newNotifications = [];
      const updatedItemsTracked = { ...itemsTrackedRef.current };

      for (const key in data) {
        const item = data[key];
        console.log(`Checking item: ${item.itemName}, Status: ${item.status}`);

        if (item.status === "Very Low" && !updatedItemsTracked[key]) {
          console.log(
            `Notifying about low stock: ${item.itemName}, Status: ${item.status}`
          );
          newNotifications.push({
            id: key,
            message: `${item.itemName} is ${item.status}`,
          });
          updatedItemsTracked[key] = true;
        } else if (
          updatedItemsTracked[key] &&
          item.status !== "Low" &&
          item.status !== "Very Low"
        ) {
          console.log(
            `Status improved for: ${item.itemName}, Status: ${item.status}`
          );

          delete updatedItemsTracked[key];

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

    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lowStockNotifications = notifyLowStock(data);
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          ...lowStockNotifications,
        ]);
      }
    });

    const unsubscribeSupplies = onValue(suppliesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lowStockNotifications = notifyLowStock(data);
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          ...lowStockNotifications,
        ]);
      }
    });

    return () => {
      unsubscribeInventory();
      unsubscribeSupplies();
    };
  }, []);
  return (
    <div className="notification-container">
      <button
        className="notification-bell"
        onClick={toggleModal}
        aria-label="View notifications"
      >
        {notifications.length > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-red-600 hover:text-red-700" /> 
        ) : (
          <BellIcon className="h-6 w-6 text-slate-800 hover:text-slate-900" /> 
        )}
        {notifications.length > 0 && (
          <span className="notification-count">{notifications.length}</span>
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
