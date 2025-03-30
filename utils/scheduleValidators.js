export function isValidScheduleForCategory(schedule, rule) {
    const days = Object.values(schedule || {});
    return days.some(day => {
      if (day.isClosed) return false;
      if (!day.open) return false;
  
      const [hours, minutes] = day.open.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes;
  
      if (rule === "openAfter20") return totalMinutes >= 20 * 60;
      if (rule === "openBefore8") return totalMinutes < 8 * 60;
  
      return true;
    });
  }
  