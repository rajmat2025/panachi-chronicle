import { prisma } from "./client";
import type { ChroniclePerson, MediaItem } from "@/types/chronicle";

/** Serialize a Date to ISO string (or null) for safe passing to client components. */
function dateStr(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/**
 * Fetch every visible person from the shared DB (read-only) with their media.
 * Ordering here is coarse; the true depth-first book order is rebuilt from
 * parentCode links in the book builder.
 */
export async function fetchAllVisiblePeople(): Promise<ChroniclePerson[]> {
  const rows = await prisma.person.findMany({
    where: { isVisible: true },
    orderBy: [
      { generationNumber: "asc" },
      { sortOrder: "asc" },
      { genealogyCode: "asc" },
    ],
    include: {
      media: {
        orderBy: [{ sortOrder: "asc" }],
      },
    },
  });

  return rows.map((row): ChroniclePerson => {
    const media: MediaItem[] = row.media
      .filter((m) => (m.mediaType ?? "image") === "image")
      .map((m) => ({
        id: m.id,
        url: m.url,
        caption: m.caption ?? null,
        subject: (m.subject as string) ?? "PERSON",
      }));

    return {
      id: row.id,
      genealogyCode: row.genealogyCode,
      parentCode: row.parentCode,
      branchCode: row.branchCode,
      generationNumber: row.generationNumber,
      sortOrder: row.sortOrder,

      displayName: row.displayName,
      originalName: row.originalName,
      otherName: row.otherName,
      familyName: row.familyName,
      place: row.place,
      qualification: row.qualification,

      spouseName: row.spouseName,
      originalSpouseName: row.originalSpouseName,
      spouseFamilyName: row.spouseFamilyName,
      spousePlace: row.spousePlace,
      spouseQualification: row.spouseQualification,
      spouseDob: dateStr(row.spouseDob),
      spouseDod: dateStr(row.spouseDod),

      houseLocation: row.houseLocation,
      notes: row.notes,
      dob: dateStr(row.dob),
      dod: dateStr(row.dod),
      profileImageUrl: row.profileImageUrl,
      spouseProfileImageUrl: row.spouseProfileImageUrl,

      media,
    };
  });
}
