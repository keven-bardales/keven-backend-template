export class DateUtils {
  static utcNow(): string {
    return new Date().toISOString();
  }

  static dateOnlyUtc(date: Date | string): string {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  static endOfDayUtc(date: Date | string): string {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d.toISOString();
  }

  static parseIsoDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format, expected ISO 8601');
    }
    return date;
  }

  static addDays(date: Date | string, days: number): string {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString();
  }

  static addHours(date: Date | string, hours: number): string {
    const d = new Date(date);
    d.setUTCHours(d.getUTCHours() + hours);
    return d.toISOString();
  }

  static addMinutes(date: Date | string, minutes: number): string {
    const d = new Date(date);
    d.setUTCMinutes(d.getUTCMinutes() + minutes);
    return d.toISOString();
  }

  static isBefore(date1: Date | string, date2: Date | string): boolean {
    return new Date(date1) < new Date(date2);
  }

  static isAfter(date1: Date | string, date2: Date | string): boolean {
    return new Date(date1) > new Date(date2);
  }

  static isBetween(date: Date | string, start: Date | string, end: Date | string): boolean {
    const d = new Date(date);
    return d >= new Date(start) && d <= new Date(end);
  }

  static formatUtcDate(
    date: Date | string,
    format: 'date' | 'datetime' | 'time' = 'datetime'
  ): string {
    const d = new Date(date);

    switch (format) {
      case 'date':
        return d.toISOString().split('T')[0];
      case 'time':
        return d.toISOString().split('T')[1].split('.')[0];
      case 'datetime':
      default:
        return d.toISOString();
    }
  }

  static getDifferenceInDays(date1: Date | string, date2: Date | string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static getDifferenceInHours(date1: Date | string, date2: Date | string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  static getDifferenceInMinutes(date1: Date | string, date2: Date | string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60));
  }

  static isExpired(expiryDate: Date | string): boolean {
    return new Date(expiryDate) < new Date();
  }

  static getStartOfWeekUtc(date: Date | string = new Date()): string {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  static getEndOfWeekUtc(date: Date | string = new Date()): string {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + 7;
    d.setUTCDate(diff);
    d.setUTCHours(23, 59, 59, 999);
    return d.toISOString();
  }

  static getStartOfMonthUtc(date: Date | string = new Date()): string {
    const d = new Date(date);
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  static getEndOfMonthUtc(date: Date | string = new Date()): string {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + 1, 0);
    d.setUTCHours(23, 59, 59, 999);
    return d.toISOString();
  }
}
