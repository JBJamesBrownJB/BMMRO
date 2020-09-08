/** @jsx jsx */
import { jsx, css } from "@emotion/core";
import { useEffect, useContext, useState } from "react";
import { useNavigate } from "@reach/router";

import utilities from "../materials/utilities";
import breakPoints from "../materials/breakPoints";
import { ROUTES } from "../constants/routes";
import { CollectionNames, generateEncounterPath } from "../constants/datastore";
import { FirebaseContext } from "../firebaseContext/firebaseContext";
import Layout from "../components/Layout";
import EncounterOverview from "../components/EncounterOverview";
import HabitatUseList from "../components/HabitatUseList";
import Button from "../components/Button";
import Loader from "../components/Loader";
import typography from "../materials/typography";
import BackLink from "../components/BackLink";

const OpenEncounter = ({ encounterId }) => {
  const styles = {
    footerContainer: css`
      ${utilities.sticky.footerContainer}
      flex-direction: column;
      align-items: center;
    `,
    list: css`
      margin: 10px;

      @media (min-width: ${breakPoints.mediumTablet}) {
        margin: 0;
      }
    `,
    disabledButtonMessage: css`
      ${typography.smallText}
      font-style: italic;
      margin-top: 10px;
      text-align: center;
    `,
  };

  const { datastore } = useContext(FirebaseContext);
  const [encounter, setEncounter] = useState({});
  const navigate = useNavigate();

  const onEndEncounterClick = () => {
    navigate(ROUTES.encounters);
  };

  const isNewEncounter = () => {
    return !encounter.sequenceNumber || !encounter.species || !encounter.area;
  };

  useEffect(() => {
    const getData = async (encounterPath) => {
      const [encounterResult, habitatUseResult] = await Promise.all([
        datastore.readDocByPath(encounterPath),
        datastore.readDocsByParentPath(
          encounterPath,
          CollectionNames.HABITAT_USE
        ),
      ]);

      if (!encounterResult.data) {
        navigate(ROUTES.newEncounter);
        return;
      }

      setEncounter({
        ...encounterResult.data,
        id: encounterId,
        habitatUseEntries: habitatUseResult,
      });
    };

    if (!!datastore) {
      getData(generateEncounterPath(encounterId));
    }
    // eslint-disable-next-line
  }, [datastore]);

  return (
    <Layout hasDefaultPadding={false} hasBackLink={encounter.exported}>
      {encounter.exported && (
        <div css={utilities.backLinkContainer.top}>
          <BackLink text="Return to encounter list" to={ROUTES.encounters} />
        </div>
      )}

      {!!Object.keys(encounter).length ? (
        <div css={utilities.sticky.contentContainer}>
          <EncounterOverview
            isNewEncounter={isNewEncounter()}
            encounter={encounter}
          />
          <div css={styles.list}>
            <HabitatUseList
              items={encounter.habitatUseEntries}
              encounterId={encounterId}
              encounterExported={encounter.exported}
            />
          </div>
          <div css={utilities.backLinkContainer.bottom}>
            <BackLink text="Return to encounter list" to={ROUTES.encounters} />
          </div>
        </div>
      ) : (
        <Loader />
      )}
    </Layout>
  );
};

export default OpenEncounter;
