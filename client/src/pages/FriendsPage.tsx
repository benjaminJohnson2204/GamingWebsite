import { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import SiteHeader from "../components/SiteHeader";

import { IUser } from "../../../db/models/user";
import mongoose from "mongoose";

export default function FriendsPage() {
  const [incomingRequests, setIncomingRequests] = useState<IUser[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<IUser[]>([]);
  const [friends, setFriends] = useState<IUser[]>([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<IUser[]>([]);

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
  }, []);

  useEffect(() => {
    fetch(`/friend/search?search=${search}`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users));
  }, [search]);

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
    }).then((res) => {});
  };

  const removeFriend = (id: mongoose.Types.ObjectId) => {
    fetch("/friend/remove", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    }).then((res) => {});
  };

  const acceptFriendRequest = (id: mongoose.Types.ObjectId) => {
    fetch("/friend/accept", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    });
  };

  const declineFriendRequest = (id: mongoose.Types.ObjectId) => {
    fetch("/friend/decline", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    });
  };

  const cancelFriendRequest = (id: mongoose.Types.ObjectId) => {
    fetch("/friend/cancel", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    });
  };

  return (
    <div>
      <SiteHeader isAuthenticated={true} />
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
            </Col>

            <Col xs={12} md={6}>
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
                  </Col>
                </Row>

                <h2>Add a Friend</h2>
                <Form onSubmit={searchForUser}>
                  <Form.Control
                    name="search"
                    type="search"
                    placeholder="Username"
                    className="me-2"
                    aria-label="Search"
                  />
                  <Button variant="outline-secondary" type="submit">
                    Search
                  </Button>
                </Form>
                <Container fluid>
                  {users.map((user) => (
                    <Row>
                      <Col>{user.username}</Col>
                      <Col>
                        <Button onClick={() => addFriend(user._id)}>Add</Button>
                      </Col>
                    </Row>
                  ))}
                </Container>
              </>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}
