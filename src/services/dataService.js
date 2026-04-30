import { supabase } from '../supabaseClient';

export const dataService = {
  // Helper to map Supabase snake_case to Frontend camelCase
  mapLog: (log) => ({
    id: log.id,
    employeeId: log.employee_id,
    courseName: log.course_name,
    provider: log.provider,
    providerWebsite: log.provider_website,
    cost: log.cost,
    enrolmentDate: log.enrolment_date,
    completionDate: log.completion_date,
    expiryDate: log.expiry_date,
    status: log.status,
    renewalType: log.renewal_type,
    createdAt: log.created_at
  }),

  mapEmployee: (emp) => ({
    id: emp.id,
    name: emp.name,
    role: emp.role,
    isArchived: emp.is_archived,
    credentials: emp.credentials,
    createdAt: emp.created_at
  }),

  // Employees
  getEmployees: async (showArchived = false) => {
    let query = supabase
      .from('employees')
      .select('*')
      .order('name');
    
    if (!showArchived) {
      query = query.eq('is_archived', false);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data.map(dataService.mapEmployee);
  },

  addEmployee: async (name, role) => {
    const { data, error } = await supabase
      .from('employees')
      .insert([{ name, role }])
      .select();
    if (error) throw error;
    return dataService.mapEmployee(data[0]);
  },

  archiveEmployee: async (employeeId) => {
    const { error } = await supabase
      .from('employees')
      .update({ is_archived: true })
      .eq('id', employeeId);
    if (error) throw error;
  },

  updateEmployeeCredentials: async (employeeId, portal, user, pass) => {
    const { data: emp, error: fError } = await supabase
      .from('employees')
      .select('credentials')
      .eq('id', employeeId)
      .single();
    if (fError) throw fError;

    const newCreds = { ...(emp.credentials || {}) };
    newCreds[portal] = { user, pass };

    const { error } = await supabase
      .from('employees')
      .update({ credentials: newCreds })
      .eq('id', employeeId);
    if (error) throw error;
  },

  deleteEmployeeCredential: async (employeeId, portalKey) => {
    const { data: emp, error: fError } = await supabase
      .from('employees')
      .select('credentials')
      .eq('id', employeeId)
      .single();
    
    if (fError) throw fError;
    
    const newCreds = { ...emp.credentials };
    delete newCreds[portalKey];
    
    const { error: uError } = await supabase
      .from('employees')
      .update({ credentials: newCreds })
      .eq('id', employeeId);
    
    if (uError) throw uError;
  },

  // Training Logs
  getLogs: async () => {
    const { data, error } = await supabase
      .from('training_logs')
      .select('*')
      .order('enrolment_date', { ascending: false });
    if (error) throw error;
    return data.map(dataService.mapLog);
  },

  getEmployeeHistory: async (employeeId) => {
    const { data, error } = await supabase
      .from('training_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .order('enrolment_date', { ascending: false });
    if (error) throw error;
    return data.map(dataService.mapLog);
  },

  completeRecord: async (recordId, completionDate, manualExpiryDate) => {
    const { data: log, error: fError } = await supabase
      .from('training_logs')
      .select('renewal_type')
      .eq('id', recordId)
      .single();
    if (fError) throw fError;

    const expiryDate = manualExpiryDate || dataService.calculateExpiry(completionDate, log.renewal_type || '+ 730 Days (2 Years)');
    
    const { error: uError } = await supabase
      .from('training_logs')
      .update({ 
        completion_date: completionDate, 
        expiry_date: expiryDate, 
        status: 'Completed' 
      })
      .eq('id', recordId);
    if (uError) throw uError;
  },

  updateTrainingRecord: async (recordId, updates) => {
    const payload = {};
    if (updates.completionDate !== undefined) payload.completion_date = updates.completionDate || null;
    if (updates.expiryDate !== undefined) payload.expiry_date = updates.expiryDate || null;
    
    if (!payload.completion_date) {
      payload.status = 'Enrolled';
      payload.expiry_date = null;
    } else {
      payload.status = 'Completed';
    }

    const { error } = await supabase
      .from('training_logs')
      .update(payload)
      .eq('id', recordId);
    if (error) throw error;
  },

  calculateExpiry: (completionDate, type) => {
    const date = new Date(completionDate);
    if (type.includes('No expiration') || type.includes('Lifetime')) return null;
    if (type.includes('730')) { date.setDate(date.getDate() + 730); }
    else if (type.includes('365')) { date.setDate(date.getDate() + 365); }
    else { date.setDate(date.getDate() + 90); }
    return date.toISOString().split('T')[0];
  },

  getDashboardStats: async (targetYear = new Date().getFullYear()) => {
    const { data: employees, error: eError } = await supabase.from('employees').select('id, name').eq('is_archived', false);
    const { data: logs, error: lError } = await supabase.from('training_logs').select('*');
    
    if (eError || lError) throw (eError || lError);

    const activeEmpIds = employees.map(e => e.id);
    const filteredLogs = logs.filter(l => activeEmpIds.includes(l.employee_id));
    const now = new Date();
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(now.getDate() + 30);

    const yearlySpend = filteredLogs.reduce((acc, log) => {
      if (log.enrolment_date && new Date(log.enrolment_date).getFullYear() === parseInt(targetYear)) {
        return acc + (parseFloat(log.cost) || 0);
      }
      return acc;
    }, 0);

    const spendItems = filteredLogs
      .filter(log => log.enrolment_date && new Date(log.enrolment_date).getFullYear() === parseInt(targetYear))
      .map(log => {
        const emp = employees.find(e => e.id === log.employee_id);
        return {
          employeeName: emp ? emp.name : 'Unknown',
          courseName: log.course_name,
          cost: parseFloat(log.cost) || 0,
          status: log.status,
          expiryDate: log.expiry_date
        };
      })
      .sort((a, b) => b.cost - a.cost);

    const expiringSoon = filteredLogs.filter(log => log.status === 'Completed' && log.expiry_date && new Date(log.expiry_date) <= thirtyDaysOut && new Date(log.expiry_date) > now).length;
    const overdue = filteredLogs.filter(log => log.status === 'Completed' && log.expiry_date && new Date(log.expiry_date) < now).length;
    const inProgress = filteredLogs.filter(log => log.status === 'Enrolled').length;

    return { 
      totalSpend: yearlySpend, 
      expiringCount: expiringSoon, 
      overdueCount: overdue, 
      inProgressCount: inProgress, 
      spendBreakdown: spendItems,
      compliancePercentage: employees.length > 0 ? Math.round(((employees.length - overdue) / employees.length) * 100) : 100 
    };
  },

  getYearlyRenewals: async (targetYear) => {
    const { data: employees, error: eError } = await supabase.from('employees').select('id, name').eq('is_archived', false);
    const { data: logs, error: lError } = await supabase.from('training_logs').select('*').eq('status', 'Completed');
    
    if (eError || lError) throw (eError || lError);
    
    const activeEmpIds = employees.map(e => e.id);
    const now = new Date();
    
    return logs
      .filter(log => activeEmpIds.includes(log.employee_id))
      .filter(log => log.expiry_date && new Date(log.expiry_date).getFullYear() === parseInt(targetYear))
      .map(log => {
        const emp = employees.find(e => e.id === log.employee_id);
        return {
          ...dataService.mapLog(log),
          employeeName: emp ? emp.name : 'Unknown',
          daysLeft: Math.ceil((new Date(log.expiry_date) - now) / (1000 * 60 * 60 * 24))
        };
      });
  },

  getUniqueCenters: async () => {
    const { data: logs, error } = await supabase.from('training_logs').select('provider, course_name, provider_website');
    if (error) throw error;
    
    const centersMap = {};
    logs.forEach(log => {
      if (!log.provider) return;
      if (!centersMap[log.provider]) {
        centersMap[log.provider] = { name: log.provider, courses: new Set(), website: log.provider_website };
      }
      centersMap[log.provider].courses.add(log.course_name);
    });
    
    return Object.values(centersMap).map(c => ({
      ...c,
      courses: Array.from(c.courses)
    }));
  },

  updateCenterDetails: async (oldName, newName, newWebsite) => {
    const { error } = await supabase
      .from('training_logs')
      .update({ provider: newName, provider_website: newWebsite })
      .eq('provider', oldName);
    if (error) throw error;
  },

  createTrainingRecords: async (formData, employeeIds) => {
    const records = employeeIds.map(empId => ({
      employee_id: empId,
      course_name: formData.courseName,
      provider: formData.provider,
      provider_website: formData.website,
      cost: formData.cost || 0,
      enrolment_date: formData.enrolmentDate,
      completion_date: formData.completionDate || null,
      renewal_type: formData.renewalType,
      status: formData.completionDate ? 'Completed' : 'Enrolled',
      expiry_date: formData.completionDate ? dataService.calculateExpiry(formData.completionDate, formData.renewalType) : null
    }));

    const { error } = await supabase.from('training_logs').insert(records);
    if (error) throw error;
  },

  exportAllDataCSV: async () => {
    const { data: employees, error: eError } = await supabase.from('employees').select('id, name, role, is_archived');
    const { data: logs, error: lError } = await supabase.from('training_logs').select('*');
    
    if (eError || lError) throw (eError || lError);
    
    const csvRows = [];
    csvRows.push(['Employee Name', 'Role', 'Account Status', 'Course Name', 'Provider', 'Cost', 'Enrolment Date', 'Completion Date', 'Expiry Date', 'Training Status', 'Renewal Type']);
    
    employees.forEach(emp => {
      const empLogs = logs.filter(l => l.employee_id === emp.id);
      if (empLogs.length === 0) {
        csvRows.push([`"${emp.name}"`, `"${emp.role}"`, emp.is_archived ? 'Archived' : 'Active', '', '', '', '', '', '', '', '']);
      } else {
        empLogs.forEach(log => {
          csvRows.push([
            `"${emp.name}"`, 
            `"${emp.role}"`, 
            emp.is_archived ? 'Archived' : 'Active',
            `"${log.course_name || ''}"`,
            `"${log.provider || ''}"`,
            log.cost || 0,
            log.enrolment_date || '',
            log.completion_date || '',
            log.expiry_date || '',
            log.status || '',
            `"${log.renewal_type || ''}"`
          ]);
        });
      }
    });

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Itero_TC_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
