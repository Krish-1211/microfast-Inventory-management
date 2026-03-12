// Tanzania Shilling formatter — use throughout the app
export const formatTZS = (amount: number): string => {
    return `TZS ${amount.toLocaleString("en-TZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
};
