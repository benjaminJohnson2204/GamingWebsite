import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IUser } from "../../../db/models/user";

export default function useAuthenticated() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<IUser>();

  useEffect(() => {
    fetch("/auth/user").then((res: Response) => {
      if (res.ok) {
        res.json().then((data) => setUser(data.user));
      } else {
        navigate(`/login?next=${location.pathname}`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return user;
}
