import { useEffect, useState } from "react";
import logoUrl from "../png/logo.png";

const playerUuids = [
  "4554de35-091a-44ee-b6f5-fa718155e2b4",
  "7c4b9eb7-0c0d-4149-90c5-b6d63b86db8e",
  "a09a2541-2438-4cb9-83b1-d64804e44fda",
  "e2e5c9b4-a79f-4f20-8a75-ecc71cf54cd9"
];

function playerRenderUrl(uuid) {
  return `https://avatars.oc.tc/renders/body/${uuid}?scale=10&overlay`;
}

function Player({ uuid }) {
  const [username, setUsername] = useState("Loading");

  useEffect(() => {
    let alive = true;

    fetch(`https://playerdb.co/api/player/minecraft/${uuid}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Name lookup failed: ${response.status}`);
        }

        return response.json();
      })
      .then((result) => {
        if (alive) {
          setUsername(result.data?.player?.username || "Unknown");
        }
      })
      .catch(() => {
        if (alive) {
          setUsername("Unknown");
        }
      });

    return () => {
      alive = false;
    };
  }, [uuid]);

  return (
    <article className="player">
      <img src={playerRenderUrl(uuid)} alt="" loading="lazy" />
      <span className="name">{username}</span>
    </article>
  );
}

export default function App() {
  return (
    <main className="site">
      <div className="page">
        <img className="logo" src={logoUrl} alt="Orblion" />

        <section className="team" aria-label="Administratoren">
          <div className="teamHeader">
            <h1>Administratoren</h1>
            <p>Orblion Network</p>
          </div>

          <div className="players">
            {playerUuids.map((uuid) => (
              <Player key={uuid} uuid={uuid} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
