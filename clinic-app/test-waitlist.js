// Test script for waitlist functionality
// Run this in the browser console after loading the app

// Helper to create test data
function testWaitlist() {
  const db = JSON.parse(localStorage.getItem('phizio-db-v1'));
  
  // Create a test group with capacity of 2
  const testGroupId = 'test-group-' + Date.now();
  const testGroup = {
    id: testGroupId,
    name: 'Test Waitlist Group',
    capacity: 2,
    available: 2,
    when: 'Monday 10:00',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  // Create test patients
  const patients = [
    { id: 'patient-1', firstName: 'John', lastName: 'Doe', nationalId: '111', phone: '111', createdAt: Date.now(), updatedAt: Date.now(), statusId: db.statuses[0].id },
    { id: 'patient-2', firstName: 'Jane', lastName: 'Smith', nationalId: '222', phone: '222', createdAt: Date.now(), updatedAt: Date.now(), statusId: db.statuses[0].id },
    { id: 'patient-3', firstName: 'Bob', lastName: 'Johnson', nationalId: '333', phone: '333', createdAt: Date.now(), updatedAt: Date.now(), statusId: db.statuses[0].id }
  ];
  
  // Add test data
  db.groups.push(testGroup);
  db.patients.push(...patients);
  
  // Add first two patients (should be enrolled)
  db.patientsInGroups.push({
    id: 'pig-1',
    patientId: 'patient-1',
    groupId: testGroupId,
    enrolled: 1, // Should be enrolled
    createdAt: Date.now(),
    updatedAt: Date.now(),
    statusId: db.statuses[0].id
  });
  
  db.patientsInGroups.push({
    id: 'pig-2',
    patientId: 'patient-2',
    groupId: testGroupId,
    enrolled: 1, // Should be enrolled
    createdAt: Date.now() + 1000,
    updatedAt: Date.now() + 1000,
    statusId: db.statuses[0].id
  });
  
  // Add third patient (should be on waitlist)
  db.patientsInGroups.push({
    id: 'pig-3',
    patientId: 'patient-3',
    groupId: testGroupId,
    enrolled: 0, // Should be on waitlist
    createdAt: Date.now() + 2000,
    updatedAt: Date.now() + 2000,
    statusId: db.statuses[0].id
  });
  
  // Update available count
  testGroup.available = 0;
  
  // Save to localStorage
  localStorage.setItem('phizio-db-v1', JSON.stringify(db));
  
  console.log('Test data created successfully!');
  console.log('Group:', testGroup);
  console.log('Patients in group:');
  db.patientsInGroups.filter(pig => pig.groupId === testGroupId).forEach(pig => {
    const patient = patients.find(p => p.id === pig.patientId);
    console.log(`- ${patient.firstName} ${patient.lastName}: ${pig.enrolled === 1 ? 'ENROLLED' : 'WAITLISTED'}`);
  });
  
  console.log('\nNow navigate to Groups page and select "Test Waitlist Group" to see the waitlist display.');
  console.log('The third patient (Bob Johnson) should show "ממתינים" in orange.');
  
  return 'Test completed. Refresh the page to see the test data.';
}

// Run the test
testWaitlist();
