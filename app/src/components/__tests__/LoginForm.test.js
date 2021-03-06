import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react/pure";
import React from "react";

import { FirebaseContext } from "../../firebaseContext/firebaseContext";
import {
  buildFirebaseAuthMock,
  buildFirestoreMock,
} from "../../utils/test/firebase";
import LoginForm from "../LoginForm";

jest.mock("@reach/router", () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

describe("Login form", () => {
  beforeEach(() => {
    buildFirestoreMock();
  });

  afterEach(cleanup);

  it("should display an error when user fails to login", async () => {
    const signInResult = {
      signInWithEmailAndPassword: jest
        .fn()
        .mockRejectedValue(new Error("some error")),
    };
    buildFirebaseAuthMock(signInResult);

    const { queryByTestId } = render(
      <FirebaseContext.Provider value={{ datastore: "some-datastore" }}>
        <LoginForm />
      </FirebaseContext.Provider>
    );

    fireEvent.click(queryByTestId("submit"));

    await waitFor(() =>
      expect(queryByTestId("login-error")).toBeInTheDocument()
    );
  });
});
