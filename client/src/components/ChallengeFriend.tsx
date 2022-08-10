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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const challengeFriend = (event: React.ChangeEvent<any>) => {
    event.preventDefault();
    if (event.target[0].value) {
      navigate(`/waiting-private/${props.gameType}/${event.target[0].value}`);
    }
  };

  return (
    <>
      <Form onSubmit={challengeFriend}>
        <Form.Group>
          <Form.Label>Challenge a friend</Form.Label>
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
