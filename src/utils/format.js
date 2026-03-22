/**
 * Formats wait time in minutes to a human-readable string (e.g., "1h 20m" or "15m").
 * @param {number} minutes 
 * @returns {string}
 */
export const formatWaitTime = (minutes) => {
    if (minutes === undefined || minutes === null) return 'N/A';
    if (minutes <= 0) return 'Your turn!';
    
    if (minutes < 60) {
        return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
        return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
};
