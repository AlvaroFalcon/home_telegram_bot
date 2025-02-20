import { Client } from "@notionhq/client";
import { config } from "dotenv";
import { Context } from "telegraf";
config();

export async function markAsPurchased(ctx: Context, pageId: string) {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Comprado: { checkbox: true },
      },
    });
    await ctx.answerCbQuery("Marcado como comprado!");
    await ctx.editMessageText("Esta lista se ha marcado como comprada.");
  } catch (error) {
    console.error("Error updating Notion page: ", error);
    await ctx.answerCbQuery("No se pudo actualizar. Intenta nuevamente.");
  }
}
