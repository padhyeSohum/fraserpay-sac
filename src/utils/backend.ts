import { functions } from "@/integrations/firebase/client";
import { httpsCallable } from "firebase/functions";
import { CartItem } from "@/types";

const callBackend = async <TResponse = any>(name: string, payload: Record<string, unknown>) => {
  const callable = httpsCallable<Record<string, unknown>, TResponse>(functions, name);
  const result = await callable(payload);
  return result.data;
};

export const backend = {
  adjustFunds: (studentId: string, amount: number) =>
    callBackend<{ success: boolean; transactionId: string; updatedBalance: number; studentName: string }>(
      "adjustFunds",
      { studentId, amount },
    ),

  adjustPoints: (studentId: string, amount: number, reason: string) =>
    callBackend<{ success: boolean; transactionId: string; updatedPoints: number; studentName: string }>(
      "adjustPoints",
      { studentId, amount, reason },
    ),

  processPurchase: (
    boothId: string,
    buyerId: string,
    sellerName: string,
    cartItems: CartItem[],
  ) =>
    callBackend<{ success: boolean; transactionId: string; amount: number; updatedBalance: number }>(
      "processPurchase",
      {
        boothId,
        buyerId,
        sellerName,
        cartItems: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    ),

  createBooth: (name: string, description: string, managerId: string, pin: string) =>
    callBackend<{ success: boolean; boothId: string }>("createBooth", {
      name,
      description,
      managerId,
      pin,
    }),

  joinBooth: (pin: string) =>
    callBackend<{ success: boolean; boothId: string }>("joinBooth", { pin }),

  deleteBooth: (boothId: string) =>
    callBackend<{ success: boolean }>("deleteBooth", { boothId }),

  deleteUser: (userId: string) =>
    callBackend<{ success: boolean }>("deleteUser", { userId }),

  resetFraserPay: () =>
    callBackend<{ success: boolean }>("resetFraserPay", {}),

  addAuthorizedSacUser: (email: string) =>
    callBackend<{ success: boolean; id: string }>("addAuthorizedSacUser", { email }),

  removeAuthorizedSacUser: (userId: string, email: string) =>
    callBackend<{ success: boolean }>("removeAuthorizedSacUser", { userId, email }),

  verifySacAccess: () =>
    callBackend<{ success: boolean }>("verifySacAccess", {}),

  submitBoothRequest: (payload: Record<string, unknown>) =>
    callBackend<{ success: boolean; requestId: string }>("submitBoothRequest", payload),
};
