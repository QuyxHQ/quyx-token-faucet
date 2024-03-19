import express, { Request, Response } from "express";
import NodeCache from "node-cache";
import validate from "./validateSchema";
import { FaucetSchema } from "./schema";
import { z } from "zod";
import { dateUTC, isValidAddress } from "./helper";
import { Connection, PublicKey } from "@solana/web3.js";
import { mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import config from "./config";
import tokenMetadata from "../../token/metadata.json";

const cache = new NodeCache({ stdTTL: 60 * 60 }); // ttl - 1 hr

const router = express.Router();

router.post(
  "/",
  validate(FaucetSchema),
  async function (req: Request<{}, z.TypeOf<typeof FaucetSchema>["body"]>, res: Response) {
    try {
      const { address } = req.body;

      if (!isValidAddress(address)) {
        return res.status(400).json({
          status: false,
          message: "Address is not valid",
        });
      }

      // check if address is still in cache
      const cachedData = cache.get(address) as CachedData | undefined;
      if (cachedData) {
        // should still wait
        return res.status(200).json({
          status: false,
          message: "Oops! Wait an hr before requesting again",
          data: cachedData,
        });
      }

      // get connection to blockchain
      const connection = new Connection(config.DEVNET_RPC_URL);

      // get address ATA
      const accountATA = await getOrCreateAssociatedTokenAccount(
        connection,
        config.SIGNER,
        new PublicKey(tokenMetadata.mint),
        new PublicKey(address)
      );

      // do the minting..
      const request = await mintTo(
        connection,
        config.SIGNER,
        new PublicKey(tokenMetadata.mint),
        accountATA.address,
        config.SIGNER.publicKey,
        config.AIRDROP_QTY
      );

      // confirming tx
      await connection.confirmTransaction(
        { signature: request, ...(await connection.getLatestBlockhash()) },
        "finalized"
      );

      // setting cache!
      const created_on = dateUTC();
      const expires_on = dateUTC();
      expires_on.setHours(expires_on.getHours() + 1); // expires in the next 1 hr

      cache.set(address, {
        created_on: created_on.getTime(),
        expires_on: expires_on.getTime(),
      } as CachedData);

      return res.status(200).json({
        status: true,
        message: `${config.AIRDROP_QTY / 10 ** tokenMetadata.decimals} ${
          tokenMetadata.symbol
        } sent to ${address}`,
      });
    } catch (e) {
      return res.status(500).json({
        status: false,
        message: (e as any).message,
      });
    }
  }
);

export = router;
