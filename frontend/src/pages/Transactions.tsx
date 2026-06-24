export default function Transactions() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-purple-600 mb-6">Transactions</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="text-left px-6 py-4 font-semibold">Date</th>
              <th className="text-left px-6 py-4 font-semibold">Description</th>
              <th className="text-left px-6 py-4 font-semibold">Category</th>
              <th className="text-right px-6 py-4 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td colSpan={4} className="text-center px-6 py-8 text-gray-500">
                No transactions yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
