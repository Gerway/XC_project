import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import './DatePicker.scss';

interface DatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (start: Date, end: Date) => void;
    startDate?: Date;
    endDate?: Date;
}

const HOLIDAYS: Record<string, string> = {
    '2-14': '情人节',
    '5-1': '劳动节',
    '6-1': "儿童节",
};

const normalizeDate = (d: Date) => {
    const newDate = new Date(d);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
};

const DatePicker: React.FC<DatePickerProps> = ({ isOpen, onClose, onSelect, startDate: initialStart, endDate: initialEnd }) => {
    const [startDate, setStartDate] = useState<Date | null>(() => initialStart ? normalizeDate(initialStart) : normalizeDate(new Date()));
    const [endDate, setEndDate] = useState<Date | null>(() => {
        if (initialEnd) return normalizeDate(initialEnd);
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        return normalizeDate(tmr);
    });

    useEffect(() => {
        if (isOpen) {
            const start = initialStart ? normalizeDate(initialStart) : normalizeDate(new Date());
            const end = initialEnd ? normalizeDate(initialEnd) : (() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return normalizeDate(d);
            })();
            setStartDate(start);
            setEndDate(end);
        }
    }, [isOpen, initialStart, initialEnd]);

    const months = useMemo(() => {
        const result: Date[] = [];
        const today = new Date();
        for (let i = 0; i < 6; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
            result.push(d);
        }
        return result;
    }, []);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const getHoliday = (date: Date) => {
        const key = `${date.getMonth() + 1}-${date.getDate()}`;
        return HOLIDAYS[key];
    };

    const handleDateClick = (date: Date) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(date);
            setEndDate(null);
        } else {
            if (date < startDate) {
                setStartDate(date);
                setEndDate(null);
            } else {
                setEndDate(date);
            }
        }
    };

    const formatMonth = (date: Date) => {
        // Taro doesn't verify locale string exactly like browser, simple formatting
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    };

    const handleDone = () => {
        if (startDate && endDate) {
            onSelect(startDate, endDate);
        } else if (startDate) {
            const nextDay = new Date(startDate);
            nextDay.setDate(startDate.getDate() + 1);
            onSelect(startDate, nextDay);
        }
        onClose();
    };

    const handleClear = () => {
        setStartDate(null);
        setEndDate(null);
    };

    if (!isOpen) return null;

    const totalNights = startDate && endDate
        ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    const today = normalizeDate(new Date());

    return (
        <View className="date-picker">
            {/* Header */}
            <View className="date-picker__header">
                <View onClick={handleClear} className="date-picker__clear-btn">
                    <Text>清空</Text>
                </View>
                <Text className="date-picker__title">选择日期</Text>
                {/* 伪类占位，保持flex-between居中 */}
                <View className="date-picker__placeholder" />
            </View>

            {/* Week Header */}
            <View className="date-picker__week-header">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                    <Text key={d} className="date-picker__week-day">{d}</Text>
                ))}
            </View>

            {/* Calendar Body */}
            <ScrollView scrollY className="date-picker__body">
                {months.map((monthDate) => {
                    const { days, firstDay } = getDaysInMonth(monthDate);
                    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
                    const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

                    return (
                        <View key={monthDate.toISOString()} className="date-picker__month">
                            <Text className="date-picker__month-title">{formatMonth(monthDate)}</Text>
                            <View className="date-picker__days-grid">
                                {emptyDays.map(i => <View key={`empty-${i}`} />)}
                                {daysArray.map(day => {
                                    const current = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
                                    const isPast = current < today;
                                    const isStart = startDate && isSameDay(current, startDate);
                                    const isEnd = endDate && isSameDay(current, endDate);
                                    const isToday = isSameDay(current, today);
                                    const holiday = getHoliday(current);
                                    const inRange = startDate && endDate && current > startDate && current < endDate;
                                    const hasRightConnector = isStart && endDate && endDate > startDate;
                                    const hasLeftConnector = isEnd && startDate && endDate > startDate;

                                    let mainText = day.toString();
                                    if (day < 10) mainText = `0${day}`;
                                    if (isToday && isStart) mainText = "今天";

                                    return (
                                        <View
                                            key={day}
                                            className={`date-picker__day ${isPast ? 'date-picker__day--past' : ''}`}
                                            onClick={() => !isPast && handleDateClick(current)}
                                        >
                                            {/* Range Connectors */}
                                            <View className="date-picker__day-connectors">
                                                <View className={`date-picker__day-connector-half ${(inRange || hasLeftConnector) ? 'date-picker__day-connector-half--active' : ''}`}></View>
                                                <View className={`date-picker__day-connector-half ${(inRange || hasRightConnector) ? 'date-picker__day-connector-half--active' : ''}`}></View>
                                            </View>

                                            {/* Main Content */}
                                            <View className={`date-picker__day-content
                        ${isStart ? 'date-picker__day-content--start' : ''}
                        ${isEnd ? 'date-picker__day-content--end' : ''}
                        ${!isStart && !isEnd && !inRange ? 'date-picker__day-content--hoverable' : ''}
                      `}>
                                                {holiday && (
                                                    <Text className="date-picker__day-holiday">{holiday}</Text>
                                                )}

                                                <Text className={`date-picker__day-number ${isStart ? 'date-picker__day-number--start' : ''} ${isEnd ? 'date-picker__day-number--end' : ''}`}>
                                                    {mainText}
                                                </Text>

                                                {(isStart || isEnd) && (
                                                    <Text className={`date-picker__day-label ${isStart ? 'date-picker__day-label--start' : 'date-picker__day-label--end'}`}>
                                                        {isStart ? '入住' : '离店'}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Footer */}
            <View className="date-picker__footer">
                <View className="date-picker__footer-info">
                    <Text className="date-picker__nights-text">共 {totalNights} 晚</Text>
                    <Text className="date-picker__price-badge">查看价格</Text>
                </View>
                <Button
                    onClick={handleDone}
                    className="date-picker__done-btn"
                >
                    完成
                </Button>
            </View>
        </View>
    );
};

export default DatePicker;
