import { config } from "dotenv";
import { Context } from "telegraf";

config();

const VALID_USERS = process.env.VALID_USERS.toLowerCase().split(",");

export async function checkUserValid(
  username: string,
  ctx: Context,
): Promise<boolean> {
  if (VALID_USERS.includes(username.toLowerCase())) {
    return true;
  }
  await ctx.reply("Lo siento, no tienes permisos para usar este comando.");
  return false;
}
