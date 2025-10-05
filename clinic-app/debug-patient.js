// Debug script to check patient data
// Run this in the browser console to debug the issue

console.log('=== DEBUGGING PATIENT NOT FOUND ISSUE ===');

// Load the database from localStorage
const dbData = localStorage.getItem('db');
if (!dbData) {
  console.error('No database found in localStorage!');
} else {
  const db = JSON.parse(dbData);
  console.log('Database loaded successfully');
  
  // The patient ID from the URL
  const targetPatientId = 'b727cdc8-9c52-4095-a342-6075347290d6';
  
  // Check if patients array exists
  if (!db.patients) {
    console.error('No patients array in database!');
  } else {
    console.log(`Total patients in database: ${db.patients.length}`);
    
    // Search for the specific patient
    const patient = db.patients.find(p => p.id === targetPatientId);
    
    if (patient) {
      console.log('✅ Patient FOUND:', patient);
    } else {
      console.log('❌ Patient NOT found with ID:', targetPatientId);
      
      // Show first few patient IDs for comparison
      console.log('First 5 patient IDs in database:');
      db.patients.slice(0, 5).forEach(p => {
        console.log(`  - ${p.id} (${p.firstName} ${p.familyName})`);
      });
      
      // Check if there's a similar ID (case sensitivity or typo)
      const similarPatient = db.patients.find(p => 
        p.id.toLowerCase() === targetPatientId.toLowerCase()
      );
      
      if (similarPatient) {
        console.log('⚠️  Found similar patient (case mismatch):', similarPatient);
      }
    }
  }
  
  // Also check the route parsing
  console.log('\n=== ROUTE INFORMATION ===');
  console.log('Current hash:', location.hash);
  console.log('Expected format: #/registration/patientId or #/registration/patientId/groupId');
  
  // Parse the route manually
  let h = location.hash || '';
  if (h.startsWith('#/')) h = h.slice(2);
  else if (h.startsWith('#')) h = h.slice(1);
  const segments = h.split('/').filter(Boolean);
  console.log('Parsed segments:', segments);
  console.log('Route name:', segments[0]);
  console.log('Patient ID from route:', segments[1]);
  console.log('Group ID from route (if any):', segments[2] || 'none');
}