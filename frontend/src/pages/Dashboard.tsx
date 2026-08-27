interface StatCard {
  title: string;
  value: string;
  description: string;
}

const stats: StatCard[] = [
  {
    title: "Today’s Sales",
    value: "₱0.00",
    description: "Total sales today",
  },
  {
    title: "Transactions",
    value: "0",
    description: "Sales transactions today",
  },
  {
    title: "Products",
    value: "0",
    description: "Active products",
  },
  {
    title: "Low Stock",
    value: "0",
    description: "Products need attention",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        <p className="mt-1 text-sm text-gray-500">Welcome to iPOS.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{stat.title}</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {stat.value}
            </p>

            <p className="mt-1 text-xs text-gray-500">{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>

          <div className="mt-6 flex h-40 items-center justify-center text-sm text-gray-400">
            No sales recorded yet.
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Low Stock Products
          </h2>

          <div className="mt-6 flex h-40 items-center justify-center text-sm text-gray-400">
            No low-stock products.
          </div>
        </div>
      </div>
    </div>
  );
}
