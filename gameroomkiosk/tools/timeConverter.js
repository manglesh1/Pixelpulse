function time(minutes) {
    const MINUTES_IN_HOUR = 60;
    const HOURS_IN_DAY = 24;
    const DAYS_IN_MONTH = 30;
    const MONTHS_IN_YEAR = 12;

    let remainingMinutes = minutes;

    const years = Math.floor(remainingMinutes / (MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_IN_MONTH * MONTHS_IN_YEAR));
    remainingMinutes %= MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_IN_MONTH * MONTHS_IN_YEAR;

    const months = Math.floor(remainingMinutes / (MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_IN_MONTH));
    remainingMinutes %= MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_IN_MONTH;

    const days = Math.floor(remainingMinutes / (MINUTES_IN_HOUR * HOURS_IN_DAY));
    remainingMinutes %= MINUTES_IN_HOUR * HOURS_IN_DAY;

    const hours = Math.floor(remainingMinutes / MINUTES_IN_HOUR);
    remainingMinutes %= MINUTES_IN_HOUR;

    return { years, months, days, hours, minutes };
}

module.exports = time;