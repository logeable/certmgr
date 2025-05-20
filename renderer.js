document.body.appendChild(document.createElement("h1")).textContent =
  "Hello World";

document.body.appendChild(document.createElement("h2")).textContent =
  versions.node();

document.body.appendChild(document.createElement("h2")).textContent =
  versions.chrome();

document.body.appendChild(document.createElement("h2")).textContent =
  versions.electron();

(async () => {
  const result = await msg.ping();
  document.body.appendChild(document.createElement("h2")).textContent = result;
})();
