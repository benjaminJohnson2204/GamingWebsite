import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { IUser } from "../../../db/models/user";

export default function ChallengeFriend(props: { gameType: string }) {
  const [friends, setFriends] = useState<IUser[]>();

  const navigate = useNavigate();

  useEffect(() => {
    fetch("/friend/all")
      .then((res) => res.json())
      .then((data) => setFriends(data.friends));
  });

  const challengeFriend = (event: React.ChangeEvent<any>) => {
    event.preventDefault();
    navigate(`/waiting-private/${props.gameType}/${event.target[0].value}`);
  };

  return (
    <>
      <h3>Play a friend</h3>
      <Form onSubmit={challengeFriend}>
        <Form.Group>
          <Form.Label>Friend to challenge</Form.Label>
          <Form.Select>
            <option value=""></option>
            {friends &&
              friends.map((friend) => (
                <option value={friend._id.toString()}>{friend.username}</option>
              ))}
          </Form.Select>
        </Form.Group>
        <Button type="submit">Send challenge!</Button>
      </Form>
    </>
  );
}