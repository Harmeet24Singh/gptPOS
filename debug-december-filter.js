// Debug the exact month filter logic
const monthFilter = "2025-12";
const [year, month] = monthFilter.split("-");

console.log("Month filter:", monthFilter);
console.log("Parsed year:", year, typeof year);
console.log("Parsed month:", month, typeof month);

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
console.log("Next month calc:", nextMonth);
console.log("Next year calc:", nextYear);
console.log(
  "Month end string:",
  `${nextYear}-${nextMonth.toString().padStart(2, "0")}-01T00:00:00.000Z`,
);

// Test sample timestamp
const sampleTimestamp = new Date("2025-12-27T17:32:00.000Z");
console.log("Sample timestamp:", sampleTimestamp);
console.log("Is sample >= monthStart?", sampleTimestamp >= monthStart);
console.log("Is sample < monthEnd?", sampleTimestamp < monthEnd);
console.log(
  "Is sample in range?",
  sampleTimestamp >= monthStart && sampleTimestamp < monthEnd,
);
