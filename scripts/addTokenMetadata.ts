import {
  Collection,
  Creator,
  Uses,
  createMetadataAccountV3,
} from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import { createSignerFromKeypair, none, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// run npm run create-keypair && npm run create-token or it's equivalent for import to work
import tokenMetadata from "../token/metadata.json";

dotenv.config();

// getting the keypair_secret from .env
const KEYPAIR_SECRET = process.env.KEYPAIR_SECRET;
if (!KEYPAIR_SECRET) throw new Error("missing .env variable: KEYPAIR_SECRET");

const secret = KEYPAIR_SECRET.split(",").map(Number);
const signer = web3.Keypair.fromSecretKey(Uint8Array.from(secret));

async function main() {
  console.log("Started process >>>>>>>>>>");

  const RPC_URL = process.env.RPC_URL;
  const umi = createUmi(RPC_URL ? RPC_URL : "https://api.devnet.solana.com");
  const umiSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(signer));
  umi.use(signerIdentity(umiSigner, true));

  const metadata = {
    name: "Quyx Token",
    symbol: "QXT",
    uri: "https://bronze-geographical-mackerel-284.mypinata.cloud/ipfs/QmZLZ2EzBC6x42c1dviEn8C526APGhfMtWNP7e472TyD7y",
  };

  const accounts = {
    mint: fromWeb3JsPublicKey(new web3.PublicKey(tokenMetadata.mint)),
    mintAuthority: umiSigner,
  };

  const data = {
    isMutable: true,
    collectionDetails: null,
    data: {
      ...metadata,
      sellerFeeBasisPoints: 0,
      creators: none<Creator[]>(),
      collection: none<Collection>(),
      uses: none<Uses>(),
    },
  };

  console.log("Creating metadata >>>>>>>>>>");
  await createMetadataAccountV3(umi, { ...accounts, ...data }).sendAndConfirm(umi);

  // update metadata json file
  const _path = path.resolve(__dirname, "..", "token", "metadata.json"); // ../token/metadata.json
  fs.writeFile(
    _path,
    JSON.stringify({ ...tokenMetadata, ...metadata }, null, 4),
    "utf-8",
    (err) => {
      if (err) console.error(err);
      else console.log("Token metadata updated!");
    }
  );
}

main().catch((e) => console.error(e));
