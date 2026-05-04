import { useEffect, useState } from "react";
import { listenAvailableOrders } from "../services/orderService";

export const useLiveOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsub = listenAvailableOrders(setOrders);
    return () => unsub();
  }, []);

  return orders;
};
