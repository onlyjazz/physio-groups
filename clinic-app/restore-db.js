// Script to restore database from backup
// Run this in the browser console to restore your data

const backupData = {
  "statuses": [
    {
      "id": "fd02dbdd-7dd7-48b7-b335-e358850e4824",
      "code": "active"
    },
    {
      "id": "5ba45215-c0a4-46ba-a3f5-a0ebb4820465",
      "code": "inactive"
    }
  ],
  "therapists": [],
  "patients": [
    {
      "id": "b727cdc8-9c52-4095-a342-6075347290d6",
      "firstName": "יוסי",
      "lastName": "כינור",
      "nationalId": "110033",
      "phone": "054-998822",
      "createdAt": 1759686436633,
      "updatedAt": 1759686436633,
      "statusId": "fd02dbdd-7dd7-48b7-b335-e358850e4824"
    },
    {
      "id": "e330868d-58f3-478a-9720-8d7044397ca8",
      "firstName": "שרה",
      "lastName": "מלכה",
      "nationalId": "9821309123",
      "phone": "05-667788",
      "createdAt": 1759686454017,
      "updatedAt": 1759686454017,
      "statusId": "fd02dbdd-7dd7-48b7-b335-e358850e4824"
    }
  ],
  "groups": [
    {
      "id": "587adb58-1e35-44f4-8616-3dcb1ca2c5a2",
      "name": "פילטיס יום א",
      "capacity": 2,
      "available": 0,
      "when": "ראשון 9:00",
      "createdAt": 1759686416396,
      "updatedAt": 1759687289859
    }
  ],
  "patientsInGroups": [
    {
      "id": "3eb31d8d-eb55-4f66-b9b7-ad7ba8b2bff4",
      "patientId": "b727cdc8-9c52-4095-a342-6075347290d6",
      "groupId": "587adb58-1e35-44f4-8616-3dcb1ca2c5a2",
      "receipt": "13131",
      "enrolled": 1,
      "createdAt": 1759687270308,
      "updatedAt": 1759687270308,
      "statusId": "fd02dbdd-7dd7-48b7-b335-e358850e4824"
    },
    {
      "id": "42f4feb0-3f4d-40b6-82fd-f83742f92988",
      "patientId": "e330868d-58f3-478a-9720-8d7044397ca8",
      "groupId": "587adb58-1e35-44f4-8616-3dcb1ca2c5a2",
      "receipt": "312321",
      "enrolled": 1,
      "createdAt": 1759687289859,
      "updatedAt": 1759687289859,
      "statusId": "fd02dbdd-7dd7-48b7-b335-e358850e4824"
    }
  ],
  "therapistsInGroups": [],
  "attendance": [],
  "patientPayments": [
    {
      "id": "66b17084-a86b-4e34-95fa-0f8b7fc6522e",
      "patientId": "b727cdc8-9c52-4095-a342-6075347290d6",
      "groupId": "587adb58-1e35-44f4-8616-3dcb1ca2c5a2",
      "fromMonth": "10/2025",
      "toMonth": "10/2025",
      "paymentDate": "05/10/2025",
      "amount": 50,
      "paymentMethod": "ת",
      "receiptNumber": "13131",
      "createdAt": 1759687270308,
      "updatedAt": 1759687270308
    },
    {
      "id": "ab3de12e-a816-4b5f-bf31-9b2f47e5c258",
      "patientId": "e330868d-58f3-478a-9720-8d7044397ca8",
      "groupId": "587adb58-1e35-44f4-8616-3dcb1ca2c5a2",
      "fromMonth": "10/2025",
      "toMonth": "10/2025",
      "paymentDate": "05/10/2025",
      "amount": 50,
      "paymentMethod": "א",
      "receiptNumber": "312321",
      "createdAt": 1759687289859,
      "updatedAt": 1759687289859
    }
  ]
};

// Store in localStorage with the correct key
localStorage.setItem('phizio-db-v1', JSON.stringify(backupData));

console.log('✅ Database restored successfully!');
console.log('Found:');
console.log(`  - ${backupData.patients.length} patients`);
console.log(`  - ${backupData.groups.length} groups`);
console.log(`  - ${backupData.patientsInGroups.length} patient-group relationships`);
console.log(`  - ${backupData.patientPayments.length} payment records`);
console.log('\n📝 Patients:');
backupData.patients.forEach(p => {
  console.log(`  - ${p.firstName} ${p.lastName} (ID: ${p.id})`);
});

console.log('\nPlease refresh the page to see the restored data.');