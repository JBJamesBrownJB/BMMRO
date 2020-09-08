import { renderWithMockContexts } from "../../utils/test/renderWithMockContexts";
import React from "react";
import * as firebaseTesting from "@firebase/testing";
import { waitFor } from "@testing-library/react";

import { Datastore } from "../../datastore/datastore";
import OpenEncounter from "../OpenEncounter";

describe("OpenEncounter", () => {
  const projectId = "open-encounter-test-id";
  let firestoreEmulator;
  let datastore;

  beforeEach(() => {
    firestoreEmulator = firebaseTesting
      .initializeTestApp({
        projectId,
        auth: { uid: "test-researcher" },
      })
      .firestore();

    datastore = new Datastore(firestoreEmulator);
  });

  afterAll(async () => {
    await firebaseTesting.clearFirestoreData({ projectId });
    await Promise.all(firebaseTesting.apps().map((app) => app.delete()));
  });

  it("navigates to /encounters/new if no encounter is found in firestore for a given ID", async () => {
    await firestoreEmulator
      .collection("encounter")
      .add({ name: "Barney", species: "Bottlenose dolphin" });

    const entryPath = "/encounters/123/habitat-uses";
    const redirectPath = "/encounters/new";

    const { history } = renderWithMockContexts(
      <OpenEncounter encounterId={"123"} />,
      {
        datastore,
        route: entryPath,
      }
    );

    await waitFor(() => {
      expect(history.location.pathname).toEqual(redirectPath);
    });
  });

  it("has one link if the encounter was not previously exported", async () => {
    await firestoreEmulator.collection("encounter").doc("123").set({
      species: "some species",
      area: "some area",
      sequenceNumber: "123",
      exported: false,
    });

    const { getAllByRole } = renderWithMockContexts(
      <OpenEncounter encounterId={"123"} />,
      { datastore }
    );

    await waitFor(() => {
      const expectedLink = "/encounters";
      const backLinks = getAllByRole("link", {
        name: "Return to encounter list",
      });

      expect(backLinks).toHaveLength(1);
      expect(backLinks[0].href).toContain(expectedLink);
    });
  });

  it("has two links to the list of encounters if the encounter was previously exported", async () => {
    await firestoreEmulator.collection("encounter").doc("123").set({
      species: "some species",
      area: "some area",
      sequenceNumber: "123",
      exported: true,
    });

    const { getAllByRole } = renderWithMockContexts(
      <OpenEncounter encounterId={"123"} />,
      { datastore }
    );

    await waitFor(() => {
      const expectedLink = "/encounters";
      const backLinks = getAllByRole("link", {
        name: "Return to encounter list",
      });

      expect(backLinks).toHaveLength(2);
      expect(backLinks[0].href).toContain(expectedLink);
      expect(backLinks[1].href).toContain(expectedLink);
    });
  });
});
