
export const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins} دقيقة`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ساعة`;
  return `${Math.floor(diffMins / 1440)} يوم`;
};

export const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
