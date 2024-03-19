import { clusterApiUrl, Keypair } from "@solana/web3.js";
import dotenv from "dotenv";
import tokenMetadata from "../../token/metadata.json";

dotenv.config();

let { SENTRY_DSN, ENV, DEVNET_RPC_URL, AIRDROP_QTY, KEYPAIR_SECRET } = process.env;

ENV = ENV || "test";
const IS_PROD = ENV === "production";

SENTRY_DSN = SENTRY_DSN || "xx";
DEVNET_RPC_URL = DEVNET_RPC_URL || clusterApiUrl("devnet");

// KEYPAIR_SECRET must be setƒ
if (!KEYPAIR_SECRET) throw new Error("missing .env variable: KEYPAIR_SECRET");
const secret = KEYPAIR_SECRET.split(",").map(Number);
const signer = Keypair.fromSecretKey(Uint8Array.from(secret));

export default {
  ENV,
  IS_PROD,
  SENTRY_DSN,
  DEVNET_RPC_URL,
  AIRDROP_QTY: Number(AIRDROP_QTY || 20) * 10 ** tokenMetadata.decimals,
  SIGNER: signer,
};
