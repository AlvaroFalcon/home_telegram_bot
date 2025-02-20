import { Client } from "@notionhq/client";
import {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { config } from "dotenv";
import { Context, Markup } from "telegraf";
import { isTitleProperty } from "../helper.js";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
config();
export async function listShoppingLists(context: Context) {
  await context.reply("Cargando listas de la compra...");
  const response = await notion.databases.query({
    database_id: process.env.SHOPPING_LIST_DB_ID,
    filter: {
      property: "Comprado",
      checkbox: {
        equals: false,
      },
    },
  });

  if (response.results.length > 0) {
    await context.reply(
      `${context.from.first_name}, estos son los elementos pendientes de comprar:`,
    );
  } else {
    return context.reply("No hay elementos en la lista de la compra.");
  }

  for (const page of response.results) {
    const allIngredients: string[] = [];
    const ingredients = await notion.blocks.children.list({
      block_id: page.id,
    });
    allIngredients.push(
      ...ingredients.results
        .map((ingredient: BlockObjectResponse) => {
          if (ingredient.type === "to_do") {
            const checked = ingredient.to_do.checked ? "✅" : "🔲";
            return `${checked} ${ingredient.to_do.rich_text[0].plain_text}`;
          }
          return null;
        })
        .filter(Boolean),
    );
    if (allIngredients.length > 0) {
      const inlineKeyboard = Markup.inlineKeyboard([
        Markup.button.callback(
          "Marcar como Comprado",
          `markPurchased:${page.id}`,
        ),
      ]);
      const nameProp = (page as PageObjectResponse).properties["Name"];
      if (isTitleProperty(nameProp)) {
        await context.reply(`${nameProp.title[0].plain_text}:`);
      }
      await context.reply(allIngredients.join("\n"), inlineKeyboard);
    }
  }
}
