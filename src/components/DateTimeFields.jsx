import { useRef } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
import './flow.css';

function parts(value) {
  const [date = '', time = ''] = (value || '').split('T');
  return { date, time };
}

function displayDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'DD/MM/YYYY';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

function displayTime(time) {
  if (!/^\d{2}:\d{2}$/.test(time)) return 'Select time';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function DateTimeFields({ value, onChange, label = 'Date & time', required = false }) {
  const dateRef = useRef(null);
  const timeRef = useRef(null);
  const { date, time } = parts(value);

  function updateDate(nextDate) {
    if (!nextDate) return;
    onChange(`${nextDate}T${time || '12:00'}`);
  }

  function updateTime(nextTime) {
    if (!nextTime) return;
    onChange(`${date || new Date().toISOString().slice(0, 10)}T${nextTime}`);
  }

  function openPicker(ref) {
    const input = ref.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === 'function') input.showPicker();
      else input.click();
    } catch {
      input.click();
    }
  }

  return (
    <div className="date-time-fields">
      <label>{label}</label>
      <div className="date-time-row">
        <button
          type="button"
          className={`picker-field ${!date ? 'is-empty' : ''}`}
          onClick={() => openPicker(dateRef)}
          aria-label="Choose date"
        >
          <span>{displayDate(date)}</span>
          <CalendarDays size={18} />
          <input
            ref={dateRef}
            className="picker-native-input"
            type="date"
            value={date}
            onChange={e => updateDate(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            required={required}
          />
        </button>

        <button
          type="button"
          className={`picker-field ${!time ? 'is-empty' : ''}`}
          onClick={() => openPicker(timeRef)}
          aria-label="Choose time"
        >
          <span>{displayTime(time)}</span>
          <Clock3 size={18} />
          <input
            ref={timeRef}
            className="picker-native-input"
            type="time"
            value={time}
            onChange={e => updateTime(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            required={required}
          />
        </button>
      </div>
    </div>
  );
}
