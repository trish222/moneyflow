export default function Savings() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-purple-600 mb-6">Savings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">
            Emergency Fund
          </h2>
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">$0 / $1000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Vacation Fund</h2>
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">$0 / $2000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
