/* Dashboard.tsx renders (produce & displays output) the application's main summary view.
 * - displays total balance, monthly income, and spending overview cards.
 * - used as the landing page route in the app router.
 */
export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-purple-600 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Balance</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">$0.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">
            Monthly Income
          </h2>
          <p className="text-3xl font-bold text-blue-600 mt-2">$0.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">
            Monthly Spending
          </h2>
          <p className="text-3xl font-bold text-red-600 mt-2">$0.00</p>
        </div>
      </div>
    </div>
  );
}
