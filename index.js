// Import stylesheets
import './style.scss';
// Firebase App (the core Firebase SDK) is always required and must be listed first
import firebase from 'firebase/app';

// Add the Firebase products that you want to use
import 'firebase/auth';
import 'firebase/firestore';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const type = document.getElementById('type');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const numberRed = document.getElementById('number-red');
const numberGreen = document.getElementById('number-green');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

var rsvpListener = null;
var guestbookListener = null;
var dettaglioListener = null;

async function main() {
  // Add Firebase project configuration object here
  var firebaseConfig = {
    apiKey: 'AIzaSyCgp2v4xav5zfJuYXS3ZE_8ubuj258BkHk',
    authDomain: 'fir-web-codelab-f822e.firebaseapp.com',
    projectId: 'fir-web-codelab-f822e',
    storageBucket: 'fir-web-codelab-f822e.appspot.com',
    messagingSenderId: '1038987755323',
    appId: '1:1038987755323:web:6e9d0bad72610498bbc11e'
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      }
    }
  };

  // Initialize the FirebaseUI widget using Firebase
  const ui = new firebaseui.auth.AuthUI(firebase.auth());

  // Called when the user clicks the RSVP button
  startRsvpButton.addEventListener('click', () => {
    if (firebase.auth().currentUser) {
      // User is signed in; allows user to sign out
      firebase.auth().signOut();
    } else {
      // No user is signed in; allows user to sign in
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      startRsvpButton.textContent = 'ESCI';
      // Show guestbook to logged-in users
      guestbookContainer.style.display = 'block';

      // Subscribe to the guestbook collection
      subscribeGuestbook();

      // Subscribe to the guestbook collection
      subscribeCurrentRSVP(user);

      //
      subscribeDettaglio();
    } else {
      startRsvpButton.textContent = 'ACCEDI';
      // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = 'none';

      // Unsubscribe from the guestbook collection
      unsubscribeGuestbook();

      // Unsubscribe from the guestbook collection
      unsubscribeCurrentRSVP();

      //
      unsubscribeDettaglio();
    }
  });

  // Listen to the form submission
  form.addEventListener('submit', e => {
    // Prevent the default form redirect
    e.preventDefault();
    // Write a new message to the database collection "guestbook"
   firebase
      .firestore()
      .collection('guestbook')
      .add({
        text: input.value,
        timestamp: Date.now(),
        name: firebase.auth().currentUser.displayName,
        userId: firebase.auth().currentUser.uid,
        type: type.value
      });

    firebase
      .firestore()
      .collection('dettaglio')
      .add({
        text: input.value,
        timestamp: Date.now(),
        name: firebase.auth().currentUser.displayName,
        userId: firebase.auth().currentUser.uid,
        type: type.value,
        testo: "vbcvbcbcbcvbcvbcvbcvbcvbcvbcbcvbcvvbcv"
      });

    // clear message input field
    input.value = '';
    // Return false to avoid redirect
    return false;
  });

  // Listen to guestbook updates
  function subscribeGuestbook() {
    // Create query for messages
    guestbookListener = firebase
      .firestore()
      .collection('guestbook')
      .orderBy('timestamp', 'desc')
      .onSnapshot(snaps => {
        // Reset page
        guestbook.innerHTML = '--';

        // Loop through documents in database
        snaps.forEach(doc => {
          // Create an HTML entry for each document and add it to the chat
          const entry = document.createElement('button');
          entry.textContent = doc.data().name + ': ' + doc.data().text;
          entry.className = doc.data().type;
          guestbook.appendChild(entry);
          entry.onclick = (e) => {
            console.log("LOG:"+doc.data().text);
            altroGuestbook.innerHTML = doc.data().text;
          }
        });
      });
  }

  // Unsubscribe from guestbook updates
  function unsubscribeGuestbook() {
    if (guestbookListener != null) {
      guestbookListener();
      guestbookListener = null;
    }
  }

    // Listen to dettaglio updates
  function subscribeDettaglio() {
    // Create query for messages
    dettaglioListener = firebase
      .firestore()
      .collection('dettaglio')
      .orderBy('timestamp', 'desc')
      .onSnapshot(snaps => {
        // Reset page
        dettaglio.innerHTML = '--';

        // Loop through documents in database
        snaps.forEach(doc => {
          // Create an HTML entry for each document and add it to the chat
          const entry = document.createElement('button');
          entry.textContent = doc.data().name + ': ' + doc.data().text;
          entry.className = doc.data().type;
          entry.title =  doc.data().testo;
          dettaglio.appendChild(entry);
        });
      });
  }

  // Unsubscribe from dettaglio updates
  function unsubscribeDettaglio() {
    if (dettaglioListener != null) {
      dettaglioListener();
      dettaglioListener = null;
    }
  }

  // Listen to RSVP responses
  rsvpYes.onclick = () => {
    // Get a reference to the user's document in the attendees collection
    const userDoc = firebase
      .firestore()
      .collection('attendees')
      .doc(firebase.auth().currentUser.uid);

    // If they RSVP'd yes, save a document with attending: true
    userDoc
      .set({
        attending: true
      })
      .catch(console.error);
  };

  rsvpNo.onclick = () => {
    // Get a reference to the user's document in the attendees collection
    const userDoc = firebase
      .firestore()
      .collection('attendees')
      .doc(firebase.auth().currentUser.uid);

    // If they RSVP'd no, save a document with attending: false
    userDoc
      .set({
        attending: false
      })
      .catch(console.error);
  };

  // Listen for attendee list
  firebase
    .firestore()
    .collection('attendees')
    .where('attending', '==', true)
    .onSnapshot(snap => {
      const newAttendeeCount = snap.docs.length;

      numberAttending.innerHTML = newAttendeeCount + ' people going';
    });

  // Listen for numberRed
  firebase
    .firestore()
    .collection('guestbook')
    .where('type', '==', 'clickedNo')
    .onSnapshot(snap => {
      const newAttendeeCount = snap.docs.length;

      numberRed.innerHTML = newAttendeeCount + ' RED';
    });

  // Listen for numberGreen
  firebase
    .firestore()
    .collection('guestbook')
    .where('type', '==', 'clickedYes')
    .onSnapshot(snap => {
      const newAttendeeCount = snap.docs.length;

      numberGreen.innerHTML = newAttendeeCount + ' GREEN';
    });

  // Listen for attendee list
  function subscribeCurrentRSVP(user) {
    rsvpListener = firebase
      .firestore()
      .collection('attendees')
      .doc(user.uid)
      .onSnapshot(doc => {
        if (doc && doc.data()) {
          const attendingResponse = doc.data().attending;

          // Update css classes for buttons
          if (attendingResponse) {
            rsvpYes.className = 'clickedYes';
            rsvpNo.className = '';
          } else {
            rsvpYes.className = '';
            rsvpNo.className = 'clickedNo';
          }
        }
      });
  }

  function unsubscribeCurrentRSVP() {
    if (rsvpListener != null) {
      rsvpListener();
      rsvpListener = null;
    }
    rsvpYes.className = '';
    rsvpNo.className = '';
  }
}
main();
