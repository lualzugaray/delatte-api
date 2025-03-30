export function validateLateNight(schedule) {
    const days = Object.values(schedule || {});
    return days.some((day) => {
      if (!day?.isClosed && day?.close) {
        const [h, m] = day.close.split(":").map(Number);
        return h > 22 || (h === 22 && m > 0);
      }
      return false;
    });
  }
  