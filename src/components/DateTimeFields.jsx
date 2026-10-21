import { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import './flow.css';

function parts(value) {
  const [date = '', time = ''] = (value || '').split('T');
  return { date, time };
}

function displayDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

function parseDate(text) {
  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 8);
  if (cleaned.length !== 8) return '';
  const d = cleaned.slice(0, 2);
  const m = cleaned.slice(2, 4);
  const y = cleaned.slice(4, 8);
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return '';
  return `${y}-${m}-${d}`;
}

export default function DateTimeFields({ value, onChange, label = 'Date & time', required = false }) {
  const dateRef = useRef(null);
  const { date, time } = parts(value);
  const [dateText, setDateText] = useState(displayDate(date));

  function updateDate(nextDate) {
    const next = `${nextDate}${time ? `T${time}` : ''}`;
    onChange(next);
    setDateText(displayDate(nextDate));
  }

  function updateTime(nextTime) {
    onChange(`${date || ''}${nextTime ? `T${nextTime}` : ''}`);
  }

  function handleDateText(e) {
    const raw = e.target.value;
    setDateText(raw);
    const parsed = parseDate(raw);
    if (parsed) updateDate(parsed);
    else if (!raw.trim()) onChange(`${time ? `T${time}` : ''}`);
  }

  return (
    <div className="date-time-fields">
      <label>{label}</label>
      <div className="date-time-row">
        <div className="date-input-wrap">
          <input
            className="date-display-input"
            value={dateText}
            onChange={handleDateText}
            onBlur={() => setDateText(displayDate(date))}
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            maxLength={10}
            required={required}
            aria-label="Date in day month year format"
          />
          <button type="button" className="date-picker-btn" onClick={() => dateRef.current?.showPicker?.()} aria-label="Choose date">
            <CalendarDays size={17} />
          </button>
          <input
            ref={dateRef}
            className="native-date-picker"
            type="date"
            value={date}
            onChange={e => updateDate(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
        <input
          className="time-input"
          type="time"
          value={time}
          onChange={e => updateTime(e.target.value)}
          required={required}
          aria-label="Time"
        />
      </div>
    </div>
  );
}
