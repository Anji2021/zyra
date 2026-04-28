export type { ResourceArticle, ResourceCategory } from "./resource-types";
export { RESOURCE_CATEGORIES } from "./resource-types";

export { resources } from "./resource-articles";

import { resources as resourcesList } from "./resource-articles";
import type { ResourceArticle } from "./resource-types";

export function getResourceById(id: string): ResourceArticle | undefined {
  return resourcesList.find((a) => a.id === id);
}

export function getAllResourceIds(): string[] {
  return resourcesList.map((a) => a.id);
}
