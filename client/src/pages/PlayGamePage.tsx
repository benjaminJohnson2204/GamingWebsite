import { IUser } from "../../../db/models/user";
import SiteHeader from "../components/SiteHeader";

export default function PlayGamePage() {
  return (
    <div>
      <SiteHeader isAuthenticated={true} />
    </div>
  );
}
