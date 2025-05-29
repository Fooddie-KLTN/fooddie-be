import { apiRequest } from '@/api/base-api';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';

interface Shipper {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    orders?: any[];
  };
  cccd: string;
  driverLicense: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export function useShippers() {
  const [activeShippers, setActiveShippers] = useState<Shipper[]>([]);
  const [pendingShippers, setPendingShippers] = useState<Shipper[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken() || undefined;
      console.log('🔐 Using token:', token);

      const [activeData, pendingData] = await Promise.all([
        apiRequest<Shipper[]>('/users/shippers', 'GET', {
          token,
          query: { status: 'APPROVED' },
        }),
        apiRequest<Shipper[]>('/users/shippers', 'GET', {
          token,
          query: { status: 'PENDING' },
        }),
      ]);

      console.log('✅ Active shippers:', activeData);
      console.log('🕒 Pending shippers:', pendingData);

      setActiveShippers(Array.isArray(activeData) ? activeData : []);
      setPendingShippers(Array.isArray(pendingData) ? pendingData : []);
    } catch (err: any) {
      console.error('❌ Failed to fetch shippers:', err.message || err);
      setActiveShippers([]);
      setPendingShippers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveShipper = async (id: string) => {
    try {
      const token = await getToken() || undefined; // hoặc lấy từ context
      await apiRequest(`/users/shippers/${id}/approve`, 'PATCH', { token });
      await fetchData(); // hoặc refresh()
    } catch (error) {
      console.error("❌ Failed to approve shipper:", error);
    }
  };

  const rejectShipper = async (id: string) => {
    const token = getToken() || undefined;
    console.log(`🚫 Rejecting shipper: ${id}`);
    await apiRequest(`/shippers/${id}/reject`, 'PATCH', { token });
    fetchData();
  };

  return {
    activeShippers,
    pendingShippers,
    loading,
    approveShipper,
    rejectShipper,
    refresh: fetchData,
  };
}
