# Firebase Backend Security Model

This project now uses a backend-mediated Firebase model for sensitive actions.

## What Changed

Before, the browser directly performed privileged Firestore writes, such as:

```ts
updateDoc(userRef, { tickets: newBalance });
deleteDoc(doc(firestore, "transactions", id));
addDoc(collection(firestore, "sac_authorized_users"), data);
```

That meant a user could potentially open DevTools, copy the same Firebase client logic, and attempt direct writes against Firestore.

Now, sensitive actions call Firebase Cloud Functions instead:

```ts
backend.adjustFunds(...);
backend.processPurchase(...);
backend.resetFraserPay();
```

The Cloud Functions run server-side with the Firebase Admin SDK. They verify the caller before writing to Firestore.

## Why This Is More Secure

Firebase client configuration is public by design. The project ID, API key, and app ID can be visible in the browser. Those values are not secrets.

The real security boundary is:

1. Firestore Security Rules
2. Firebase Authentication
3. Server-side validation in Cloud Functions

The browser can still load Firebase and attempt Firestore requests, but Firestore rules should reject direct writes to sensitive collections.

## Intended Flow

Browser:

- Requests an action, such as adding funds or processing a purchase.

Cloud Function:

- Checks the caller is signed in.
- Loads the caller's FraserPay profile.
- Verifies role or permissions, such as SAC, super admin, or booth manager.
- Validates the request data.
- Performs the Firestore write with Admin SDK.

Firestore:

- Rejects direct client writes to protected collections.
- Accepts writes performed by trusted Cloud Functions.

## Example Attack Attempt

A malicious user could still open DevTools and try:

```ts
updateDoc(doc(db, "users", victimId), { tickets: 999999 });
```

With proper Firestore rules, this should fail with `permission-denied`.

They could also try calling the backend function:

```ts
httpsCallable(functions, "adjustFunds")({
  studentId: victimId,
  amount: 9999,
});
```

But the backend function checks SAC authorization before making the write, so a normal student should still be rejected.

## Important Requirement

The backend change removes privileged write logic from the browser, but it is not complete without restrictive Firestore Security Rules.

Rules should block direct client writes to sensitive collections such as:

- `users`
- `transactions`
- `transaction_products`
- `booths`
- `sac_authorized_users`

Example policy shape:

```js
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if false;
}

match /transactions/{id} {
  allow read: if request.auth != null;
  allow write: if false;
}

match /transaction_products/{id} {
  allow read: if request.auth != null;
  allow write: if false;
}

match /booths/{id} {
  allow read: if request.auth != null;
  allow write: if false;
}

match /sac_authorized_users/{id} {
  allow read, write: if false;
}
```

Cloud Functions using Firebase Admin SDK bypass Firestore rules, so legitimate writes still work through the backend.

## Summary

Client-side Firebase access is normal. The vulnerability is allowing the client to directly write privileged data.

The improved model is:

```text
Browser -> Cloud Function -> Permission checks -> Firestore write
```

Not:

```text
Browser -> Direct Firestore privileged write
```

Once backend functions are deployed and Firestore rules block direct writes, a hacker can still try from DevTools, but they should not be able to successfully modify protected Firestore data.
