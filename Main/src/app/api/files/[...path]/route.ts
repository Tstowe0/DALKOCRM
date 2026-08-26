import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/paths";

type Params = Promise<{ path: string[] }>;

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const segments = (await params).path;
  if (!segments?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const resolved = path.normalize(path.join(UPLOADS_DIR, ...segments));
  if (!resolved.startsWith(path.normalize(UPLOADS_DIR))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = fs.readFileSync(resolved);
  const ext = path.extname(resolved).toLowerCase();
  const type =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".gif"
          ? "image/gif"
          : ext === ".webp"
            ? "image/webp"
            : "application/octet-stream";

  return new NextResponse(bytes, {
    headers: { "Content-Type": type },
  });
}