import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const db = getFirestore();
const SUPER_ADMIN_EMAILS = new Set(["909957@pdsb.net"]);

type Role = "student" | "booth" | "sac";

interface AuthProfile {
  id: string;
  email: string;
  role: Role;
}

interface CartItemInput {
  productId?: unknown;
  product?: {
    id?: unknown;
    name?: unknown;
    price?: unknown;
  };
  quantity?: unknown;
}

const assertAuthed = (uid?: string) => {
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }
  return uid;
};

const asString = (value: unknown, field: string) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpsError("invalid-argument", `${field} is required.`);
  }
  return value.trim();
};

const asOptionalString = (value: unknown) => {
  return typeof value === "string" ? value.trim() : "";
};

const asNumber = (value: unknown, field: string) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpsError("invalid-argument", `${field} must be a finite number.`);
  }
  return value;
};

const getCallerProfile = async (uid: string): Promise<AuthProfile> => {
  const directSnap = await db.doc(`users/${uid}`).get();
  let docSnap = directSnap;

  if (!docSnap.exists) {
    const byUid = await db.collection("users").where("uid", "==", uid).limit(1).get();
    if (byUid.empty) {
      throw new HttpsError("permission-denied", "No FraserPay profile exists for this account.");
    }
    docSnap = byUid.docs[0];
  }

  const data = docSnap.data() ?? {};
  return {
    id: docSnap.id,
    email: String(data.email ?? "").toLowerCase(),
    role: (data.role === "sac" || data.role === "booth") ? data.role : "student",
  };
};

const isSacAuthorizedEmail = async (email: string) => {
  if (SUPER_ADMIN_EMAILS.has(email)) return true;
  const snap = await db.collection("sac_authorized_users").where("email", "==", email).limit(1).get();
  return !snap.empty;
};

const requireSac = async (uid: string) => {
  const profile = await getCallerProfile(uid);
  if (profile.role !== "sac" && !(await isSacAuthorizedEmail(profile.email))) {
    throw new HttpsError("permission-denied", "SAC access is required.");
  }
  return profile;
};

const requireSuperAdmin = async (uid: string) => {
  const profile = await getCallerProfile(uid);
  if (!SUPER_ADMIN_EMAILS.has(profile.email)) {
    throw new HttpsError("permission-denied", "Super admin access is required.");
  }
  return profile;
};

const canManageBooth = async (uid: string, boothId: string) => {
  const profile = await getCallerProfile(uid);
  if (profile.role === "sac" || await isSacAuthorizedEmail(profile.email)) {
    return profile;
  }

  const boothSnap = await db.doc(`booths/${boothId}`).get();
  if (!boothSnap.exists) {
    throw new HttpsError("not-found", "Booth not found.");
  }

  const booth = boothSnap.data() ?? {};
  const members = Array.isArray(booth.members) ? booth.members : [];
  const managers = Array.isArray(booth.managers) ? booth.managers : [];
  if (!members.includes(profile.id) && !managers.includes(profile.id)) {
    throw new HttpsError("permission-denied", "You do not manage this booth.");
  }

  return profile;
};

export const adjustFunds = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  const sac = await requireSac(uid);
  const studentId = asString(request.data?.studentId, "studentId");
  const amount = asNumber(request.data?.amount, "amount");
  const amountInCents = Math.round(amount * 100);

  if (amountInCents === 0) {
    throw new HttpsError("invalid-argument", "Amount cannot be zero.");
  }

  const userRef = db.doc(`users/${studentId}`);
  const transactionRef = db.collection("transactions").doc();

  const result = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "Student not found.");
    }

    const user = userSnap.data() ?? {};
    const currentTickets = Number(user.tickets ?? 0);
    const newTickets = currentTickets + amountInCents;
    if (newTickets < 0) {
      throw new HttpsError("failed-precondition", "Refund exceeds current balance.");
    }

    tx.update(userRef, {
      tickets: newTickets,
      updated_at: FieldValue.serverTimestamp(),
    });

    tx.set(transactionRef, {
      student_id: studentId,
      student_name: user.name ?? "",
      amount: amountInCents,
      type: amountInCents >= 0 ? "fund" : "refund",
      sac_member: sac.id,
      created_at: FieldValue.serverTimestamp(),
      created_at_iso: new Date().toISOString(),
    });

    return {
      transactionId: transactionRef.id,
      updatedBalance: newTickets / 100,
      studentName: user.name ?? "",
    };
  });

  return { success: true, ...result };
});

