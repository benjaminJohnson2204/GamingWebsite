import { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import SiteHeader from "../components/SiteHeader";

import { IUser } from "../../../db/models/user";
import mongoose from "mongoose";
import useAuthenticated from "../components/useAuthenticated";

export interface IUserSearchData {
  user: IUser;
  friends: boolean;
  requested: boolean;
  requesting: boolean;
}

export default function FriendsPage() {
  useAuthenticated();

  const [incomingRequests, setIncomingRequests] = useState<IUser[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<IUser[]>([]);
  const [friends, setFriends] = useState<IUser[]>([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<IUserSearchData[]>([]);
  const [reloadFriends, setReloadFriends] = useState(0);

  useEffect(() => {
    fetch("/friend/request/incoming")
      .then((res) => res.json())
      .then((data) => setIncomingRequests(data.requestingUsers));
    fetch("/friend/request/outgoing")
      .then((res) => res.json())
      .then((data) => setOutgoingRequests(data.requestedUsers));
    fetch("/friend/all")
      .then((res) => res.json())
      .then((data) => setFriends(data.friends));
  }, [reloadFriends]);

  useEffect(() => {
    if (search) {
      fetch(`/friend/search?search=${search}`)
        .then((res) => res.json())
        .then((data) => setUsers(data.users));
    }
  }, [search, reloadFriends]);

  const searchForUser = (event: React.ChangeEvent<any>) => {
    event.preventDefault();
    setSearch(event.target[0].value);
  };

  const addFriend = (id: mongoose.Types.ObjectId) => {
    fetch("/friend/request", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    }).then((res) => setReloadFriends(reloadFriends + 1));
  };

  const removeFriend = (id: mongoose.Types.ObjectId) => {
    fetch("/friend/remove", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    }).then((res) => setReloadFriends(reloadFriends + 1));
  };

  const acceptFriendRequest = (id: mongoose.Types.ObjectId) => {
    fetch("/friend/accept", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    }).then((res) => setReloadFriends(reloadFriends + 1));
  };

  const declineFriendRequest = (id: mongoose.Types.ObjectId) => {
    fetch("/friend/decline", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    }).then((res) => setReloadFriends(reloadFriends + 1));
  };

  const cancelFriendRequest = (id: mongoose.Types.ObjectId) => {
    fetch("/friend/cancel", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    }).then((res) => setReloadFriends(reloadFriends + 1));
  };

  return (
    <div>
      <SiteHeader isAuthenticated={true} reloadFriends={reloadFriends} />
      <div className="page">
        <Container fluid className="m-3">
          <Row>
            <Col xs={12} md={6}>
              <h1>Your Friends</h1>
              {friends.map((friend) => (
                <Row>
                  <Col>{friend.username}</Col>
                  <Col>
                    <Button>Challenge</Button>
                  </Col>
                  <Col>
                    <Button onClick={() => removeFriend(friend._id)} variant="danger">
                      Remove
                    </Button>
                  </Col>
                </Row>
              ))}
              {friends.length === 0 && (
                <Row>
                  <Col>You don't have any friends yet</Col>
                </Row>
              )}
            </Col>

            <Col xs={11} md={5}>
              <>
                <h1>Friend Requests</h1>
                <Row>
                  <Col>
                    <h2>Incoming</h2>
                    {incomingRequests.map((user) => (
                      <Row>
                        <Col>{user.username}</Col>
                        <Button onClick={() => acceptFriendRequest(user._id)} variant="success">
                          Accept
                        </Button>
                        <Button onClick={() => declineFriendRequest(user._id)} variant="danger">
                          Decline
                        </Button>
                      </Row>
                    ))}
                    {incomingRequests.length === 0 && (
                      <Row>
                        <Col>No incoming requests</Col>
                      </Row>
                    )}
                  </Col>

                  <Col>
                    <h2>Outgoing</h2>
                    {outgoingRequests.map((user) => (
                      <Row>
                        <Col>{user.username}</Col>
                        <Button onClick={() => cancelFriendRequest(user._id)} variant="danger">
                          Cancel
                        </Button>
                      </Row>
                    ))}
                    {outgoingRequests.length === 0 && (
                      <Row>
                        <Col>No outgoing requests</Col>
                      </Row>
                    )}
                  </Col>
                </Row>

                <h2 className="mt-4">Add a Friend</h2>
                <Form onSubmit={searchForUser}>
                  <Form.Control
                    name="search"
                    type="search"
                    placeholder="Username"
                    className="me-2"
                    aria-label="Search"
                  />
                  <Button className="mt-2" variant="outline-secondary" type="submit">
                    Search
                  </Button>
                </Form>
                <Container fluid>
                  {users.map((user) => (
                    <Row className="mt-2">
                      <Col>{user.user.username}</Col>
                      {user.friends ? (
                        <>
                          <Col>
                            <Button>Challenge</Button>
                          </Col>
                          <Col>
                            <Button onClick={() => removeFriend(user.user._id)} variant="danger">
                              Remove
                            </Button>
                          </Col>
                        </>
                      ) : user.requested ? (
                        <Col>
                          <Button
                            onClick={() => cancelFriendRequest(user.user._id)}
                            variant="danger"
                          >
                            Cancel
                          </Button>
                        </Col>
                      ) : user.requesting ? (
                        <Col>
                          <Row>
                            <Button
                              onClick={() => acceptFriendRequest(user.user._id)}
                              variant="success"
                            >
                              Accept
                            </Button>
                            <Button
                              className="ml-2"
                              onClick={() => declineFriendRequest(user.user._id)}
                              variant="danger"
                            >
                              Decline
                            </Button>
                          </Row>
                        </Col>
                      ) : (
                        <Col>
                          <Button onClick={() => addFriend(user.user._id)}>Add</Button>
                        </Col>
                      )}
                    </Row>
                  ))}
                  {users.length === 0 && search && (
                    <Row>
                      <Col>No search results found</Col>
                    </Row>
                  )}
                </Container>
              </>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}
