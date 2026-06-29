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

function flatten(items, parentPath = "") {
  return items.flatMap((item) => {
    const entry = {
      ...item,
      parentPath
    };

    if (item.type === "folder") {
      return [entry, ...flatten(item.children || [], item.path)];
    }

    return [entry];
  });
}

function formatSize(size) {
  if (!Number.isFinite(size)) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function findFolder(items, currentPath) {
  if (!currentPath) {
    return items;
  }

  for (const item of items) {
    if (item.type !== "folder") {
      continue;
    }

    if (item.path === currentPath) {
      return item.children || [];
    }

    const match = findFolder(item.children || [], currentPath);

    if (match) {
      return match;
    }
  }

  return null;
}

function breadcrumbs(currentPath) {
  if (!currentPath) {
    return [];
  }

  return currentPath.split("/").map((part, index, parts) => ({
    name: part,
    path: parts.slice(0, index + 1).join("/")
  }));
}

function AssetExplorer({ onBack }) {
  const [manifest, setManifest] = useState(null);
  const [currentPath, setCurrentPath] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    fetch("./storage-manifest.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Manifest failed: ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        if (alive) {
          setManifest(data);
        }
      })
      .catch(() => {
        if (alive) {
          setError("Storage konnte nicht geladen werden.");
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  const rootItems = manifest?.root || [];
  const currentItems = manifest ? findFolder(rootItems, currentPath) || [] : [];
  const allFiles = manifest ? flatten(rootItems).filter((item) => item.type === "file") : [];
  const trail = breadcrumbs(currentPath);

  return (
    <main className="site explorerSite">
      <section className="explorer">
        <header className="explorerHeader">
          <div>
            <p className="eyebrow">Storage</p>
            <h1>Assets</h1>
          </div>
          <button className="ghostButton" type="button" onClick={onBack}>
            Zurueck
          </button>
        </header>

        <nav className="breadcrumbs" aria-label="Pfad">
          <button type="button" onClick={() => setCurrentPath("")}>
            storage
          </button>
          {trail.map((crumb) => (
            <button key={crumb.path} type="button" onClick={() => setCurrentPath(crumb.path)}>
              {crumb.name}
            </button>
          ))}
        </nav>

        <div className="explorerMeta">
          <span>{allFiles.length} Dateien</span>
          <span>{currentItems.length} Eintraege</span>
        </div>

        <div className="fileList">
          {error && <p className="emptyState">{error}</p>}
          {!manifest && !error && <p className="emptyState">Lade Storage...</p>}
          {manifest && currentPath && (
            <button className="fileRow" type="button" onClick={() => setCurrentPath(currentPath.split("/").slice(0, -1).join("/"))}>
              <span className="fileIcon">../</span>
              <span className="fileName">Zurueck</span>
              <span className="fileInfo">Ordner</span>
            </button>
          )}
          {manifest &&
            currentItems.map((item) =>
              item.type === "folder" ? (
                <button className="fileRow" key={item.path} type="button" onClick={() => setCurrentPath(item.path)}>
                  <span className="fileIcon">DIR</span>
                  <span className="fileName">{item.name}</span>
                  <span className="fileInfo">{item.children?.length || 0} Eintraege</span>
                </button>
              ) : (
                <a className="fileRow" key={item.path} href={item.url} target="_blank" rel="noreferrer">
                  <span className="fileIcon">FILE</span>
                  <span className="fileName">{item.name}</span>
                  <span className="fileInfo">{formatSize(item.size)}</span>
                </a>
              )
            )}
          {manifest && currentItems.length === 0 && !error && <p className="emptyState">Dieser Ordner ist leer.</p>}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [view, setView] = useState("home");

  if (view === "assets") {
    return <AssetExplorer onBack={() => setView("home")} />;
  }

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

      <button className="assetsButton" type="button" onClick={() => setView("assets")}>
        Assets
      </button>
    </main>
  );
}
