import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";

interface CustomCalendarProps {
    selected?: Date;
    onSelect: (date: Date) => void;
    initialFocus?: boolean;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
    selected,
    onSelect,
    initialFocus = false,
}) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1)
    );

    useEffect(() => {
        if (initialFocus && selected == null) {
            onSelect(today);
        }
    }, [initialFocus]);

    const daysInMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
    ).getDate();

    const startDay = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
    ).getDay();

    const handlePrevMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
        );
    };

    const handleNextMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        );
    };

    const isSameDay = (date1: Date, date2: Date) =>
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();

    const renderDays = () => {
        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2" />);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const currentDate = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                i
            );
            const isSelected = selected && isSameDay(selected, currentDate);
            const isToday = isSameDay(today, currentDate);

            days.push(
                <button
                    key={i}
                    onClick={() => onSelect(currentDate)}
                    className={`aspect-square flex items-center justify-center text-sm font-medium transition-all duration-200 rounded-md ${isSelected
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : isToday
                                ? "bg-accent text-accent-foreground border border-primary/20"
                                : "hover:bg-accent hover:text-accent-foreground text-foreground"
                        }`}
                >
                    {i}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="w-full max-w-sm border border-border rounded-xl p-6 shadow-lg bg-card text-card-foreground">
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="font-semibold text-lg text-foreground">
                    {currentMonth.toLocaleString("default", { month: "long" })}{" "}
                    {currentMonth.getFullYear()}
                </div>
                <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-muted-foreground mb-4">
                {WEEK_DAYS.map((day) => (
                    <div key={day} className="text-sm font-semibold py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">{renderDays()}</div>
        </div>
    );
};
