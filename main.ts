import { MongoClient, ObjectId } from "mongodb";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
  console.error("MONGO_URL is not set");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

const db = client.db("coleccion");
const booksCollection = db.collection("books");

const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if (method === "GET" && path === "/books") {
    const books = await booksCollection.find().toArray();
    const response = books.map(({ _id, ...book }) => ({ id: _id, ...book }));
    return new Response(JSON.stringify(response), { status: 200 });
  }

  if (method === "GET" && path.startsWith("/books/")) {
    const id = path.split("/")[2];
    const book = await booksCollection.findOne({ _id: new ObjectId(id) });
    if (!book) return new Response(JSON.stringify({ error: "Libro no encontrado" }), { status: 404 });
    const response = { ...book };
    return new Response(JSON.stringify(response), { status: 200 });
  }

  if (method === "POST" && path === "/books") {
    const body = await req.json();
    const { title, author, year } = body;
    if (!title || !author || !year) {
      return new Response(
        JSON.stringify({ error: "Faltan campos obligatorios: title, author, year" }),
        { status: 400 }
      );
    }
    const { insertedId } = await booksCollection.insertOne({ title, author, year });
    const response = { id: insertedId, title, author, year };
    return new Response(JSON.stringify(response), { status: 201 });
  }

  if (method === "PUT" && path.startsWith("/books/")) {
    const id = path.split("/")[2];
    const body = await req.json();
    const { title, author, year } = body;
    if (!title && !author && !year) {
      return new Response(
        JSON.stringify({ error: "Debe enviar al menos un campo para actualizar (title, author, year)" }),
        { status: 400 }
      );
    }
    const updateData: any = {};
    if (title) updateData.title = title;
    if (author) updateData.author = author;
    if (year) updateData.year = year;
    const { modifiedCount } = await booksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    if (modifiedCount === 0) return new Response(JSON.stringify({ error: "Libro no encontrado" }), { status: 404 });
    const book = await booksCollection.findOne({ _id: new ObjectId(id) });
    if (book) {
      const response = {  ...book };
      return new Response(JSON.stringify(response), { status: 200 });
    }
  }

  if (method === "DELETE" && path.startsWith("/books/")) {
    const id = path.split("/")[2];
    if (!id) return new Response(JSON.stringify({ error: "ID inválido" }), { status: 400 });
    const { deletedCount } = await booksCollection.deleteOne({ _id: new ObjectId(id) });
    if (deletedCount === 0) return new Response(JSON.stringify({ error: "Libro no encontrado" }), { status: 404 });
    return new Response(JSON.stringify({ message: "Libro eliminado correctamente" }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: "Ruta no encontrada" }), { status: 404 });
};

Deno.serve({ port: 3000 }, handler);
