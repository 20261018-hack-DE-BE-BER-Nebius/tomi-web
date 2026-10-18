const byId = (id) => document.getElementById(id);
let pages = [],
  selected = null;
function select(page) {
  selected = page;
  byId("title").textContent = `Page ${page.row_index} · ${page.title}`;
  byId("status").textContent = page.status;
  byId("scan").src = page.scan;
  byId("pdf-link").href = page.pdf;
  byId("pdf-preview").src = `previews/page-${page.row_index}.jpg`;
  byId("raw").textContent =
    page.raw || "No prose returned for the non-text cover.";
  byId("metadata").textContent = JSON.stringify(
    {
      page_id: page.page_id,
      image_sha256: page.image_sha256,
      text_sha256: page.text_sha256,
      parser_receipt_sha256: page.parser_receipt_sha256,
    },
    null,
    2,
  );
  byId("links").replaceChildren();
  for (const [label, key] of [
    ["PDF", "pdf"],
    ["LaTeX", "tex"],
    ["Scan", "scan"],
  ]) {
    const a = document.createElement("a");
    a.textContent = label;
    a.href = page[key];
    a.target = "_blank";
    a.rel = "noopener";
    byId("links").append(a);
  }
  history.replaceState(null, "", `#page-${page.row_index}`);
  render();
}
function render() {
  const q = byId("search").value.toLowerCase();
  const matches = pages.filter((p) =>
    `${p.row_index} ${p.title} ${p.raw}`.toLowerCase().includes(q),
  );
  byId("count").textContent =
    `${matches.length} of ${pages.length} selected pages`;
  byId("pages").replaceChildren();
  for (const page of matches) {
    const button = document.createElement("button");
    button.textContent = `${page.row_index} · ${page.title}`;
    button.className = selected === page ? "active" : "";
    button.addEventListener("click", () => select(page));
    byId("pages").append(button);
  }
}
byId("search").addEventListener("input", render);
fetch("assets/pages.json")
  .then((r) => {
    if (!r.ok) throw new Error("Archive data unavailable");
    return r.json();
  })
  .then((data) => {
    pages = data.pages;
    const id = Number(location.hash.replace("#page-", ""));
    select(pages.find((p) => p.row_index === id) || pages[0]);
  })
  .catch((e) => {
    byId("title").textContent = e.message;
  });