export const adjustPoints = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  const sac = await requireSac(uid);
  const studentId = asString(request.data?.studentId, "studentId");
  const amount = Math.trunc(asNumber(request.data?.amount, "amount"));
  const reason = asOptionalString(request.data?.reason);

  if (amount === 0) {
    throw new HttpsError("invalid-argument", "Amount cannot be zero.");
  }

  const userRef = db.doc(`users/${studentId}`);
  const transactionRef = db.collection("transactions").doc();

  const result = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "Student not found.");
    }

    const user = userSnap.data() ?? {};
    const currentPoints = Number(user.points ?? 0);
    const newPoints = currentPoints + amount;
    if (newPoints < 0) {
      throw new HttpsError("failed-precondition", "Redemption exceeds current points.");
    }

    tx.update(userRef, {
      points: newPoints,
      updated_at: FieldValue.serverTimestamp(),
    });

    tx.set(transactionRef, {
      student_id: studentId,
      student_name: user.name ?? "",
      amount,
      type: amount >= 0 ? "add" : "redeem",
      sac_member: sac.id,
      reason,
      created_at: FieldValue.serverTimestamp(),
      created_at_iso: new Date().toISOString(),
    });

    return {
      transactionId: transactionRef.id,
      updatedPoints: newPoints,
      studentName: user.name ?? "",
    };
  });

  return { success: true, ...result };
});

export const processPurchase = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  const boothId = asString(request.data?.boothId, "boothId");
  const buyerId = asString(request.data?.buyerId, "buyerId");
  const sellerName = asString(request.data?.sellerName, "sellerName");
  const cartItems = Array.isArray(request.data?.cartItems) ? request.data.cartItems as CartItemInput[] : [];

  if (cartItems.length === 0) {
    throw new HttpsError("invalid-argument", "Cart is empty.");
  }

  const seller = await canManageBooth(uid, boothId);
  const buyerRef = db.doc(`users/${buyerId}`);
  const boothRef = db.doc(`booths/${boothId}`);
  const transactionRef = db.collection("transactions").doc();
  const transactionProductsRef = db.collection("transaction_products");

  const result = await db.runTransaction(async (tx) => {
    const [buyerSnap, boothSnap] = await Promise.all([tx.get(buyerRef), tx.get(boothRef)]);
    if (!buyerSnap.exists) throw new HttpsError("not-found", "Buyer not found.");
    if (!boothSnap.exists) throw new HttpsError("not-found", "Booth not found.");

    const buyer = buyerSnap.data() ?? {};
    const booth = boothSnap.data() ?? {};
    const boothProducts = Array.isArray(booth.products) ? [...booth.products] : [];

    const normalizedItems = cartItems.map((item) => {
      const productId = asString(item.productId ?? item.product?.id, "productId");
      const quantity = Math.trunc(asNumber(item.quantity, "quantity"));
      if (quantity <= 0 || quantity > 100) {
        throw new HttpsError("invalid-argument", "Quantity must be between 1 and 100.");
      }

      const product = boothProducts.find((candidate: any) => candidate?.id === productId);
      if (!product) {
        throw new HttpsError("invalid-argument", "Product does not belong to this booth.");
      }

      const price = Math.trunc(Number(product.price ?? 0));
      if (price <= 0) {
        throw new HttpsError("failed-precondition", "Product has an invalid price.");
      }

      return {
        productId,
        productName: String(product.name ?? ""),
        quantity,
        price,
      };
    });

    const totalAmountInCents = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const currentTickets = Number(buyer.tickets ?? 0);
    if (currentTickets < totalAmountInCents) {
      throw new HttpsError("failed-precondition", "Insufficient balance.");
    }

    const pointsEarned = Math.round(totalAmountInCents / 10);
    for (const item of normalizedItems) {
      const productIndex = boothProducts.findIndex((product: any) => product?.id === item.productId);
      if (productIndex !== -1) {
        boothProducts[productIndex] = {
          ...boothProducts[productIndex],
          salesCount: Number(boothProducts[productIndex].salesCount ?? 0) + item.quantity,
        };
      }
    }

    tx.update(buyerRef, {
      tickets: currentTickets - totalAmountInCents,
      points: Number(buyer.points ?? 0) + pointsEarned,
      updated_at: FieldValue.serverTimestamp(),
    });

    tx.update(boothRef, {
      sales: Number(booth.sales ?? 0) + totalAmountInCents,
      products: boothProducts,
      updated_at: FieldValue.serverTimestamp(),
    });

    tx.set(transactionRef, {
      student_id: buyerId,
      student_name: buyer.name ?? "",
      buyer_id: buyerId,
      buyer_name: buyer.name ?? "",
      booth_id: boothId,
      booth_name: booth.name ?? "",
      seller_id: seller.id,
      seller_name: sellerName,
      amount: totalAmountInCents,
      points_earned: pointsEarned,
      type: "purchase",
      paymentMethod: "cash",
      products: normalizedItems,
      created_at: FieldValue.serverTimestamp(),
      created_at_iso: new Date().toISOString(),
    });

    for (const item of normalizedItems) {
      tx.set(transactionProductsRef.doc(), {
        transaction_id: transactionRef.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
      });
    }

    return {
      transactionId: transactionRef.id,
      amount: totalAmountInCents / 100,
      updatedBalance: (currentTickets - totalAmountInCents) / 100,
    };
  });

  return { success: true, ...result };
});

