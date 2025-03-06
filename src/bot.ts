import { Telegraf } from "telegraf";
import { config } from "dotenv";
import { checkUserValid } from "./auth/check-user-valid.js";
import { buildShoppingList } from "./shopping-list/build-shopping-list.js";
import { listShoppingLists } from "./shopping-list/list-shopping-list.js";
import { markAsPurchased } from "./shopping-list/mark-as-purchased-action.js";
import { loginAndScrape } from "./gym/gym-checker.js";

config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
console.log("Bot started");

bot.command("import", async (ctx) => {
  const isValid = await checkUserValid(ctx.from.username, ctx);
  if (!isValid) {
    return;
  }
  await ctx.reply("Comenzando la importacion...");
  return buildShoppingList(ctx);
});

bot.command("list_shopping", async (ctx) => {
  const isValid = await checkUserValid(ctx.from.username, ctx);
  if (!isValid) {
    return;
  }
  return listShoppingLists(ctx);
});

bot.command("gym", async (ctx) => {
  const isValid = await checkUserValid(ctx.from.username, ctx);
  if (!isValid) {
    return;
  }
  ctx.reply("Consultando el estado del gimnasio...");
  const gymStatus = await loginAndScrape();
  ctx.reply(
    `El gimnasio ${gymStatus.centerName} ahora mismo está \n ${gymStatus.capacity}`
  );
});

bot.action(/markPurchased:(.+)/, async (ctx) => {
  const isValid = await checkUserValid(ctx.from.username, ctx);
  if (!isValid) {
    return;
  }
  const pageId = ctx.match[1];
  await markAsPurchased(ctx, pageId);
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
