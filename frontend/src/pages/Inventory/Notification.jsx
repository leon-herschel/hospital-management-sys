import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";

// Create a simple Modal component for demonstration
const Modal = ({ isOpen, onClose, notifications }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose}>Close</button>
        <h2>Notifications</h2>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className="notification-item">
              {notification.message}
            </div>
          ))
        ) : (
          <div>No new notifications</div>
        )}
      </div>
    </div>
  );
};

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [itemsTracked, setItemsTracked] = useState({});
  const [modal, setModal] = useState(false);

  const toggleModal = () => {
    setModal((prev) => !prev); // Toggle modal state
  };

  useEffect(() => {
    const inventoryRef = ref(database, "medicine");
    const suppliesRef = ref(database, "supplies");

    const notifyLowStock = (data) => {
      const newNotifications = [];
      const updatedItemsTracked = { ...itemsTracked };

      for (const key in data) {
        const item = data[key];
        console.log(`Checking item: ${item.itemName}, Status: ${item.status}`); // Log each item's status

        if (!updatedItemsTracked[key] && item.status === "Very Low") {
          console.log(
            `Notifying about low stock: ${item.itemName}, Status: ${item.status}`
          );
        } else if (
          updatedItemsTracked[key] &&
          item.status !== "Low" &&
          item.status !== "Very Low"
        ) {
          console.log(
            `Status improved for: ${item.itemName}, Status: ${item.status}`
          );
        }

        // If the status is low and it's not already notified
        if (item.status === "Very Low" && !updatedItemsTracked[key]) {
          newNotifications.push({
            id: key,
            message: `${item.itemName} is ${item.status}`,
          });
          updatedItemsTracked[key] = true; // Mark as notified
        } else if (
          updatedItemsTracked[key] &&
          item.status !== "Low" &&
          item.status !== "Very Low"
        ) {
          // If the item is no longer low, remove from tracking
          delete updatedItemsTracked[key];
          // Remove the notification when stock status improves
          setNotifications((prevNotifications) =>
            prevNotifications.filter((notif) => notif.id !== key)
          );
        }
      }

      setItemsTracked(updatedItemsTracked);
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
  }, [itemsTracked]);

  return (
    <div className="notification-container">
      <button
        className="notification-bell"
        onClick={toggleModal}
        aria-label="View notifications"
      >
        <span role="img" aria-label="bell">
          🔔
        </span>
        {notifications.length > 0 && (
          <span className="notification-count">{notifications.length}</span>
        )}
      </button>

      {/* Modal to show notifications */}
      <Modal
        isOpen={modal}
        onClose={toggleModal}
        notifications={notifications}
      />
    </div>
  );
}

export default Notification;
