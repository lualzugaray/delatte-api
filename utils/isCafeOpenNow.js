export function isCafeOpenNow(schedule) {
    const now = new Date();
    const dayNames = [
      "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); 
  
    const daySchedule = schedule[currentDay];
  
    if (!daySchedule || daySchedule.isClosed) return false;
  
    return (
      currentTime >= daySchedule.open &&
      currentTime <= daySchedule.close
    );
  }
  