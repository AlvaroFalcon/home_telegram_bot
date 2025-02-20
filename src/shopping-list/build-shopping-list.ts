import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints.js";

import { config } from "dotenv";
import { Context } from "telegraf";
import { isTitleProperty } from "../helper.js";

config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const RECIPES_DB_ID = process.env.RECIPES_DB_ID;
const SHOPPING_LISTS_DB_ID = process.env.SHOPPING_LIST_DB_ID;

export async function buildShoppingList(ctx: Context): Promise<void> {
  try {
    const recipesToAdd = await getRecipesToAdd();

    if (recipesToAdd.length === 0) {
      await ctx.reply(
        `${ctx.from.first_name} No hay recetas marcadas para agregar a la lista de la compra.`,
      );
      return;
    }

    const allIngredients = [];
    for (const recipe of recipesToAdd) {
      const recipeName = getTitle(
        (recipe as PageObjectResponse).properties.Receta,
      );
      const allIngredientsText = await getIngredientsList(recipe);
      allIngredients.push(...allIngredientsText);
      await uncheckAddToShopping(recipe.id);
      await ctx.reply(`Añadida receta a la lista de la compra: ${recipeName}`);
    }

    const shoppingListPage = await createShoppingListPage();
    const link = `https://www.notion.so/${shoppingListPage.id.replace(
      /-/g,
      "",
    )}`;
    await appendIngredientChecklist(shoppingListPage.id, allIngredients);
    await ctx.reply(`Se ha creado con exito la lista de la compra! ${link}`);
  } catch (error) {
    await ctx.reply(
      "Ha ocurrido un error al crear la lista de la compra. Por favor, intentelo de nuevo.",
    );
    console.error("Error building shopping list:", error);
  }
}

/**
 * Query the Recipes database to find any rows where "Add to Shopping?" = true.
 */
async function getRecipesToAdd() {
  const response = await notion.databases.query({
    database_id: RECIPES_DB_ID,
    filter: {
      property: "A la lista?",
      checkbox: {
        equals: true,
      },
    },
  });
  return response.results;
}

/**
 * Create a new page in the Shopping Lists DB.
 * For example, name it "Groceries <today's date>".
 */
async function createShoppingListPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const pageName = `Nueva lista ${todayStr}`;

  return await notion.pages.create({
    parent: { database_id: SHOPPING_LISTS_DB_ID },
    properties: {
      Name: {
        title: [{ type: "text", text: { content: pageName } }],
      },
      Fecha: {
        date: { start: todayStr },
      },
      Comprado: {
        checkbox: false,
      },
    },
  });
}

async function getIngredientsList(recipePage) {
  const relationArray = recipePage.properties["Ingredientes"]?.relation;
  if (!relationArray || !relationArray.length) {
    return [];
  }

  const ingredientNames = [];

  for (const rel of relationArray) {
    const ingredientPageId = rel.id;

    const ingredientPage = await notion.pages.retrieve({
      page_id: ingredientPageId,
    });
    const nameProp = (ingredientPage as PageObjectResponse).properties[
      "Ingrediente"
    ];
    let ingredientName = "Unnamed Ingredient";
    if (
      nameProp &&
      isTitleProperty(nameProp) &&
      nameProp.title &&
      nameProp.title[0]
    ) {
      ingredientName = nameProp.title[0].plain_text;
    }

    ingredientNames.push(ingredientName);
  }

  return ingredientNames;
}

/**
 * Appends a set of to-do blocks (checkboxes) for each ingredient.
 */
async function appendIngredientChecklist(pageId, ingredients) {
  const children = ingredients.map((item) => ({
    object: "block",
    type: "to_do",
    to_do: {
      rich_text: [
        {
          type: "text",
          text: { content: item },
        },
      ],
      checked: false,
    },
  }));

  await notion.blocks.children.append({
    block_id: pageId,
    children,
  });
}

/**
 * Uncheck "Add to Shopping?" in the recipe page
 * so it doesn't get re-imported next time.
 */
async function uncheckAddToShopping(recipePageId) {
  await notion.pages.update({
    page_id: recipePageId,
    properties: {
      "A la lista?": {
        checkbox: false,
      },
    },
  });
}

/**
 * Helper to safely get the title property from a page
 */
function getTitle(nameProperty) {
  if (nameProperty && nameProperty.title && nameProperty.title[0]) {
    return nameProperty.title[0].plain_text;
  }
  return "Untitled";
}
