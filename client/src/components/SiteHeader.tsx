import { useEffect, useState } from "react";
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { useLocation } from "react-router-dom";

export default function SiteHeader(props: { isAuthenticated: boolean }) {
  const location = useLocation();

  const [incomingFriendRequests, setIncomingFriendRequests] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    if (props.isAuthenticated) {
      fetch("/friend/request/incoming")
        .then((res) => res.json())
        .then((data) => setIncomingFriendRequests(data.requestingUsers.length));
    }
  }, []);

  return (
    <Navbar collapseOnSelect bg="info" variant="dark" expand="lg">
      <Container fluid>
        <Navbar.Brand href="/">Home</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar" />
        <Navbar.Collapse id="navbar">
          <Nav className="me-auto">
            <Navbar.Brand href="/about">About</Navbar.Brand>
            <Navbar.Brand href="/contact">Contact</Navbar.Brand>
          </Nav>
        </Navbar.Collapse>

        <Navbar.Collapse className="justify-content-end">
          {props.isAuthenticated ? (
            <Nav>
              <NavDropdown
                title="Profile"
                show={dropdownVisible}
                onMouseOver={() => setDropdownVisible(true)}
                onMouseLeave={() => setDropdownVisible(false)}
              >
                <NavDropdown.Item href="/profile">Profile</NavDropdown.Item>
                <NavDropdown.Item href="/friends">Friends</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item
                  href={location.pathname}
                  onClick={() => fetch("/auth/logout", { method: "POST", credentials: "include" })}
                >
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          ) : (
            <Nav>
              <Navbar.Brand href={`/login?next=${location.pathname}`}>Login</Navbar.Brand>
              <Navbar.Brand href={`/register?next=${location.pathname}`}>Sign Up</Navbar.Brand>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
