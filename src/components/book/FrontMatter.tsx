"use client";

import { Divider } from "./ui";

export function CoverPage({ totalPeople }: { totalPeople: number }) {
  return (
    <div className="cover">
      <p className="cover-kicker">The</p>
      <h1 className="cover-title">Panachickal</h1>
      <p className="cover-ml ml">പനച്ചിക്കൽ കുടുംബം</p>
      <p className="cover-sub">Family Chronicle</p>
      <Divider className="cover-divider" />
      <p className="cover-blurb">
        The family history, followed by a record of every family in the line — their names,
        their homes, and the generations carried down the branches.
      </p>
      <p className="cover-count">{totalPeople} family members</p>
    </div>
  );
}

export function BackPage() {
  return (
    <div className="cover">
      <Divider className="cover-divider" />
      <p className="cover-blurb">Panachickal Family Chronicle</p>
    </div>
  );
}
