import { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints.js";

type TitleProperty = {
  type: "title";
  title: Array<RichTextItemResponse>;
  id: string;
};

export function isTitleProperty(prop: any): prop is TitleProperty {
  return prop && prop.type === "title" && Array.isArray(prop.title);
}
