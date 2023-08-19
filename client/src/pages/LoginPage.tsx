import { ErrorMessage, Field, Formik, FormikHelpers, Form } from "formik";
import { useEffect, useState } from "react";
import { Button, Container, Form as ReactBootstrapForm } from "react-bootstrap";
import { Cookies, withCookies } from "react-cookie";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";

interface LoginValues {
  username: string;
  password: string;
}

function LoginPage(props: { cookies: Cookies }) {
  const navigate = useNavigate();
  const [error, setError] = useState(false);
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
        <h1 className="m-3">Login</h1>
        <Formik
          initialValues={{ username: "", password: "" }}
          validate={(values: LoginValues) => {
            const errors: any = {};
            if (!values.username) {
              errors.username = "Username is required";
            } else if (!values.password) {
              errors.password = "Password is required";
            }
            return errors;
          }}
          onSubmit={(values: LoginValues, { setSubmitting }: FormikHelpers<LoginValues>) => {
            setTimeout(() => {
              fetch("/auth/login", {
                credentials: "include",
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
              }).then((res) => {
                if (res.ok) {
                  navigate(searchParams.get("next") || "/");
                } else {
                  setError(true);
                }
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
                  <ReactBootstrapForm.Label className="m-3">Password</ReactBootstrapForm.Label>
                </Container>
                <Field name="password" placeholder="Password" type="password" />
                <ErrorMessage className="text-danger" name="password" component="div" />
              </ReactBootstrapForm.Group>

              <Button className="m-3" disabled={isSubmitting} type="submit">
                Submit
              </Button>
            </Form>
          )}
        </Formik>
        {error && <div className="text-danger">Invalid username and/or password</div>}
        Don't have an account?{" "}
        <Link to={`/register?next=${searchParams.get("next") || "/"}`}>Sign up</Link>
      </div>
    </div>
  );
}

export default withCookies(LoginPage);
