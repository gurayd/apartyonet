import { MAX_UNITS, MIN_UNITS, MONTHLY_PER_UNIT, normalizeUnits, quotePlans } from "./pricing.mjs";

const find = (id) => document.getElementById(id);
const unitsInput = find("calcUnits");
const unitsRange = find("calcUnitsRange");
const newMember = find("calcNewMember");
const choices = [...document.querySelectorAll('input[name="plan"]')];
const currency = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const money = (value) => `${currency.format(value)} TL`;
const label = { "1y": "1 Yıl", "2y": "2 Yıl", "3y": "3 Yıl" };

function render(value) {
  const { units, plans } = quotePlans(value, newMember.checked);
  const key = choices.find((choice) => choice.checked)?.value || "1y";
  const current = plans[key];
  unitsRange.value = String(units);
  find("calcSummaryUnits").textContent = currency.format(units);
  find("calcSummaryPlan").textContent = label[key];
  find("calcTotal").textContent = money(current.total);
  find("calcSave").textContent = current.saved ? `${money(current.saved)} tasarruf` : "Standart ücret";
  find("calcMonthlyAvg").textContent = money(current.monthly);
  find("calcPerUnit").textContent = money(current.perUnitMonthly);
  for (const choice of choices) {
    choice.closest("label").querySelector("[data-plan-total]").textContent = money(plans[choice.value].total);
  }
}

unitsInput.min = unitsRange.min = String(MIN_UNITS);
unitsInput.max = unitsRange.max = String(MAX_UNITS);
find("calcRate").textContent = money(MONTHLY_PER_UNIT);
unitsInput.addEventListener("input", () => render(unitsInput.value));
unitsInput.addEventListener("change", () => {
  unitsInput.value = String(normalizeUnits(unitsInput.value));
  render(unitsInput.value);
});
unitsRange.addEventListener("input", () => {
  unitsInput.value = unitsRange.value;
  render(unitsInput.value);
});
for (const choice of [...choices, newMember]) {
  choice.addEventListener("change", () => render(unitsInput.value));
}
render(unitsInput.value);
