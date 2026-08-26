import fs from "node:fs";
import { NextResponse } from "next/server";
import {
  absolutePathFor,
  getAttachment,
} from "@/data/attachments";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const { id } = await params;
  const attachment = getAttachment(id);
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = absolutePathFor(attachment);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  const bytes = fs.readFileSync(filePath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${attachment.fileName}"`,
    },
  });
}