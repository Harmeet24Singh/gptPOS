// Debug script to test month filter date generation
const testMonthFilter = (monthFilter) => {
  console.log("Testing month filter:", monthFilter);

  // monthFilter format: "2025-12" for December 2025
  const [year, month] = monthFilter.split("-");

  console.log("Parsed year:", year);
  console.log("Parsed month:", month);

  // Original logic from mongo.js
  const monthStart = new Date(
    `${year}-${month.padStart(2, "0")}-01T00:00:00.000Z`,
  );
  const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
  const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
  const monthEnd = new Date(
    `${nextYear}-${nextMonth.toString().padStart(2, "0")}-01T00:00:00.000Z`,
  );

  console.log("Month start:", monthStart);
  console.log("Month end:", monthEnd);
  console.log("Month start ISO:", monthStart.toISOString());
  console.log("Month end ISO:", monthEnd.toISOString());

  // Test with local timezone version
  const localMonthStart = new Date(
    parseInt(year),
    parseInt(month) - 1,
    1,
    0,
    0,
    0,
    0,
  );
  const localNextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
  const localNextYear =
    parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
  const localMonthEnd = new Date(
    localNextYear,
    localNextMonth - 1,
    1,
    0,
    0,
    0,
    0,
  );

  console.log("Local month start:", localMonthStart);
  console.log("Local month end:", localMonthEnd);
  console.log("Local month start ISO:", localMonthStart.toISOString());
  console.log("Local month end ISO:", localMonthEnd.toISOString());

  // Test sample transaction date
  const sampleTransactionDate = new Date("2025-12-27T17:32:00.000Z");
  console.log("Sample transaction date:", sampleTransactionDate);
  console.log("Sample transaction ISO:", sampleTransactionDate.toISOString());

  console.log(
    "Is sample between UTC dates?",
    sampleTransactionDate >= monthStart && sampleTransactionDate < monthEnd,
  );
  console.log(
    "Is sample between local dates?",
    sampleTransactionDate >= localMonthStart &&
      sampleTransactionDate < localMonthEnd,
  );
};

// Test December 2025
testMonthFilter("2025-12");
