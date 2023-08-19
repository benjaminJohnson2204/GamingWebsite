import { ErrorMessage, Field, Formik, FormikHelpers, Form } from "formik";
import { useEffect, useState } from "react";
import { Button, Container, Form as ReactBootstrapForm } from "react-bootstrap";
import { Cookies, withCookies } from "react-cookie";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";

interface RegisterValues {
  username: string;
  email: string;
  password: string;
  confirmation: string;
}

function RegisterPage(props: { cookies: Cookies }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetch("/auth/user").then((res: Response) => {
      if (res.ok) {
        navigate(searchParams.get("next") || "/");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div>
      <SiteHeader isAuthenticated={false} />
      <div className="page">
        <h1 className="m-3">Create an account</h1>
        <Formik
          initialValues={{
            username: "",
            email: "",
            password: "",
            confirmation: "",
          }}
          validate={(values: RegisterValues) => {
            const errors: any = {};
            if (!values.username) {
              errors.username = "Username is required";
            } else if (!values.email) {
              errors.email = "Email address is required";
            } else if (!/\S+@\S+\.\S+/.test(values.email)) {
              errors.email = "Not a valid email address";
            } else if (!values.password) {
              errors.password = "Password is required";
            } else if (!values.confirmation) {
              errors.confirmation = "Must confirm password";
            } else if (values.password !== values.confirmation) {
              errors.confirmation = "Passwords don't match";
            }
            return errors;
          }}
          onSubmit={(values: RegisterValues, { setSubmitting }: FormikHelpers<RegisterValues>) => {
            setTimeout(() => {
              fetch("/auth/register", {
                credentials: "include",
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
              })
                .then((res) => {
                  if (res.ok) {
                    navigate(searchParams.get("next") || "/");
                  } else {
                    return res.json();
                  }
                })
                .then((data) => {
                  setError(data.error);
                });
              setSubmitting(false);
            }, 400);
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <ReactBootstrapForm.Group>
                <Container fluid>
                  <ReactBootstrapForm.Label className="m-3">Username</ReactBootstrapForm.Label>
                </Container>
                <Field name="username" placeholder="Username" type="username" />
                <ErrorMessage className="text-danger" name="username" component="div" />
              </ReactBootstrapForm.Group>

              <ReactBootstrapForm.Group>
                <Container fluid>
                  <ReactBootstrapForm.Label className="m-3">Email address</ReactBootstrapForm.Label>
                </Container>
                <Field name="email" placeholder="Email address" type="email" />
                <ErrorMessage className="text-danger" name="email" component="div" />
              </ReactBootstrapForm.Group>

              <ReactBootstrapForm.Group>
                <Container fluid>
                  <ReactBootstrapForm.Label className="m-3">Password</ReactBootstrapForm.Label>
                </Container>
                <Field name="password" placeholder="Password" type="password" />
                <ErrorMessage className="text-danger" name="password" component="div" />
              </ReactBootstrapForm.Group>

              <ReactBootstrapForm.Group>
                <Container fluid>
                  <ReactBootstrapForm.Label className="m-3">
                    Confirm password
                  </ReactBootstrapForm.Label>
                </Container>
                <Field name="confirmation" placeholder="Confirm password" type="password" />
                <ErrorMessage className="text-danger" name="confirmation" component="div" />
              </ReactBootstrapForm.Group>

              <Button className="m-3" disabled={isSubmitting} type="submit">
                Submit
              </Button>
            </Form>
          )}
        </Formik>
        <div className="text-danger">{error}</div>
        Already have an account?{" "}
        <Link to={`/login?next=${searchParams.get("next") || "/"}`}>Login</Link>
      </div>
    </div>
  );
}

export default withCookies(RegisterPage);
