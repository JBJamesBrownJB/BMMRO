/** @jsx jsx */
import { Formik, Form } from "formik";
import { css, jsx } from "@emotion/core";
import { useState, useEffect, Fragment, useContext } from "react";

import { fields } from "./habitatUseFields";
import { usePosition } from "../position/usePosition";
import { DatastoreContext } from "../App";
import Input from "./Input";
import Button from "./Button";
import Select from "./Select";
import RecordSummaryList from "./RecordSummaryList";

const HabitatUseForm = () => {
  const [successMessage, setSuccessMessage] = useState(null);
  const [pendingRecords, setPendingRecords] = useState([]);
  const { latitude, longitude } = usePosition();
  const { datastore } = useContext(DatastoreContext);

  useEffect(() => {
    if (!!datastore) {
      datastore.listenForPendingHabitatUseRecords(setPendingRecords);
    }
  }, [datastore]);

  const styles = {
    inputFieldContainer: css`
      margin-bottom: 15px;
    `,
    formContainer: css`
      margin-bottom: 10px;

      @media (min-width: 500px) {
        display: grid;
        grid-template-columns: 50% 50%;
      }
    `,
    recordSummaryList: css`
      margin-top: 45px;
    `,
  };
  return (
    <Fragment>
      <h1>Habitat Use Form</h1>
      <Formik
        enableReinitialize={true}
        initialValues={(function () {
          const initValues = {};

          fields.forEach((field) => {
            initValues[field.name] = field.initialValue
              ? field.initialValue()
              : "";
          });
          initValues["latitude"] = latitude || "";
          initValues["longitude"] = longitude || "";

          return initValues;
        })()}
        validate={(values) => {
          const errors = {};
          const errorMessage = "Required";

          fields.forEach((field) => {
            if (!values[field.name] && field.required) {
              errors[field.name] = errorMessage;
            }
          });

          return errors;
        }}
        onSubmit={(values, { setSubmitting }) => {
          datastore.createHabitatUse(values);
          setSuccessMessage("Reading added");
          setSubmitting(false);
        }}
      >
        {({
          handleChange,
          handleBlur,
          isSubmitting,
          touched,
          values,
          errors,
        }) => (
          <Form>
            <div css={styles.formContainer}>
              {fields.map(({ name, label, placeholder, type, options }) => (
                <div
                  key={`habitat-use-form-field-${name}`}
                  css={styles.inputFieldContainer}
                >
                  {type === "select" ? (
                    <Select
                      type={type}
                      name={name}
                      label={label}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={options}
                      touched={touched[name]}
                      value={values[name]}
                      error={errors[name]}
                    />
                  ) : (
                    <Input
                      type={type}
                      name={name}
                      label={label}
                      placeholder={placeholder}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      touched={touched[name]}
                      value={values[name]}
                      error={errors[name]}
                    />
                  )}
                </div>
              ))}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              Submit
            </Button>
          </Form>
        )}
      </Formik>
      {!!successMessage && <div>{successMessage}</div>}
      {!!pendingRecords.length && (
        <div css={styles.recordSummaryList}>
          <RecordSummaryList
            title="List of pending records"
            records={pendingRecords}
          />
        </div>
      )}
    </Fragment>
  );
};

export default HabitatUseForm;