import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/auth/user").then((res: Response) => {
      setAuthenticated(res.ok);
    });
  });

  return (
    <div>
      <SiteHeader isAuthenticated={authenticated} />
    </div>
  );
}
