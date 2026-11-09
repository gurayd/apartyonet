import { getDemoView } from "./ornek-panel.mjs";

const buttons = [...document.querySelectorAll("[data-sample-block]")];
const units = document.getElementById("planUnits");
const currency = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const money = (cents) => `${currency.format(cents / 100)} ₺`;
const statuses = { paid: "Ödendi", partial: "Kısmi ödeme", open: "Bekliyor" };

function selectBlock(button) {
  const block = button.dataset.sampleBlock;
  const view = getDemoView({ period: "2026-10", block });
  for (const option of buttons) option.setAttribute("aria-pressed", String(option === button));
  units.setAttribute("aria-label", `${block} Blok aidat durumları`);
  units.replaceChildren(...view.rows.map((row) => {
    const unit = document.createElement("li");
    unit.className = "plan-unit";
    unit.dataset.status = row.status;
    const label = document.createElement("span");
    const status = document.createElement("strong");
    label.textContent = row.name;
    status.textContent = statuses[row.status];
    unit.append(label, status);
    return unit;
  }));
  document.getElementById("planPaid").textContent = money(view.paid);
  document.getElementById("planRemaining").textContent = money(view.remaining);
}

for (const button of buttons) {
  button.disabled = false;
  button.addEventListener("click", () => selectBlock(button));
}
if (buttons[0]) selectBlock(buttons[0]);
