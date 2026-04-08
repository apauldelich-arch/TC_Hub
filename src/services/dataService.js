const STORAGE_KEY_LOGS = 'itero_tc_logs';
const STORAGE_KEY_EMPLOYEES = 'itero_tc_employees';

const defaultEmployees = [
  { id: '1', name: 'Dave Richardson', role: 'Plant Operator', status: 'active', credentials: { 'City Lab': { user: 'drichardson', pass: 'lab123' } } },
  { id: '2', name: 'Simon Wells', role: 'Safety Lead', status: 'active', credentials: { 'Portal X': { user: 'swells_safety', pass: 'secure99' } } },
  { id: '3', name: 'Elijah K.', role: 'Lab Technician', status: 'active', credentials: {} },
  { id: '4', name: 'Sarah Miller', role: 'Process Engineer', status: 'active', credentials: { 'Engineer Hub': { user: 'smiller_eng', pass: 'pwr2026' } } },
  { id: '5', name: 'Marcus Aurelius', role: 'Plant Technician', status: 'active', credentials: {} },
  { id: '6', name: 'Elena Vance', role: 'HSE Coordinator', status: 'active', credentials: { 'Compliance Portal': { user: 'evance_hse', pass: 'audit_ready' } } },
];

export const dataService = {
  getEmployees: (includeArchived = false) => {
    const saved = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    const emps = saved ? JSON.parse(saved) : defaultEmployees;
    return includeArchived ? emps : emps.filter(e => e.status !== 'archived');
  },

  addEmployee: (name, role) => {
    const emps = dataService.getEmployees(true);
    const newEmp = { id: crypto.randomUUID(), name, role, status: 'active', credentials: {} };
    const updated = [...emps, newEmp];
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(updated));
    return newEmp;
  },

  archiveEmployee: (id) => {
    const emps = dataService.getEmployees(true);
    const updated = emps.map(e => e.id === id ? { ...e, status: 'archived' } : e);
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(updated));
  },

  getLogs: () => {
    const saved = localStorage.getItem(STORAGE_KEY_LOGS);
    return saved ? JSON.parse(saved) : [];
  },

  getEmployeeHistory: (employeeId) => {
    const logs = dataService.getLogs();
    return logs.filter(log => log.employeeId === employeeId).sort((a,b) => new Date(b.enrolmentDate) - new Date(a.enrolmentDate));
  },

  getUniqueCenters: () => {
    const logs = dataService.getLogs();
    const centersMap = {};
    logs.forEach(log => {
      const name = log.provider || 'Uncategorized';
      if (!centersMap[name]) {
        centersMap[name] = { name: name, website: log.website || '', courses: new Set() };
      }
      if (log.courseName) centersMap[name].courses.add(log.courseName);
    });
    return Object.values(centersMap).map(center => ({
      ...center,
      courses: Array.from(center.courses).sort()
    })).sort((a,b) => a.name.localeCompare(b.name));
  },

  updateCenterDetails: (oldName, newName, newWebsite) => {
    const logs = dataService.getLogs();
    const updatedLogs = logs.map(log => {
      if (log.provider === oldName) return { ...log, provider: newName, website: newWebsite };
      return log;
    });
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
  },

  createTrainingRecords: (formData, selectedEmployeeIds) => {
    const logs = dataService.getLogs();
    const newRecords = selectedEmployeeIds.map(empId => {
      const isCompleted = !!formData.completionDate;
      return {
        id: crypto.randomUUID(),
        employeeId: empId,
        courseName: formData.courseName,
        provider: formData.provider,
        website: formData.website,
        cost: parseFloat(formData.cost) || 0,
        enrolmentDate: formData.enrolmentDate,
        completionDate: formData.completionDate || null,
        // UPDATED: Handle No Expiration for new records
        expiryDate: isCompleted ? dataService.calculateExpiry(formData.completionDate, formData.renewalType) : null,
        status: isCompleted ? 'Completed' : 'Enrolled',
        renewalType: formData.renewalType
      };
    });
    const updatedLogs = [...logs, ...newRecords];
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
    return newRecords;
  },

  completeRecord: (recordId, completionDate) => {
    const logs = dataService.getLogs();
    const updatedLogs = logs.map(log => {
      if (log.id === recordId) {
        return {
          ...log,
          completionDate: completionDate,
          // UPDATED: Handle No Expiration when finalizing
          expiryDate: dataService.calculateExpiry(completionDate, log.renewalType || '+ 730 Days (2 Years)'),
          status: 'Completed'
        };
      }
      return log;
    });
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
  },

  calculateExpiry: (completionDate, type) => {
    const date = new Date(completionDate);
    // NEW: Handle lifetime certifications
    if (type.includes('No expiration') || type.includes('Lifetime')) {
      return null;
    }
    
    if (type.includes('730')) {
      date.setDate(date.getDate() + 730);
    } else if (type.includes('365')) {
      date.setDate(date.getDate() + 365);
    } else {
      date.setDate(date.getDate() + 90); 
    }
    return date.toISOString().split('T')[0];
  },

  getDashboardStats: (targetYear = new Date().getFullYear()) => {
    const logs = dataService.getLogs();
    const employees = dataService.getEmployees();
    const activeEmpIds = employees.map(e => e.id);
    const filteredLogs = logs.filter(l => activeEmpIds.includes(l.employeeId));
    const now = new Date();
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(now.getDate() + 30);

    const yearlySpend = filteredLogs.reduce((acc, log) => {
      if (log.completionDate && new Date(log.completionDate).getFullYear() === parseInt(targetYear)) {
        return acc + log.cost;
      }
      return acc;
    }, 0);

    // Filter out NULL expiry dates for compliance alerts
    const expiringSoon = filteredLogs.filter(log => log.status === 'Completed' && log.expiryDate && new Date(log.expiryDate) <= thirtyDaysOut && new Date(log.expiryDate) > now).length;
    const overdue = filteredLogs.filter(log => log.status === 'Completed' && log.expiryDate && new Date(log.expiryDate) < now).length;
    const inProgress = filteredLogs.filter(log => log.status === 'Enrolled').length;

    return { totalSpend: yearlySpend, expiringCount: expiringSoon, overdueCount: overdue, inProgressCount: inProgress, compliancePercentage: 94 };
  },

  getYearlyRenewals: (targetYear) => {
    const logs = dataService.getLogs();
    const employees = dataService.getEmployees();
    const activeEmpIds = employees.map(e => e.id);
    const now = new Date();
    return logs
      .filter(log => {
        // Must be active, completed, and have an expiry date to appear in renewal calendar
        return activeEmpIds.includes(log.employeeId) && 
               log.status === 'Completed' && 
               log.expiryDate && 
               new Date(log.expiryDate).getFullYear() === parseInt(targetYear);
      })
      .map(log => {
        const diffDays = Math.ceil((new Date(log.expiryDate) - now) / (1000 * 60 * 60 * 24));
        return { ...log, employeeName: employees.find(e => e.id === log.employeeId)?.name || 'Unknown', daysLeft: diffDays };
      })
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  },

  getImpendingCrises: () => {
    const logs = dataService.getLogs();
    const employees = dataService.getEmployees();
    const activeEmpIds = employees.map(e => e.id);
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(now.getDate() + 180);
    return logs
      .filter(log => activeEmpIds.includes(log.employeeId) && log.status === 'Completed' && log.expiryDate && new Date(log.expiryDate) <= horizon)
      .map(log => {
        const diffDays = Math.ceil((new Date(log.expiryDate) - now) / (1000 * 60 * 60 * 24));
        return { ...log, employeeName: employees.find(e => e.id === log.employeeId)?.name || 'Unknown', daysLeft: diffDays };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }
};
