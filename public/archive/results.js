const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
let cases = [];
function render(filter) {
  const list = document.getElementById("case-list");
  list.replaceChildren();
  for (const [index, item] of cases.entries()) {
    if (filter && item.outcome !== filter) continue;
    const article = element("article", undefined, `case ${item.outcome}`);
    article.append(
      element(
        "span",
        item.outcome === "success"
          ? "SUPPORTED NARROW COMPARISON"
          : "RETAINED FAILED ATTEMPT",
        "badge",
      ),
    );
    article.append(element("h2", `${index + 1}. ${item.title}`));
    article.append(element("p", item.question, "question"));
    article.append(element("p", item.answer, "answer"));
    article.append(element("p", item.review_reason, "review"));
    const details = element("details");
    details.append(element("summary", "Inspect source passages and run trace"));
    for (const citation of item.citations || []) {
      details.append(element("blockquote", citation.quote));
      const link = element("a", `${citation.document_id} · exact source`);
      if (/^https:\/\//.test(citation.source_url))
        link.href = citation.source_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      details.append(link);
    }
    details.append(element("pre", JSON.stringify(item.traces || [], null, 2)));
    details.append(element("p", `Original status: ${item.status}`, "muted"));
    details.append(element("code", `Receipt SHA-256: ${item.receipt_sha256}`));
    const receipt = element("a", "Open original run JSON");
    if (/^receipts\/[a-z0-9-]+\.json$/.test(item.receipt_url))
      receipt.href = item.receipt_url;
    receipt.target = "_blank";
    receipt.rel = "noopener noreferrer";
    details.append(element("p"));
    details.append(receipt);
    article.append(details);
    list.append(article);
  }
}
for (const [id, filter] of [
  ["show-all", ""],
  ["show-success", "success"],
  ["show-failure", "failure"],
]) {
  document.getElementById(id).addEventListener("click", () => render(filter));
}
fetch("assets/reviewed-six-cases.json")
  .then((response) => response.json())
  .then((data) => {
    cases = data.cases;
    render("");
  });
fetch("assets/matching-summary.json")
  .then((response) => response.json())
  .then((data) => {
    document.getElementById("coverage-status").textContent = data.summary;
    if (!data.pages.length) return;
    const table = element("table");
    const head = element("tr");
    for (const label of ["Source page", "Result", "Top candidates", "Review"])
      head.append(element("th", label));
    table.append(head);
    for (const page of data.pages) {
      const row = element("tr");
      for (const value of [
        page.row_index,
        page.status,
        page.candidate_titles.join(" · "),
        page.review_state,
      ])
        row.append(element("td", String(value)));
      table.append(row);
    }
    document.getElementById("coverage-table").append(table);
  });
