import { PublicKey } from "@solana/web3.js";

export function isValidAddress(address: string) {
  try {
    return PublicKey.isOnCurve(new PublicKey(address));
  } catch (e: any) {
    return false;
  }
}

export function dateUTC(date?: string | number | Date) {
  let dt = new Date();
  if (date) dt = new Date(date);

  return new Date(
    Date.UTC(
      dt.getFullYear(),
      dt.getMonth(),
      dt.getDate(),
      dt.getHours(),
      dt.getMinutes(),
      dt.getSeconds()
    )
  );
}
