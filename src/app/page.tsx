import { readFile } from "node:fs/promises";
import path from "node:path";
import { fetchAllVisiblePeople } from "@/lib/db/people";
import { buildChronicle } from "@/lib/book/build-book";
import { parseHistory } from "@/lib/history/parse-history";
import { BookClient } from "@/components/book/BookClient";

// Always read fresh from the shared DB.
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadHistory() {
  const file = path.join(process.cwd(), "content", "family-history.md");
  return parseHistory(await readFile(file, "utf8"));
}

export default async function HomePage() {
  let people;
  try {
    people = await fetchAllVisiblePeople();
  } catch (err) {
    return <DbError message={(err as Error).message} />;
  }

  if (!people || people.length === 0) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <div className="parchment page-border max-w-md rounded-lg p-8 text-center">
          <h1 className="font-serif text-xl font-semibold text-ink-900">
            The chronicle is empty
          </h1>
          <p className="mt-3 text-sm text-ink-700">
            No visible family members were found in the database yet.
          </p>
        </div>
      </main>
    );
  }

  const [history, data] = [await loadHistory(), buildChronicle(people)];
  return (
    <main>
      <BookClient data={data} history={history} />
    </main>
  );
}

function DbError({ message }: { message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="parchment page-border max-w-lg rounded-lg p-8 text-center">
        <h1 className="font-serif text-xl font-semibold text-heritage-700">
          Unable to open the chronicle
        </h1>
        <p className="mt-3 text-sm text-ink-800">
          The chronicle could not read the family database. Ensure the shared
          MySQL database is running and <code>DATABASE_URL</code> is configured.
        </p>
        <pre className="mt-4 overflow-auto rounded bg-ink-900/5 p-3 text-left text-xs text-ink-700">
          {message}
        </pre>
      </div>
    </main>
  );
}
