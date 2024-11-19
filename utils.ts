import type { Collection } from "mongodb";
import type { BookModel } from "./types.ts";
import type { Book } from "./types.ts";



export const fromModelToBook = (model: BookModel): Book => ({
  id: model._id!.toString(),
  title: model.title,
  author: model.author,
  year: model.year,
});