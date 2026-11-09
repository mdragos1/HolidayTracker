import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  X, 
  Check, 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  Sparkles,
  SlidersHorizontal,
  AlertCircle
} from 'lucide-react';

const App = () => {
  // --- State Initialization ---
  const [people, setPeople] = useState(() => {
    const saved = localStorage.getItem('shd_people');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Christos', entitlement: 30, bankHolidays: 8, color: 'indigo' },
      { id: '2', name: 'Maria', entitlement: 30, bankHolidays: 8, color: 'sky' },
      { id: '3', name: 'Anita', entitlement: 30, bankHolidays: 8, color: 'teal' },
      { id: '4', name: 'Lindsey', entitlement: 20, bankHolidays: 8, color: 'violet' }
    ];
  });

  const [holidays, setHolidays] = useState(() => {
    const saved = localStorage.getItem('shd_holidays');
    if (saved) return JSON.parse(saved);
    return {}; // format: { "personId|YYYY-MM-DD": true }
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showOptions, setShowOptions] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [newName, setNewName] = useState("");
  const [filterPersonId, setFilterPersonId] = useState('ALL');

  // Multi-day selection state
  const [selectedCells, setSelectedCells] = useState([]);
  const [limitWarning, setLimitWarning] = useState(null);

  // --- Document Title ---
  useEffect(() => {
    document.title = `Shield House Dentistry - Holiday Tracker (${selectedYear})`;
  }, [selectedYear]);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('shd_people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('shd_holidays', JSON.stringify(holidays));
  }, [holidays]);

  // --- Helpers ---
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();
  const getDayOfWeek = (year, monthIndex, day) => new Date(year, monthIndex, day).getDay();
  const isWeekday = (year, monthIndex, day) => {
    const dayOfWeek = getDayOfWeek(year, monthIndex, day);
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  };
  const isFriday = (year, monthIndex, day) => getDayOfWeek(year, monthIndex, day) === 5;

  const formatDate = (year, monthIndex, day) => {
    const m = String(monthIndex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // --- Actions ---
  const handleUpdatePerson = (id, field, value) => {
    setPeople(people.map(p => p.id === id ? { ...p, [field]: Number(value) || 0 } : p));
  };

  const addPerson = () => {
    if (!newName.trim()) return;
    const colors = ['indigo', 'sky', 'teal', 'violet', 'rose', 'amber', 'emerald'];
    const randomColor = colors[people.length % colors.length];
    setPeople([...people, {
      id: Date.now().toString(),
      name: newName.trim(),
      entitlement: 30,
      bankHolidays: 8,
      color: randomColor
    }]);
    setNewName("");
  };

  const removePerson = (id) => {
    setPeople(people.filter(p => p.id !== id));
    const newHolidays = { ...holidays };
    Object.keys(newHolidays).forEach(key => {
      if (key.startsWith(`${id}|`)) delete newHolidays[key];
    });
    setHolidays(newHolidays);
    if (editingStaffId === id) setEditingStaffId(null);
  };

  const confirmBooking = () => {
    const newHolidays = { ...holidays };
    selectedCells.forEach(cellKey => {
      newHolidays[cellKey] = true;
    });
    setHolidays(newHolidays);
    setSelectedCells([]);
  };

  const clearBooking = () => {
    const newHolidays = { ...holidays };
    selectedCells.forEach(cellKey => {
      delete newHolidays[cellKey];
    });
    setHolidays(newHolidays);
    setSelectedCells([]);
  };

  const getYearStats = (personId) => {
    let bookedThisYear = 0;
    Object.keys(holidays).forEach(key => {
      if (key.startsWith(`${personId}|${selectedYear}`)) {
        bookedThisYear += 1;
      }
    });
    return bookedThisYear;
  };

  const getPersonRemainingDays = (personId) => {
    const person = people.find(p => p.id === personId);
    if (!person) return 0;
    const totalAllowed = (person.entitlement || 0) + (person.bankHolidays || 0);
    const booked = getYearStats(personId);
    // Also deduct newly selected cells for this person that aren't already saved as booked
    const newlySelected = selectedCells.filter(cellKey => {
      return cellKey.startsWith(`${personId}|${selectedYear}`) && !holidays[cellKey];
    }).length;
    return totalAllowed - booked - newlySelected;
  };

  const toggleCellSelection = (personId, dateStr) => {
    const cellKey = `${personId}|${dateStr}`;
    const isAlreadySelected = selectedCells.includes(cellKey);
    const isAlreadyBooked = Boolean(holidays[cellKey]);

    // If deselecting, allow without restriction
    if (isAlreadySelected) {
      setSelectedCells(selectedCells.filter(key => key !== cellKey));
      setLimitWarning(null);
      return;
    }

    // If already booked, allow selection so user can choose to clear it
    if (isAlreadyBooked) {
      setSelectedCells([...selectedCells, cellKey]);
      return;
    }

    // Check available days before selecting a new day
    const remainingDays = getPersonRemainingDays(personId);
    if (remainingDays <= 0) {
      const person = people.find(p => p.id === personId);
      setLimitWarning(`${person?.name || 'Staff member'} has reached their total allowance (${(person?.entitlement || 0) + (person?.bankHolidays || 0)} days) for ${selectedYear}.`);
      return;
    }

    setLimitWarning(null);
    setSelectedCells([...selectedCells, cellKey]);
  };

  const displayPeople = filterPersonId === 'ALL' 
    ? people 
    : people.filter(p => p.id === filterPersonId);

  const getAvatarInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-36 selection:bg-indigo-100">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                  Shield House Dentistry
                </h1>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100/80">
                  Staff Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Holiday Schedule & Allowance Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Year Navigator */}
            <div className="flex items-center bg-slate-100/90 rounded-xl p-1 border border-slate-200/80">
              <button 
                onClick={() => setSelectedYear(y => y - 1)} 
                className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg text-slate-600 transition shadow-sm"
                title="Previous Year"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 text-sm font-bold text-slate-700 min-w-[56px] text-center tracking-tight">
                {selectedYear}
              </span>
              <button 
                onClick={() => setSelectedYear(y => y + 1)} 
                className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg text-slate-600 transition shadow-sm"
                title="Next Year"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Manage Staff Button */}
            <button 
              onClick={() => setShowOptions(true)} 
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all"
            >
              <Settings size={15} />
              <span>Staff Setup</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Limit Warning Alert */}
        {limitWarning && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center space-x-2.5">
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
              <span className="text-xs font-semibold">{limitWarning}</span>
            </div>
            <button 
              onClick={() => setLimitWarning(null)} 
              className="text-amber-500 hover:text-amber-800 p-1 rounded-lg"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Staff Dashboard Cards (Replaces the raw spreadsheet stats table) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Staff Allowance Overview &bull; {selectedYear}
              </h2>
            </div>
            
            {/* Filter Pill List */}
            <div className="hidden md:flex items-center space-x-1.5 bg-slate-200/60 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setFilterPersonId('ALL')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterPersonId === 'ALL' 
                    ? 'bg-white text-slate-900 shadow-sm font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Staff ({people.length})
              </button>
              {people.map(person => (
                <button
                  key={person.id}
                  onClick={() => setFilterPersonId(person.id)}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterPersonId === person.id 
                      ? 'bg-white text-slate-900 shadow-sm font-semibold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {person.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {people.map(person => {
              const total = person.entitlement + person.bankHolidays;
              const booked = getYearStats(person.id);
              const balance = total - booked;
              const percentUsed = Math.min(100, Math.round((booked / (total || 1)) * 100));
              const isSelectedForFilter = filterPersonId === person.id;

              return (
                <div 
                  key={person.id} 
                  className={`bg-white rounded-2xl border transition-all duration-200 p-5 relative overflow-hidden group shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md ${
                    isSelectedForFilter ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200/90'
                  }`}
                >
                  {/* Subtle top decoration */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shadow-inner">
                        {getAvatarInitials(person.name)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{person.name}</h3>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {total} days total
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingStaffId(editingStaffId === person.id ? null : person.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Adjust Allowance"
                    >
                      <SlidersHorizontal size={14} />
                    </button>
                  </div>

                  {/* Inline quick adjustment form */}
                  {editingStaffId === person.id && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Base Entitlement:</span>
                        <input
                          type="number"
                          min="0"
                          value={person.entitlement}
                          onChange={(e) => handleUpdatePerson(person.id, 'entitlement', e.target.value)}
                          className="w-14 text-center bg-white border border-slate-300 rounded-md py-0.5 font-semibold"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Bank Holidays:</span>
                        <input
                          type="number"
                          min="0"
                          value={person.bankHolidays}
                          onChange={(e) => handleUpdatePerson(person.id, 'bankHolidays', e.target.value)}
                          className="w-14 text-center bg-white border border-slate-300 rounded-md py-0.5 font-semibold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Days Stats */}
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Booked</span>
                      <div className="text-xl font-bold text-slate-800">{booked} <span className="text-xs font-normal text-slate-400">days</span></div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Remaining</span>
                      <div className={`text-xl font-bold ${balance < 0 ? 'text-rose-600' : balance < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {balance} <span className="text-xs font-normal text-slate-400">days</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        percentUsed > 90 ? 'bg-rose-500' : percentUsed > 70 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>{percentUsed}% utilized</span>
                    <span>{balance >= 0 ? `${balance} left` : 'Over limit'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Schedule Grid */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Full Annual Schedule &bull; {selectedYear}
              </h2>
            </div>

            <div className="flex items-center space-x-3 text-xs font-medium text-slate-500">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span>Booked</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-indigo-100 border border-indigo-400"></span>
                <span>Selected</span>
              </div>
            </div>
          </div>

          {/* Strict 2-Column Grid (1 column on small screens, exactly 2 columns across 6 rows on larger screens) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MONTHS.map((monthName, monthIndex) => {
              const daysInMonth = getDaysInMonth(selectedYear, monthIndex);
              const weekdays = [];
              for (let d = 1; d <= daysInMonth; d++) {
                if (isWeekday(selectedYear, monthIndex, d)) {
                  weekdays.push(d);
                }
              }

              return (
                <div 
                  key={monthName} 
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow"
                >
                  {/* Month Banner */}
                  <div className="px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                    <span className="font-bold text-sm tracking-wide">{monthName}</span>
                    <span className="text-[11px] text-slate-400 font-medium bg-slate-800/80 px-2 py-0.5 rounded-full">
                      {weekdays.length} Working Days
                    </span>
                  </div>

                  {/* Calendar Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-100">
                          <th className="py-2.5 px-3 text-left w-20 sticky left-0 bg-slate-50 border-r border-slate-200/70 z-10 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                            Staff
                          </th>
                          {weekdays.map(day => {
                            const dateObj = new Date(selectedYear, monthIndex, day);
                            const dayLetter = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
                            const isWeekendBreak = isFriday(selectedYear, monthIndex, day);

                            return (
                              <th 
                                key={day} 
                                className={`py-2 px-1 text-center min-w-[28px] ${
                                  isWeekendBreak ? 'border-r-2 border-r-slate-300' : 'border-r border-slate-100'
                                }`}
                              >
                                <div className="text-slate-400 font-medium text-[10px]">{dayLetter}</div>
                                <div className="font-bold text-slate-700">{day}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {displayPeople.map(person => {
                          const remainingForPerson = getPersonRemainingDays(person.id);
                          const isCapped = remainingForPerson <= 0;

                          return (
                            <tr key={person.id} className="hover:bg-slate-50/60 transition group">
                              <td className="py-2.5 px-3 font-semibold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50/60 border-r border-slate-200/70 z-10 truncate max-w-[85px] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                                {person.name}
                              </td>

                              {weekdays.map(day => {
                                const dateStr = formatDate(selectedYear, monthIndex, day);
                                const cellKey = `${person.id}|${dateStr}`;
                                const isBooked = Boolean(holidays[cellKey]);
                                const isSelected = selectedCells.includes(cellKey);
                                const isWeekendBreak = isFriday(selectedYear, monthIndex, day);
                                const isLocked = isCapped && !isBooked && !isSelected;

                                return (
                                  <td 
                                    key={day} 
                                    onClick={() => toggleCellSelection(person.id, dateStr)}
                                    title={isLocked ? `${person.name} has no remaining days for ${selectedYear}` : undefined}
                                    className={`
                                      p-1 text-center transition-all select-none
                                      ${isWeekendBreak ? 'border-r-2 border-r-slate-300' : 'border-r border-slate-100'}
                                      ${isSelected ? 'bg-indigo-50' : ''}
                                      ${isLocked ? 'cursor-not-allowed opacity-40 bg-slate-100/50' : 'cursor-pointer'}
                                    `}
                                  >
                                    <div 
                                      className={`
                                        w-6 h-6 mx-auto rounded-lg flex items-center justify-center transition-all duration-150
                                        ${isSelected 
                                          ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 scale-105' 
                                          : isBooked 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : isLocked
                                              ? 'border border-dashed border-slate-300'
                                              : 'hover:bg-slate-200/70'
                                        }
                                      `}
                                    >
                                      {isBooked && !isSelected && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                      )}
                                      {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modern Floating Action Toolbar */}
      {selectedCells.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] border border-slate-700/60 px-5 py-3 flex items-center space-x-4">
            <div className="flex items-center space-x-2 pr-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
              <span className="text-xs font-semibold tracking-wide">
                {selectedCells.length} {selectedCells.length === 1 ? 'day' : 'days'} selected
              </span>
            </div>

            <div className="flex items-center space-x-2 border-l border-slate-700 pl-4">
              <button 
                onClick={confirmBooking}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm hover:shadow"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>Book Holidays</span>
              </button>

              <button 
                onClick={clearBooking}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                <Trash2 size={14} />
                <span>Clear</span>
              </button>

              <button 
                onClick={() => setSelectedCells([])}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Cancel selection"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Setup Drawer/Modal */}
      {showOptions && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-100">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Manage Practice Staff</h3>
              </div>
              <button 
                onClick={() => setShowOptions(false)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-1">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Team Members ({people.length})</h4>
              {people.map(person => (
                <div key={person.id} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200/60 transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {getAvatarInitials(person.name)}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-slate-800 block">{person.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {person.entitlement + person.bankHolidays} days/yr
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removePerson(person.id)} 
                    className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition"
                    title={`Remove ${person.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Add Team Member</h4>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  placeholder="Enter staff name..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <button 
                  onClick={addPerson} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center text-xs font-semibold transition shadow-sm"
                >
                  <Plus size={16} className="mr-1" /> Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Micro-animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 15px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default App;