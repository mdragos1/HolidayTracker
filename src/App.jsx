import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Settings, X, Check } from 'lucide-react';

const App = () => {
  // --- State Initialization ---
  const [people, setPeople] = useState(() => {
    const saved = localStorage.getItem('shd_people');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Christos', entitlement: 30, bankHolidays: 8 },
      { id: '2', name: 'Maria', entitlement: 30, bankHolidays: 8 },
      { id: '3', name: 'Anita', entitlement: 30, bankHolidays: 8 },
      { id: '4', name: 'Lindsey', entitlement: 20, bankHolidays: 8 }
    ];
  });

  const [holidays, setHolidays] = useState(() => {
    const saved = localStorage.getItem('shd_holidays');
    if (saved) return JSON.parse(saved);
    return {}; // format: { "personId|YYYY-MM-DD": true }
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showOptions, setShowOptions] = useState(false);
  const [newName, setNewName] = useState("");
  
  // Selection state for multiple days
  const [selectedCells, setSelectedCells] = useState([]);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('shd_people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('shd_holidays', JSON.stringify(holidays));
  }, [holidays]);

  // --- Helpers ---
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();
  const getDayOfWeek = (year, monthIndex, day) => new Date(year, monthIndex, day).getDay(); // 0 = Sun, 1 = Mon...
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
    setPeople([...people, { 
      id: Date.now().toString(), 
      name: newName, 
      entitlement: 30, 
      bankHolidays: 8 
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
  };

  const toggleCellSelection = (personId, dateStr) => {
    const cellKey = `${personId}|${dateStr}`;
    if (selectedCells.includes(cellKey)) {
      setSelectedCells(selectedCells.filter(key => key !== cellKey));
    } else {
      setSelectedCells([...selectedCells, cellKey]);
    }
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

  // --- Rendering Helpers ---
  const getYearStats = (personId) => {
    let bookedThisYear = 0;
    Object.keys(holidays).forEach(key => {
      if (key.startsWith(`${personId}|${selectedYear}`)) {
        bookedThisYear += 1;
      }
    });
    return bookedThisYear;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 font-sans pb-32">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">SHIELD HOUSE DENTISTRY</h1>
          <h2 className="text-lg text-slate-500">{selectedYear} HOLIDAY CHART</h2>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            <button onClick={() => setSelectedYear(y => y - 1)} className="p-2 hover:bg-white rounded shadow-sm text-gray-600"><ChevronLeft size={20} /></button>
            <span className="px-4 font-semibold text-lg">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="p-2 hover:bg-white rounded shadow-sm text-gray-600"><ChevronRight size={20} /></button>
          </div>
          <button onClick={() => setShowOptions(true)} className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md font-medium transition-colors">
            <Settings size={18} />
            <span>Staff Setup</span>
          </button>
        </div>
      </div>

      {/* Stats Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-sm font-semibold text-slate-600">
                <th className="p-3 pl-6">Name</th>
                <th className="p-3 text-center">Entitlement</th>
                <th className="p-3 text-center">Bank Holiday</th>
                <th className="p-3 text-center">Total Allowed</th>
                <th className="p-3 text-center text-blue-600">Booked {selectedYear}</th>
                <th className="p-3 text-center text-green-600">Balance</th>
              </tr>
            </thead>
            <tbody>
              {people.map(person => {
                const total = person.entitlement + person.bankHolidays;
                const booked = getYearStats(person.id);
                const balance = total - booked;
                return (
                  <tr key={person.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 pl-6 font-medium text-gray-800">{person.name}</td>
                    <td className="p-3 text-center">
                      <input 
                        type="number" 
                        value={person.entitlement} 
                        onChange={(e) => handleUpdatePerson(person.id, 'entitlement', e.target.value)}
                        className="w-16 text-center border border-gray-300 rounded p-1"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input 
                        type="number" 
                        value={person.bankHolidays} 
                        onChange={(e) => handleUpdatePerson(person.id, 'bankHolidays', e.target.value)}
                        className="w-16 text-center border border-gray-300 rounded p-1"
                      />
                    </td>
                    <td className="p-3 text-center font-semibold">{total}</td>
                    <td className="p-3 text-center font-semibold text-blue-600">{booked}</td>
                    <td className={`p-3 text-center font-bold ${balance < 0 ? 'text-red-500' : 'text-green-600'}`}>{balance}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendar Grids (Parallel Layout) */}
      <div className="max-w-[95%] mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {MONTHS.map((monthName, monthIndex) => {
          const daysInMonth = getDaysInMonth(selectedYear, monthIndex);
          const weekdays = [];
          for (let d = 1; d <= daysInMonth; d++) {
            if (isWeekday(selectedYear, monthIndex, d)) {
              weekdays.push(d);
            }
          }

          return (
            <div key={monthName} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-slate-800 text-white font-semibold py-2 px-4 text-center">
                {monthName}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-gray-300">
                      <th className="p-2 text-left w-20 sticky left-0 bg-slate-100 border-r border-gray-300 shadow-[1px_0_0_rgba(0,0,0,0.1)]">Name</th>
                      {weekdays.map(day => {
                        const dateObj = new Date(selectedYear, monthIndex, day);
                        const dayLetter = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
                        const isEndOfWeek = dateObj.getDay() === 5; // Friday
                        return (
                          <th key={day} className={`p-1 min-w-[28px] text-center border-b border-gray-300 ${isEndOfWeek ? 'border-r-2 border-r-slate-400' : 'border-r border-gray-200'}`}>
                            <div className="text-slate-500 font-normal">{dayLetter}</div>
                            <div className="font-bold text-slate-800">{day}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {people.map(person => (
                      <tr key={person.id} className="border-b border-gray-100 hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-700 sticky left-0 bg-white border-r border-gray-300 shadow-[1px_0_0_rgba(0,0,0,0.1)] truncate max-w-[80px]">
                          {person.name}
                        </td>
                        {weekdays.map(day => {
                          const dateStr = formatDate(selectedYear, monthIndex, day);
                          const cellKey = `${person.id}|${dateStr}`;
                          const isBooked = holidays[cellKey];
                          const isSelected = selectedCells.includes(cellKey);
                          const isEndOfWeek = isFriday(selectedYear, monthIndex, day);

                          return (
                            <td 
                              key={day} 
                              onClick={() => toggleCellSelection(person.id, dateStr)}
                              className={`
                                cursor-pointer text-center p-0 transition-colors
                                ${isEndOfWeek ? 'border-r-2 border-r-slate-400' : 'border-r border-gray-100'}
                                ${isSelected ? 'bg-blue-200 ring-2 ring-blue-500 inset-0 z-10 relative' : ''}
                                ${isBooked && !isSelected ? 'bg-indigo-500 text-white' : ''}
                                ${!isBooked && !isSelected ? 'hover:bg-blue-50' : ''}
                              `}
                            >
                              <div className="w-full h-8 flex items-center justify-center">
                                {isBooked && !isSelected && <span className="block w-2 h-2 rounded-full bg-white"></span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed Action Bottom Modal for Selection */}
      {selectedCells.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-200 px-6 py-4 flex items-center space-x-6 z-50 animate-bounce-short">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
              {selectedCells.length} {selectedCells.length === 1 ? 'Day' : 'Days'} Selected
            </span>
          </div>
          <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
            <button 
              onClick={confirmBooking}
              className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium transition-colors"
            >
              <Check size={16} />
              <span>Book</span>
            </button>
            <button 
              onClick={clearBooking}
              className="flex items-center space-x-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-full font-medium transition-colors"
            >
              <Trash2 size={16} />
              <span>Clear</span>
            </button>
            <button 
              onClick={() => setSelectedCells([])}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-2"
              title="Cancel Selection"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Staff Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Staff Management</h3>
              <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
            </div>
            
            <div className="space-y-4 mb-8">
              <h4 className="font-semibold text-slate-700 border-b pb-2">Current Staff</h4>
              {people.map(person => (
                <div key={person.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="font-medium">{person.name}</span>
                  <button onClick={() => removePerson(person.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {people.length === 0 && <p className="text-sm text-gray-500">No staff added yet.</p>}
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold text-slate-700 mb-3">Add New Person</h4>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  placeholder="Staff Name..." 
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addPerson} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium transition-colors">
                  <Plus size={18} className="mr-1" /> Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Style for custom bounce animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-5px) translateX(-50%); }
        }
        .animate-bounce-short {
          animation: bounce-short 0.3s ease-in-out;
        }
      `}} />
    </div>
  );
};

export default App;