export const createBooth = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  const sac = await requireSac(uid);
  const name = asString(request.data?.name, "name");
  const description = asOptionalString(request.data?.description);
  const managerId = asString(request.data?.managerId, "managerId");
  const pin = asString(request.data?.pin, "pin");

  if (pin.length < 4 || pin.length > 32) {
    throw new HttpsError("invalid-argument", "PIN must be 4 to 32 characters.");
  }

  const existing = await db.collection("booths").where("name", "==", name).limit(1).get();
  if (!existing.empty) {
    throw new HttpsError("already-exists", "Booth name already exists.");
  }

  const boothRef = db.collection("booths").doc();
  await db.runTransaction(async (tx) => {
    tx.set(boothRef, {
      name,
      description,
      members: [managerId],
      managers: [managerId],
      pin,
      sales: 0,
      products: [],
      created_at: FieldValue.serverTimestamp(),
      created_by: sac.id,
    });
    tx.update(db.doc(`users/${managerId}`), {
      booth_access: FieldValue.arrayUnion(boothRef.id),
    });
  });

  return { success: true, boothId: boothRef.id };
});

export const joinBooth = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  const profile = await getCallerProfile(uid);
  const pin = asString(request.data?.pin, "pin");

  const booths = await db.collection("booths").where("pin", "==", pin).limit(1).get();
  if (booths.empty) {
    throw new HttpsError("not-found", "Invalid booth PIN.");
  }

  const boothRef = booths.docs[0].ref;
  await db.runTransaction(async (tx) => {
    tx.update(boothRef, {
      members: FieldValue.arrayUnion(profile.id),
      managers: FieldValue.arrayUnion(profile.id),
      updated_at: FieldValue.serverTimestamp(),
    });
    tx.update(db.doc(`users/${profile.id}`), {
      booth_access: FieldValue.arrayUnion(boothRef.id),
    });
  });

  return { success: true, boothId: boothRef.id };
});

export const deleteBooth = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  const boothId = asString(request.data?.boothId, "boothId");
  await requireSac(uid);
  await db.doc(`booths/${boothId}`).delete();
  return { success: true };
});

export const deleteUser = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  const userId = asString(request.data?.userId, "userId");
  const sac = await requireSac(uid);
  if (sac.id === userId) {
    throw new HttpsError("failed-precondition", "You cannot delete your own profile.");
  }
  await db.doc(`users/${userId}`).delete();
  return { success: true };
});

export const resetFraserPay = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  await requireSuperAdmin(uid);

  const collections = ["booths", "transactions", "transaction_products"];
  for (const collectionName of collections) {
    let snap = await db.collection(collectionName).limit(400).get();
    while (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      snap = await db.collection(collectionName).limit(400).get();
    }
  }

  return { success: true };
});

export const addAuthorizedSacUser = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  await requireSuperAdmin(uid);
  const email = asString(request.data?.email, "email").toLowerCase();
  if (!email.endsWith("@pdsb.net")) {
    throw new HttpsError("invalid-argument", "Only @pdsb.net email addresses are allowed.");
  }

  const existing = await db.collection("sac_authorized_users").where("email", "==", email).limit(1).get();
  if (!existing.empty) {
    throw new HttpsError("already-exists", "This email is already authorized.");
  }

  const ref = await db.collection("sac_authorized_users").add({
    email,
    added_at: FieldValue.serverTimestamp(),
  });

  return { success: true, id: ref.id };
});

export const verifySacAccess = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  const profile = await getCallerProfile(uid);
  if (!(await isSacAuthorizedEmail(profile.email))) {
    throw new HttpsError("permission-denied", "This account is not authorized for SAC access.");
  }

  await db.doc(`users/${profile.id}`).update({
    role: "sac",
    updated_at: FieldValue.serverTimestamp(),
  });

  return { success: true };
});

export const removeAuthorizedSacUser = onCall(async (request) => {
  const uid = assertAuthed(request.auth?.uid);
  await requireSuperAdmin(uid);
  const userId = asString(request.data?.userId, "userId");
  const userEmail = asString(request.data?.email, "email").toLowerCase();

  await db.doc(`sac_authorized_users/${userId}`).delete();
  const users = await db.collection("users").where("email", "==", userEmail).limit(10).get();
  const batch = db.batch();
  users.docs.forEach((userDoc) => batch.update(userDoc.ref, { role: "student" }));
  await batch.commit();

  return { success: true };
});

export const submitBoothRequest = onCall(async (request) => {
  assertAuthed(request.auth?.uid);
  const data = request.data ?? {};
  const boothName = asString(data.boothName, "boothName");
  const products = Array.isArray(data.products) ? data.products : [];

  if (boothName.length < 3 || boothName.length > 30) {
    throw new HttpsError("invalid-argument", "Booth name must be 3 to 30 characters.");
  }
  if (products.length === 0) {
    throw new HttpsError("invalid-argument", "At least one product is required.");
  }

  const ref = await db.collection("booth_requests").add({
    teachers: Array.isArray(data.teachers) ? data.teachers : [],
    boothName,
    boothDescription: asOptionalString(data.boothDescription),
    groupType: asOptionalString(data.groupType),
    groupInfo: asOptionalString(data.groupInfo),
    products,
    status: "pending",
    additionalInformation: asOptionalString(data.additionalInformation),
    sellingDates: Array.isArray(data.sellingDates) ? data.sellingDates.map(Boolean).slice(0, 5) : [],
    created_at: FieldValue.serverTimestamp(),
  });

  return { success: true, requestId: ref.id };
});
