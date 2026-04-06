import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useFirstPurchase() {
  const { user } = useAuth();
  const [isFirstPurchase, setIsFirstPurchase] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setIsFirstPurchase(true);
      setLoading(false);
      return;
    }

    fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then((orders: any[]) => {
        const completedOrders = orders.filter(
          (order: any) => order.status === "confirmed" || order.status === "completed"
        );
        setIsFirstPurchase(completedOrders.length === 0);
      })
      .catch(() => {
        setIsFirstPurchase(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.email]);

  return { isFirstPurchase, loading };
}
