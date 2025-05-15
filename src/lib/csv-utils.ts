
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
  const key = id ? `${CSV_STORAGE_PREFIX}${type}_${id}` : `${CSV_STORAGE_PREFIX}${type}`;
  const csv = Papa.unparse(data);
  localStorage.setItem(key, csv);
  return Promise.resolve();
}

// Function to get data from CSV in localStorage
export async function getFromCSV<T>(type: CSVFileType, id?: string): Promise<T[]> {
  const key = id ? `${CSV_STORAGE_PREFIX}${type}_${id}` : `${CSV_STORAGE_PREFIX}${type}`;
  const csv = localStorage.getItem(key);
  
  if (!csv) {
    return Promise.resolve([]);
  }
  
  const results = Papa.parse<T>(csv, { header: true });
  return Promise.resolve(results.data);
}

// Function to append data to existing CSV
export async function appendToCSV<T>(data: T, type: CSVFileType, id?: string): Promise<void> {
  const existingData = await getFromCSV<T>(type, id);
  const newData = [...existingData, data];
  return saveToCSV(newData, type, id);
}

// Function to update a specific item in CSV
export async function updateInCSV<T extends { id: string }>(
  id: string, 
  updates: Partial<T>, 
  type: CSVFileType, 
  fileId?: string
): Promise<void> {
  const existingData = await getFromCSV<T>(type, fileId);
  const updatedData = existingData.map((item) => 
    item.id === id ? { ...item, ...updates } : item
  );
  return saveToCSV(updatedData, type, fileId);
}

// Function to delete an item from CSV
export async function deleteFromCSV<T extends { id: string }>(
  id: string, 
  type: CSVFileType, 
  fileId?: string
): Promise<void> {
  const existingData = await getFromCSV<T>(type, fileId);
  const filteredData = existingData.filter(item => item.id !== id);
  return saveToCSV(filteredData, type, fileId);
}

// Function to import CSV file
export async function importCSV<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Function to export data to CSV file
export function exportToCSV<T>(data: T[], filename: string): void {
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
}

// Initialize default data
export async function initializeDefaultData(): Promise<void> {
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
}
