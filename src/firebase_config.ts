

// https://console.firebase.google.com/project/_/firestore/rules
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//   	match /timesync/{sync_id} {
//     	allow read, write, create, update;
//     }
//     match /groups/{g_name} {
//       allow read, create;
// 			allow write, update: if request.resource.data.tick > resource.data.tick;
//     }
//   }
// }

export const firebase_config = {
  apiKey: "AIzaSyDg9u-qd-S3mtAAJDYV6WBHIddecAEurfU",
  authDomain: "go-stress-without-them.firebaseapp.com",
  projectId: "go-stress-without-them",
  storageBucket: "go-stress-without-them.appspot.com",
  messagingSenderId: "782913429050",
  appId: "1:782913429050:web:82a11d5881a07ab4ec9f03"
};
