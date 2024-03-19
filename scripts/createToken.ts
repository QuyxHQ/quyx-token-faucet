import { Keypair, Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// getting the keypair_secret from .env
const KEYPAIR_SECRET = process.env.KEYPAIR_SECRET;
if (!KEYPAIR_SECRET) throw new Error("missing .env variable: KEYPAIR_SECRET");

const secret = KEYPAIR_SECRET.split(",").map(Number);
const signer = Keypair.fromSecretKey(Uint8Array.from(secret));

async function main() {
  console.log("Started process >>>>>>>>>>");

  const RPC_URL = process.env.RPC_URL;
  const connection = new Connection(RPC_URL ? RPC_URL : clusterApiUrl("devnet"));

  console.log("Querying signer balance >>>>>>>>>>");
  let signerBalance = await connection.getBalance(signer.publicKey);
  signerBalance = signerBalance / LAMPORTS_PER_SOL;

  if (signerBalance < 1) {
    // request airdrop
    const amount_to_airdrop = 1;

    console.log(
      `Requesting airdrop of ${amount_to_airdrop} SOL for ${signer.publicKey.toBase58()}`
    );

    const signature = await connection.requestAirdrop(
      signer.publicKey,
      amount_to_airdrop * LAMPORTS_PER_SOL
    );

    await connection.confirmTransaction(
      { signature, ...(await connection.getLatestBlockhash()) },
      "finalized"
    );

    console.log(
      `Successfully airdropped ${amount_to_airdrop} SOL to ${signer.publicKey.toBase58()}`
    );
  }

  console.log("Creating token >>>>>>>>>>");

  const token: Record<string, any> = { decimals: 9 };
  const mint = await createMint(
    connection,
    signer,
    signer.publicKey,
    signer.publicKey,
    token.decimals
  );

  token.mint = mint.toBase58();
  console.log(`Token created, mint: ${mint.toBase58()}`);

  // creating the folder if it does not exist
  const _tokenPatb = path.join(__dirname, "..", "token");
  if (!fs.existsSync(_tokenPatb)) fs.mkdirSync(_tokenPatb, { recursive: true });

  // write to json file
  const _path = path.resolve(__dirname, "..", "token", "metadata.json"); // ../token/metadata.json
  fs.writeFile(_path, JSON.stringify(token, null, 4), "utf-8", (err) => {
    if (err) console.error(err);
    else console.log("Token metadata written to: token/metadata.json");
  });

  return;
}

main().catch((e) => console.error(e));
