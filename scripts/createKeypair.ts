import fs from "fs";
import { Keypair } from "@solana/web3.js";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const filePath = path.resolve(__dirname, "..", ".env");
const fileExists = fs.existsSync(filePath);

const key = Keypair.generate().secretKey.toString();
const content = `KEYPAIR_SECRET="${key}"`;

if (fileExists) {
  if (process.env.KEYPAIR_SECRET) {
    const existingContent = fs.readFileSync(filePath, "utf-8");

    fs.writeFileSync(
      filePath,
      existingContent.replace(
        new RegExp(`KEYPAIR_SECRET="${process.env.KEYPAIR_SECRET}"`, "g"),
        `KEYPAIR_SECRET="${key}"`
      )
    );
  } else fs.writeFileSync(filePath, fs.readFileSync(filePath, "utf-8") + `\n${content}`);
} else fs.writeFileSync(filePath, content);

console.log("Keypair added to .env file ✅");
