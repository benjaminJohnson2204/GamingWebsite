import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";

export default function NotFoundPage() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/auth/user").then((res: Response) => {
      setAuthenticated(res.ok);
    });
  });

  return (
    <div>
      <SiteHeader isAuthenticated={authenticated} />
      <div className="page">
        <h1 className="m-3">404: Page Not Found</h1>
      </div>
    </div>
  );
}
