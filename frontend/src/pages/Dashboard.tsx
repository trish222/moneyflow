// Import React hooks used in this component
import { useEffect, useState, useCallback } from "react";

// Define the shape of the dashboard metrics data we get from the API
// This ensures type safety and helps catch errors early
interface DashboardMetrics {
  netWorth: number; // Total assets minus total debts
  availableFunds: number; // Available amount to use
  debts: number; // Total amount owed
  savings: number; // Total savings goal progress
  investmentsValue: number; // Total value of investments
}

// Main Dashboard component - displays financial metrics in card format
export default function Dashboard() {
  // State to store the financial metrics data from the API
  // Initialized with all zeros until data is fetched
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    netWorth: 0,
    availableFunds: 0,
    debts: 0,
    savings: 0,
    investmentsValue: 0,
  });

  // State to track if data is currently loading from the API
  // Used to show "Loading..." message while waiting for data
  const [loading, setLoading] = useState(true);

  // State to track which filter type is selected: "all", "year", or "month"
  // Default is "all" to show all-time data
  const [filterType, setFilterType] = useState("all");

  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // State for the selected month (1-12)
  // Defaults to current month (getMonth() returns 0-11, so we add 1)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // State for the selected year
  // Defaults to current year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Memoized function to fetch metrics from the backend API
  // useCallback ensures this function only changes when its dependencies change
  // This prevents unnecessary re-renders and re-fetches
  const fetchMetrics = useCallback(async () => {
    try {
      // Set loading to true while fetching
      setLoading(true);

      // Start with the base API URL
      let url = "http://localhost:3000/api/dashboard/metrics";

      // Adjust URL based on selected filter type
      // Add query parameters to filter by time period
      if (filterType === "month") {
        // If filtering by month, add month and year parameters
        url += `?month=${selectedMonth}&year=${selectedYear}`;
      } else if (filterType === "year") {
        // If filtering by year, add only year parameter
        url += `?year=${selectedYear}`;
      } else if (filterType === "day") {
        // If filtering by day, add day, month, and year parameters
        url += `?day=${selectedDay}&month=${selectedMonth}&year=${selectedYear}`;
      }
      // If "all" is selected, no parameters are added (shows all-time data)

      // Make the API request
      const response = await fetch(url);

      // Parse the JSON response
      const data = await response.json();

      // Update the metrics state with the fetched data
      setMetrics(data);
    } catch (error) {
      // Log any errors that occur during the fetch
      console.error("Error fetching metrics:", error);
    } finally {
      // Set loading to false after fetch completes (success or error)
      setLoading(false);
    }
  }, [filterType, selectedMonth, selectedYear, selectedDay]); // Re-create function if filter settings change

  // Effect hook - runs when component mounts or when fetchMetrics changes
  // This automatically fetches updated metrics whenever filters are changed
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]); // Dependency: re-run when fetchMetrics function changes

  // Array of month names used in the month filter dropdown
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Array of years to show in the year filter dropdown
  // Creates 10 years: 5 years before current year to 5 years after
  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i,
  );

  return (
    // Main container with padding
    <div className="p-8">
      {/* Header section with title and filters */}
      <div className="flex justify-between items-center mb-6">
        {/* Dashboard title */}
        <h1 className="text-4xl font-bold text-purple-600">Dashboard</h1>

        {/* Filter Controls - placed in top right of dashboard */}
        <div className="flex gap-4 items-center">
          {/* Main filter type selector dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Time</option>
            <option value="year">By Year</option>
            <option value="month">By Month</option>
            <option value="day">By Day</option>
          </select>

          {/* Year selector - only shown when filter type is "year" */}
          {filterType === "year" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {/* Generate option for each year in the years array */}
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}

          {/* Month and Year selectors - only shown when filter type is "month" */}
          {filterType === "month" && (
            <>
              {/* Month selector dropdown */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {/* Generate an option for each month */}
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>

              {/* Year selector dropdown for month view */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {/* Generate option for each year in the years array */}
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Day, Month, and Year selectors - only shown when filter type is "day" */}
          {filterType === "day" && (
            <>
              {/* Day selector dropdown */}
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {/* Generate an option for each day */}
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>

              {/* Month selector dropdown */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {/* Generate an option for each month */}
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>

              {/* Year selector dropdown for month view */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {/* Generate option for each year in the years array */}
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Conditional rendering: Show loading message OR the metrics cards */}
      {loading ? (
        // Loading state - display while fetching data
        <div className="text-center py-12">
          <p className="text-gray-500">Loading metrics...</p>
        </div>
      ) : (
        // Metrics cards grid - responsive layout that adapts to screen size
        // On mobile: 1 column, tablet: 2 columns, desktop: 5 columns
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Card 1: Net Worth */}
          {/* Shows total assets minus debts (can be negative if debts exceed assets) */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-sm font-semibold text-gray-600 uppercase">
              Net Worth
            </h2>
            <p className="text-3xl font-bold text-purple-600 mt-3">
              ${metrics.netWorth.toFixed(2)}
            </p>
          </div>

          {/* Card 2: Available Funds */}
          {/* Shows total money available in all accounts (checking, savings, etc.) */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-sm font-semibold text-gray-600 uppercase">
              Available Funds
            </h2>
            <p className="text-3xl font-bold text-green-600 mt-3">
              ${metrics.availableFunds.toFixed(2)}
            </p>
          </div>

          {/* Card 3: Debts */}
          {/* Shows total amount owed (loans, credit cards, etc.) */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-sm font-semibold text-gray-600 uppercase">
              Debts
            </h2>
            <p className="text-3xl font-bold text-red-600 mt-3">
              ${metrics.debts.toFixed(2)}
            </p>
          </div>

          {/* Card 4: Savings */}
          {/* Shows cumulative progress toward all savings goals */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-sm font-semibold text-gray-600 uppercase">
              Savings
            </h2>
            <p className="text-3xl font-bold text-blue-600 mt-3">
              ${metrics.savings.toFixed(2)}
            </p>
          </div>

          {/* Card 5: Investments */}
          {/* Shows total current value of all investments (stocks, bonds, etc.) */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-sm font-semibold text-gray-600 uppercase">
              Investments
            </h2>
            <p className="text-3xl font-bold text-indigo-600 mt-3">
              ${metrics.investmentsValue.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
