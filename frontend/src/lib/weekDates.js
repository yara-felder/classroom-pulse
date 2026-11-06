import { startOfWeek, addDays, format } from "date-fns";

// Mon–Fri of the current week with "M/d" labels and yyyy-MM-dd keys.
export const currentWeekdays = () => {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return [0, 1, 2, 3, 4].map((i) => {
    const d = addDays(monday, i);
    return { date: d, label: format(d, "M/d"), key: format(d, "yyyy-MM-dd") };
  });
};

export const dayKey = (iso) => format(new Date(iso), "yyyy-MM-dd");
