import { useEffect, useState } from "react";
import { Navbar, Container, Nav, NavDropdown, Badge, Alert } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { Socket, io } from "socket.io-client";
import { IUser } from "../../../db/models/user";
import { ClientToServerEvents, ServerToClientEvents } from "../../../server/gameHandlers/types";
import { IGameRequest } from "../../../server/routes/gameType";

export default function SiteHeader(props: { isAuthenticated: boolean; reloadFriends?: number }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<IUser>();
  const [incomingFriendRequests, setIncomingFriendRequests] = useState(0);
  const [incomingGameRequests, setIncomingGameRequests] = useState<IGameRequest[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    if (props.isAuthenticated) {
      fetch("/friend/request/incoming")
        .then((res) => res.json())
        .then((data) => setIncomingFriendRequests(data.requestingUsers.length));
    }
  }, [props.isAuthenticated, props.reloadFriends]);

  useEffect(() => {
    fetch("/auth/user")
      .then((res) => res.json())
      .then((data) => setUser(data.user));

    fetch("/game-type/requests")
      .then((res) => res.json())
      .then((data) => setIncomingGameRequests(data));
  }, [location]);

  const joinGame = (request: IGameRequest) => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      `/${request.gameType.socketNamespace}`
    );

    socket.emit("joinPrivateGame", user!._id.toString(), request.opponent._id.toString());

    socket.on("joinedGame", (game) => {
      navigate(`/play/${request.gameType.socketNamespace}/${game._id}`);
    });
  };

  return (
    <>
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
                  title={
                    <>
                      Profile{" "}
                      {incomingFriendRequests > 0 && (
                        <Badge bg="danger">{incomingFriendRequests}</Badge>
                      )}
                    </>
                  }
                  show={dropdownVisible}
                  onMouseOver={() => setDropdownVisible(true)}
                  onMouseLeave={() => setDropdownVisible(false)}
                >
                  <NavDropdown.Item href="/profile">Profile</NavDropdown.Item>
                  <NavDropdown.Item href="/friends">
                    Friends{" "}
                    {incomingFriendRequests > 0 && (
                      <Badge bg="danger">{incomingFriendRequests}</Badge>
                    )}
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item
                    href={location.pathname}
                    onClick={() =>
                      fetch("/auth/logout", { method: "POST", credentials: "include" })
                    }
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
      {incomingGameRequests &&
        incomingGameRequests.length > 0 &&
        incomingGameRequests.map((request) => (
          <Alert variant="success">
            {request.opponent.username} is challenging you to a game of {request.gameType.name}{" "}
            <Alert.Link onClick={() => joinGame(request)}>Accept challenge</Alert.Link>
          </Alert>
        ))}
    </>
  );
}
