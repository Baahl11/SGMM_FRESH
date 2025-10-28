interface CalendarEvent {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
}

export function createGoogleCalendarLink({
  title,
  description,
  startDate,
  endDate,
  location = "UME López & López",
}: CalendarEvent): string {
  // Formato de fecha para Google Calendar: YYYYMMDDTHHMMSS
  const formatDate = (date: string) => {
    return date.replace(/[-:]/g, "").replace(" ", "T") + "00Z";
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    location: location,
    dates: `${formatDate(startDate)}/${formatDate(endDate || startDate)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
