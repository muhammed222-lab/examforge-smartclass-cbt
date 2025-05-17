
import Papa from 'papaparse';

// Base directory for CSV storage (in production would be a server path)
const CSV_STORAGE_PREFIX = 'examforge_';

// CSV File Types
export enum CSVFileType {
  USERS = 'users',
  CLASSES = 'classes',
  STUDENTS = 'students',
  QUESTIONS = 'questions',
  RESULTS = 'results',
  ATTEMPTS = 'attempts',
}

// Function to save data to CSV in localStorage
export async function saveToCSV<T>(data: T[], type: CSVFileType, id?: string): Promise<void> {
  try {
    const key = id ? `${CSV_STORAGE_PREFIX}${type}_${id}` : `${CSV_STORAGE_PREFIX}${type}`;
    const csv = Papa.unparse(data);
    localStorage.setItem(key, csv);
    return Promise.resolve();
  } catch (error) {
    console.error(`Error saving ${type} CSV data:`, error);
    return Promise.reject(error);
  }
}

// Function to get data from CSV in localStorage
export async function getFromCSV<T>(type: CSVFileType, id?: string): Promise<T[]> {
  try {
    const key = id ? `${CSV_STORAGE_PREFIX}${type}_${id}` : `${CSV_STORAGE_PREFIX}${type}`;
    const csv = localStorage.getItem(key);
    
    if (!csv) {
      return Promise.resolve([]);
    }
    
    const results = Papa.parse<T>(csv, { 
      header: true,
      dynamicTyping: true, // Automatically convert numeric values
      skipEmptyLines: true // Skip empty lines to prevent parsing errors
    });
    
    // Check for errors in parsing
    if (results.errors && results.errors.length > 0) {
      console.warn(`Warning parsing ${type} CSV data:`, results.errors);
    }
    
    // Add debugging info for class access
    if (type === CSVFileType.CLASSES) {
      console.log(`Fetched classes data, count: ${results.data?.length || 0}`);
    }
    
    return Promise.resolve(results.data || []);
  } catch (error) {
    console.error(`Error fetching ${type} CSV data:`, error);
    return Promise.resolve([]); // Return empty array on error to prevent app crashes
  }
}

// Function to append data to existing CSV
export async function appendToCSV<T>(data: T, type: CSVFileType, id?: string): Promise<void> {
  try {
    const existingData = await getFromCSV<T>(type, id);
    const newData = [...existingData, data];
    return saveToCSV(newData, type, id);
  } catch (error) {
    console.error(`Error appending to ${type} CSV:`, error);
    return Promise.reject(error);
  }
}

// Function to update a specific item in CSV
export async function updateInCSV<T extends { id: string }>(
  id: string, 
  updates: Partial<T>, 
  type: CSVFileType, 
  fileId?: string
): Promise<void> {
  try {
    const existingData = await getFromCSV<T>(type, fileId);
    const updatedData = existingData.map((item) => 
      item.id === id ? { ...item, ...updates } : item
    );
    return saveToCSV(updatedData, type, fileId);
  } catch (error) {
    console.error(`Error updating item in ${type} CSV:`, error);
    return Promise.reject(error);
  }
}

// Function to delete an item from CSV
export async function deleteFromCSV<T extends { id: string }>(
  id: string, 
  type: CSVFileType, 
  fileId?: string
): Promise<void> {
  try {
    const existingData = await getFromCSV<T>(type, fileId);
    const filteredData = existingData.filter(item => item.id !== id);
    return saveToCSV(filteredData, type, fileId);
  } catch (error) {
    console.error(`Error deleting from ${type} CSV:`, error);
    return Promise.reject(error);
  }
}

// Function to import CSV file
export async function importCSV<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn('Warning parsing imported CSV:', results.errors);
        }
        resolve(results.data || []);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Function to export data to CSV file
export function exportToCSV<T>(data: T[], filename: string): void {
  try {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting to CSV file:', error);
    throw error;
  }
}

// Function to backup all CSV data
export async function backupAllCSVData(): Promise<Record<string, any[]>> {
  try {
    const backup: Record<string, any[]> = {};
    
    // Backup all main CSV types
    for (const type of Object.values(CSVFileType)) {
      const data = await getFromCSV(type);
      backup[type] = data;
      
      // For types that might have sub-files (like STUDENTS, QUESTIONS, RESULTS)
      if (type === CSVFileType.CLASSES) {
        const classes = data as { id: string }[];
        
        // For each class, backup related data
        for (const cls of classes) {
          const students = await getFromCSV(CSVFileType.STUDENTS, cls.id);
          backup[`${CSVFileType.STUDENTS}_${cls.id}`] = students;
          
          const questions = await getFromCSV(CSVFileType.QUESTIONS, cls.id);
          backup[`${CSVFileType.QUESTIONS}_${cls.id}`] = questions;
          
          const results = await getFromCSV(CSVFileType.RESULTS, cls.id);
          backup[`${CSVFileType.RESULTS}_${cls.id}`] = results;
        }
      }
    }
    
    return backup;
  } catch (error) {
    console.error('Error backing up CSV data:', error);
    return {};
  }
}

// Initialize default data
export async function initializeDefaultData(): Promise<void> {
  try {
    // Check if users already exist
    const users = await getFromCSV(CSVFileType.USERS);
    if (users.length === 0) {
      // Add admin user
      await saveToCSV([{
        id: '1',
        email: 'muhammednetr@gmail.com',
        password: '@muhammedA1', // In production this would be hashed
        name: 'Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentPlan: 'premium',
        examsRemaining: 'unlimited'
      }], CSVFileType.USERS);
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}
