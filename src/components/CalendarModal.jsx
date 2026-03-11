import React, { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { calendarService } from "../services/calendar.service.js";
import { formatError } from "../lib/api.js";
import { Solar, Lunar } from "lunar-javascript";

export default function CalendarModal({ isOpen, onClose }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [anniversaries, setAnniversaries] = useState([]);
    const [birthdays, setBirthdays] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    // Tính toán danh sách ngày cần hiển thị trên lưới lịch (Từ T2 -> CN)
    const getDaysInMonthForGrid = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const days = [];

        // Điều chỉnh t2 -> cn. getDay() trả về CN=0, T2=1... 
        // Lịch VN: T2 là đầu tuần.
        let startPadding = firstDayOfMonth.getDay() - 1;
        if (startPadding < 0) startPadding = 6; // Nếu là CN thì thụt vào 6 ô

        // Những ngày của tháng trước (in mờ)
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startPadding - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                month: month - 1,
                year: year,
                isCurrentMonth: false
            });
        }

        // Những ngày của tháng hiện tại
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            days.push({
                day: i,
                month: month,
                year: year,
                isCurrentMonth: true
            });
        }

        // Những ngày của tháng sau để cho tròn lưới (thường là 42 ô = 6 hàng)
        const currentGridSize = days.length;
        const totalCells = Math.ceil(currentGridSize / 7) * 7;
        const remaining = totalCells - currentGridSize;

        for (let i = 1; i <= remaining; i++) {
            days.push({
                day: i,
                month: month + 1,
                year: year,
                isCurrentMonth: false
            });
        }

        // Bổ sung thông tin Âm Lịch cho mỗi ngày
        return days.map(d => {
            const solarDate = new Date(d.year, d.month, d.day);
            const solar = Solar.fromDate(solarDate);
            const lunar = solar.getLunar();

            // Xử lý hiển thị ngày Âm: mùng 1 nên hiện "1/Tháng", các ngày khác hiện số
            let lunarLabel = lunar.getDay().toString();
            if (lunar.getDay() === 1) {
                lunarLabel = `1/${lunar.getMonth()}${lunar.getMonth() < 0 ? ' (Nhuận)' : ''}`;
            }

            return {
                ...d,
                lunarDay: lunar.getDay(),
                lunarMonth: lunar.getMonth(),
                lunarYear: lunar.getYear(),
                lunarLabel: lunarLabel,
                isToday: solarDate.toDateString() === new Date().toDateString()
            };
        });
    };

    const daysGrid = getDaysInMonthForGrid(currentDate);

    // Tải sự kiện giỗ chạp trong tháng
    useEffect(() => {
        if (!isOpen) return;

        const loadMonthEvents = async () => {
            setLoadingEvents(true);
            try {
                // Solar month overlaps with multiple lunar months.
                // Fetch current month and the month before/after to be safe.
                const m = currentDate.getMonth() + 1;
                const prevM = m === 1 ? 12 : m - 1;
                const nextM = m === 12 ? 1 : m + 1;

                const fetchPromises = [
                    calendarService.anniversaries(m),
                    calendarService.birthdays(m),
                    calendarService.anniversaries(prevM),
                    calendarService.birthdays(prevM),
                    calendarService.anniversaries(nextM),
                    calendarService.birthdays(nextM)
                ];

                const [aCur, bCur, aPrev, bPrev, aNext, bNext] = await Promise.all(fetchPromises);

                const safeArr = (val) => Array.isArray(val) ? val : (val?.data || []);

                // Combine and de-duplicate if necessary (though months should be distinct)
                setAnniversaries([...safeArr(aPrev), ...safeArr(aCur), ...safeArr(aNext)]);
                setBirthdays([...safeArr(bPrev), ...safeArr(bCur), ...safeArr(bNext)]);
            } catch (e) {
                console.error(formatError(e));
            } finally {
                setLoadingEvents(false);
            }
        };

        loadMonthEvents();
    }, [currentDate, isOpen]);


    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    if (!isOpen) return null;

    const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    return (
        <div className="modal-overlay" style={{
            position: "fixed",
            inset: 0,
            background: "rgba(44, 34, 26, 0.5)",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)"
        }}>
            <div className="modal-content" style={{
                maxWidth: 900,
                width: "95%",
                borderRadius: 24,
                padding: 32,
                display: "flex",
                flexDirection: "column",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "var(--surface)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
            }}>
                <div className="modal-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="avatar" style={{ background: "var(--primary-light)", color: "var(--primary)", width: 44, height: 44 }}>
                            <CalendarIcon size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-dark)" }}>Lịch Âm Toàn Tập</h3>
                            <div className="small" style={{ color: "var(--text-light)" }}>Tra cứu lịch vạn niên và sự kiện dòng họ</div>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-light)" }}>
                        <X size={28} />
                    </button>
                </div>

                <div className="row" style={{ alignItems: "flex-start", gap: 32 }}>
                    {/* KHU VỰC LỊCH GRID */}
                    <div style={{ flex: 2 }}>
                        <div className="row" style={{ justifyContent: "space-between", marginBottom: 24, alignItems: "center" }}>
                            <h2 style={{ margin: 0, fontSize: 24, color: "var(--text-dark)" }}>
                                Tháng {currentDate.getMonth() + 1}, Năm {currentDate.getFullYear()}
                            </h2>
                            <div className="row" style={{ gap: 8 }}>
                                <button className="btn outline" onClick={goToToday} style={{ borderRadius: 8 }}>Hôm nay</button>
                                <button className="btn outline" onClick={prevMonth} style={{ borderRadius: 8, padding: "8px" }}><ChevronLeft size={20} /></button>
                                <button className="btn outline" onClick={nextMonth} style={{ borderRadius: 8, padding: "8px" }}><ChevronRight size={20} /></button>
                            </div>
                        </div>

                        {/* Tiêu đề Ngày trong tuần */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "8px" }}>
                            {WEEKDAYS.map(day => (
                                <div key={day} style={{ textAlign: "center", fontWeight: 700, color: (day === "CN" || day === "T7") ? "var(--danger)" : "var(--text-light)", fontSize: 13 }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Các ô ngày */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
                            {daysGrid.map((d, index) => {
                                // Kiểm tra xem ngày này có sự kiện nào ko (giả lập highlight)
                                const isWeekend = index % 7 === 5 || index % 7 === 6;

                                return (
                                    <div
                                        key={index}
                                        style={{
                                            position: "relative",
                                            padding: "8px",
                                            borderRadius: "12px",
                                            border: d.isToday ? "2px solid var(--primary)" : "1px solid var(--border)",
                                            background: d.isToday ? "var(--primary-light)" : "var(--surface)",
                                            minHeight: "80px",
                                            opacity: d.isCurrentMonth ? 1 : 0.4,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.2s",
                                            cursor: "default"
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = d.isToday ? "var(--primary)" : "var(--border)"; }}
                                    >
                                        <div style={{ fontSize: 22, fontWeight: 700, color: isWeekend ? "var(--danger)" : "var(--text-dark)", lineHeight: 1 }}>
                                            {d.day}
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: d.lunarDay === 1 || d.lunarDay === 15 ? "var(--primary)" : "var(--text-light)", marginTop: 6 }}>
                                            {d.lunarLabel}
                                        </div>

                                        {/* Indicators for events */}
                                        <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                                            {anniversaries.some(a => a && a.lunarDay === d.lunarDay && a.lunarMonth === d.lunarMonth) && (
                                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)" }} title="Giỗ / Sự kiện" />
                                            )}
                                            {birthdays.some(b => b && b.lunarDay === d.lunarDay && b.lunarMonth === d.lunarMonth) && (
                                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} title="Sinh nhật" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* KHU VỰC SỰ KIỆN TRONG THÁNG */}
                    <div style={{ flex: 1, borderLeft: "1px solid var(--border)", paddingLeft: 32 }}>
                        <h3 style={{ fontSize: 18, marginBottom: 20, color: "var(--text-dark)", display: "flex", alignItems: "center", gap: 8 }}>
                            <Gift size={20} color="var(--primary)" />
                            Sự kiện tháng {currentDate.getMonth() + 1}
                        </h3>

                        {loadingEvents ? (
                            <div className="small" style={{ color: "var(--text-light)" }}>Đang tải...</div>
                        ) : (
                            <div className="stack" style={{ gap: 24 }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                                        LỊCH GIỖ & SỰ KIỆN
                                    </div>
                                    {anniversaries.filter(a => a && daysGrid.some(d => d.lunarDay === a.lunarDay && d.lunarMonth === a.lunarMonth && d.isCurrentMonth)).length > 0 ? (
                                        anniversaries
                                            .filter(a => a && daysGrid.some(d => d.lunarDay === a.lunarDay && d.lunarMonth === a.lunarMonth && d.isCurrentMonth))
                                            .sort((a, b) => a.lunarDay - b.lunarDay)
                                            .map((a, idx) => (
                                                <div key={idx} style={{ padding: "12px", background: "var(--surface-hover)", borderRadius: 8, marginBottom: 8 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", marginBottom: 4 }}>Ngày Âm: {a.lunarDay}/{a.lunarMonth}</div>
                                                    <div style={{ fontSize: 14, color: "var(--text-dark)" }}>{a.title}</div>
                                                </div>
                                            ))
                                    ) : <div className="small" style={{ color: "var(--text-light)" }}>Không có sự kiện nào.</div>}
                                </div>

                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                                        SINH NHẬT
                                    </div>
                                    {birthdays.filter(b => b && daysGrid.some(d => d.lunarDay === b.lunarDay && d.lunarMonth === b.lunarMonth && d.isCurrentMonth)).length > 0 ? (
                                        birthdays
                                            .filter(b => b && daysGrid.some(d => d.lunarDay === b.lunarDay && d.lunarMonth === b.lunarMonth && d.isCurrentMonth))
                                            .sort((a, b) => a.lunarDay - b.lunarDay)
                                            .map((b, idx) => {
                                                // Find the corresponding solar date from the grid
                                                const matchingDay = daysGrid.find(d => d.lunarDay === b.lunarDay && d.lunarMonth === b.lunarMonth && d.isCurrentMonth);
                                                return (
                                                    <div key={idx} style={{ padding: "12px", background: "rgba(184, 134, 11, 0.07)", borderLeft: "3px solid var(--accent)", borderRadius: 8, marginBottom: 8 }}>
                                                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>
                                                            Ngày {matchingDay?.day}/{matchingDay?.month + 1} ({b.lunarDay}/{b.lunarMonth} ÂL)
                                                        </div>
                                                        <div style={{ fontSize: 14, color: "var(--text-dark)" }}>{b.title}</div>
                                                    </div>
                                                );
                                            })
                                    ) : <div className="small" style={{ color: "var(--text-light)" }}>Không có sinh nhật nào.</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
