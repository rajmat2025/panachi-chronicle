import { prisma } from "./client";
import { getLocalPhotos } from "@/lib/uploads/local-photos";
import { imageBaseUrl, resolveImageUrl } from "@/lib/image";
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
    select: {
      id: true,
      genealogyCode: true,
      parentCode: true,
      branchCode: true,
      generationNumber: true,
      sortOrder: true,
      displayName: true,
      otherName: true,
      familyName: true,
      place: true,
      qualification: true,
      spouseName: true,
      originalSpouseName: true,
      spouseFamilyName: true,
      spousePlace: true,
      spouseQualification: true,
      spouseDob: true,
      spouseDod: true,
      houseLocation: true,
      notes: true,
      dob: true,
      dod: true,
      profileImageUrl: true,
      spouseProfileImageUrl: true,
      media: {
        select: { id: true, url: true, mediaType: true, subject: true, caption: true },
        orderBy: [{ sortOrder: "asc" }],
      },
    },
  });

  const base = imageBaseUrl();
  return rows.map((row): ChroniclePerson => {
    // Start from DB media (carries captions), then add every photo found in the
    // tree's folder for this genealogy code, de-duplicated by path; finally
    // point every path at the tree site.
    const media: MediaItem[] = row.media
      .filter((m) => (m.mediaType ?? "image") === "image")
      .map((m) => ({
        id: m.id,
        url: m.url,
        caption: m.caption ?? null,
        subject: (m.subject as string) ?? "PERSON",
      }));

    const local = getLocalPhotos(row.genealogyCode);
    const seen = new Set(media.map((m) => m.url));
    for (const url of local.person) {
      if (!seen.has(url)) {
        media.push({ id: url, url, caption: null, subject: "PERSON" });
        seen.add(url);
      }
    }
    for (const url of local.spouse) {
      if (!seen.has(url)) {
        media.push({ id: url, url, caption: null, subject: "SPOUSE" });
        seen.add(url);
      }
    }

    const profileImageUrl = resolveImageUrl(row.profileImageUrl ?? local.person[0], base);
    const spouseProfileImageUrl = resolveImageUrl(
      row.spouseProfileImageUrl ?? local.spouse[0],
      base
    );
    for (const m of media) m.url = resolveImageUrl(m.url, base) ?? m.url;

    return {
      id: row.id,
      genealogyCode: row.genealogyCode,
      parentCode: row.parentCode,
      branchCode: row.branchCode,
      generationNumber: row.generationNumber,
      sortOrder: row.sortOrder,

      displayName: row.displayName,
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
      profileImageUrl,
      spouseProfileImageUrl,

      media,
    };
  });
}
