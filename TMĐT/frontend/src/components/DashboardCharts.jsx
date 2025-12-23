import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import LoadingSpinner from "./LoadingSpinner";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
};

const getStatusText = (status) => {
  const texts = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    processing: "Đang xử lý",
    shipping: "Đang giao hàng",
    delivered: "Đã giao hàng",
    cancelled: "Đã hủy",
    returned: "Đã trả hàng",
  };
  return texts[status] || status;
};

const COLORS = {
  pending: "#FFBB28",
  confirmed: "#0088FE",
  processing: "#8884d8",
  shipping: "#FF8042",
  delivered: "#00C49F",
  cancelled: "#F44336",
  returned: "#9E9E9E",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg">
        <p className="font-bold text-gray-800">{`Ngày: ${label}`}</p>
        <p className="text-green-600">{`Doanh thu: ${formatCurrency(
          payload[0].value
        )}`}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({
  revenueData,
  orderStats,
  topProducts,
  loading,
}) {
  if (loading) {
    return (
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border h-96 flex items-center justify-center">
          <LoadingSpinner text="Đang tải dữ liệu biểu đồ..." />
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border h-96 flex items-center justify-center">
          <LoadingSpinner text="Đang tải thống kê..." />
        </div>
      </div>
    );
  }

  const pieData = orderStats?.stats
    ?.filter((stat) => stat.count > 0)
    .map((stat) => ({
      name: getStatusText(stat.Trang_thai),
      value: stat.count,
      color: COLORS[stat.Trang_thai] || "#CCCCCC",
    }));

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Revenue Chart */}
      <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Phân tích doanh thu (30 ngày qua)
        </h3>
        {revenueData && revenueData.data && revenueData.data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={revenueData.data}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(value) =>
                  new Intl.NumberFormat("vi-VN", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "14px" }} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Không có đủ dữ liệu để hiển thị.
          </div>
        )}
      </div>

      {/* Order Stats Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Tỷ lệ trạng thái đơn hàng (30 ngày qua)
        </h3>
        {pieData && pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${value} đơn`,
                  name,
                ]}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "14px" }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Không có dữ liệu trạng thái đơn hàng.
          </div>
        )}
      </div>

      {/* Top Selling Products */}
      <div className="lg:col-span-5 bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Top 5 sản phẩm bán chạy (30 ngày qua)
        </h3>
        {topProducts &&
        topProducts.products &&
        topProducts.products.length > 0 ? (
          <div className="space-y-4">
            {topProducts.products.map((product, index) => (
              <div
                key={product.ID_San_pham}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-gray-400">
                    {index + 1}
                  </span>
                  <img
                    src={product.Thumbnail}
                    alt={product.Ten_san_pham}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {product.Ten_san_pham}
                    </p>
                    <p className="text-sm text-gray-500">
                      {product.Ten_danh_muc}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-brand-600">
                    {product.total_sold}
                  </p>
                  <p className="text-sm text-gray-500">lượt bán</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-500">
            Không có dữ liệu sản phẩm bán chạy.
          </div>
        )}
      </div>
    </div>
  );
}
